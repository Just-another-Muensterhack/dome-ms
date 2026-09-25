import type { NextPage } from 'next'
import { DashboardColumns } from '@/components/dashboard/DashboardColumns'
import { Page } from '@/components/layout/Page'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

const Dashboard: NextPage = () => {
  const translation = useDomeTranslation()

  return (
    <Page pageTitle={translation('navDashboard')}>
      <DashboardColumns />
    </Page>
  )
}

export default Dashboard
