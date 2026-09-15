import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

interface RequestBody {
  profileId?: string
  mode?: 'email' | 'in_person'
  email?: string
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

function createSecureToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)

  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error('Missing required Supabase environment variables')
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  /*
   * Authenticate the caller using the JWT supplied by the browser.
   */
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return jsonResponse({ error: 'Authentication required' }, 401)
  }

  const callerClient = createClient(
    supabaseUrl,
    anonKey,
    {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    },
  )

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser()

  if (userError || !user || !user.email) {
    return jsonResponse({ error: 'Authentication required' }, 401)
  }

  let body: RequestBody

  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const profileId = body.profileId
  const mode = body.mode

  if (!profileId) {
    return jsonResponse({ error: 'profileId is required' }, 400)
  }

  if (mode !== 'email' && mode !== 'in_person') {
    return jsonResponse(
      { error: 'mode must be email or in_person' },
      400,
    )
  }

  /*
   * Consent actions are administrator-only.
   *
   * The existing application identifies administrators through school_admins.
   * Global administrators can manage any school. School administrators can
   * manage only profiles belonging to their own school.
   */
  const { data: adminRow, error: adminLookupError } = await callerClient
    .from('school_admins')
    .select('id, school_id, is_global_admin')
    .eq('email', user.email.toLowerCase())
    .limit(1)
    .maybeSingle()

  if (adminLookupError || !adminRow) {
    return jsonResponse(
      { error: 'Administrator access required' },
      403,
    )
  }

  /*
   * Use the caller's authenticated client for this lookup so the existing RLS
   * rules remain part of the authorization boundary.
   */
  const { data: visibleProfile, error: visibleProfileError } =
    await callerClient
      .from('profiles')
      .select('id, school_id')
      .eq('id', profileId)
      .maybeSingle()

  if (visibleProfileError || !visibleProfile) {
    return jsonResponse(
      { error: 'Profile not found or access denied' },
      403,
    )
  }

  if (
    !adminRow.is_global_admin &&
    adminRow.school_id !== visibleProfile.school_id
  ) {
    return jsonResponse(
      { error: 'Administrator access required' },
      403,
    )
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select(`
      id,
      name,
      role,
      status,
      consent_status
    `)
    .eq('id', profileId)
    .maybeSingle()

  if (profileError || !profile) {
    console.error('Failed to fetch profile', {
      profileId,
      error: profileError,
    })

    return jsonResponse({ error: 'Profile not found' }, 404)
  }

  if (profile.status === 'published') {
    return jsonResponse(
      { error: 'This profile is already published' },
      400,
    )
  }

  /*
   * IN-PERSON CONSENT
   *
   * The admin is recording permission already given directly by the person.
   * This does not publish the profile.
   */
  if (mode === 'in_person') {
    const approvedAt = new Date().toISOString()

    const { error: updateError } = await admin
      .from('profiles')
      .update({
        consent_status: 'approved',
        consent_approved_at: approvedAt,
        consent_method: 'in_person',
      })
      .eq('id', profileId)

    if (updateError) {
      console.error('Failed to record in-person permission', {
        profileId,
        error: updateError,
      })

      return jsonResponse(
        { error: 'Could not record permission' },
        500,
      )
    }

    /*
     * Any outstanding email links should no longer be usable once a newer
     * in-person approval has been recorded.
     */
    const { error: invalidateError } = await admin
      .from('profile_consent_requests')
      .update({
        invalidated_at: approvedAt,
      })
      .eq('profile_id', profileId)
      .is('approved_at', null)
      .is('invalidated_at', null)

    if (invalidateError) {
      console.error('Failed to invalidate outstanding consent requests', {
        profileId,
        error: invalidateError,
      })
    }

    return jsonResponse({
      success: true,
      consentStatus: 'approved',
      consentMethod: 'in_person',
      approvedAt,
    })
  }

  /*
   * EMAIL CONSENT
   */
  const normalizedEmail = body.email?.trim().toLowerCase() ?? ''

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return jsonResponse(
      { error: 'A valid email address is required' },
      400,
    )
  }

  const rawToken = createSecureToken()
  const tokenHash = await sha256(rawToken)

  const requestedAt = new Date()
  const expiresAt = new Date(
    requestedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
  )

  /*
   * Invalidate older outstanding links first. A person should only have one
   * active review link for the current request.
   */
  const { error: invalidateError } = await admin
    .from('profile_consent_requests')
    .update({
      invalidated_at: requestedAt.toISOString(),
    })
    .eq('profile_id', profileId)
    .is('approved_at', null)
    .is('invalidated_at', null)

  if (invalidateError) {
    console.error('Failed to invalidate older consent requests', {
      profileId,
      error: invalidateError,
    })

    return jsonResponse(
      { error: 'Could not create permission request' },
      500,
    )
  }

  const { data: consentRequest, error: requestError } = await admin
    .from('profile_consent_requests')
    .insert({
      profile_id: profileId,
      email: normalizedEmail,
      token_hash: tokenHash,
      requested_at: requestedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    })
    .select('id')
    .single()

  if (requestError || !consentRequest) {
    console.error('Failed to create consent request', {
      profileId,
      error: requestError,
    })

    return jsonResponse(
      { error: 'Could not create permission request' },
      500,
    )
  }

  const { error: profileUpdateError } = await admin
    .from('profiles')
    .update({
      consent_status: 'requested',
      consent_requested_at: requestedAt.toISOString(),
      consent_approved_at: null,
      consent_method: null,
    })
    .eq('id', profileId)

  if (profileUpdateError) {
    console.error('Failed to update profile consent status', {
      profileId,
      error: profileUpdateError,
    })

    await admin
      .from('profile_consent_requests')
      .update({
        invalidated_at: new Date().toISOString(),
      })
      .eq('id', consentRequest.id)

    return jsonResponse(
      { error: 'Could not create permission request' },
      500,
    )
  }

  const reviewUrl =
    `https://nowweseeyou.org/consent/${encodeURIComponent(rawToken)}`

  /*
   * Reuse the existing transactional email pipeline.
   *
   * The raw token appears only in the outgoing review URL. It is never stored
   * in the database and is not written to logs.
   */
  const { error: emailError } = await admin.functions.invoke(
    'send-transactional-email',
    {
      body: {
        templateName: 'profile-consent-request',
        recipientEmail: normalizedEmail,
        idempotencyKey:
          `profile-consent-${profileId}-${consentRequest.id}`,
        templateData: {
          profileName: profile.name,
          role: profile.role,
          reviewUrl,
        },
      },
    },
  )

  if (emailError) {
    console.error('Failed to enqueue profile consent email', {
      profileId,
      consentRequestId: consentRequest.id,
      error: emailError,
    })

    /*
     * Do not leave the profile claiming that permission was successfully
     * requested if the email could not be queued.
     */
    const failedAt = new Date().toISOString()

    await admin
      .from('profile_consent_requests')
      .update({
        invalidated_at: failedAt,
      })
      .eq('id', consentRequest.id)

    await admin
      .from('profiles')
      .update({
        consent_status: 'not_requested',
        consent_requested_at: null,
        consent_approved_at: null,
        consent_method: null,
      })
      .eq('id', profileId)

    return jsonResponse(
      { error: 'Permission email could not be sent' },
      500,
    )
  }

  return jsonResponse({
    success: true,
    consentStatus: 'requested',
    requestedAt: requestedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  })
})