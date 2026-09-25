import type { NextPage } from 'next'
import { DomainsContent } from '@/components/domains/DomainsContent'
import { Page } from '@/components/layout/Page'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

const Domains: NextPage = () => {
  const translation = useDomeTranslation()

  return (
    <Page pageTitle={translation('navDomains')}>
      <DomainsContent />
    </Page>
  )
}

export default Domains
