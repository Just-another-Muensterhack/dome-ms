export type Domain = {
  id: string,
  name: string,
  wildcard: boolean,
  website_id: string | null,
  created_at: string,
  updated_at: string,
}

export type DomainIn = {
  name: string,
  wildcard?: boolean,
  website_id?: string | null,
}

export type DomainUpdate = {
  name?: string,
  wildcard?: boolean,
  website_id?: string | null,
}
