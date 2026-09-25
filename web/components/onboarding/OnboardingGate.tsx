import type { PropsWithChildren } from 'react'
import { useLayoutEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useDomainsQuery } from '@/api/domain'
import { useWebsites } from '@/api/website'
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen'
import { readOnboardingTimestamp, writeOnboardingTimestamp } from '@/utils/onboarding'

export const OnboardingGate = ({
  children,
}: PropsWithChildren) => {
  const router = useRouter()
  const websites = useWebsites()
  const domains = useDomainsQuery()
  const [onboardingTimestamp, setOnboardingTimestamp] = useState<string | null | undefined>(undefined)

  useLayoutEffect(() => {
    setOnboardingTimestamp(readOnboardingTimestamp())
  }, [])

  const hasNoWebsites = websites.isSuccess && websites.data.length === 0
  const hasNoDomains = domains.isSuccess && domains.data.length === 0
  const showOnboarding = onboardingTimestamp === null && hasNoWebsites && hasNoDomains

  const completeOnboarding = (path: string) => {
    const timestamp = new Date().toISOString()
    writeOnboardingTimestamp(timestamp)
    setOnboardingTimestamp(timestamp)
    void router.push(path)
  }

  if (!showOnboarding) {
    return children
  }

  return (
    <OnboardingScreen
      onCreateWebsite={() => completeOnboarding('/websites')}
      onMoveWebsite={() => completeOnboarding('/domains')}
    />
  )
}
