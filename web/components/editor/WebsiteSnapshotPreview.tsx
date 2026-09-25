import { useState, type ReactNode } from 'react'
import { Button, Select } from '@helpwave/hightide'
import type { WebsiteContent } from '@/api/types/websiteContent'
import { useDomeTranslation, useLocale } from '@/i18n/useDomeTranslation'
import { websiteContentPreviewUrl } from '@/utils/websiteContent'

type WebsiteSnapshotPreviewProps = {
  websiteId: string,
  websiteName: string,
  contents: WebsiteContent[],
  selectedId: string,
  onSelect: (contentId: string) => void,
  onUpdate: () => void,
  onCreate: () => void,
  isActivating: boolean,
  showActions: boolean,
  children?: ReactNode,
}

export const WebsiteSnapshotPreview = ({
  websiteId,
  websiteName,
  contents,
  selectedId,
  onSelect,
  onUpdate,
  onCreate,
  isActivating,
  showActions,
  children,
}: WebsiteSnapshotPreviewProps) => {
  const translation = useDomeTranslation()
  const { locale } = useLocale()
  const [mobilePreview, setMobilePreview] = useState(false)
  const hasActiveSnapshot = contents.some((content) => content.is_active)

  const optionLabel = (content: WebsiteContent) => {
    const date = new Date(content.created_at).toLocaleString(locale)
    if (!content.is_active) {
      return date
    }
    return `${date} (${translation('editorSnapshotActive')})`
  }

  return (
    <section className="flex-col-4 desktop:flex-row desktop:items-start">
      <aside className="flex-col-3 max-w-sm rounded-lg bg-surface-variant p-4 text-on-surface">
        <h2 className="typography-title-md">{translation('editorPreviewTitle')}</h2>
        {websiteName.length > 0 && (
          <p className="typography-body text-description">{websiteName}</p>
        )}
        <label className="flex-col-1">
          <span className="typography-label-md">{translation('editorActiveSnapshot')}</span>
          <Select
            value={selectedId}
            disabled={isActivating}
            onValueChange={(value) => {
              if (value) {
                onSelect(value)
              }
            }}
          >
            {contents.map((content) => (
              <Select.Option key={content.id} value={content.id} label={optionLabel(content)}>
                {optionLabel(content)}
              </Select.Option>
            ))}
          </Select>
        </label>
        {showActions && hasActiveSnapshot && (
          <div className="flex-col-2">
            <Button type="button" onClick={onUpdate}>
              {translation('editorUpdateSnapshot')}
            </Button>
            <Button type="button" color="neutral" coloringStyle="outline" onClick={onCreate}>
              {translation('editorNewSnapshot')}
            </Button>
          </div>
        )}
        {children}
      </aside>
      <div className="flex-col-2 min-w-0 grow">
        <div className="flex flex-wrap gap-2" role="group" aria-label={translation('editorPreviewTitle')}>
          <Button
            type="button"
            size="sm"
            color={mobilePreview ? 'neutral' : 'primary'}
            coloringStyle={mobilePreview ? 'outline' : 'solid'}
            aria-pressed={!mobilePreview}
            onClick={() => setMobilePreview(false)}
          >
            {translation('editorDesktop')}
          </Button>
          <Button
            type="button"
            size="sm"
            color={mobilePreview ? 'primary' : 'neutral'}
            coloringStyle={mobilePreview ? 'solid' : 'outline'}
            aria-pressed={mobilePreview}
            onClick={() => setMobilePreview(true)}
          >
            {translation('editorMobile')}
          </Button>
        </div>
        <div className={mobilePreview ? 'mx-auto w-full max-w-sm' : 'w-full'}>
          <iframe
            key={selectedId}
            title={translation('editorPreviewFrame')}
            sandbox=""
            src={websiteContentPreviewUrl(websiteId, selectedId)}
            className="h-[36rem] w-full rounded-lg border border-neutral bg-white"
          />
        </div>
      </div>
    </section>
  )
}
