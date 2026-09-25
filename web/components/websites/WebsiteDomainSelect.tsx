import { MultiSelect } from '@helpwave/hightide'
import { useDomainsQuery } from '@/api/domain'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { domainLabel } from '@/utils/domains'

type WebsiteDomainSelectProps = {
  value: string[],
  onValueChange: (value: string[]) => void,
}

export const WebsiteDomainSelect = ({
  value,
  onValueChange,
}: WebsiteDomainSelectProps) => {
  const translation = useDomeTranslation()
  const domainsQuery = useDomainsQuery()
  const domains = domainsQuery.data ?? []
  const hasNoDomains = domainsQuery.isSuccess && domains.length === 0

  return (
    <div className="flex-col-1">
      <span className="typography-label-md">{translation('navDomains')}</span>
      <MultiSelect
        value={value}
        disabled={!domainsQuery.isSuccess || hasNoDomains}
        placeholder={hasNoDomains ? translation('noDomains') : undefined}
        onValueChange={onValueChange}
      >
        {domains.map((domain) => {
          const label = domainLabel(domain)
          return (
            <MultiSelect.Option key={domain.id} value={domain.id} label={label}>
              {label}
            </MultiSelect.Option>
          )
        })}
      </MultiSelect>
    </div>
  )
}
