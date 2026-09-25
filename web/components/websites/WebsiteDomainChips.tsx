import { useState } from 'react'
import { Chip, Dialog, SearchBar } from '@helpwave/hightide'
import type { Domain } from '@/api/types/domain'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { domainChipPreview, domainLabel, domainsMatchingName } from '@/utils/domains'

type WebsiteDomainChipsProps = {
  websiteName: string,
  domains: Domain[],
}

export const WebsiteDomainChips = ({
  websiteName,
  domains,
}: WebsiteDomainChipsProps) => {
  const translation = useDomeTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const preview = domainChipPreview(domains)
  const matches = domainsMatchingName(domains, query)

  if (domains.length === 0) {
    return (
      <p className="typography-body text-description">{translation('noDomains')}</p>
    )
  }

  return (
    <>
      <div className="flex flex-wrap justify-start gap-2">
        {preview.visible.map((domain) => (
          <Chip key={domain.id} color="neutral" coloringStyle="tonal" size="sm">
            {domainLabel(domain)}
          </Chip>
        ))}
        {preview.hiddenCount > 0 && (
          <Chip
            color="primary"
            coloringStyle="tonal"
            size="sm"
            role="button"
            tabIndex={0}
            className="cursor-pointer"
            onClick={() => setIsOpen(true)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') {
                return
              }
              event.preventDefault()
              setIsOpen(true)
            }}
          >
            {translation('moreCount', { count: String(preview.hiddenCount) })}
          </Chip>
        )}
      </div>
      <Dialog
        isOpen={isOpen}
        isModal
        titleElement={<span className="typography-title-md">{websiteName}</span>}
        description={translation('domainsFor', { name: websiteName })}
        onClose={() => setIsOpen(false)}
      >
        <div className="flex-col-4">
          <SearchBar
            value={query}
            onValueChange={setQuery}
            onSearch={setQuery}
            placeholder={translation('searchDomains')}
            aria-label={translation('searchDomainsFor', { name: websiteName })}
          />
          {matches.length === 0 && (
            <p className="typography-body text-description">{translation('noDomainsMatchSearch')}</p>
          )}
          {matches.length > 0 && (
            <div className="flex-col-2 justify-start">
              {matches.map((domain) => (
                <Chip key={domain.id} color="neutral" coloringStyle="tonal" size="sm">
                  {domainLabel(domain)}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </Dialog>
    </>
  )
}
