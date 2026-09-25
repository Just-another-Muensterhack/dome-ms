import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import { WebsitesContent } from '@/components/websites/WebsitesContent'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

const Websites: NextPage = () => {
  const translation = useDomeTranslation()

  return (
    <Page pageTitle={translation('navWebsites')}>
      <WebsitesContent />
    </Page>
  )
}

export default Websites
