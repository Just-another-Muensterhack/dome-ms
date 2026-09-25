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
  description: string,
  attributes: WebsiteAttributes,
  model: string,
  html: string,
  created_at: string,
  updated_at: string,
}
