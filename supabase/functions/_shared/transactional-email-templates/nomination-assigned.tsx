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

interface NominationAssignedProps {
  nomineeName?: string
  role?: string
  schoolName?: string
  assignmentType?: string
  profileUrl?: string
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

const Email = ({
  nomineeName = 'a staff member',
  role = 'Staff Member',
  schoolName = 'your school',
  assignmentType = 'assignment',
  profileUrl = '#',
  adminDashboardUrl = '#',
}: NominationAssignedProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        You have been assigned to the {nomineeName} profile at {schoolName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            You have been assigned a new profile
          </Heading>
          <Text style={text}>
            Hi there,
          </Text>
          <Text style={text}>
            You have been assigned as the {assignmentType} for the profile of{' '}
            <strong>{nomineeName}</strong> ({role}) at {schoolName}.
          </Text>
          <Section style={highlight}>
            <Text style={{ ...text, margin: 0, fontWeight: 500 }}>
              {nomineeName}
            </Text>
            <Text style={{ ...text, margin: 0, color: '#6B6560' }}>
              {role}, {schoolName}
            </Text>
          </Section>
          <Text style={text}>
            You can view the profile and manage your contribution from the admin dashboard.
          </Text>
          <Button href={adminDashboardUrl} style={button}>
            Open admin dashboard
          </Button>
          <Text style={footer}>
            This email was sent by NowWeSeeYou. If you have questions, reply to this email or contact your school administrator.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: ({ nomineeName, schoolName }: NominationAssignedProps) =>
    `You have been assigned to the ${nomineeName} profile at ${schoolName}`,
  displayName: 'Nomination Assigned',
  previewData: {
    nomineeName: 'Brad Fisher',
    role: 'Head Custodian',
    schoolName: 'Lake Washington High School',
    assignmentType: 'journalist',
    profileUrl: 'https://nowweseeyou.org/gallery/brad-fisher',
    adminDashboardUrl: 'https://nowweseeyou.org/admin',
  },
} satisfies TemplateEntry
