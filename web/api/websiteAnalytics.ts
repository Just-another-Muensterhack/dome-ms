import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
import type { WebsiteAnalytics, WebsiteAnalyticsCount } from '@/api/types/websiteAnalytics'

type WebsiteAnalyticsCountSource = {
  count: number,
  date: string,
}

type WebsiteAnalyticsSource = {
  visitors: WebsiteAnalytics['visitors'],
  requests: WebsiteAnalyticsCountSource[],
  blockedRequests: WebsiteAnalyticsCountSource[],
}

const hourMs = 60 * 60 * 1000
const dayMs = 24 * hourMs
const epochMs = Date.UTC(2026, 0, 1)

const requestsAt = (time: number) => {
  const hours = Math.floor(Math.max(0, time - epochMs) / hourMs)
  return Math.min(10000, Math.max(1, hours))
}

const blockedAt = (time: number) => Math.min(10000, Math.max(1, Math.round(requestsAt(time) * 0.05)))

const sampleTimes = (now: number) => {
  const hourEnd = Math.floor(now / hourMs) * hourMs
  const times = new Set<number>()
  for (let day = 30; day >= 2; day -= 1) {
    times.add(hourEnd - day * dayMs)
  }
  for (let hour = 24; hour >= 0; hour -= 1) {
    times.add(hourEnd - hour * hourMs)
  }
  return [...times].sort((left, right) => left - right)
}

const websiteAnalyticsSource = (): WebsiteAnalyticsSource => {
  const times = sampleTimes(Date.now())
  return {
    visitors: {
      all: 1000,
      DEU: 900,
      AUT: 70,
      CHE: 20,
      ITA: 10,
    },
    requests: times.map((time) => ({
      count: requestsAt(time),
      date: new Date(time).toISOString(),
    })),
    blockedRequests: times.map((time) => ({
      count: blockedAt(time),
      date: new Date(time).toISOString(),
    })),
  }
}

const parseCounts = (counts: WebsiteAnalyticsCountSource[]): WebsiteAnalyticsCount[] => (
  counts.map((count) => ({
    count: count.count,
    date: new Date(count.date),
  }))
)

const parseWebsiteAnalytics = (source: WebsiteAnalyticsSource): WebsiteAnalytics => ({
  visitors: source.visitors,
  requests: parseCounts(source.requests),
  blockedRequests: parseCounts(source.blockedRequests),
})

const queryWebsiteAnalytics = (websiteId: string) => {
  if (websiteId.length === 0) {
    return Promise.reject(new Error('Missing website id'))
  }
  return Promise.resolve(parseWebsiteAnalytics(websiteAnalyticsSource()))
}

export type UseWebsiteAnalyticsOptions = Omit<
  UseQueryOptions<WebsiteAnalytics, Error, WebsiteAnalytics, QueryKey>,
  'queryFn' | 'queryKey'
> & {
  queryKey?: QueryKey,
}

export const useWebsiteAnalytics = (
  websiteId: string,
  options?: UseWebsiteAnalyticsOptions
): UseQueryResult<WebsiteAnalytics, Error> => {
  const { queryKey, ...queryOptions } = options ?? {}

  return useQuery({
    queryKey: queryKey ?? ['website-analytics', websiteId],
    enabled: websiteId.length > 0,
    ...queryOptions,
    queryFn: () => queryWebsiteAnalytics(websiteId),
  })
}
