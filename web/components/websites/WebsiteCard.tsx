import { useState } from 'react'
import { Card, IconButton } from '@helpwave/hightide'
import { PencilIcon } from 'lucide-react'
import type { Website } from '@/api/types/website'
import { AddWebsiteDialog } from '@/components/websites/AddWebsiteDialog'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { WebsiteDomainChips } from './WebsiteDomainChips'
import Link from 'next/link'

type WebsiteCardProps = {
  website: Website,
}

export const WebsiteCard = ({
  website,
}: WebsiteCardProps) => {
  const translation = useDomeTranslation()
  const [isEditOpen, setIsEditOpen] = useState(false)

  return (
    <Card
      id={website.id}
      title={website.name}
      className="relative flex-col justify-start [&_.card-header]:z-[1]"
      trailing={(
        <IconButton
          size="sm"
          color="primary"
          coloringStyle="text"
          className="relative z-10"
          tooltip={translation('editWebsite')}
          onClick={() => setIsEditOpen(true)}
        >
          <PencilIcon className="size-5" />
        </IconButton>
      )}
    >
      <Link
        aria-label={translation('analyticsFor', { name: website.name })}
        className="absolute inset-0 cursor-pointer underline-none hover:bg-surface-hover rounded-[inherit] z-0"
        href={`/website/${website.id}`}
      />
      {website.domains.length === 0 && (
        <p className="typography-body text-description z-1">{translation('noDomains')}</p>
      )}
      {website.domains.length > 0 && (
        <div className="relative z-10 flex-col-2 z-1">
          <WebsiteDomainChips websiteName={website.name} domains={website.domains} />
        </div>
      )}
      {isEditOpen && (
        <AddWebsiteDialog
          website={website}
          isOpen
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </Card>
  )
}
