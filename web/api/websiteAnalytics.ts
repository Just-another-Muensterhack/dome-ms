import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
import { apiRequest } from '@/api/client'
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
  return apiRequest<WebsiteAnalyticsSource>(`/api/v1/websites/${websiteId}/analytics`)
    .then(parseWebsiteAnalytics)
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
    refetchInterval: 60_000,
    ...queryOptions,
    queryFn: () => queryWebsiteAnalytics(websiteId),
  })
}
