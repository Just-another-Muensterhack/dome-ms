import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useWebsite } from '@/api/website'
import { Page } from '@/components/layout/Page'
import { WebsiteDetail } from '@/components/websites/WebsiteDetail'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

const WebsitePage: NextPage = () => {
  const router = useRouter()
  const translation = useDomeTranslation()
  const websiteId = typeof router.query['id'] === 'string' ? router.query['id'] : ''
  const websiteQuery = useWebsite(websiteId)
  const website = websiteQuery.data

  return (
    <Page pageTitle={website?.name ?? translation('navWebsites')}>
      {websiteId && (
        <WebsiteDetail websiteId={websiteId} />
      )}
    </Page>
  )
}

export default WebsitePage
