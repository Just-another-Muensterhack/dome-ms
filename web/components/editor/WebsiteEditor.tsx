import { useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Drawer, IconButton, LoadingSpinner, Textarea } from '@helpwave/hightide'
import { PencilIcon } from 'lucide-react'
import {
  useActivateWebsiteContent,
  useEditWebsiteContent,
  useWebsiteContents,
  websiteContentsKey
} from '@/api/websiteBuilder'
import type { WebsiteContent } from '@/api/types/websiteContent'
import { WebsiteEditorSidebar } from '@/components/editor/WebsiteEditorSidebar'
import { WebsiteSnapshotPreview } from '@/components/editor/WebsiteSnapshotPreview'
import { WebsiteSnapshotStepper } from '@/components/editor/WebsiteSnapshotStepper'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { websiteContentPreviewUrl } from '@/utils/websiteContent'

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
  const queryClient = useQueryClient()
  const contentsQuery = useWebsiteContents(websiteId)
  const contents = contentsQuery.data ?? []
  const activeContent = contents.find((content) => content.is_active)
  const [panel, setPanel] = useState<'preview' | 'update'>('preview')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [prompt, setPrompt] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
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

  const showCreatedSnapshot = async (content: WebsiteContent) => {
    setSelectedId(content.id)
    setPrompt('')
    setPanel('preview')
    setIsCreateOpen(false)
    await refreshContents()
    if (!content.is_active) {
      activate.mutate(content.id)
    }
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
    const next = contents.find((content) => content.id === contentId)
    if (next && !next.is_active) {
      activate.mutate(contentId)
    }
  }

  const updateForm = panel === 'update' && selectedContent ? (
    edit.isPending ? (
      <div className="flex-col-2 items-start">
        <LoadingSpinner />
        <p className="typography-title-md">{translation('editorUpdatingTitle')}</p>
        <p className="typography-body text-description">{translation('editorUpdatingWait')}</p>
      </div>
    ) : (
      <div className="flex-col-2">
        <Field label={translation('editorUpdatePromptLabel')}>
          <Textarea
            value={prompt}
            maxLength={maxPromptLength}
            rows={4}
            placeholder={translation('editorUpdatePromptPlaceholder')}
            onValueChange={setPrompt}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" color="neutral" coloringStyle="outline" onClick={() => setPanel('preview')}>
            {translation('cancel')}
          </Button>
          <Button
            type="button"
            disabled={prompt.trim().length === 0}
            onClick={() => edit.mutate({ contentId: selectedContent.id, prompt: prompt.trim() })}
          >
            {translation('editorUpdateSubmit')}
          </Button>
        </div>
      </div>
    )
  ) : undefined

  const sidebar = (
    <WebsiteEditorSidebar
      websiteId={websiteId}
      websiteName={websiteName}
      contents={contents}
      selectedId={previewId}
      onSelect={chooseSnapshot}
      onUpdate={() => {
        setPrompt('')
        setPanel('update')
      }}
      onCreate={() => setIsCreateOpen(true)}
      isActivating={activate.isPending}
      showActions={panel === 'preview'}
      mobilePreview={mobilePreview}
      onMobilePreviewChange={setMobilePreview}
      showFullscreenLink={!fullscreen}
    >
      {updateForm}
    </WebsiteEditorSidebar>
  )

  const createDialog = isCreateOpen ? (
    <Dialog
      isOpen
      isModal
      titleElement={<span className="typography-title-md">{translation('editorNewSnapshot')}</span>}
      description={translation('editorLead')}
      containerClassName="w-[min(48rem,calc(100vw-2rem))] max-h-[90vh] overflow-y-auto"
      onClose={() => setIsCreateOpen(false)}
    >
      <WebsiteSnapshotStepper
        key={selectedContent?.id ?? 'new'}
        websiteId={websiteId}
        websiteName={websiteName}
        initialDescription={initialDescription}
        source={selectedContent}
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
      {edit.isError && (
        <p className="typography-body text-negative" role="alert">
          {edit.error.message || translation('editorUpdateFailed')}
        </p>
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
                sandbox=""
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
      {createDialog}
    </div>
  )
}
