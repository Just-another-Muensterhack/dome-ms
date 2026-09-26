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
  apiRequest<WebsiteContent>(`${websiteBuilderPath}generate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
)

export const editWebsiteContent = (
  contentId: string,
  prompt: string,
  name: string,
): Promise<WebsiteContent> => (
  apiRequest<WebsiteContent>(`${websiteBuilderPath}${contentId}/edit`, {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      ...(name.length > 0 ? { name } : {}),
    }),
  })
)

export const updateWebsiteContent = (contentId: string, name: string): Promise<WebsiteContent> => (
  apiRequest<WebsiteContent>(`${websiteBuilderPath}${contentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
)

export const activateWebsiteContent = (contentId: string): Promise<WebsiteContent> => (
  apiRequest<WebsiteContent>(`${websiteBuilderPath}${contentId}/activate`, {
    method: 'POST',
  })
)

export const deleteWebsiteContent = (contentId: string): Promise<void> => (
  apiRequest<void>(`${websiteBuilderPath}${contentId}`, {
    method: 'DELETE',
  })
)

export type WebsiteUploadFile = {
  path: string,
  file: File,
}

export const uploadWebsite = (
  websiteId: string,
  files: WebsiteUploadFile[],
  name: string,
): Promise<WebsiteContent> => {
  const body = new FormData()
  body.set('website_id', websiteId)
  if (name.length > 0) {
    body.set('name', name)
  }
  for (const item of files) {
    body.append('paths', item.path)
    body.append('files', item.file, item.file.name)
  }
  return apiRequest<WebsiteContent>(`${websiteBuilderPath}upload`, {
    method: 'POST',
    body,
  })
}

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
  options?: UseMutationOptions<WebsiteContent, Error, { contentId: string, prompt: string, name: string }>
) => (
  useMutation({
    mutationFn: ({ contentId, prompt, name }) => editWebsiteContent(contentId, prompt, name),
    ...options,
  })
)

export const useUpdateWebsiteContent = (
  options?: UseMutationOptions<WebsiteContent, Error, { contentId: string, name: string }>
) => (
  useMutation({
    mutationFn: ({ contentId, name }) => updateWebsiteContent(contentId, name),
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

export const useDeleteWebsiteContent = (
  options?: UseMutationOptions<void, Error, string>
) => (
  useMutation({
    mutationFn: deleteWebsiteContent,
    ...options,
  })
)

export const useUploadWebsite = (
  options?: UseMutationOptions<WebsiteContent, Error, { websiteId: string, files: WebsiteUploadFile[], name: string }>
) => (
  useMutation({
    mutationFn: ({ websiteId, files, name }) => uploadWebsite(websiteId, files, name),
    ...options,
  })
)
