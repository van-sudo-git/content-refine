import { template as nominationAssigned } from './nomination-assigned.tsx'
import { template as nominationPublishedAdmin } from './nomination-published-admin.tsx'
import { template as nominationPublishedPr } from './nomination-published-pr.tsx'
import { template as roleAssigned } from './roles-assigned.tsx'

import type { FC } from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: FC<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'nomination-assigned': nominationAssigned,
  'nomination-published-admin': nominationPublishedAdmin,
  'nomination-published-pr': nominationPublishedPr,
  'role-assigned': roleAssigned,
}