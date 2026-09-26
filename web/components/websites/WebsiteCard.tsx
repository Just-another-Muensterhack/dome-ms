import { Card } from '@helpwave/hightide'
import { PencilIcon } from 'lucide-react'
import type { Website } from '@/api/types/website'
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

  return (
    <Card
      id={website.id}
      title={website.name}
      className="relative flex-col justify-start [&_.card-header]:z-[1]"
      trailing={(
        <Link
          href={`/website/${website.id}?mode=edit`}
          className="icon-button relative z-10"
          data-size="sm"
          data-color="primary"
          data-coloringstyle="text"
          aria-label={translation('editWebsite')}
        >
          <PencilIcon className="size-5" />
        </Link>
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
    </Card>
  )
}
