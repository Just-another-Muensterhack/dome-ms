import { useState } from 'react'
import { Card, Chip, IconButton } from '@helpwave/hightide'
import { BadgeX, ExternalLink, PencilIcon, Verified } from 'lucide-react'
import { useWebsites } from '@/api/website'
import type { Domain } from '@/api/types/domain'
import { EditDomainDialog } from '@/components/domains/EditDomainDialog'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { domainLabel, isDomainVerified } from '@/utils/domains'
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
      title={(
        <span className="truncate flex-row-1 items-center">
          {domainLabel(domain)}
          {isDomainVerified(domain) ? (
            <Verified size={16} className="text-positive" aria-label={translation('verified')} />
          ): (
            <BadgeX size={16} className="text-warning" aria-label={translation('notVerified')} />
          )}
        </span>
      )}
      className="relative [&_.card-header]:z-1"
      trailing={(
        <div className="flex-row-1 z-10">
          <Link
            href={`https://${domain.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-button"
            data-size="sm"
            data-color="primary"
            data-coloringstyle="text"
          >
            <ExternalLink size={16}/>
          </Link>
          <IconButton
            size="sm"
            color="primary"
            coloringStyle="text"
            tooltip={translation('editDomain')}
            onClick={() => setIsEditOpen(true)}
          >
            <PencilIcon className="size-5" />
          </IconButton>
        </div>
      )}
    >
      <button
        className="absolute inset-0 cursor-pointer underline-none hover:bg-surface-hover rounded-[inherit] z-0"
        onClick={() => setIsEditOpen(true)}
      />
      {website ? (
        <Link
          href={`/website/${website.id}`}
          className="typography-body text-primary hover:bg-surface-hover w-fit z-1"
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
          className="z-1"
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
