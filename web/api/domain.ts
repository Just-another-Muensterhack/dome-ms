import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
import { apiRequest } from '@/api/client'
import type { Domain, DomainIn, DomainUpdate } from '@/api/types/domain'

const domainsPath = '/api/v1/domains/'

export const fetchDomains = (websiteId?: string): Promise<Domain[]> => {
  const query = websiteId ? `?website_id=${encodeURIComponent(websiteId)}` : ''
  return apiRequest<Domain[]>(`${domainsPath}${query}`)
}

export const fetchDomain = (domainId: string): Promise<Domain> => (
  apiRequest<Domain>(`${domainsPath}${domainId}`)
)

export const createDomain = (payload: DomainIn): Promise<Domain> => (
  apiRequest<Domain>(domainsPath, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
)

export const updateDomain = (domainId: string, payload: DomainUpdate): Promise<Domain> => (
  apiRequest<Domain>(`${domainsPath}${domainId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
)

export const deleteDomain = (domainId: string): Promise<void> => (
  apiRequest<void>(`${domainsPath}${domainId}`, {
    method: 'DELETE',
  })
)

export type UseDomainsQueryOptions = Omit<
  UseQueryOptions<Domain[], Error, Domain[], QueryKey>,
  'queryFn' | 'queryKey'
> & {
  queryKey?: QueryKey,
}

export const useDomainsQuery = (
  websiteId?: string,
  options?: UseDomainsQueryOptions
): UseQueryResult<Domain[], Error> => {
  const { queryKey, ...queryOptions } = options ?? {}

  return useQuery({
    queryKey: queryKey ?? ['domains', websiteId ?? null],
    ...queryOptions,
    queryFn: () => fetchDomains(websiteId),
  })
}
