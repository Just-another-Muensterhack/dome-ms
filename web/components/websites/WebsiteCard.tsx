import { useState } from 'react'
import { useRouter } from 'next/router'
import { Card, IconButton } from '@helpwave/hightide'
import { PencilIcon } from 'lucide-react'
import type { Website } from '@/api/types/website'
import { AddWebsiteDialog } from '@/components/websites/AddWebsiteDialog'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { domainLabel } from '@/utils/domains'
import { WebsiteDomainChips } from './WebsiteDomainChips'

type WebsiteCardProps = {
  website: Website,
}

export const WebsiteCard = ({
  website,
}: WebsiteCardProps) => {
  const router = useRouter()
  const translation = useDomeTranslation()
  const [isEditOpen, setIsEditOpen] = useState(false)

  return (
    <Card
      id={website.id}
      title={website.name}
      className="relative flex-col justify-start"
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
      <button
        type="button"
        aria-label={translation('analyticsFor', { name: website.name })}
        className="absolute inset-0 cursor-pointer"
        onClick={() => {
          void router.push(`/website/${website.id}`)
        }}
      />
      {website.domains.length === 0 && (
        <p className="typography-body text-description">{translation('noDomains')}</p>
      )}
      {website.domains.length > 0 && (
        <div className="relative z-10 flex-col-2">
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
