import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useWebsite } from '@/api/website'
import { WebsiteEditor } from '@/components/editor/WebsiteEditor'
import { NoIndex } from '@/components/seo/SiteGraph'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import titleWrapper from '@/utils/titleWrapper'

const WebsitePreviewPage: NextPage = () => {
  const router = useRouter()
  const translation = useDomeTranslation()
  const websiteId = typeof router.query['id'] === 'string' ? router.query['id'] : ''
  const websiteQuery = useWebsite(websiteId)
  const website = websiteQuery.data
  const title = website?.name ?? translation('editorPreviewTitle')

  return (
    <>
      <Head>
        <title>{titleWrapper(title)}</title>
      </Head>
      <NoIndex />
      {websiteId && (
        <WebsiteEditor
          fullscreen
          websiteId={websiteId}
          websiteName={website?.name ?? ''}
          initialDescription={website?.description ?? ''}
        />
      )}
    </>
  )
}

export default WebsitePreviewPage
