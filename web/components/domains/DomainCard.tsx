import { useState } from 'react'
import { Card, Chip, IconButton } from '@helpwave/hightide'
import { PencilIcon } from 'lucide-react'
import { useWebsites } from '@/api/website'
import type { Domain } from '@/api/types/domain'
import { EditDomainDialog } from '@/components/domains/EditDomainDialog'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { domainLabel } from '@/utils/domains'
import Link from 'next/link'

type DomainCardProps = {
  domain: Domain,
}

export const DomainCard = ({
  domain,
}: DomainCardProps) => {
  const translation = useDomeTranslation()
  const websites = useWebsites()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const website = domain.website_id
    ? websites.data?.find((item) => item.id === domain.website_id)
    : undefined

  return (
    <Card
      id={domain.id}
      title={<span className="block truncate">{domainLabel(domain)}</span>}
      className="relative h-full [&_.card-header]:min-h-0 [&_.card-header]:items-start"
      trailing={(
        <IconButton
          size="sm"
          color="primary"
          coloringStyle="text"
          className="relative z-10"
          tooltip={translation('editDomain')}
          onClick={() => setIsEditOpen(true)}
        >
          <PencilIcon className="size-5" />
        </IconButton>
      )}
    >
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
      {isEditOpen && (
        <EditDomainDialog
          domain={domain}
          isOpen
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </Card>
  )
}
