import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog, Input, Textarea } from '@helpwave/hightide'
import { createWebsite } from '@/api/website'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

type AddWebsiteDialogProps = {
  isOpen: boolean,
  onClose: () => void,
}

const parseTags = (value: string): string[] => (
  value.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
)

export const AddWebsiteDialog = ({
  isOpen,
  onClose,
}: AddWebsiteDialogProps) => {
  const translation = useDomeTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')

  const clearForm = () => {
    setName('')
    setDescription('')
    setTags('')
  }

  const create = useMutation({
    mutationFn: createWebsite,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['websites'] })
      await queryClient.invalidateQueries({ queryKey: ['website'] })
      clearForm()
      onClose()
    },
  })

  const close = () => {
    clearForm()
    create.reset()
    onClose()
  }

  const submit = () => {
    const trimmedName = name.trim()
    if (trimmedName.length === 0 || create.isPending) {
      return
    }

    create.mutate({
      name: trimmedName,
      description: description.trim(),
      tags: parseTags(tags),
    })
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      isModal
      titleElement={<span className="typography-title-md">{translation('addWebsite')}</span>}
      description={translation('addWebsite')}
      confirmType="primary"
      onCancel={close}
      onConfirm={submit}
      buttonOverwrites={[
        { text: translation('cancel') },
        {},
        { text: translation('add'), disabled: name.trim().length === 0 || create.isPending },
      ]}
    >
      <div className="flex-col-3">
        <label className="flex-col-1" htmlFor="website-name">
          <span className="typography-label-md">{translation('name')}</span>
          <Input
            id="website-name"
            value={name}
            onValueChange={setName}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            }}
          />
        </label>
        <label className="flex-col-1" htmlFor="website-description">
          <span className="typography-label-md">{translation('description')}</span>
          <Textarea
            id="website-description"
            value={description}
            onValueChange={setDescription}
          />
        </label>
        <label className="flex-col-1" htmlFor="website-tags">
          <span className="typography-label-md">{translation('tags')}</span>
          <Input
            id="website-tags"
            value={tags}
            onValueChange={setTags}
            placeholder={translation('tagsPlaceholder')}
          />
        </label>
        {create.isError && (
          <p className="typography-body text-negative">{create.error.message}</p>
        )}
      </div>
    </ConfirmDialog>
  )
}
