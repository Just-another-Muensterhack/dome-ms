import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createDomain,
  managedDomainHostname,
  managedWebsiteDomain,
  updateDomain,
  useManagedDomainEligibility
} from '@/api/domain'
import type { Domain } from '@/api/types/domain'
import { DomainNameField } from '@/components/domains/DomainNameField'
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
  const locked = domain?.managed === true
  const initialName = locked && domain !== null
    ? domain.name.slice(0, -(managedWebsiteDomain.length + 1))
    : domain?.name ?? ''
  const [name, setName] = useState(initialName)
  const [managed, setManaged] = useState(locked)
  const eligibility = useManagedDomainEligibility(name, managed && !locked)
  const canContinue = locked || (managed ? eligibility.passed : name.trim().length > 0)

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
    if (!canContinue || save.isPending) {
      return
    }
    const domainName = managed ? managedDomainHostname(name) : name.trim()
    save.mutate(domainName)
  }

  return (
    <OnboardingFrame
      title={translation('onboardingDomainTitle')}
      description={translation('onboardingDomainDescription')}
    >
      <DomainNameField
        id="onboarding-domain-name"
        name={name}
        managed={managed}
        locked={locked}
        checking={eligibility.checking}
        failed={eligibility.failed}
        reason={eligibility.reason}
        onNameChange={setName}
        onManagedChange={setManaged}
        onEnter={submit}
      />
      {save.isError && (
        <p className="typography-body text-negative">{save.error.message}</p>
      )}
      <OnboardingActions
        onBack={onBack}
        onContinue={submit}
        continueDisabled={!canContinue}
        pending={save.isPending}
      />
    </OnboardingFrame>
  )
}
