import { useMemo } from 'react'
import { useWebsiteAnalytics } from '@/api/websiteAnalytics'
import { VisitorRing } from '@/components/dashboard/VisitorRing'
import { VisitorTimeline } from '@/components/dashboard/VisitorTimeline'
import { useDomeTranslation, useLocale } from '@/i18n/useDomeTranslation'
import { countryName } from '@/utils/countryName'
import {
  countInLastDay,
  requestsInLastDay,
  visitorCountrySegments
} from '@/utils/dashboardVisitors'

type WebsiteAnalyticsProps = {
  websiteId: string,
}

export const WebsiteAnalytics = ({
  websiteId,
}: WebsiteAnalyticsProps) => {
  const translation = useDomeTranslation()
  const { locale } = useLocale()
  const analytics = useWebsiteAnalytics(websiteId)
  const now = useMemo(() => new Date(), [])
  const data = analytics.data
  const segments = data
    ? visitorCountrySegments(data.visitors).map((segment) => ({
      ...segment,
      label: segment.id === 'others' ? translation('others') : countryName(segment.id, locale),
    }))
    : []
  const recentRequests = data ? requestsInLastDay(data.requests, now) : []
  const visitorsLastDay = data ? countInLastDay(data.requests, now) : 0
  const recentBlockedRequests = data ? requestsInLastDay(data.blockedRequests, now) : []
  const blockedLastDay = data ? countInLastDay(data.blockedRequests, now) : 0

  return (
    <div className="flex-col-4">
      {analytics.isPending && (
        <p className="typography-body text-description">{translation('loadingAnalytics')}</p>
      )}
      {analytics.isError && (
        <p className="typography-body text-description">{translation('analyticsUnavailable')}</p>
      )}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="rounded-lg bg-surface-variant p-4 flex-col-4 text-on-surface">
            <h2 className="typography-title-md">{translation('visitorsByCountry')}</h2>
            <VisitorRing
              segments={segments}
              total={data.visitors.all}
              label={translation('visitorsByCountry')}
            />
          </section>
          <section className="rounded-lg bg-surface-variant p-4 flex-col-4 text-on-surface">
            <h2 className="typography-title-md">{translation('visitorsLastDay')}</h2>
            <p className="typography-title-lg">{visitorsLastDay}</p>
            <VisitorTimeline
              points={recentRequests}
              end={now}
              label={translation('visitorsDuringLastDay')}
            />
          </section>
          <section className="rounded-lg bg-surface-variant p-4 flex-col-4 text-on-surface">
            <h2 className="typography-title-md">{translation('blockedRequestsLastDay')}</h2>
            <p className="typography-title-lg">{blockedLastDay}</p>
            <VisitorTimeline
              points={recentBlockedRequests}
              end={now}
              color="#e5484d"
              label={translation('blockedRequestsDuringLastDay')}
            />
          </section>
        </div>
      )}
    </div>
  )
}
