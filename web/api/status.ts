import { useQuery } from '@tanstack/react-query'
import { apiOrigin } from '@/api/client'

export const statusPageUrl = 'https://status.dome.ms/'

export type SystemStatus = {
  operational: boolean,
}

export const fetchSystemStatus = async (): Promise<SystemStatus> => {
  const response = await fetch(`${apiOrigin}/api/v1/status/`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Status unavailable')
  }

  const body = await response.json() as { operational?: unknown }
  return { operational: body.operational === true }
}

export const useSystemStatus = () => {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: fetchSystemStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
