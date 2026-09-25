import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog, Input, Textarea } from '@helpwave/hightide'
import { updateDomain, useDomainsQuery } from '@/api/domain'
import type { Domain } from '@/api/types/domain'
import { createWebsite, updateWebsite } from '@/api/website'
import type { Website, WebsiteIn } from '@/api/types/website'
import { WebsiteDomainSelect } from '@/components/websites/WebsiteDomainSelect'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { invalidateHostQueries } from '@/utils/hostQueries'

type AddWebsiteDialogProps = {
  isOpen: boolean,
  onClose: () => void,
  website?: Website,
}

const parseTags = (value: string): string[] => (
  value.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
)

const syncWebsiteDomains = async (
  websiteId: string,
  nextIds: string[],
  domains: Domain[]
): Promise<void> => {
  const currentIds = domains
    .filter((domain) => domain.website_id === websiteId)
    .map((domain) => domain.id)
  const currentIdSet = new Set(currentIds)
  const nextIdSet = new Set(nextIds)

  await Promise.all([
    ...nextIds
      .filter((id) => !currentIdSet.has(id))
      .map((id) => updateDomain(id, { website_id: websiteId })),
    ...currentIds
      .filter((id) => !nextIdSet.has(id))
      .map((id) => updateDomain(id, { website_id: null })),
  ])
}

export const AddWebsiteDialog = ({
  isOpen,
  onClose,
  website,
}: AddWebsiteDialogProps) => {
  const translation = useDomeTranslation()
  const queryClient = useQueryClient()
  const domainsQuery = useDomainsQuery()
  const createdId = useRef<string | null>(null)
  const [name, setName] = useState(website?.name ?? '')
  const [description, setDescription] = useState(website?.description ?? '')
  const [tags, setTags] = useState(website?.tags.join(', ') ?? '')
  const [domainIds, setDomainIds] = useState(website?.domains.map((domain) => domain.id) ?? [])
  const isEdit = website !== undefined

  const clearForm = () => {
    setName(website?.name ?? '')
    setDescription(website?.description ?? '')
    setTags(website?.tags.join(', ') ?? '')
    setDomainIds(website?.domains.map((domain) => domain.id) ?? [])
    createdId.current = null
  }

  const fieldId = website?.id ?? 'new'

  const save = useMutation({
    mutationFn: async (input: { payload: WebsiteIn, nextDomainIds: string[] }) => {
      const existingId = website?.id ?? createdId.current
      const saved = existingId
        ? await updateWebsite(existingId, input.payload)
        : await createWebsite(input.payload)
      createdId.current = saved.id
      const domains = queryClient.getQueryData<Domain[]>(['domains', null]) ?? domainsQuery.data ?? []
      await syncWebsiteDomains(saved.id, input.nextDomainIds, domains)
      return saved
    },
    onSuccess: async () => {
      await invalidateHostQueries(queryClient)
      clearForm()
      onClose()
    },
  })

  const close = () => {
    clearForm()
    save.reset()
    onClose()
  }

  const submit = () => {
    const trimmedName = name.trim()
    if (trimmedName.length === 0 || save.isPending) {
      return
    }

    save.mutate({
      payload: {
        name: trimmedName,
        description: description.trim(),
        tags: parseTags(tags),
      },
      nextDomainIds: domainIds,
    })
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      isModal
      titleElement={(
        <span className="typography-title-md">
          {translation(isEdit ? 'editWebsite' : 'addWebsite')}
        </span>
      )}
      description={translation(isEdit ? 'editWebsite' : 'addWebsite')}
      confirmType="primary"
      onCancel={close}
      onConfirm={submit}
      buttonOverwrites={[
        { text: translation('cancel') },
        {},
        {
          text: translation(isEdit ? 'save' : 'add'),
          disabled: name.trim().length === 0 || save.isPending,
        },
      ]}
    >
      <div className="flex-col-3">
        <label className="flex-col-1" htmlFor={`website-name-${fieldId}`}>
          <span className="typography-label-md">{translation('name')}</span>
          <Input
            id={`website-name-${fieldId}`}
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
        <label className="flex-col-1" htmlFor={`website-description-${fieldId}`}>
          <span className="typography-label-md">{translation('description')}</span>
          <Textarea
            id={`website-description-${fieldId}`}
            value={description}
            onValueChange={setDescription}
          />
        </label>
        <label className="flex-col-1" htmlFor={`website-tags-${fieldId}`}>
          <span className="typography-label-md">{translation('tags')}</span>
          <Input
            id={`website-tags-${fieldId}`}
            value={tags}
            onValueChange={setTags}
            placeholder={translation('tagsPlaceholder')}
          />
        </label>
        <WebsiteDomainSelect value={domainIds} onValueChange={setDomainIds} />
        {save.isError && (
          <p className="typography-body text-negative">{save.error.message}</p>
        )}
      </div>
    </ConfirmDialog>
  )
}
