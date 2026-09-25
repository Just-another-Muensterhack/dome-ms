import Link from 'next/link'
import { Card, Chip } from '@helpwave/hightide'
import { useWebsites } from '@/api/website'
import type { Domain } from '@/api/types/domain'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { domainLabel } from '@/utils/domains'

type DomainCardProps = {
  domain: Domain,
}

export const DomainCard = ({
  domain,
}: DomainCardProps) => {
  const translation = useDomeTranslation()
  const websites = useWebsites()
  const website = domain.website_id
    ? websites.data?.find((item) => item.id === domain.website_id)
    : undefined

  return (
    <Card
      id={domain.id}
      title={<span className="block truncate">{domainLabel(domain)}</span>}
      className="h-full [&_.card-header]:min-h-0 [&_.card-header]:items-start"
    >
      <div className="flex flex-wrap gap-2">
        {website ? (
          <Link
            href={`/website/${website.id}`}
            className="typography-body text-primary hover:underline"
          >
            <Chip
              color="primary"
              coloringStyle="tonal"
              size="sm"
            >
              {website.name}
            </Chip>
          </Link>
        ) : (
          <Chip
            color="neutral"
            coloringStyle="tonal"
            size="sm"
          >
            {translation('custom')}
          </Chip>
        )}
      </div>
    </Card>
  )
}
