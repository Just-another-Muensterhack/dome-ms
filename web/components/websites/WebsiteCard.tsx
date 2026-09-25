import { useRouter } from 'next/router'
import { Card, IconButton } from '@helpwave/hightide'
import { ChartColumnIcon } from 'lucide-react'
import type { Website } from '@/api/types/website'
import { WebsiteDomainChips } from '@/components/websites/WebsiteDomainChips'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

type WebsiteCardProps = {
  website: Website,
}

export const WebsiteCard = ({
  website,
}: WebsiteCardProps) => {
  const router = useRouter()
  const translation = useDomeTranslation()

  return (
    <Card
      id={website.id}
      title={website.name}
      className="flex-col justify-start"
      trailing={(
        <IconButton
          size="sm"
          color="primary"
          coloringStyle="text"
          tooltip={translation('analyticsFor', { name: website.name })}
          onClick={() => {
            void router.push(`/website/${website.id}`)
          }}
        >
          <ChartColumnIcon className="size-5" />
        </IconButton>
      )}
    >
      <WebsiteDomainChips websiteName={website.name} domains={website.domains} />
    </Card>
  )
}
