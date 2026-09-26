import { apiOrigin } from '@/api/client'

const maxSnapshotNameLength = 255

export const snapshotDateTimeLabel = (date: Date, locale: string) => (
  date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
)

export const snapshotDateLabel = (date: Date, locale: string) => (
  date.toLocaleDateString(locale, { dateStyle: 'medium' })
)

export const collapseSnapshotName = (value: string) => (
  value.replaceAll(/\s+/g, ' ').trim().slice(0, maxSnapshotNameLength)
)

export const snapshotNameWithSuffix = (previousName: string, suffix: string) => {
  const trimmed = previousName.trim()
  if (trimmed.length === 0) {
    return suffix.trim().slice(0, maxSnapshotNameLength)
  }
  const room = Math.max(0, maxSnapshotNameLength - suffix.length)
  return `${trimmed.slice(0, room).trimEnd()}${suffix}`
}

const uuidHex = (value: string) => value.replaceAll('-', '')

export const websiteContentPreviewUrl = (websiteId: string, contentId: string) => (
  `${apiOrigin}/media/websites/${uuidHex(websiteId)}/${uuidHex(contentId)}/index.html`
)
