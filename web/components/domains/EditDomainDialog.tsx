import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog, Input, LabelledCheckbox, Select } from '@helpwave/hightide'
import { updateDomain } from '@/api/domain'
import type { Domain } from '@/api/types/domain'
import { useWebsites } from '@/api/website'
import { DomainVerification } from '@/components/domains/DomainVerification'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { invalidateHostQueries } from '@/utils/hostQueries'

type EditDomainDialogProps = {
  domain: Domain,
  isOpen: boolean,
  onClose: () => void,
}

export const EditDomainDialog = ({
  domain,
  isOpen,
  onClose,
}: EditDomainDialogProps) => {
  const translation = useDomeTranslation()
  const queryClient = useQueryClient()
  const websites = useWebsites()
  const websiteOptions = websites.data ?? []
  const hasNoWebsites = websites.isSuccess && websiteOptions.length === 0
  const [name, setName] = useState(domain.name)
  const [wildcard, setWildcard] = useState(domain.wildcard)
  const [websiteId, setWebsiteId] = useState(domain.website_id ?? '')

  const update = useMutation({
    mutationFn: (payload: { name: string, wildcard: boolean, website_id: string | null }) => (
      updateDomain(domain.id, payload)
    ),
    onSuccess: async () => {
      await invalidateHostQueries(queryClient)
      onClose()
    },
  })

  const close = () => {
    update.reset()
    onClose()
  }

  const submit = () => {
    const trimmedName = name.trim()
    if (trimmedName.length === 0 || update.isPending) {
      return
    }

    update.mutate({
      name: trimmedName,
      wildcard,
      website_id: websiteId.length > 0 ? websiteId : null,
    })
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      isModal
      titleElement={<span className="typography-title-md">{translation('editDomain')}</span>}
      description={translation('editDomain')}
      confirmType="primary"
      onCancel={close}
      onConfirm={submit}
      buttonOverwrites={[
        { text: translation('cancel') },
        {},
        { text: translation('save'), disabled: name.trim().length === 0 || update.isPending },
      ]}
    >
      <div className="flex-col-3">
        <label className="flex-col-1" htmlFor={`domain-edit-name-${domain.id}`}>
          <span className="typography-label-md">{translation('name')}</span>
          <Input
            id={`domain-edit-name-${domain.id}`}
            value={name}
            onValueChange={setName}
            placeholder="example.com"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            }}
          />
        </label>
        <LabelledCheckbox
          label={translation('wildcard')}
          value={wildcard}
          onValueChange={setWildcard}
        />
        <div className="flex-col-1">
          <span className="typography-label-md">{translation('website')}</span>
          <Select
            value={websiteId.length > 0 ? websiteId : undefined}
            disabled={hasNoWebsites}
            onValueChange={(value) => setWebsiteId(value ?? '')}
            placeholder={hasNoWebsites ? translation('noWebsites') : translation('selectWebsite')}
          >
            {!hasNoWebsites && (
              <Select.Option value="" label={translation('noWebsite')}>
                {translation('noWebsite')}
              </Select.Option>
            )}
            {websiteOptions.map((website) => (
              <Select.Option key={website.id} value={website.id} label={website.name}>
                {website.name}
              </Select.Option>
            ))}
          </Select>
        </div>
        <DomainVerification domain={domain} />
        {update.isError && (
          <p className="typography-body text-negative">{update.error.message}</p>
        )}
      </div>
    </ConfirmDialog>
  )
}
