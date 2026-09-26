import { useRouter } from 'next/router'
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
  const router = useRouter()
  const websiteQuery = useWebsite(websiteId)
  const openEditor = router.isReady && router.query['tab'] === 'editor'
  const editRequested = router.isReady && router.query['mode'] === 'edit'
  const website = websiteQuery.data

  const openEdit = () => {
    void router.replace({
      pathname: router.pathname,
      query: { ...router.query, mode: 'edit' },
    }, undefined, { shallow: true })
  }

  const closeEdit = () => {
    const nextQuery = { ...router.query }
    delete nextQuery['mode']
    void router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true })
  }

  return (
    <div className="flex-col-2 grow">
      <div className="flex-row-4 items-start justify-between">
        <div className="flex-col-0">
          <h1 className="typography-title-lg">{website?.name ?? translation('navWebsites')}</h1>
          {website && editRequested && (
            <AddWebsiteDialog
              website={website}
              isOpen
              onClose={closeEdit}
            />
          )}
          {website && (
            <WebsiteDomainChips websiteName={website.name} domains={website.domains} />
          )}
        </div>
        {website && (
          <IconButton
            color="primary"
            coloringStyle="text"
            tooltip={translation('editWebsite')}
            onClick={openEdit}
          >
            <PencilIcon className="size-5" />
          </IconButton>
        )}
      </div>
      <div className="flex-col-2 grow">
        {router.isReady && (
          <TabSwitcher initialActiveId={openEditor ? 'editor' : 'analytics'}>
            <TabList />
            <TabView />
            <TabPanel id="analytics" label={translation('analytics')} initiallyActive={!openEditor}>
              <WebsiteAnalytics websiteId={websiteId} />
            </TabPanel>
            <TabPanel id="editor" label={translation('editor')}>
              <WebsiteEditor
                websiteId={websiteId}
                websiteName={website?.name ?? ''}
                initialDescription={website?.description ?? ''}
              />
            </TabPanel>
          </TabSwitcher>
        )}
      </div>
    </div>
  )
}
