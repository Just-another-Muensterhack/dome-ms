import { useEffect, useState } from 'react'
import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
import { apiRequest } from '@/api/client'
import type { Domain, DomainIn, DomainUpdate } from '@/api/types/domain'

const domainsPath = '/api/v1/domains/'
const managedEligibilityDelayMs = 1000

export const managedWebsiteDomain = 'website.dome.ms'

export const managedDomainHostname = (label: string) => (
  `${label.trim().toLowerCase()}.${managedWebsiteDomain}`
)

export type DomainAvailability = {
  name: string,
  available: boolean,
  reason: string | null,
}

export const fetchManagedDomainAvailability = (name: string): Promise<DomainAvailability> => (
  apiRequest<DomainAvailability>(`${domainsPath}available?name=${encodeURIComponent(name)}`)
)

export const useManagedDomainEligibility = (name: string, enabled: boolean) => {
  const trimmed = name.trim().toLowerCase()
  const [debouncedName, setDebouncedName] = useState(trimmed)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedName(trimmed), managedEligibilityDelayMs)
    return () => window.clearTimeout(timeout)
  }, [trimmed])

  const query = useQuery({
    queryKey: ['managed-domain-availability', debouncedName],
    enabled: enabled && debouncedName.length > 0,
    queryFn: () => fetchManagedDomainAvailability(debouncedName),
  })

  const current = enabled && trimmed.length > 0 && trimmed === debouncedName
  const settled = current && query.isSuccess && !query.isFetching
  const passed = settled && query.data.available

  return {
    passed,
    checking: enabled && trimmed.length > 0 && !passed && !query.isError && !settled,
    failed: (settled && !query.data.available) || (current && query.isError),
    reason: settled && !query.data.available ? query.data.reason : null,
  }
}

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

export const verifyDomain = (domainId: string): Promise<Domain> => (
  apiRequest<Domain>(`${domainsPath}${domainId}/verify`, {
    method: 'POST',
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
