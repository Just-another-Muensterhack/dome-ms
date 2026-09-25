import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
import { apiRequest } from '@/api/client'
import type { Website, WebsiteIn, WebsiteUpdate } from '@/api/types/website'

const websitesPath = '/api/v1/websites/'

export const fetchWebsites = (): Promise<Website[]> => apiRequest<Website[]>(websitesPath)

export const fetchWebsite = (websiteId: string): Promise<Website> => (
  apiRequest<Website>(`${websitesPath}${websiteId}`)
)

export const createWebsite = (payload: WebsiteIn): Promise<Website> => (
  apiRequest<Website>(websitesPath, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
)

export const updateWebsite = (websiteId: string, payload: WebsiteUpdate): Promise<Website> => (
  apiRequest<Website>(`${websitesPath}${websiteId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
)

export const deleteWebsite = (websiteId: string): Promise<void> => (
  apiRequest<void>(`${websitesPath}${websiteId}`, {
    method: 'DELETE',
  })
)

export type UseWebsitesOptions = Omit<
  UseQueryOptions<Website[], Error, Website[], QueryKey>,
  'queryFn' | 'queryKey'
> & {
  queryKey?: QueryKey,
}

export const useWebsites = (
  options?: UseWebsitesOptions
): UseQueryResult<Website[], Error> => {
  const { queryKey, ...queryOptions } = options ?? {}

  return useQuery({
    queryKey: queryKey ?? ['websites'],
    ...queryOptions,
    queryFn: fetchWebsites,
  })
}

export type UseWebsiteOptions = Omit<
  UseQueryOptions<Website, Error, Website, QueryKey>,
  'queryFn' | 'queryKey'
> & {
  queryKey?: QueryKey,
}

export const useWebsite = (
  websiteId: string,
  options?: UseWebsiteOptions
): UseQueryResult<Website, Error> => {
  const { queryKey, ...queryOptions } = options ?? {}

  return useQuery({
    queryKey: queryKey ?? ['website', websiteId],
    enabled: websiteId.length > 0,
    ...queryOptions,
    queryFn: () => fetchWebsite(websiteId),
  })
}
