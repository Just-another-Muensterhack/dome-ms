import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Input, Textarea } from '@helpwave/hightide'
import { updateDomain } from '@/api/domain'
import type { Domain } from '@/api/types/domain'
import { createWebsite } from '@/api/website'
import { OnboardingActions } from '@/components/onboarding/OnboardingActions'
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { invalidateHostQueries } from '@/utils/hostQueries'

type OnboardingWebsiteStepProps = {
  domain: Domain,
  onBack: () => void,
  onComplete: () => void,
}

export const OnboardingWebsiteStep = ({
  domain,
  onBack,
  onComplete,
}: OnboardingWebsiteStepProps) => {
  const translation = useDomeTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState(domain.name)
  const [description, setDescription] = useState('')
  const websiteId = useRef<string | null>(null)

  const save = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim()
      const createdId = websiteId.current ?? (await createWebsite({
        name: trimmedName,
        description: description.trim(),
      })).id
      websiteId.current = createdId
      await updateDomain(domain.id, { website_id: createdId })
    },
    onSuccess: async () => {
      await invalidateHostQueries(queryClient)
      onComplete()
    },
  })

  const submit = () => {
    if (name.trim().length === 0 || save.isPending) {
      return
    }
    save.mutate()
  }

  return (
    <OnboardingFrame
      title={translation('onboardingWebsiteTitle')}
      description={translation('onboardingWebsiteDescription', { domain: domain.name })}
    >
      <div className="flex-col-3">
        <label className="flex-col-1" htmlFor="onboarding-website-name">
          <span className="typography-label-md">{translation('name')}</span>
          <Input
            id="onboarding-website-name"
            value={name}
            onValueChange={setName}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            }}
          />
        </label>
        <label className="flex-col-1" htmlFor="onboarding-website-description">
          <span className="typography-label-md">{translation('description')}</span>
          <Textarea
            id="onboarding-website-description"
            value={description}
            onValueChange={setDescription}
          />
        </label>
        {save.isError && (
          <p className="typography-body text-negative">{save.error.message}</p>
        )}
      </div>
      <OnboardingActions
        onBack={onBack}
        onContinue={submit}
        continueDisabled={name.trim().length === 0}
        pending={save.isPending}
      />
    </OnboardingFrame>
  )
}
