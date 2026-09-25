import type { PropsWithChildren } from 'react'
import { useLayoutEffect, useState } from 'react'
import { useDomainsQuery } from '@/api/domain'
import { useWebsites } from '@/api/website'
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen'
import { readOnboardingTimestamp, writeOnboardingTimestamp } from '@/utils/onboarding'

const stampOnboarding = (): string => {
  const timestamp = new Date().toISOString()
  writeOnboardingTimestamp(timestamp)
  return timestamp
}

export const OnboardingGate = ({
  children,
}: PropsWithChildren) => {
  const websites = useWebsites()
  const domains = useDomainsQuery()
  const [onboardingTimestamp, setOnboardingTimestamp] = useState<string | null | undefined>(undefined)

  useLayoutEffect(() => {
    setOnboardingTimestamp(readOnboardingTimestamp())
  }, [])

  const loaded = websites.isSuccess && domains.isSuccess
  const alreadyHasHost = loaded && (websites.data.length > 0 || domains.data.length > 0)
  const needsStamp = onboardingTimestamp === null && alreadyHasHost

  useLayoutEffect(() => {
    if (!needsStamp) {
      return
    }
    setOnboardingTimestamp(stampOnboarding())
  }, [needsStamp])

  if (onboardingTimestamp === undefined || needsStamp) {
    return null
  }

  if (onboardingTimestamp !== null) {
    return children
  }

  if (!loaded) {
    if (websites.isError || domains.isError) {
      return children
    }
    return null
  }

  return (
    <OnboardingScreen
      onComplete={() => {
        setOnboardingTimestamp(stampOnboarding())
      }}
    />
  )
}
