export type Domain = {
  id: string,
  name: string,
  wildcard: boolean,
  website_id: string | null,
  webserver_id: string | null,
  verified_at: string | null,
  record_name: string,
  record_value: string,
  created_at: string,
  updated_at: string,
}

export type DomainIn = {
  name: string,
  wildcard?: boolean,
  website_id?: string | null,
  webserver_id?: string | null,
}

export type DomainUpdate = {
  name?: string,
  wildcard?: boolean,
  website_id?: string | null,
  webserver_id?: string | null,
}
