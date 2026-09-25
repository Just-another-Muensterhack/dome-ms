import type { Domain } from '@/api/types/domain'

export type Website = {
  id: string,
  name: string,
  description: string,
  tags: string[],
  domains: Domain[],
  created_at: string,
  updated_at: string,
}

export type WebsiteIn = {
  name: string,
  description?: string,
  tags?: string[],
}

export type WebsiteUpdate = {
  name?: string,
  description?: string,
  tags?: string[],
}
