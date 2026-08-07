import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  email?: string
  role?: string
  school_id?: string
}

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// pr uses the admin dashboard, everyone else uses the club dashboard
function destinationUrlForRole(role: string): string {
  if (role === 'pr') return 'https://nowweseeyou.org/admin'
  return 'https://nowweseeyou.org/club'
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

  const { email, role, school_id: schoolId } = body
  if (!email || !role || !schoolId) {
    return jsonResponse({ error: 'email, role, and school_id are required' }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('name')
    .eq('id', schoolId)
    .maybeSingle()

  if (schoolError) {
    console.error('Failed to fetch school', { error: schoolError, schoolId })
  }

  const schoolName = school?.name || 'your school'
  const idempotencyKey = `role-assigned-${schoolId}-${role}-${email}`

  const { error: invokeError } = await supabase.functions.invoke('send-transactional-email', {
    body: {
      templateName: 'role-assigned',
      recipientEmail: email,
      idempotencyKey,
      templateData: {
        role,
        schoolName,
        dashboardUrl: destinationUrlForRole(role),
      },
    },
  })

  if (invokeError) {
    console.error('Failed to send role assigned email', { error: invokeError, email, role, schoolId })
    return jsonResponse({ error: 'Failed to send email' }, 500)
  }

  console.log('Role assigned email sent', { email, role, schoolId })
  return jsonResponse({ success: true })
})