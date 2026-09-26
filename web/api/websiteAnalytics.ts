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

const dailyCounts = (now: number, scale: number): WebsiteAnalyticsCountSource[] => (
  Array.from({ length: 28 }, (_, index) => {
    const day = 30 - index
    return {
      count: scale * (8 + (day % 5) * 3),
      date: new Date(now - day * dayMs).toISOString(),
    }
  })
)

const websiteAnalyticsSource = (): WebsiteAnalyticsSource => {
  const now = Date.now()
  return {
    visitors: {
      all: 1265,
      DEU: 420,
      USA: 310,
      FRA: 180,
      GBR: 140,
      JPN: 90,
      BRA: 70,
      IND: 55,
    },
    requests: [
      ...dailyCounts(now, 4),
      { count: 8, date: new Date(now - 26 * hourMs).toISOString() },
      { count: 14, date: new Date(now - 22 * hourMs).toISOString() },
      { count: 21, date: new Date(now - 18 * hourMs).toISOString() },
      { count: 17, date: new Date(now - 14 * hourMs).toISOString() },
      { count: 28, date: new Date(now - 10 * hourMs).toISOString() },
      { count: 19, date: new Date(now - 6 * hourMs).toISOString() },
      { count: 24, date: new Date(now - 2 * hourMs).toISOString() },
    ],
    blockedRequests: [
      ...dailyCounts(now, 1),
      { count: 2, date: new Date(now - 26 * hourMs).toISOString() },
      { count: 3, date: new Date(now - 22 * hourMs).toISOString() },
      { count: 5, date: new Date(now - 18 * hourMs).toISOString() },
      { count: 4, date: new Date(now - 14 * hourMs).toISOString() },
      { count: 9, date: new Date(now - 10 * hourMs).toISOString() },
      { count: 6, date: new Date(now - 6 * hourMs).toISOString() },
      { count: 7, date: new Date(now - 2 * hourMs).toISOString() },
    ],
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
