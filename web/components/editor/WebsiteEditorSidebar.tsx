import { useEffect, useState } from 'react'
import { Button, ConfirmDialog, Input, LabelledCheckbox, Select } from '@helpwave/hightide'
import { ExternalLink, Maximize2, Minimize2 } from 'lucide-react'
import Link from 'next/link'
import type { WebsiteContent } from '@/api/types/websiteContent'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { websiteContentPreviewUrl } from '@/utils/websiteContent'

type WebsiteEditorSidebarProps = {
  websiteId: string,
  websiteName: string,
  contents: WebsiteContent[],
  selectedId?: string,
  onSelect: (contentId: string) => void,
  onActivate: (contentId: string) => void,
  onRename: (contentId: string, name: string) => void,
  renameError?: string,
  onDelete: (contentId: string) => Promise<void>,
  isDeleting: boolean,
  onUpdate: () => void,
  onCreate: () => void,
  onUpload: () => void,
  isActivating: boolean,
  mobilePreview: boolean,
  onMobilePreviewChange: (mobilePreview: boolean) => void,
  showFullscreenLink: boolean,
}

export const WebsiteEditorSidebar = ({
  websiteId,
  websiteName,
  contents,
  selectedId,
  onSelect,
  onActivate,
  onRename,
  renameError,
  onDelete,
  isDeleting,
  onUpdate,
  onCreate,
  onUpload,
  isActivating,
  mobilePreview,
  onMobilePreviewChange,
  showFullscreenLink,
}: WebsiteEditorSidebarProps) => {
  const translation = useDomeTranslation()
  const hasActiveSnapshot = contents.some((content) => content.is_active)
  const selected = contents.find((content) => content.id === selectedId)
  const [name, setName] = useState(selected?.name ?? '')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | undefined>()
  const isOnlySnapshot = contents.length === 1

  useEffect(() => {
    setName(selected?.name ?? '')
  }, [selected?.id, selected?.name])

  const commitName = () => {
    if (!selected) {
      return
    }
    const trimmed = name.trim()
    if (trimmed.length === 0 || trimmed === selected.name) {
      setName(selected.name)
      return
    }
    onRename(selected.id, trimmed)
  }

  const openDelete = () => {
    setDeleteError(undefined)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!selected || isDeleting) {
      return
    }
    if (selected.is_active && contents.length > 1) {
      setDeleteError(translation('editorDeleteActiveSnapshot'))
      return
    }
    try {
      await onDelete(selected.id)
      setIsDeleteOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      setDeleteError(message.length > 0 ? message : translation('editorDeleteFailed'))
    }
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
        <div className="flex-row-1 items-center">
          {showFullscreenLink ? (
            <Link
              href={selected
                ? `/website/preview/${websiteId}?snapshotId=${encodeURIComponent(selected.id)}`
                : `/website/preview/${websiteId}`}
              className="icon-button"
              data-size="sm"
              data-color="primary"
              data-coloringstyle="text"
              aria-label={translation('editorOpenFullscreen')}
              title={translation('editorOpenFullscreen')}
            >
              <Maximize2 size={16} />
            </Link>
          ) : (
            <Link
              href={selected
                ? `/website/${websiteId}?tab=editor&snapshotId=${encodeURIComponent(selected.id)}`
                : `/website/${websiteId}?tab=editor`}
              className="icon-button"
              data-size="sm"
              data-color="primary"
              data-coloringstyle="text"
              aria-label={translation('editorMinimize')}
              title={translation('editorMinimize')}
            >
              <Minimize2 size={16} />
            </Link>
          )}
          {selected && (
            <a
              href={websiteContentPreviewUrl(websiteId, selected.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="icon-button"
              data-size="sm"
              data-color="primary"
              data-coloringstyle="text"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
      {contents.length > 0 && selected && (
        <>
          <label className="flex-col-1">
            <span className="typography-label-md">{translation('editorShownSnapshot')}</span>
            <Select
              value={selected.id}
              onValueChange={(value) => {
                if (value) {
                  onSelect(value)
                }
              }}
            >
              {contents.map((content) => (
                <Select.Option key={content.id} value={content.id} label={content.name}>
                  {content.name}
                </Select.Option>
              ))}
            </Select>
          </label>
          <label className="flex-col-1" htmlFor={`snapshot-name-${selected.id}`}>
            <span className="typography-label-md">{translation('name')}</span>
            <Input
              id={`snapshot-name-${selected.id}`}
              value={name}
              maxLength={255}
              onValueChange={setName}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitName()
                }
              }}
            />
          </label>
          {renameError && (
            <p className="typography-body text-negative">{renameError}</p>
          )}
          <LabelledCheckbox
            label={translation('editorMakeActiveSnapshot')}
            value={selected.is_active}
            disabled={isActivating}
            onValueChange={(checked) => {
              if (checked && !selected.is_active) {
                onActivate(selected.id)
              }
            }}
          />
        </>
      )}
      <div className="flex-col-1">
        <span className="typography-body text-description">{websiteName}</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label={translation('previewMode')}>
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

      <div className="flex-col-0">
        <span className="typography-body text-description">{translation('actions')}</span>

        <div className="flex-col-2">
          <Button type="button" color="neutral" coloringStyle="outline" onClick={onCreate}>
            {translation('editorNewSnapshot')}
          </Button>
          <Button type="button" color="neutral" coloringStyle="outline" onClick={onUpload}>
            {translation('editorUploadFiles')}
          </Button>
          {hasActiveSnapshot && (
            <>
              {selected?.kind === 'uploaded' ? (
                <p className="typography-body text-description">{translation('editorUploadedNoUpdate')}</p>
              ) : (
                <Button type="button" onClick={onUpdate}>
                  {translation('editorUpdateSnapshot')}
                </Button>
              )}
              <Button
                type="button"
                color="negative"
                coloringStyle="text"
                onClick={openDelete}
              >
                {translation('delete')}
              </Button>
              <ConfirmDialog
                isOpen={isDeleteOpen}
                isModal
                className="confirm-dialog"
                titleElement={<span className="typography-title-md">{translation('editorDeleteSnapshotTitle')}</span>}
                description={translation('editorDeleteSnapshotDescription')}
                confirmType="negative"
                onCancel={() => setIsDeleteOpen(false)}
                onConfirm={() => {
                  void confirmDelete()
                }}
                buttonOverwrites={[
                  { text: translation('cancel') },
                  {},
                  { text: translation('delete'), disabled: isDeleting },
                ]}
              >
                {isOnlySnapshot && (
                  <p className="typography-body text-warning">{translation('editorDeleteOnlySnapshotWarning')}</p>
                )}
                {deleteError && (
                  <p className="typography-body text-negative" role="alert">{deleteError}</p>
                )}
              </ConfirmDialog>
            </>
          )}
        </div>
      </div>
      {contents.length === 0 && (
        <Button type="button" onClick={onCreate}>
          {translation('editorNewSnapshot')}
        </Button>
      )}
    </aside>
  )
}
