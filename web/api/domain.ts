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

const managedDomainLabelPattern = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/

export const isManagedDomainLabel = (name: string) => managedDomainLabelPattern.test(name.trim().toLowerCase())

export const managedDomainHostname = (label: string) => (
  `${label.trim().toLowerCase()}.${managedWebsiteDomain}`
)

export const useManagedDomainEligibility = (name: string, enabled: boolean) => {
  const trimmed = name.trim().toLowerCase()
  const [checkedName, setCheckedName] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || trimmed.length === 0) {
      setCheckedName(null)
      return
    }
    const timeout = window.setTimeout(() => setCheckedName(trimmed), managedEligibilityDelayMs)
    return () => window.clearTimeout(timeout)
  }, [enabled, trimmed])

  const settled = enabled && trimmed.length > 0 && checkedName === trimmed

  return {
    passed: settled,
    checking: enabled && trimmed.length > 0 && !settled,
    failed: false,
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
