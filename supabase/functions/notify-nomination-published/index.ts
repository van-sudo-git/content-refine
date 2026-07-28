import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

interface RequestBody {
  nomination_id?: string
}

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const nominationId = body.nomination_id
  if (!nominationId) {
    return jsonResponse({ error: 'nomination_id is required' }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Fetch the nomination and related data
  const { data: nomination, error: nominationError } = await supabase
    .from('nominations')
    .select(`
      *,
      school:schools(id, name)
    `)
    .eq('id', nominationId)
    .maybeSingle()

  if (nominationError || !nomination) {
    console.error('Failed to fetch nomination', { error: nominationError, nominationId })
    return jsonResponse({ error: 'Nomination not found' }, 404)
  }

  const schoolId = nomination.school_id
  const schoolName = nomination.school?.name || 'your school'
  const profileUrl = `https://nowweseeyou.org/gallery/${nomination.profile_slug || ''}`

  // Fetch all PR roles for this school
  const { data: prRoles, error: prError } = await supabase
    .from('club_roles')
    .select('id, user_id')
    .eq('school_id', schoolId)
    .eq('role', 'pr')

  if (prError) {
    console.error('Failed to fetch PR roles', { error: prError, nominationId })
    return jsonResponse({ error: 'Failed to fetch PR roles' }, 500)
  }

  // Fetch school admins for this school and global admins
  const { data: schoolAdmins, error: adminError } = await supabase
    .from('school_admins')
    .select('email, is_global_admin')
    .or(`school_id.eq.${schoolId},is_global_admin.eq.true`)

  if (adminError) {
    console.error('Failed to fetch school admins', { error: adminError, nominationId })
    return jsonResponse({ error: 'Failed to fetch school admins' }, 500)
  }

  // Fetch user emails for PR roles
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) {
    console.error('Failed to fetch users', { error: usersError, nominationId })
    return jsonResponse({ error: 'Failed to fetch users' }, 500)
  }

  const userEmailMap = new Map<string, string>()
  for (const user of users.users) {
    if (user.email) {
      userEmailMap.set(user.id, user.email)
    }
  }

  let sent = 0

  // Send PR notifications
  if (prRoles && prRoles.length > 0) {
    for (const prRole of prRoles) {
      const email = userEmailMap.get(prRole.user_id)
      if (!email) {
        console.warn('No email for PR user', { userId: prRole.user_id, nominationId })
        continue
      }

      const idempotencyKey = `nomination-published-pr-${nominationId}-${prRole.id}`
      const { error: invokeError } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'nomination-published-pr',
          recipientEmail: email,
          idempotencyKey,
          templateData: {
            nomineeName: nomination.nominee_name,
            role: nomination.nominee_role,
            schoolName,
            profileUrl,
          },
        },
      })

      if (invokeError) {
        console.error('Failed to send PR published email', { error: invokeError, email, nominationId })
        continue
      }

      sent++
    }
  }

  // Send admin notifications
  if (schoolAdmins && schoolAdmins.length > 0) {
    const adminEmails = Array.from(new Set(schoolAdmins.map((a) => a.email)))
    for (const email of adminEmails) {
      const idempotencyKey = `nomination-published-admin-${nominationId}-${email}`
      const { error: invokeError } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'nomination-published-admin',
          recipientEmail: email,
          idempotencyKey,
          templateData: {
            nomineeName: nomination.nominee_name,
            role: nomination.nominee_role,
            schoolName,
            profileUrl,
            adminDashboardUrl: 'https://nowweseeyou.org/admin',
          },
        },
      })

      if (invokeError) {
        console.error('Failed to send admin published email', { error: invokeError, email, nominationId })
        continue
      }

      sent++
    }
  }

  console.log('Nomination published emails sent', { nominationId, sent })
  return jsonResponse({ success: true, sent })
})
