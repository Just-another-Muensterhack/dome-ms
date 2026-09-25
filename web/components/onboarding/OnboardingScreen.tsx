import { useState } from 'react'
import type { Domain } from '@/api/types/domain'
import { OnboardingAddressStep } from '@/components/onboarding/OnboardingAddressStep'
import { OnboardingChoice } from '@/components/onboarding/OnboardingChoice'
import { OnboardingDomainStep } from '@/components/onboarding/OnboardingDomainStep'
import { OnboardingWebsiteStep } from '@/components/onboarding/OnboardingWebsiteStep'

type OnboardingPath = 'create' | 'existing'

type OnboardingScreenProps = {
  onComplete: () => void,
}

export const OnboardingScreen = ({
  onComplete,
}: OnboardingScreenProps) => {
  const [path, setPath] = useState<OnboardingPath | null>(null)
  const [domain, setDomain] = useState<Domain | null>(null)
  const [domainConfirmed, setDomainConfirmed] = useState(false)

  if (path === null) {
    return (
      <OnboardingChoice
        onCreateWebsite={() => setPath('create')}
        onAddExistingDomain={() => setPath('existing')}
      />
    )
  }

  if (!domainConfirmed) {
    return (
      <OnboardingDomainStep
        domain={domain}
        onBack={() => setPath(null)}
        onSaved={(saved) => {
          setDomain(saved)
          setDomainConfirmed(true)
        }}
      />
    )
  }

  if (domain === null) {
    return null
  }

  if (path === 'create') {
    return (
      <OnboardingWebsiteStep
        domain={domain}
        onBack={() => setDomainConfirmed(false)}
        onComplete={onComplete}
      />
    )
  }

  return (
    <OnboardingAddressStep
      domain={domain}
      onBack={() => setDomainConfirmed(false)}
      onComplete={onComplete}
    />
  )
}
