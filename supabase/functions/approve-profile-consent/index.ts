import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

interface RequestBody {
  token?: string
  action?: 'review' | 'approve'
}

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return bytesToHex(new Uint8Array(digest))
}

function invalidLinkResponse(): Response {
  return jsonResponse(
    {
      error:
        'This permission link is invalid or has expired. Please ask the Now We See You team for a new link.',
    },
    400,
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required Supabase environment variables')
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  let body: RequestBody

  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const token = body.token?.trim()
  const action = body.action ?? 'review'

  if (!token) {
    return invalidLinkResponse()
  }

  if (action !== 'review' && action !== 'approve') {
    return jsonResponse({ error: 'Invalid action' }, 400)
  }

  const tokenHash = await sha256(token)
  const admin = createClient(supabaseUrl, serviceRoleKey)

  /*
   * The raw token is never queried or stored. Only its SHA-256 hash is used.
   */
  const { data: consentRequest, error: requestError } = await admin
    .from('profile_consent_requests')
    .select(`
      id,
      profile_id,
      requested_at,
      approved_at,
      expires_at,
      invalidated_at
    `)
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (requestError || !consentRequest) {
    return invalidLinkResponse()
  }

  if (consentRequest.invalidated_at) {
    return invalidLinkResponse()
  }

  if (new Date(consentRequest.expires_at).getTime() < Date.now()) {
    return invalidLinkResponse()
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select(`
      id,
      name,
      role,
      department,
      bio,
      reflection_quote,
      reflection_video_url,
      reflection_recorded_date,
      status,
      consent_status,
      consent_approved_at
    `)
    .eq('id', consentRequest.profile_id)
    .maybeSingle()

  if (profileError || !profile) {
    return invalidLinkResponse()
  }

  const { data: images, error: imagesError } = await admin
    .from('profile_images')
    .select(`
      image_url,
      image_type,
      sort_order
    `)
    .eq('profile_id', profile.id)
    .in('image_type', ['portrait', 'additional'])
    .order('sort_order', { ascending: true })

  if (imagesError) {
    console.error('Failed to load consent review images', {
      profileId: profile.id,
      error: imagesError,
    })

    return jsonResponse(
      { error: 'The profile could not be loaded for review.' },
      500,
    )
  }

  /*
   * REVIEW
   *
   * Return only the content the person needs to decide whether to approve.
   * Email addresses, token hashes, admin information and internal workflow
   * data are intentionally omitted.
   */
  if (action === 'review') {
    if (consentRequest.approved_at) {
        if (profile.consent_status !== "approved") {
          const { error: repairError } = await admin
            .from("profiles")
            .update({
              consent_status: "approved",
              consent_approved_at: consentRequest.approved_at,
              consent_method: "approval_link",
            })
            .eq("id", profile.id);
      
          if (repairError) {
            console.error("Failed to repair profile consent state:", repairError);
      
            return new Response(
              JSON.stringify({ error: "Could not complete approval." }),
              {
                status: 500,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              },
            );
          }
        }
      
        return new Response(
          JSON.stringify({
            success: true,
            alreadyApproved: true,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

    return jsonResponse({
      success: true,
      alreadyApproved: false,
      profile: {
        name: profile.name,
        role: profile.role,
        department: profile.department,
        bio: profile.bio,
        reflectionQuote: profile.reflection_quote,
        reflectionVideoUrl: profile.reflection_video_url,
        reflectionRecordedDate: profile.reflection_recorded_date,
        images: images ?? [],
      },
    })
  }

  /*
   * APPROVE
   *
   * Approval is idempotent. Repeated clicks return success rather than
   * creating additional approval records.
   */
  if (consentRequest.approved_at) {
    return jsonResponse({
      success: true,
      alreadyApproved: true,
      approvedAt: consentRequest.approved_at,
    })
  }

  /*
   * Do not let an old email request replace a newer in-person approval.
   */
  if (
    profile.consent_status === 'approved' &&
    profile.consent_approved_at
  ) {
    return jsonResponse({
      success: true,
      alreadyApproved: true,
      approvedAt: profile.consent_approved_at,
    })
  }

  const approvedAt = new Date().toISOString()

  const { error: requestApprovalError } = await admin
    .from('profile_consent_requests')
    .update({
      approved_at: approvedAt,
    })
    .eq('id', consentRequest.id)
    .is('approved_at', null)

  if (requestApprovalError) {
    console.error('Failed to approve consent request', {
      consentRequestId: consentRequest.id,
      error: requestApprovalError,
    })

    return jsonResponse(
      { error: 'Permission could not be recorded. Please try again.' },
      500,
    )
  }

  const { error: profileApprovalError } = await admin
    .from('profiles')
    .update({
      consent_status: 'approved',
      consent_approved_at: approvedAt,
      consent_method: 'approval_link',
    })
    .eq('id', profile.id)

  if (profileApprovalError) {
    console.error('Failed to update profile consent', {
      profileId: profile.id,
      error: profileApprovalError,
    })

    return jsonResponse(
      { error: 'Permission could not be recorded. Please try again.' },
      500,
    )
  }

  return jsonResponse({
    success: true,
    alreadyApproved: false,
    approvedAt,
  })
})