import type { ReactNode } from 'react'
import Link from 'next/link'
import { Button, Select } from '@helpwave/hightide'
import type { WebsiteContent } from '@/api/types/websiteContent'
import { useDomeTranslation, useLocale } from '@/i18n/useDomeTranslation'
import { ExternalLink } from 'lucide-react'

type WebsiteEditorSidebarProps = {
  websiteId: string,
  websiteName: string,
  contents: WebsiteContent[],
  selectedId?: string,
  onSelect: (contentId: string) => void,
  onUpdate: () => void,
  onCreate: () => void,
  isActivating: boolean,
  showActions: boolean,
  mobilePreview: boolean,
  onMobilePreviewChange: (mobilePreview: boolean) => void,
  showFullscreenLink: boolean,
  children?: ReactNode,
}

export const WebsiteEditorSidebar = ({
  websiteId,
  websiteName,
  contents,
  selectedId,
  onSelect,
  onUpdate,
  onCreate,
  isActivating,
  showActions,
  mobilePreview,
  onMobilePreviewChange,
  showFullscreenLink,
  children,
}: WebsiteEditorSidebarProps) => {
  const translation = useDomeTranslation()
  const { locale } = useLocale()
  const hasActiveSnapshot = contents.some((content) => content.is_active)

  const optionLabel = (content: WebsiteContent) => {
    const date = new Date(content.created_at).toLocaleString(locale)
    if (!content.is_active) {
      return date
    }
    return `${date} (${translation('editorSnapshotActive')})`
  }

  return (
    <aside className="flex-col-3 w-full rounded-lg bg-surface-variant p-4 text-on-surface">
      <div className="flex-row-2 justify-between items-start">
        <div className="flex-col-0">
          <h2 className="typography-title-md">{translation('editorPreviewTitle')}</h2>
          {websiteName.length > 0 && (
            <p className="typography-body text-description">{websiteName}</p>
          )}
        </div>
        {showFullscreenLink && (
          <Link
            href={`/website/preview/${websiteId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-button"
            data-size="sm"
            data-color="primary"
            data-coloringstyle="text"
          >
            <ExternalLink size={16}/>
          </Link>
        )}
      </div>
      {contents.length > 0 && selectedId && (
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
      )}
      <div className="flex-col-1">
        <span className="typography-label-md">{translation('editorActiveSnapshot')}</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label={translation('editorPreviewTitle')}>
          <Button
            type="button"
            size="sm"
            color={mobilePreview ? 'neutral' : 'primary'}
            coloringStyle={mobilePreview ? 'outline' : 'solid'}
            aria-pressed={!mobilePreview}
            onClick={() => onMobilePreviewChange(false)}
          >
            {translation('editorDesktop')}
          </Button>
          <Button
            type="button"
            size="sm"
            color={mobilePreview ? 'primary' : 'neutral'}
            coloringStyle={mobilePreview ? 'solid' : 'outline'}
            aria-pressed={mobilePreview}
            onClick={() => onMobilePreviewChange(true)}
          >
            {translation('editorMobile')}
          </Button>
        </div>
      </div>
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
      {showActions && contents.length === 0 && (
        <Button type="button" onClick={onCreate}>
          {translation('editorNewSnapshot')}
        </Button>
      )}
      {children}
    </aside>
  )
}
