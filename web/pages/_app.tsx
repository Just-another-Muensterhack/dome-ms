import Head from 'next/head'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HightideProvider } from '@helpwave/hightide'
import { AuthGate } from '@/components/auth/AuthGate'
import { NoIndex } from '@/components/seo/SiteGraph'
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
  router,
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
          {router.pathname !== '/' && <title>{titleWrapper()}</title>}
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        </Head>
        {router.pathname !== '/' && <NoIndex />}
        <AuthGate>
          <Component {...pageProps} />
        </AuthGate>
      </QueryClientProvider>
    </HightideProvider>
  )
}

export default MyApp
