import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AppPage, IconButton, type AppPageNavigationItem } from '@helpwave/hightide'
import { GlobeIcon, Grid2X2PlusIcon, Link2Icon, SettingsIcon } from 'lucide-react'
import { useDomainsQuery } from '@/api/domain'
import { useWebsites } from '@/api/website'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { domainLabel } from '@/utils/domains'
import titleWrapper from '@/utils/titleWrapper'

type PageProps = PropsWithChildren<{
  pageTitle?: string,
}>

export const Page = ({
  children,
  pageTitle,
}: PageProps) => {
  const router = useRouter()
  const translation = useDomeTranslation()
  const websites = useWebsites()
  const domains = useDomainsQuery()

  const sidebarItems = useMemo((): AppPageNavigationItem[] => [
    {
      id: 'dashboard',
      label: translation('navDashboard'),
      url: '/dashboard',
      icon: <Grid2X2PlusIcon className="-rotate-90 size-5" />,
    },
    {
      id: 'websites',
      label: translation('navWebsites'),
      icon: <GlobeIcon className="size-5" />,
      items: [
        {
          id: 'websites-all',
          label: translation('navAll'),
          url: '/websites',
        },
        ...(websites.data ?? []).map((website) => ({
          id: `website-${website.id}`,
          label: website.name,
          url: `/website/${website.id}`,
        })),
      ],
    },
    {
      id: 'domains',
      label: translation('navDomains'),
      icon: <Link2Icon className="size-5" />,
      items: [
        {
          id: 'domains-all',
          label: translation('navAll'),
          url: '/domains',
        },
        ...(domains.data ?? []).map((domain) => ({
          id: `domain-${domain.id}`,
          label: domainLabel(domain),
          url: `/domains#${domain.id}`,
        })),
      ],
    },
  ], [websites.data, domains.data, translation])

  return (
    <AppPage
      sidebarProps={{
        header: (
          <Link href="/dashboard" className="flex-row-2 text-primary items-center rounded-lg p-2">
            <img src="/logo-lightmode.svg" alt="" className="h-8 w-auto shrink-0 dark:hidden" />
            <img src="/logo-darkmode.svg" alt="" className="hidden h-8 w-auto shrink-0 dark:block" />
            <span className="typography-title-md whitespace-nowrap">{translation('appName')}</span>
          </Link>
        ),
        items: sidebarItems,
        activeUrl: router.asPath.split('?')[0],
        LinkComponent: Link,
      }}
      headerActions={[
        <IconButton
          key="settings"
          tooltip={translation('settings')}
          coloringStyle="text"
          className="ml-auto"
          onClick={() => {
            void router.push('/settings')
          }}
        >
          <SettingsIcon />
        </IconButton>,
      ]}
    >
      <Head>
        <title>{titleWrapper(pageTitle)}</title>
      </Head>
      {children}
    </AppPage>
  )
}
