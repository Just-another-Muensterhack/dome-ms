import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { apiRequest } from '@/api/client'
import type { WebsiteContent, WebsiteContentIn } from '@/api/types/websiteContent'

const websiteBuilderPath = '/api/v1/website-builder/'

export const generateWebsite = (payload: WebsiteContentIn): Promise<WebsiteContent> => (
  apiRequest<WebsiteContent>(websiteBuilderPath, {
    method: 'POST',
    body: JSON.stringify(payload),
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
