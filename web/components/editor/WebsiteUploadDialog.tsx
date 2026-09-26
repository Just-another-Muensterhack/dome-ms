import { useRef, useState } from 'react'
import { Button, Dialog, IconButton, Input } from '@helpwave/hightide'
import { X } from 'lucide-react'
import { useUploadWebsite } from '@/api/websiteBuilder'
import type { WebsiteContent } from '@/api/types/websiteContent'
import { useDomeTranslation, useLocale } from '@/i18n/useDomeTranslation'
import { snapshotDateLabel } from '@/utils/websiteContent'
import {
  isUploadPath,
  itemsFromDataTransfer,
  itemsFromFileList,
  uploadAccept,
  type WebsiteUploadItem,
} from '@/utils/websiteUpload'

type WebsiteUploadDialogProps = {
  websiteId: string,
  onClose: () => void,
  onUploaded: (content: WebsiteContent) => void,
}

export const WebsiteUploadDialog = ({
  websiteId,
  onClose,
  onUploaded,
}: WebsiteUploadDialogProps) => {
  const translation = useDomeTranslation()
  const { locale } = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(() => translation('editorUploadedSnapshotName', {
    when: snapshotDateLabel(new Date(), locale),
  }).slice(0, 255))
  const [files, setFiles] = useState<WebsiteUploadItem[]>([])
  const [skipped, setSkipped] = useState(false)
  const [isOver, setIsOver] = useState(false)
  const upload = useUploadWebsite({
    onSuccess: (content) => {
      onUploaded(content)
      onClose()
    },
  })

  const addItems = (incoming: WebsiteUploadItem[]) => {
    const accepted = incoming.filter((item) => isUploadPath(item.path))
    if (accepted.length < incoming.length) {
      setSkipped(true)
    }
    setFiles((current) => {
      const byPath = new Map(current.map((item) => [item.path, item]))
      for (const item of accepted) {
        byPath.set(item.path, item)
      }
      return [...byPath.values()]
    })
  }

  const close = () => {
    if (upload.isPending) {
      return
    }
    onClose()
  }

  const submit = () => {
    if (files.length === 0 || upload.isPending) {
      return
    }
    upload.mutate({ websiteId, files, name: name.trim() })
  }

  return (
    <Dialog
      isOpen
      isModal
      className="confirm-dialog"
      titleElement={<span className="typography-title-md">{translation('editorUploadFiles')}</span>}
      description={translation('editorUploadHint')}
      onClose={close}
    >
      <div className="flex-col-3">
        <label className="flex-col-1" htmlFor="snapshot-upload-name">
          <span className="typography-label-md">{translation('name')}</span>
          <Input
            id="snapshot-upload-name"
            value={name}
            maxLength={255}
            onValueChange={setName}
          />
        </label>
        <div
          className={isOver
            ? 'flex-col-2 items-center rounded-lg border border-dashed border-primary p-4'
            : 'flex-col-2 items-center rounded-lg border border-dashed border-neutral p-4'}
          onDragEnter={(event) => {
            event.preventDefault()
            setIsOver(true)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setIsOver(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            setIsOver(false)
          }}
          onDrop={(event) => {
            event.preventDefault()
            setIsOver(false)
            void itemsFromDataTransfer(event.dataTransfer).then(addItems)
          }}
        >
          <p className="typography-body text-description">{translation('editorUploadHint')}</p>
          <Button type="button" color="neutral" coloringStyle="outline" onClick={() => inputRef.current?.click()}>
            {translation('editorChooseFiles')}
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={uploadAccept}
            className="hidden"
            onChange={(event) => {
              addItems(itemsFromFileList(event.currentTarget.files))
              event.currentTarget.value = ''
            }}
          />
        </div>
        {files.length === 0 ? (
          <p className="typography-body text-description">{translation('editorUploadEmpty')}</p>
        ) : (
          <ul className="flex-col-1 max-h-64 overflow-y-auto">
            {files.map((item) => (
              <li key={item.path} className="flex-row-2 items-center justify-between gap-2">
                <span className="typography-body min-w-0 truncate">{item.path}</span>
                <IconButton
                  size="sm"
                  color="neutral"
                  coloringStyle="text"
                  tooltip={translation('editorUploadRemove')}
                  aria-label={translation('editorUploadRemove')}
                  onClick={() => setFiles((current) => current.filter((file) => file.path !== item.path))}
                >
                  <X className="size-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
        {skipped && (
          <p className="typography-body text-warning" role="alert">{translation('editorUploadSkipped')}</p>
        )}
        {upload.isError && (
          <p className="typography-body text-negative" role="alert">
            {upload.error.message || translation('editorUploadFailed')}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" color="neutral" coloringStyle="outline" disabled={upload.isPending} onClick={close}>
            {translation('cancel')}
          </Button>
          <Button type="button" disabled={files.length === 0} isProcessing={upload.isPending} onClick={submit}>
            {translation('editorUploadFiles')}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
