import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
import { apiRequest } from '@/api/client'
import type { CurrentUser } from '@/api/types/user'

export const fetchCurrentUser = (): Promise<CurrentUser> => (
  apiRequest<CurrentUser>('/api/v1/analysis/me')
)

export type UseCurrentUserOptions = Omit<
  UseQueryOptions<CurrentUser, Error, CurrentUser, QueryKey>,
  'queryFn' | 'queryKey'
> & {
  queryKey?: QueryKey,
}

export const useCurrentUser = (
  options?: UseCurrentUserOptions
): UseQueryResult<CurrentUser, Error> => {
  const { queryKey, ...queryOptions } = options ?? {}

  return useQuery({
    queryKey: queryKey ?? ['current-user'],
    ...queryOptions,
    queryFn: fetchCurrentUser,
  })
}
