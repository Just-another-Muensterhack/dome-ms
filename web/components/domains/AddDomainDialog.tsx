import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog, Input, LabelledCheckbox, Select } from '@helpwave/hightide'
import { createDomain } from '@/api/domain'
import { useWebsites } from '@/api/website'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

type AddDomainDialogProps = {
  isOpen: boolean,
  onClose: () => void,
}

export const AddDomainDialog = ({
  isOpen,
  onClose,
}: AddDomainDialogProps) => {
  const translation = useDomeTranslation()
  const queryClient = useQueryClient()
  const websites = useWebsites()
  const [name, setName] = useState('')
  const [wildcard, setWildcard] = useState(false)
  const [websiteId, setWebsiteId] = useState('')

  const clearForm = () => {
    setName('')
    setWildcard(false)
    setWebsiteId('')
  }

  const create = useMutation({
    mutationFn: createDomain,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['domains'] })
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
      wildcard,
      website_id: websiteId.length > 0 ? websiteId : null,
    })
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      isModal
      titleElement={<span className="typography-title-md">{translation('addDomain')}</span>}
      description={translation('addDomain')}
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
        <label className="flex-col-1" htmlFor="domain-name">
          <span className="typography-label-md">{translation('name')}</span>
          <Input
            id="domain-name"
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
            onValueChange={(value) => setWebsiteId(value ?? '')}
            placeholder={translation('selectWebsite')}
          >
            <Select.Option value="" label={translation('noWebsite')}>
              {translation('noWebsite')}
            </Select.Option>
            {(websites.data ?? []).map((website) => (
              <Select.Option key={website.id} value={website.id} label={website.name}>
                {website.name}
              </Select.Option>
            ))}
          </Select>
        </div>
        {create.isError && (
          <p className="typography-body text-negative">{create.error.message}</p>
        )}
      </div>
    </ConfirmDialog>
  )
}
