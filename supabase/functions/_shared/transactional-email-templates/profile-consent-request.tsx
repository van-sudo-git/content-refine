import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface ProfileTeamMember { name?: string; role?: string }
interface ProfileConsentRequestProps { profileName?: string; role?: string; reviewUrl?: string; requesterName?: string; teamMembers?: ProfileTeamMember[]; personalMessage?: string }

const main = { backgroundColor: '#F5F1E8', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 32px', maxWidth: '560px', borderRadius: '12px' }
const heading = { color: '#332E2B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, lineHeight: '1.3', margin: '0 0 24px' }
const text = { color: '#332E2B', fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }
const highlight = { backgroundColor: '#F0EBF7', borderLeft: '4px solid #7E57C2', padding: '16px 20px', margin: '24px 0', borderRadius: '0 8px 8px 0' }
const note = { backgroundColor: '#FBF8F2', border: '1px solid #E8E3D8', padding: '18px 20px', margin: '20px 0 24px', borderRadius: '8px' }
const button = { backgroundColor: '#7E57C2', borderRadius: '8px', color: '#ffffff', display: 'inline-block', fontSize: '16px', fontWeight: 500, padding: '14px 28px', textDecoration: 'none', marginTop: '8px' }
const footer = { color: '#6B6560', fontSize: '13px', lineHeight: '1.5', marginTop: '32px', borderTop: '1px solid #E8E3D8', paddingTop: '20px' }
const roleLabel = (role?: string) => role === 'journalist' ? 'Journalist' : role === 'artist' ? 'Artist' : role === 'photographer' ? 'Photographer' : role || 'Team member'

const Email = ({ profileName='there', role='Staff Member', reviewUrl='https://nowweseeyou.org', requesterName='the Now We See You administrator', teamMembers=[], personalMessage='' }: ProfileConsentRequestProps) => (
  <Html lang="en" dir="ltr"><Head /><Preview>Please review your Now We See You profile before it is published</Preview><Body style={main}><Container style={container}>
    <Heading style={heading}>Please review your Now We See You profile</Heading>
    <Text style={text}>Hi {profileName},</Text>
    {personalMessage.trim() && <Section style={note}><Text style={{...text,margin:'0 0 8px',fontWeight:500}}>A note from the Now We See You team</Text><Text style={{...text,margin:0,whiteSpace:'pre-wrap'}}>{personalMessage.trim()}</Text></Section>}
    <Text style={text}>A Now We See You profile has been prepared to recognize your work and contribution.</Text>
    <Section style={highlight}><Text style={{...text,margin:0,fontWeight:500}}>{profileName}</Text><Text style={{...text,margin:0,color:'#6B6560'}}>{role}</Text></Section>
    <Text style={text}>Before anything is published, we would like you to review the profile and confirm that you are comfortable with the profile and its media appearing publicly on Now We See You.</Text>
    <Button href={reviewUrl} style={button}>Review profile</Button>
    <Text style={{...text,marginTop:'24px',fontWeight:500}}>Want something changed first?</Text>
    <Text style={text}>Please reply to this email with any corrections or recommendations before approving the profile. Your reply will go to {requesterName}. If members of the assigned student team are copied on this email, you can use Reply All to include them too.</Text>
    {teamMembers.length>0 && <Section style={highlight}><Text style={{...text,margin:'0 0 8px',fontWeight:500}}>Profile team</Text>{teamMembers.map((m,i)=><Text key={`${m.name||'member'}-${i}`} style={{...text,margin:'2px 0',fontSize:'14px'}}>{m.name||'Student team member'} · {roleLabel(m.role)}</Text>)}</Section>}
    <Text style={{...text,marginTop:'24px',fontWeight:500}}>Nothing will be published until permission is confirmed.</Text>
    <Text style={text}>Opening the review page does not approve the profile. You will be able to review the content before choosing whether to give permission.</Text>
    <Text style={text}>If you did not expect this message, you can ignore it.</Text>
    <Text style={footer}>Now We See You<br />Visibility for the People Behind the Scenes<br />nowweseeyou.org</Text>
  </Container></Body></Html>
)

export const template = { component: Email, subject: 'Please review your Now We See You profile', displayName: 'Profile Publication Permission', previewData: { profileName: 'Jose Guerrero', role: 'Night Lead Custodian', reviewUrl: 'https://nowweseeyou.org/consent/example-review-token', requesterName: 'Evaan Ahlawat', personalMessage: 'Thank you for taking the time to review this. Please let us know if you would like anything changed.', teamMembers: [{name:'Evaan Ahlawat',role:'journalist'}] } } satisfies TemplateEntry
