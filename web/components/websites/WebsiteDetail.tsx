import { TabList, TabPanel, TabSwitcher, TabView } from '@helpwave/hightide'
import { useWebsite } from '@/api/website'
import { WebsiteAnalytics } from '@/components/analytics/WebsiteAnalytics'
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

  return (
    <div className="flex-col-4">
      <h1 className="typography-title-lg">{website?.name ?? translation('navWebsites')}</h1>
      <TabSwitcher>
        <TabList />
        <TabView />
        <TabPanel id="analytics" label={translation('analytics')} initiallyActive>
          <WebsiteAnalytics websiteId={websiteId} />
        </TabPanel>
        <TabPanel id="dns" label={translation('dns')} />
        <TabPanel id="editor" label={translation('editor')} />
      </TabSwitcher>
    </div>
  )
}
