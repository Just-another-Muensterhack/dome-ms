import { Button } from '@helpwave/hightide'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

type OnboardingActionsProps = {
  onBack: () => void,
  onContinue: () => void,
  continueDisabled: boolean,
  pending: boolean,
}

export const OnboardingActions = ({
  onBack,
  onContinue,
  continueDisabled,
  pending,
}: OnboardingActionsProps) => {
  const translation = useDomeTranslation()

  return (
    <div className="flex flex-row flex-wrap gap-3">
      <Button
        type="button"
        color="neutral"
        coloringStyle="outline"
        disabled={pending}
        onClick={onBack}
      >
        {translation('back')}
      </Button>
      <Button
        type="button"
        disabled={continueDisabled || pending}
        onClick={onContinue}
      >
        {translation('continue')}
      </Button>
    </div>
  )
}
