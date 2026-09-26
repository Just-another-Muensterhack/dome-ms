import { useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Drawer, IconButton, Input, LoadingSpinner, Textarea } from '@helpwave/hightide'
import { PencilIcon } from 'lucide-react'
import {
  useActivateWebsiteContent,
  useDeleteWebsiteContent,
  useEditWebsiteContent,
  useUpdateWebsiteContent,
  useWebsiteContents,
  websiteContentsKey
} from '@/api/websiteBuilder'
import type { WebsiteContent } from '@/api/types/websiteContent'
import { WebsiteEditorSidebar } from '@/components/editor/WebsiteEditorSidebar'
import { WebsiteSnapshotPreview } from '@/components/editor/WebsiteSnapshotPreview'
import { WebsiteSnapshotStepper } from '@/components/editor/WebsiteSnapshotStepper'
import { WebsiteUploadDialog } from '@/components/editor/WebsiteUploadDialog'
import { useDomeTranslation, useLocale } from '@/i18n/useDomeTranslation'
import { snapshotDateLabel, snapshotNameWithSuffix, websiteContentPreviewUrl } from '@/utils/websiteContent'

const maxPromptLength = 2000

type WebsiteEditorProps = {
  websiteId: string,
  websiteName: string,
  initialDescription: string,
  fullscreen?: boolean,
}

const Field = ({
  label,
  children,
}: {
  label: string,
  children: ReactNode,
}) => (
  <label className="flex-col-1">
    <span className="typography-label-md">{label}</span>
    {children}
  </label>
)

