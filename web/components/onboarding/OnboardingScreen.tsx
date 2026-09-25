import { ActionCard, Chip } from '@helpwave/hightide'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

type OnboardingScreenProps = {
  onCreateWebsite: () => void,
  onMoveWebsite: () => void,
}

export const OnboardingScreen = ({
  onCreateWebsite,
  onMoveWebsite,
}: OnboardingScreenProps) => {
  const translation = useDomeTranslation()

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background px-6 py-10">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <h1 className="typography-title-lg">{translation('onboardingTitle')}</h1>
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
                <span>{translation('onboardingMoveWebsite')}</span>
                <Chip color="secondary" coloringStyle="tonal" size="sm">
                  {translation('onboardingExpert')}
                </Chip>
              </span>
            )}
            description={translation('onboardingMoveWebsiteDescription')}
            onClick={onMoveWebsite}
          />
        </div>
      </div>
    </div>
  )
}
