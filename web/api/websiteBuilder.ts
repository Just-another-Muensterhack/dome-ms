import {
  useMutation,
  useQuery,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
import { apiRequest } from '@/api/client'
import type { WebsiteContent, WebsiteContentIn } from '@/api/types/websiteContent'

const websiteBuilderPath = '/api/v1/website-builder/'

export const websiteContentsKey = (websiteId: string): QueryKey => ['website-contents', websiteId]

export const fetchWebsiteContents = (websiteId: string): Promise<WebsiteContent[]> => {
  const params = new URLSearchParams({ website_id: websiteId })
  return apiRequest<WebsiteContent[]>(`${websiteBuilderPath}?${params.toString()}`)
}

export const generateWebsite = (payload: WebsiteContentIn): Promise<WebsiteContent> => (
  apiRequest<WebsiteContent>(websiteBuilderPath, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
)

export const editWebsiteContent = (contentId: string, prompt: string): Promise<WebsiteContent> => (
  apiRequest<WebsiteContent>(`${websiteBuilderPath}${contentId}/edit`, {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })
)

export const activateWebsiteContent = (contentId: string): Promise<WebsiteContent> => (
  apiRequest<WebsiteContent>(`${websiteBuilderPath}${contentId}/activate`, {
    method: 'POST',
  })
)

export const useWebsiteContents = (
  websiteId: string,
  options?: Omit<UseQueryOptions<WebsiteContent[], Error, WebsiteContent[], QueryKey>, 'queryFn' | 'queryKey'>
): UseQueryResult<WebsiteContent[], Error> => (
  useQuery({
    queryKey: websiteContentsKey(websiteId),
    enabled: websiteId.length > 0,
    ...options,
    queryFn: () => fetchWebsiteContents(websiteId),
  })
)

export const useGenerateWebsite = (
  options?: UseMutationOptions<WebsiteContent, Error, WebsiteContentIn>
) => (
  useMutation({
    mutationFn: generateWebsite,
    ...options,
  })
)

export const useEditWebsiteContent = (
  options?: UseMutationOptions<WebsiteContent, Error, { contentId: string, prompt: string }>
) => (
  useMutation({
    mutationFn: ({ contentId, prompt }) => editWebsiteContent(contentId, prompt),
    ...options,
  })
)

export const useActivateWebsiteContent = (
  options?: UseMutationOptions<WebsiteContent, Error, string>
) => (
  useMutation({
    mutationFn: activateWebsiteContent,
    ...options,
  })
)