export const WebsiteEditor = ({
  websiteId,
  websiteName,
  initialDescription,
  fullscreen = false,
}: WebsiteEditorProps) => {
  const translation = useDomeTranslation()
  const { locale } = useLocale()
  const queryClient = useQueryClient()
  const contentsQuery = useWebsiteContents(websiteId)
  const contents = contentsQuery.data ?? []
  const activeContent = contents.find((content) => content.is_active)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [prompt, setPrompt] = useState('')
  const [snapshotName, setSnapshotName] = useState('')
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [mobilePreview, setMobilePreview] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const refreshContents = async () => {
    await queryClient.invalidateQueries({ queryKey: websiteContentsKey(websiteId) })
  }

  const activate = useActivateWebsiteContent({
    onSuccess: () => {
      void refreshContents()
    },
  })

  const rename = useUpdateWebsiteContent({
    onSuccess: () => {
      void refreshContents()
    },
  })

  const remove = useDeleteWebsiteContent({
    onSuccess: (_result, contentId) => {
      const remaining = contents.filter((content) => content.id !== contentId)
      const next = remaining.find((content) => content.is_active) ?? remaining[0]
      setSelectedId(next?.id)
      setPrompt('')
      setIsUpdateOpen(false)
      void refreshContents()
    },
  })

  const showCreatedSnapshot = async (content: WebsiteContent) => {
    setSelectedId(content.id)
    setPrompt('')
    setIsUpdateOpen(false)
    setIsCreateOpen(false)
    await refreshContents()
  }

  const edit = useEditWebsiteContent({
    onSuccess: (content) => {
      void showCreatedSnapshot(content)
    },
  })

  const selectedContent = contents.find((content) => content.id === selectedId)
    ?? activeContent
    ?? contents[0]
  const previewId = selectedId ?? selectedContent?.id
  const showInlineStepper = !fullscreen && contentsQuery.isSuccess && contents.length === 0

  const chooseSnapshot = (contentId: string) => {
    setSelectedId(contentId)
  }

  const closeUpdate = () => {
    if (edit.isPending) {
      return
    }
    edit.reset()
    setIsUpdateOpen(false)
  }

  const sidebar = (
    <WebsiteEditorSidebar
      websiteId={websiteId}
      websiteName={websiteName}
      contents={contents}
      selectedId={previewId}
      onSelect={chooseSnapshot}
      onActivate={(contentId) => activate.mutate(contentId)}
      onRename={(contentId, name) => rename.mutate({ contentId, name })}
      renameError={rename.isError ? rename.error.message : undefined}
      onDelete={(contentId) => remove.mutateAsync(contentId)}
      isDeleting={remove.isPending}
      onUpdate={() => {
        const current = contents.find((content) => content.id === previewId) ?? selectedContent
        setPrompt('')
        setSnapshotName(snapshotNameWithSuffix(
          current?.name ?? '',
          translation('editorUpdatedSnapshotSuffix', { when: snapshotDateLabel(new Date(), locale) }),
        ))
        setIsUpdateOpen(true)
      }}
      onCreate={() => setIsCreateOpen(true)}
      onUpload={() => setIsUploadOpen(true)}
      isActivating={activate.isPending}
      mobilePreview={mobilePreview}
      onMobilePreviewChange={setMobilePreview}
      showFullscreenLink={!fullscreen}
    />
  )

  const createDialog = isCreateOpen ? (
    <Dialog
      isOpen
      isModal
      titleElement={<span className="typography-title-md">{translation('editorNewSnapshot')}</span>}
      description={translation('editorLead')}
      className="snapshot-dialog"
      onClose={() => setIsCreateOpen(false)}
    >
      <WebsiteSnapshotStepper
        key={selectedContent?.id ?? 'new'}
        websiteId={websiteId}
        websiteName={websiteName}
        initialDescription={initialDescription}
        source={selectedContent}
        fixedHeight
        onCancel={() => setIsCreateOpen(false)}
        onCreated={(content) => {
          void showCreatedSnapshot(content)
        }}
      />
    </Dialog>
  ) : undefined

  const status = (
    <>
      {contentsQuery.isPending && (
        <p className="typography-body text-description">{translation('editorLoadingSnapshots')}</p>
      )}
      {contentsQuery.isError && (
        <p className="typography-body text-negative" role="alert">{translation('editorSnapshotsUnavailable')}</p>
      )}
      {activate.isError && (
        <p className="typography-body text-negative" role="alert">
          {activate.error.message || translation('editorActivateFailed')}
        </p>
      )}
    </>
  )

  return (
    <div className={fullscreen ? undefined : 'flex-col-4 grow'}>
      {!fullscreen && status}
      {showInlineStepper && (
        <WebsiteSnapshotStepper
          websiteId={websiteId}
          websiteName={websiteName}
          initialDescription={initialDescription}
          onUpload={() => setIsUploadOpen(true)}
          onCreated={(content) => {
            void showCreatedSnapshot(content)
          }}
        />
      )}
      {!showInlineStepper && previewId && !fullscreen && (
        <WebsiteSnapshotPreview
          websiteId={websiteId}
          selectedId={previewId}
          mobilePreview={mobilePreview}
          sidebar={sidebar}
        />
      )}
      {fullscreen && (
        <div className="fixed inset-0 flex bg-surface">
          <div className="absolute left-4 top-4 z-20 max-w-sm">
            {status}
          </div>
          {previewId && (
            <div className={mobilePreview ? 'mx-auto h-full w-full max-w-sm' : 'h-full w-full'}>
              <iframe
                key={previewId}
                title={translation('editorPreviewFrame')}
                sandbox="allow-scripts allow-same-origin"
                src={websiteContentPreviewUrl(websiteId, previewId)}
                className="block h-full w-full border-0 bg-white"
              />
            </div>
          )}
          <IconButton
            color="primary"
            className="fixed bottom-4 left-4 z-30 shadow-md"
            tooltip={translation('editorEditPreview')}
            onClick={() => setIsSidebarOpen(true)}
          >
            <PencilIcon className="size-5" />
          </IconButton>
          <Drawer
            isOpen={isSidebarOpen}
            alignment="right"
            titleElement={<span className="typography-title-md">{translation('editorPreviewTitle')}</span>}
            description={translation('editorPreviewFrame')}
            containerClassName="w-full max-w-sm"
            onClose={() => setIsSidebarOpen(false)}
          >
            {sidebar}
          </Drawer>
        </div>
      )}
      {isUpdateOpen && selectedContent && selectedContent.kind !== 'uploaded' && (
        <Dialog
          isOpen
          isModal
          className="confirm-dialog"
          titleElement={<span className="typography-title-md">{translation('editorUpdateSnapshot')}</span>}
          description={translation('editorUpdatePromptLabel')}
          onClose={closeUpdate}
        >
          {edit.isPending ? (
            <div className="flex-col-2 items-start">
              <LoadingSpinner />
              <p className="typography-title-md">{translation('editorUpdatingTitle')}</p>
              <p className="typography-body text-description">{translation('editorUpdatingWait')}</p>
            </div>
          ) : (
            <div className="flex-col-3">
              <Field label={translation('name')}>
                <Input
                  value={snapshotName}
                  maxLength={255}
                  onValueChange={setSnapshotName}
                />
              </Field>
              <Field label={translation('editorUpdatePromptLabel')}>
                <Textarea
                  value={prompt}
                  maxLength={maxPromptLength}
                  rows={4}
                  placeholder={translation('editorUpdatePromptPlaceholder')}
                  onValueChange={setPrompt}
                />
              </Field>
              {edit.isError && (
                <p className="typography-body text-negative" role="alert">
                  {edit.error.message || translation('editorUpdateFailed')}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" color="neutral" coloringStyle="outline" onClick={closeUpdate}>
                  {translation('cancel')}
                </Button>
                <Button
                  type="button"
                  disabled={prompt.trim().length === 0}
                  onClick={() => edit.mutate({
                    contentId: selectedContent.id,
                    prompt: prompt.trim(),
                    name: snapshotName.trim(),
                  })}
                >
                  {translation('editorUpdateSubmit')}
                </Button>
              </div>
            </div>
          )}
        </Dialog>
      )}
      {createDialog}
      {isUploadOpen && (
        <WebsiteUploadDialog
          websiteId={websiteId}
          onClose={() => setIsUploadOpen(false)}
          onUploaded={(content) => {
            void showCreatedSnapshot(content)
          }}
        />
      )}
    </div>
  )
}
