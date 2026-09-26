import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog, LabelledCheckbox } from '@helpwave/hightide'
import { createDomain, isManagedDomainLabel, managedDomainHostname, useManagedDomainEligibility } from '@/api/domain'
import { DomainNameField } from '@/components/domains/DomainNameField'
import { DomainWebsiteField } from '@/components/domains/DomainWebsiteField'
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
  const [name, setName] = useState('')
  const [managed, setManaged] = useState(false)
  const [wildcard, setWildcard] = useState(false)
  const [websiteId, setWebsiteId] = useState('')
  const eligibility = useManagedDomainEligibility(name, managed)
  const labelValid = isManagedDomainLabel(name)
  const canSubmit = managed ? eligibility.passed && labelValid : name.trim().length > 0

  const clearForm = () => {
    setName('')
    setManaged(false)
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
    if (!canSubmit || create.isPending) {
      return
    }

    create.mutate({
      name: managed ? managedDomainHostname(name) : name.trim(),
      wildcard: managed ? false : wildcard,
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
        { text: translation('add'), disabled: !canSubmit || create.isPending },
      ]}
    >
      <div className="flex-col-3">
        <DomainNameField
          id="domain-name"
          name={name}
          managed={managed}
          locked={false}
          checking={eligibility.checking}
          failed={eligibility.passed && !labelValid}
          onNameChange={setName}
          onManagedChange={setManaged}
          onEnter={submit}
        />
        {!managed && (
          <LabelledCheckbox
            label={translation('wildcard')}
            value={wildcard}
            onValueChange={setWildcard}
          />
        )}
        <DomainWebsiteField websiteId={websiteId} onWebsiteIdChange={setWebsiteId} />
        {create.isError && (
          <p className="typography-body text-negative">{create.error.message}</p>
        )}
      </div>
    </ConfirmDialog>
  )
}
