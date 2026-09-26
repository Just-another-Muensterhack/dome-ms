export type WebsiteAttributes = {
  category?: string,
  purpose?: string,
  location?: string,
  language?: string,
  tone?: string,
  sections?: string[],
  primary_color?: string,
}

export type WebsiteContentIn = {
  website_id: string,
  description: string,
  attributes: WebsiteAttributes,
}

export type WebsiteContent = {
  id: string,
  website_id: string,
  name: string,
  is_active: boolean,
  source_id: string | null,
  prompt: string,
  description: string,
  attributes: WebsiteAttributes,
  model: string,
  created_at: string,
  updated_at: string,
}
