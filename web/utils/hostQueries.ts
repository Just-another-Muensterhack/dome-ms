import type { QueryClient } from '@tanstack/react-query'

export const invalidateHostQueries = async (queryClient: QueryClient): Promise<void> => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['domains'] }),
    queryClient.invalidateQueries({ queryKey: ['websites'] }),
    queryClient.invalidateQueries({ queryKey: ['website'] }),
    queryClient.invalidateQueries({ queryKey: ['webservers'] }),
  ])
}
