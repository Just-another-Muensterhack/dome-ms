import { useRouter } from 'next/router'
import { Button } from '@helpwave/hightide'
import { AppearanceControls } from '@/components/layout/AppearanceControls'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { startLogin, startSignUp } from '@/utils/auth'

type LandingFeature = {
  title: string,
  body: string,
}

export const LandingPage = () => {
  const translation = useDomeTranslation()
  const router = useRouter()
  const loginFailed = router.query['login'] === 'failed'
  const features: LandingFeature[] = [
    {
      title: translation('landingHostTitle'),
      body: translation('landingHostBody'),
    },
    {
      title: translation('landingProtectTitle'),
      body: translation('landingProtectBody'),
    },
    {
      title: translation('landingOpenDataTitle'),
      body: translation('landingOpenDataBody'),
    },
  ]

  return (
    <div className="flex h-dvh w-screen overflow-auto bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-6">
        <header className="flex items-center justify-end">
          <AppearanceControls />
        </header>
        <div className="flex flex-col gap-4">
          <p className="typography-label text-primary">{translation('appName')}</p>
          <h1 className="typography-title-lg max-w-3xl">{translation('landingHeadline')}</h1>
          <p className="typography-body max-w-3xl text-description">{translation('landingLead')}</p>
        </div>
        <div className="flex flex-row flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => {
              void startLogin()
            }}
          >
            {translation('login')}
          </Button>
          <Button
            type="button"
            color="neutral"
            coloringStyle="outline"
            onClick={() => {
              void startSignUp()
            }}
          >
            {translation('signUp')}
          </Button>
        </div>
        {loginFailed && (
          <p className="typography-body text-negative">{translation('loginFailed')}</p>
        )}
        <div className="flex flex-col gap-4">
          <h2 className="typography-title-md">{translation('landingFeaturesTitle')}</h2>
          <div className="grid grid-cols-1 gap-4 desktop:grid-cols-3">
            {features.map((feature) => (
              <section key={feature.title} className="flex flex-col gap-2 rounded-xl bg-surface p-5 text-on-surface">
                <h3 className="typography-title-sm">{feature.title}</h3>
                <p className="typography-body text-description">{feature.body}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
