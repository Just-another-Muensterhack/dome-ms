import Link from 'next/link'
import { Expandable, LoadingAndErrorComponent } from '@helpwave/hightide'
import { useDomainsQuery } from '@/api/domain'
import { useWebsites } from '@/api/website'
import type { Domain } from '@/api/types/domain'
import type { Website } from '@/api/types/website'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { domainLabel } from '@/utils/domains'

type NamedEntry = {
  id: string,
  name: string,
  href: string,
}

const domainName = (domain: Domain) => domainLabel(domain)

const NameList = ({
  entries,
  emptyLabel,
}: {
  entries: NamedEntry[],
  emptyLabel: string,
}) => {
  if (entries.length === 0) {
    return <p className="typography-body text-description">{emptyLabel}</p>
  }

  return (
    <ul className="flex-col-2">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Link href={entry.href} className="typography-body hover:underline">
            {entry.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

const ColumnBody = ({
  isLoading,
  hasError,
  loadingLabel,
  errorLabel,
  entries,
  emptyLabel,
}: {
  isLoading: boolean,
  hasError: boolean,
  loadingLabel: string,
  errorLabel: string,
  entries: NamedEntry[],
  emptyLabel: string,
}) => {
  return (
    <LoadingAndErrorComponent
      isLoading={isLoading}
      hasError={hasError}
      loadingComponent={<p className="typography-body text-description">{loadingLabel}</p>}
      errorComponent={<p className="typography-body text-description">{errorLabel}</p>}
    >
      <NameList entries={entries} emptyLabel={emptyLabel} />
    </LoadingAndErrorComponent>
  )
}

const domainEntries = (domains: Domain[]): NamedEntry[] => (
  domains.map((domain) => ({
    id: domain.id,
    name: domainName(domain),
    href: `/domains#${domain.id}`,
  }))
)

const websiteEntries = (websites: Website[]): NamedEntry[] => (
  websites.map((website) => ({
    id: website.id,
    name: website.name,
    href: `/website/${website.id}`,
  }))
)

export const DashboardColumns = () => {
  const translation = useDomeTranslation()
  const domainsQuery = useDomainsQuery()
  const websitesQuery = useWebsites()
  const domains = domainEntries(domainsQuery.data ?? [])
  const websites = websiteEntries(websitesQuery.data ?? [])

  return (
    <div className="flex-col-4">
      <h1 className="typography-title-lg">{translation('navDashboard')}</h1>
      <div className="flex-col-4 desktop:hidden">
        <Expandable
          trigger={<span className="typography-title-md">{translation('navDomains')}</span>}
          contentExpandedClassName="max-h-none h-auto"
        >
          <ColumnBody
            isLoading={domainsQuery.isPending}
            hasError={domainsQuery.isError}
            loadingLabel={translation('loadingDomains')}
            errorLabel={translation('domainsUnavailable')}
            entries={domains}
            emptyLabel={translation('noDomainsOwned')}
          />
        </Expandable>
        <Expandable
          trigger={<span className="typography-title-md">{translation('navWebsites')}</span>}
          contentExpandedClassName="max-h-none h-auto"
        >
          <ColumnBody
            isLoading={websitesQuery.isPending}
            hasError={websitesQuery.isError}
            loadingLabel={translation('loadingWebsites')}
            errorLabel={translation('websitesUnavailable')}
            entries={websites}
            emptyLabel={translation('noWebsitesOwned')}
          />
        </Expandable>
      </div>
      <div className="hidden desktop:grid desktop:grid-cols-2 gap-4">
        <section className="rounded-lg bg-white p-4 flex-col-3">
          <h2 className="typography-title-md">{translation('navDomains')}</h2>
          <ColumnBody
            isLoading={domainsQuery.isPending}
            hasError={domainsQuery.isError}
            loadingLabel={translation('loadingDomains')}
            errorLabel={translation('domainsUnavailable')}
            entries={domains}
            emptyLabel={translation('noDomainsOwned')}
          />
        </section>
        <section className="rounded-lg bg-white p-4 flex-col-3">
          <h2 className="typography-title-md">{translation('navWebsites')}</h2>
          <ColumnBody
            isLoading={websitesQuery.isPending}
            hasError={websitesQuery.isError}
            loadingLabel={translation('loadingWebsites')}
            errorLabel={translation('websitesUnavailable')}
            entries={websites}
            emptyLabel={translation('noWebsitesOwned')}
          />
        </section>
      </div>
    </div>
  )
}
