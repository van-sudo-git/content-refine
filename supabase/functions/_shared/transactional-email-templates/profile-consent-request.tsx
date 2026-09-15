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

interface ProfileConsentRequestProps {
  profileName?: string
  role?: string
  reviewUrl?: string
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
  marginTop: '8px',
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
  profileName = 'there',
  role = 'Staff Member',
  reviewUrl = 'https://nowweseeyou.org',
}: ProfileConsentRequestProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />

      <Preview>
        Please review your Now We See You profile before it is published
      </Preview>

      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            Please review your Now We See You profile
          </Heading>

          <Text style={text}>
            Hi {profileName},
          </Text>

          <Text style={text}>
            A Now We See You profile has been prepared to recognize your work
            and contribution.
          </Text>

          <Section style={highlight}>
            <Text
              style={{
                ...text,
                margin: 0,
                fontWeight: 500,
              }}
            >
              {profileName}
            </Text>

            <Text
              style={{
                ...text,
                margin: 0,
                color: '#6B6560',
              }}
            >
              {role}
            </Text>
          </Section>

          <Text style={text}>
            Before anything is published, we would like you to review the
            profile and confirm that you are comfortable with the profile and
            its media appearing publicly on Now We See You.
          </Text>

          <Button href={reviewUrl} style={button}>
            Review profile
          </Button>

          <Text
            style={{
              ...text,
              marginTop: '24px',
              fontWeight: 500,
            }}
          >
            Nothing will be published until permission is confirmed.
          </Text>

          <Text style={text}>
            Opening the review page does not approve the profile. You will be
            able to review the content before choosing whether to give
            permission.
          </Text>

          <Text style={text}>
            If you did not expect this message, you can ignore it.
          </Text>

          <Text style={footer}>
            Now We See You
            <br />
            Visibility for the People Behind the Scenes
            <br />
            nowweseeyou.org
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,

  subject: 'Please review your Now We See You profile',

  displayName: 'Profile Publication Permission',

  previewData: {
    profileName: 'Jose Guerrero',
    role: 'Night Lead Custodian',
    reviewUrl:
      'https://nowweseeyou.org/consent/example-review-token',
  },
} satisfies TemplateEntry