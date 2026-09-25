import type { Domain } from '@/api/types/domain'

export type Webserver = {
  id: string,
  name: string,
  description: string,
  tags: string[],
  ipv4: string | null,
  ipv6: string | null,
  cname: string,
  domains: Domain[],
  created_at: string,
  updated_at: string,
}

export type WebserverIn = {
  name: string,
  description?: string,
  tags?: string[],
  ipv4?: string | null,
  ipv6?: string | null,
  cname?: string,
}
