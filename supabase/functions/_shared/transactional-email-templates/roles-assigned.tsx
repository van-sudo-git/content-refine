import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface RoleAssignedProps {
  role?: string
  schoolName?: string
  adminDashboardUrl?: string
}

const main = {
  backgroundColor: '#F5F1E8',
  fontFamily: "'DM Sans', Arial, sans-serif",
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 32px',
  maxWidth: '560px',
  borderRadius: '12px',
}

const heading = {
  color: '#332E2B',
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: '28px',
  fontWeight: 600,
  lineHeight: '1.3',
  margin: '0 0 24px',
}

const text = {
  color: '#332E2B',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const highlight = {
  backgroundColor: '#F0EBF7',
  borderLeft: '4px solid #7E57C2',
  padding: '16px 20px',
  margin: '24px 0',
  borderRadius: '0 8px 8px 0',
}

const button = {
  backgroundColor: '#7E57C2',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 500,
  padding: '14px 28px',
  textDecoration: 'none',
  marginTop: '16px',
}

const footer = {
  color: '#6B6560',
  fontSize: '13px',
  lineHeight: '1.5',
  marginTop: '32px',
  borderTop: '1px solid #E8E3D8',
  paddingTop: '20px',
}

// role descriptions shown in the email so a brand new club member
// knows what they're actually signed up to do
const roleBlurbs: Record<string, string> = {
  journalist: 'interview staff members, write their stories, and publish their profiles',
  photographer: 'take and upload photos for staff profiles',
  artist: 'create the hand-drawn portrait for staff profiles',
  pr: 'generate flyers and share published profiles with the school community',
}

const Email = ({
  role = 'club member',
  schoolName = 'your school',
  adminDashboardUrl = '#',
}: RoleAssignedProps) => {
  const blurb = roleBlurbs[role] ?? 'help recognize staff members at your school'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        You've been added as a {role} for Now We See You at {schoolName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            Welcome to Now We See You
          </Heading>
          <Text style={text}>
            Hi there,
          </Text>
          <Text style={text}>
            You've been added as a <strong>{role}</strong> for Now We See You
            at {schoolName}.
          </Text>
          <Section style={highlight}>
            <Text style={{ ...text, margin: 0, fontWeight: 500 }}>
              As a {role}, you'll {blurb}.
            </Text>
          </Section>
          <Text style={text}>
            When a nomination gets assigned to you, you'll get another email
            with the details. For now, this just means you're on the team.
          </Text>
          <Button href={adminDashboardUrl} style={button}>
            Open admin dashboard
          </Button>
          <Text style={footer}>
            This email was sent by NowWeSeeYou. If you weren't expecting this,
            reply and let us know.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: ({ role, schoolName }: RoleAssignedProps) =>
    `You've been added as a ${role} for Now We See You at ${schoolName}`,
  displayName: 'Role Assigned',
  previewData: {
    role: 'journalist',
    schoolName: 'Lake Washington High School',
    adminDashboardUrl: 'https://nowweseeyou.org/admin',
  },
} satisfies TemplateEntry