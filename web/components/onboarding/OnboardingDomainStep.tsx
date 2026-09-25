import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@helpwave/hightide'
import { createDomain, updateDomain } from '@/api/domain'
import type { Domain } from '@/api/types/domain'
import { OnboardingActions } from '@/components/onboarding/OnboardingActions'
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { invalidateHostQueries } from '@/utils/hostQueries'

type OnboardingDomainStepProps = {
  domain: Domain | null,
  onBack: () => void,
  onSaved: (domain: Domain) => void,
}

export const OnboardingDomainStep = ({
  domain,
  onBack,
  onSaved,
}: OnboardingDomainStepProps) => {
  const translation = useDomeTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState(domain?.name ?? '')

  const save = useMutation({
    mutationFn: async (domainName: string) => {
      if (domain === null) {
        return createDomain({ name: domainName })
      }
      if (domain.name === domainName) {
        return domain
      }
      return updateDomain(domain.id, { name: domainName })
    },
    onSuccess: async (saved) => {
      await invalidateHostQueries(queryClient)
      onSaved(saved)
    },
  })

  const submit = () => {
    const trimmedName = name.trim()
    if (trimmedName.length === 0 || save.isPending) {
      return
    }
    save.mutate(trimmedName)
  }

  return (
    <OnboardingFrame
      title={translation('onboardingDomainTitle')}
      description={translation('onboardingDomainDescription')}
    >
      <label className="flex-col-1" htmlFor="onboarding-domain-name">
        <span className="typography-label-md">{translation('name')}</span>
        <Input
          id="onboarding-domain-name"
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
      {save.isError && (
        <p className="typography-body text-negative">{save.error.message}</p>
      )}
      <OnboardingActions
        onBack={onBack}
        onContinue={submit}
        continueDisabled={name.trim().length === 0}
        pending={save.isPending}
      />
    </OnboardingFrame>
  )
}
