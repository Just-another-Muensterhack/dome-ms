import { apiOrigin } from '@/api/client'

const uuidHex = (value: string) => value.replaceAll('-', '')

export const websiteContentPreviewUrl = (websiteId: string, contentId: string) => (
  `${apiOrigin}/media/websites/${uuidHex(websiteId)}/${uuidHex(contentId)}/index.html`
)
