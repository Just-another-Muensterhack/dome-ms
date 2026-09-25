import Head from 'next/head'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HightideProvider } from '@helpwave/hightide'
import { OnboardingGate } from '@/components/onboarding/OnboardingGate'
import { domeTranslation } from '@/i18n/translations'
import titleWrapper from '@/utils/titleWrapper'
import '../globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
    },
  },
})

const MyApp = ({
  Component,
  pageProps,
}: AppProps) => {
  return (
    <HightideProvider
      locale={{
        timeZone: 'Europe/Berlin',
        is24HourFormat: true,
      }}
      translation={{ translation: domeTranslation }}
    >
      <QueryClientProvider client={queryClient}>
        <Head>
          <title>{titleWrapper()}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        </Head>
        <OnboardingGate>
          <Component {...pageProps} />
        </OnboardingGate>
      </QueryClientProvider>
    </HightideProvider>
  )
}

export default MyApp
