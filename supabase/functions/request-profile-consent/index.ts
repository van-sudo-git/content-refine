import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
interface RequestBody { profileId?: string; mode?: 'email'|'in_person'; email?: string; reusePreviousEmail?: boolean; personalMessage?: string }
interface TeamMember { name?: string; role?: string; email?: string }
const jsonResponse=(data:Record<string,unknown>,status=200)=>new Response(JSON.stringify(data),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})
const bytesToHex=(bytes:Uint8Array)=>Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('')
async function sha256(value:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return bytesToHex(new Uint8Array(digest))}
function createSecureToken(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'')}
const isValidEmail=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS') return new Response(null,{headers:corsHeaders})
 if(req.method!=='POST') return jsonResponse({error:'Method not allowed'},405)
 const supabaseUrl=Deno.env.get('SUPABASE_URL'), serviceRoleKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), anonKey=Deno.env.get('SUPABASE_ANON_KEY')
 if(!supabaseUrl||!serviceRoleKey||!anonKey) return jsonResponse({error:'Server configuration error'},500)
 const authorization=req.headers.get('Authorization'); if(!authorization) return jsonResponse({error:'Authentication required'},401)
 const callerClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authorization}}})
 const {data:{user},error:userError}=await callerClient.auth.getUser(); if(userError||!user||!user.email) return jsonResponse({error:'Authentication required'},401)
 let body:RequestBody; try{body=await req.json()}catch{return jsonResponse({error:'Invalid JSON body'},400)}
 const profileId=body.profileId, mode=body.mode; if(!profileId) return jsonResponse({error:'profileId is required'},400); if(mode!=='email'&&mode!=='in_person') return jsonResponse({error:'mode must be email or in_person'},400)
 const adminEmail=user.email.toLowerCase()
 const {data:adminRow}=await callerClient.from('school_admins').select('id,name,email,school_id,is_global_admin').eq('email',adminEmail).limit(1).maybeSingle(); if(!adminRow) return jsonResponse({error:'Administrator access required'},403)
 const {data:visibleProfile}=await callerClient.from('profiles').select('id,school_id').eq('id',profileId).maybeSingle(); if(!visibleProfile) return jsonResponse({error:'Profile not found or access denied'},403)
 if(!adminRow.is_global_admin&&adminRow.school_id!==visibleProfile.school_id) return jsonResponse({error:'Administrator access required'},403)
 const admin=createClient(supabaseUrl,serviceRoleKey)
 const {data:profile}=await admin.from('profiles').select('id,name,role,status,consent_status,nomination_id').eq('id',profileId).maybeSingle(); if(!profile) return jsonResponse({error:'Profile not found'},404); if(profile.status==='published') return jsonResponse({error:'This profile is already published'},400)
 if(mode==='in_person'){const approvedAt=new Date().toISOString(); const {error}=await admin.from('profiles').update({consent_status:'approved',consent_approved_at:approvedAt,consent_method:'in_person'}).eq('id',profileId); if(error) return jsonResponse({error:'Could not record permission'},500); await admin.from('profile_consent_requests').update({invalidated_at:approvedAt}).eq('profile_id',profileId).is('approved_at',null).is('invalidated_at',null); return jsonResponse({success:true,consentStatus:'approved',consentMethod:'in_person',approvedAt})}
 let email=body.email?.trim().toLowerCase()??''
 if(body.reusePreviousEmail){const {data:prev,error}=await admin.from('profile_consent_requests').select('email').eq('profile_id',profileId).order('requested_at',{ascending:false}).limit(1).maybeSingle(); if(error) return jsonResponse({error:'Could not load the previous permission email'},500); email=prev?.email?.trim().toLowerCase()??''}
 if(!email||!isValidEmail(email)) return jsonResponse({error:body.reusePreviousEmail?'No previous valid staff email was found. Enter the email address and send a new review link.':'A valid email address is required'},400)
 const personalMessage=(body.personalMessage??'').trim().slice(0,1200)
 const teamMembers:TeamMember[]=[]
 if(profile.nomination_id){const {data:nom}=await admin.from('nominations').select('journalist_id,photographer_id,artist_id').eq('id',profile.nomination_id).maybeSingle(); if(nom){const ids=[nom.journalist_id,nom.photographer_id,nom.artist_id].filter((v):v is string=>Boolean(v)); if(ids.length){const {data:rows}=await admin.from('club_roles').select('id,name,email,role').in('id',ids); for(const row of rows??[]){const e=row.email?.trim().toLowerCase(); if(!e||!isValidEmail(e)||e===email||e===adminEmail) continue; teamMembers.push({name:row.name||undefined,role:row.role||undefined,email:e})}}}}
 const cc=Array.from(new Set(teamMembers.map(m=>m.email).filter((e):e is string=>Boolean(e)))).slice(0,3)
 const rawToken=createSecureToken(), tokenHash=await sha256(rawToken), requestedAt=new Date(), expiresAt=new Date(requestedAt.getTime()+7*24*60*60*1000)
 const {error:invalidateError}=await admin.from('profile_consent_requests').update({invalidated_at:requestedAt.toISOString()}).eq('profile_id',profileId).is('approved_at',null).is('invalidated_at',null); if(invalidateError) return jsonResponse({error:'Could not create permission request'},500)
 const {data:consentRequest,error:requestError}=await admin.from('profile_consent_requests').insert({profile_id:profileId,email,token_hash:tokenHash,requested_at:requestedAt.toISOString(),expires_at:expiresAt.toISOString(),created_by:user.id}).select('id').single(); if(requestError||!consentRequest) return jsonResponse({error:'Could not create permission request'},500)
 const {error:profileUpdateError}=await admin.from('profiles').update({consent_status:'requested',consent_requested_at:requestedAt.toISOString(),consent_approved_at:null,consent_method:null}).eq('id',profileId); if(profileUpdateError){await admin.from('profile_consent_requests').update({invalidated_at:new Date().toISOString()}).eq('id',consentRequest.id); return jsonResponse({error:'Could not create permission request'},500)}
 const reviewUrl=`https://nowweseeyou.org/consent/${encodeURIComponent(rawToken)}`, requesterName=adminRow.name?.trim()||'the Now We See You administrator'
 const {error:emailError}=await admin.functions.invoke('send-transactional-email',{body:{templateName:'profile-consent-request',recipientEmail:email,replyTo:adminEmail,cc,idempotencyKey:`profile-consent-${profileId}-${consentRequest.id}`,templateData:{profileName:profile.name,role:profile.role,reviewUrl,requesterName,personalMessage,teamMembers:teamMembers.map(({name,role})=>({name,role}))}}})
 if(emailError){const failedAt=new Date().toISOString(); await admin.from('profile_consent_requests').update({invalidated_at:failedAt}).eq('id',consentRequest.id); await admin.from('profiles').update({consent_status:'not_requested',consent_requested_at:null,consent_approved_at:null,consent_method:null}).eq('id',profileId); return jsonResponse({error:'Permission email could not be sent'},500)}
 return jsonResponse({success:true,consentStatus:'requested',recipientEmail:email,requestedAt:requestedAt.toISOString(),expiresAt:expiresAt.toISOString(),copiedTeamMembers:cc.length})
})
