import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@helpwave/hightide'
import { updateDomain } from '@/api/domain'
import type { Domain } from '@/api/types/domain'
import { createWebserver } from '@/api/webserver'
import { OnboardingActions } from '@/components/onboarding/OnboardingActions'
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { invalidateHostQueries } from '@/utils/hostQueries'
import { ipAddressVersion } from '@/utils/ipAddress'

type OnboardingAddressStepProps = {
  domain: Domain,
  onBack: () => void,
  onComplete: () => void,
}

export const OnboardingAddressStep = ({
  domain,
  onBack,
  onComplete,
}: OnboardingAddressStepProps) => {
  const translation = useDomeTranslation()
  const queryClient = useQueryClient()
  const [address, setAddress] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const webserverId = useRef<string | null>(null)

  const save = useMutation({
    mutationFn: async (ipAddress: string) => {
      const version = ipAddressVersion(ipAddress)
      if (version === null) {
        throw new Error(translation('invalidIpAddress'))
      }
      const createdId = webserverId.current ?? (await createWebserver({
        name: domain.name,
        ipv4: version === 'ipv4' ? ipAddress : null,
        ipv6: version === 'ipv6' ? ipAddress : null,
      })).id
      webserverId.current = createdId
      await updateDomain(domain.id, { webserver_id: createdId })
    },
    onSuccess: async () => {
      await invalidateHostQueries(queryClient)
      onComplete()
    },
  })

  const submit = () => {
    const trimmedAddress = address.trim()
    if (trimmedAddress.length === 0 || save.isPending) {
      return
    }
    if (ipAddressVersion(trimmedAddress) === null) {
      setValidationError(translation('invalidIpAddress'))
      return
    }
    setValidationError(null)
    save.mutate(trimmedAddress)
  }

  const errorMessage = validationError ?? (save.isError ? save.error.message : null)

  return (
    <OnboardingFrame
      title={translation('onboardingAddressTitle')}
      description={translation('onboardingAddressDescription', { domain: domain.name })}
    >
      <label className="flex-col-1" htmlFor="onboarding-ip-address">
        <span className="typography-label-md">{translation('ipAddress')}</span>
        <Input
          id="onboarding-ip-address"
          value={address}
          onValueChange={(value) => {
            setAddress(value)
            setValidationError(null)
          }}
          placeholder="203.0.113.10"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submit()
            }
          }}
        />
      </label>
      {errorMessage !== null && (
        <p className="typography-body text-negative">{errorMessage}</p>
      )}
      <OnboardingActions
        onBack={onBack}
        onContinue={submit}
        continueDisabled={address.trim().length === 0}
        pending={save.isPending}
      />
    </OnboardingFrame>
  )
}
