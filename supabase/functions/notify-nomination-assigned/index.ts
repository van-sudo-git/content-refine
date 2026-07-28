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

  // Collect assignment role IDs and map to role types
  const assignments: { role: string; clubRoleId: string | null }[] = [
    { role: 'journalist', clubRoleId: nomination.journalist_id },
    { role: 'photographer', clubRoleId: nomination.photographer_id },
    { role: 'artist', clubRoleId: nomination.artist_id },
  ].filter((a) => a.clubRoleId)

  if (assignments.length === 0) {
    return jsonResponse({ success: true, sent: 0, reason: 'no_assignments' })
  }

  // Fetch club roles with user emails
  const clubRoleIds = assignments.map((a) => a.clubRoleId)
  const { data: clubRoles, error: rolesError } = await supabase
    .from('club_roles')
    .select('id, user_id')
    .in('id', clubRoleIds)

  if (rolesError || !clubRoles) {
    console.error('Failed to fetch club roles', { error: rolesError, nominationId })
    return jsonResponse({ error: 'Failed to fetch club roles' }, 500)
  }

  const userIds = clubRoles.map((r) => r.user_id)
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

  const roleIdToType = new Map<string, string>()
  for (const a of assignments) {
    if (a.clubRoleId) {
      roleIdToType.set(a.clubRoleId, a.role)
    }
  }

  let sent = 0
  for (const clubRole of clubRoles) {
    const email = userEmailMap.get(clubRole.user_id)
    if (!email) {
      console.warn('No email for user', { userId: clubRole.user_id, nominationId })
      continue
    }

    const assignmentType = roleIdToType.get(clubRole.id) || 'assignment'
    const idempotencyKey = `nomination-assigned-${nominationId}-${clubRole.id}`

    const profileSlug = await resolveProfileSlug(supabase, nomination.nominee_name)

    const { error: invokeError } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'nomination-assigned',
        recipientEmail: email,
        idempotencyKey,
        templateData: {
          nomineeName: nomination.nominee_name,
          role: nomination.nominee_role,
          schoolName,
          assignmentType,
          profileUrl: `https://nowweseeyou.org/gallery/${profileSlug}`,
          adminDashboardUrl: 'https://nowweseeyou.org/admin',
        },
      },
    })

    if (invokeError) {
      console.error('Failed to send nomination assigned email', {
        error: invokeError,
        email,
        nominationId,
      })
      continue
    }

    sent++
  }

  console.log('Nomination assigned emails sent', { nominationId, sent, attempted: assignments.length })
  return jsonResponse({ success: true, sent })
})
