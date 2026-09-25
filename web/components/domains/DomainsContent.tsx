import { useState } from 'react'
import { Button, LoadingAndErrorComponent } from '@helpwave/hightide'
import { useDomainsQuery } from '@/api/domain'
import { AddDomainDialog } from '@/components/domains/AddDomainDialog'
import { DomainCard } from '@/components/domains/DomainCard'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

export const DomainsContent = () => {
  const translation = useDomeTranslation()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const domainsQuery = useDomainsQuery()
  const domains = domainsQuery.data ?? []

  return (
    <div className="flex-col-4">
      <div className="flex-row-4 items-center justify-between">
        <h1 className="typography-title-lg">{translation('navDomains')}</h1>
        <Button type="button" onClick={() => setIsAddOpen(true)}>
          {translation('addDomain')}
        </Button>
      </div>
      <AddDomainDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <LoadingAndErrorComponent
        isLoading={domainsQuery.isPending}
        hasError={domainsQuery.isError}
        loadingComponent={<p className="typography-body text-description">{translation('loadingDomains')}</p>}
        errorComponent={<p className="typography-body text-description">{translation('domainsUnavailable')}</p>}
      >
        {domains.length === 0 && (
          <p className="typography-body text-description">{translation('noDomainsOwned')}</p>
        )}
        {domains.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {domains.map((domain) => (
              <DomainCard key={domain.id} domain={domain} />
            ))}
          </div>
        )}
      </LoadingAndErrorComponent>
    </div>
  )
}
