import { ActionCard, Chip } from '@helpwave/hightide'
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

type OnboardingChoiceProps = {
  onCreateWebsite: () => void,
  onAddExistingDomain: () => void,
}

export const OnboardingChoice = ({
  onCreateWebsite,
  onAddExistingDomain,
}: OnboardingChoiceProps) => {
  const translation = useDomeTranslation()

  return (
    <OnboardingFrame
      wide
      title={translation('onboardingTitle')}
      description={translation('onboardingLead')}
    >
      <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
        <ActionCard
          className="h-full"
          title={(
            <span className="flex flex-col items-start gap-2">
              <span>{translation('onboardingCreateWebsite')}</span>
              <Chip color="primary" coloringStyle="tonal" size="sm">
                {translation('onboardingRecommended')}
              </Chip>
            </span>
          )}
          description={translation('onboardingCreateWebsiteDescription')}
          onClick={onCreateWebsite}
        />
        <ActionCard
          className="h-full"
          title={(
            <span className="flex flex-col items-start gap-2">
              <span>{translation('onboardingExistingDomain')}</span>
              <Chip color="secondary" coloringStyle="tonal" size="sm">
                {translation('onboardingExisting')}
              </Chip>
            </span>
          )}
          description={translation('onboardingExistingDomainDescription')}
          onClick={onAddExistingDomain}
        />
      </div>
    </OnboardingFrame>
  )
}
