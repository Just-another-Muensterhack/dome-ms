import { useMemo, useState } from 'react'
import { Button, Chip } from '@helpwave/hightide'
import { useWebsiteAnalytics } from '@/api/websiteAnalytics'
import { VisitorRing } from '@/components/dashboard/VisitorRing'
import { VisitorTimeline } from '@/components/dashboard/VisitorTimeline'
import { useDomeTranslation, useLocale } from '@/i18n/useDomeTranslation'
import { countryName } from '@/utils/countryName'
import {
  dayMs,
  requestsInRange,
  visitorCountrySegments
} from '@/utils/dashboardVisitors'

type WebsiteAnalyticsProps = {
  websiteId: string,
}

type AnalyticsRange = 'day' | 'week' | 'month'

const latestCount = (points: { count: number }[]) => points.at(-1)?.count ?? 0

const rangeSpanMs: Record<AnalyticsRange, number> = {
  day: dayMs,
  week: dayMs * 7,
  month: dayMs * 30,
}

export const WebsiteAnalytics = ({
  websiteId,
}: WebsiteAnalyticsProps) => {
  const translation = useDomeTranslation()
  const { locale } = useLocale()
  const analytics = useWebsiteAnalytics(websiteId)
  const [range, setRange] = useState<AnalyticsRange>('day')
  const now = useMemo(() => new Date(), [])
  const data = analytics.data
  const spanMs = rangeSpanMs[range]
  const segments = data
    ? visitorCountrySegments(data.visitors).map((segment) => ({
      ...segment,
      label: segment.id === 'others' ? translation('others') : countryName(segment.id, locale),
    }))
    : []
  const recentRequests = data ? requestsInRange(data.requests, now, spanMs) : []
  const requestsInSpan = latestCount(recentRequests)
  const recentBlockedRequests = data ? requestsInRange(data.blockedRequests, now, spanMs) : []
  const blockedInSpan = latestCount(recentBlockedRequests)
  const ranges: { id: AnalyticsRange, label: string }[] = [
    { id: 'day', label: translation('analyticsRangeDay') },
    { id: 'week', label: translation('analyticsRangeWeek') },
    { id: 'month', label: translation('analyticsRangeMonth') },
  ]

  return (
    <div className="flex-col-4">
      {analytics.isPending && (
        <p className="typography-body text-description">{translation('loadingAnalytics')}</p>
      )}
      {analytics.isError && (
        <p className="typography-body text-description">{translation('analyticsUnavailable')}</p>
      )}
      {data && (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label={translation('analytics')}>
            {ranges.map((item) => {
              const selected = range === item.id
              return (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  color={selected ? 'primary' : 'neutral'}
                  coloringStyle={selected ? 'solid' : 'outline'}
                  aria-pressed={selected}
                  onClick={() => setRange(item.id)}
                >
                  {item.label}
                </Button>
              )
            })}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="rounded-lg bg-surface-variant p-4 flex-col-4 text-on-surface">
              <div className="flex-row-2 items-center">
                <h2 className="typography-title-md">{translation('visitorsByCountry')}</h2>
                <Chip color="primary" coloringStyle="tonal" size="sm">{data.visitors.all}</Chip>
              </div>
              <VisitorRing
                segments={segments}
                label={translation('visitorsByCountry')}
              />
            </section>
            <section className="rounded-lg bg-surface-variant p-4 flex-col-4 text-on-surface">
              <div className="flex-row-2 items-center">
                <h2 className="typography-title-md">{translation('totalRequests')}</h2>
                <Chip color="primary" coloringStyle="tonal" size="sm">{requestsInSpan}</Chip>
              </div>
              <VisitorTimeline
                points={recentRequests}
                end={now}
                spanMs={spanMs}
                label={translation('totalRequests')}
              />
            </section>
            <section className="rounded-lg bg-surface-variant p-4 flex-col-4 text-on-surface">
              <div className="flex-row-2 items-center">
                <h2 className="typography-title-md">{translation('blockedRequestsLastDay')}</h2>
                <Chip color="primary" coloringStyle="tonal" size="sm">{blockedInSpan}</Chip>
              </div>
              <VisitorTimeline
                points={recentBlockedRequests}
                end={now}
                spanMs={spanMs}
                color="#e5484d"
                label={translation('blockedRequestsLastDay')}
              />
            </section>
          </div>
        </>
      )}
    </div>
  )
}
