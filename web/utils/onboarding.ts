export const onboardingTimestampKey = 'onboarding-timestamp'

export const readOnboardingTimestamp = (): string | null => {
  try {
    return localStorage.getItem(onboardingTimestampKey)
  } catch {
    return null
  }
}

export const writeOnboardingTimestamp = (timestamp: string): void => {
  try {
    localStorage.setItem(onboardingTimestampKey, timestamp)
  } catch {
    return
  }
}

export const clearOnboardingTimestamp = (): void => {
  try {
    localStorage.removeItem(onboardingTimestampKey)
  } catch {
    return
  }
}
