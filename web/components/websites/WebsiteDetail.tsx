import { useState } from 'react'
import { IconButton, TabList, TabPanel, TabSwitcher, TabView } from '@helpwave/hightide'
import { PencilIcon } from 'lucide-react'
import { useWebsite } from '@/api/website'
import { WebsiteAnalytics } from '@/components/analytics/WebsiteAnalytics'
import { WebsiteEditor } from '@/components/editor/WebsiteEditor'
import { AddWebsiteDialog } from '@/components/websites/AddWebsiteDialog'
import { WebsiteDomainChips } from '@/components/websites/WebsiteDomainChips'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

type WebsiteDetailProps = {
  websiteId: string,
}

export const WebsiteDetail = ({
  websiteId,
}: WebsiteDetailProps) => {
  const translation = useDomeTranslation()
  const websiteQuery = useWebsite(websiteId)
  const website = websiteQuery.data
  const [isEditOpen, setIsEditOpen] = useState(false)

  return (
    <div className="flex-col-4">
      <div className="flex-row-4 items-center justify-between">
        <h1 className="typography-title-lg">{website?.name ?? translation('navWebsites')}</h1>
        {website && (
          <IconButton
            color="primary"
            coloringStyle="text"
            tooltip={translation('editWebsite')}
            onClick={() => setIsEditOpen(true)}
          >
            <PencilIcon className="size-5" />
          </IconButton>
        )}
      </div>
      {website && isEditOpen && (
        <AddWebsiteDialog
          website={website}
          isOpen
          onClose={() => setIsEditOpen(false)}
        />
      )}
      {website && (
        <WebsiteDomainChips websiteName={website.name} domains={website.domains} />
      )}
      <TabSwitcher>
        <TabList />
        <TabView />
        <TabPanel id="analytics" label={translation('analytics')} initiallyActive>
          <WebsiteAnalytics websiteId={websiteId} />
        </TabPanel>
        <TabPanel id="dns" label={translation('dns')} />
        <TabPanel id="editor" label={translation('editor')}>
          <WebsiteEditor
            websiteId={websiteId}
            websiteName={website?.name ?? ''}
            initialDescription={website?.description ?? ''}
          />
        </TabPanel>
      </TabSwitcher>
    </div>
  )
}
