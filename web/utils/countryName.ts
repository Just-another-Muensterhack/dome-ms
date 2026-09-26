export const countryName = (code: string, locale = 'en') => {
  const normalized = code.trim().toUpperCase()
  if (normalized.length === 2) {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(normalized) ?? normalized
  }

  const iso2ByIso3: Record<string, string> = {
    AUS: 'AU',
    AUT: 'AT',
    BRA: 'BR',
    CAN: 'CA',
    CHE: 'CH',
    CHN: 'CN',
    DEU: 'DE',
    ESP: 'ES',
    FRA: 'FR',
    GBR: 'GB',
    IND: 'IN',
    ITA: 'IT',
    JPN: 'JP',
    KOR: 'KR',
    MEX: 'MX',
    NLD: 'NL',
    NOR: 'NO',
    POL: 'PL',
    SWE: 'SE',
    USA: 'US',
  }
  const iso2 = iso2ByIso3[normalized]
  if (!iso2) return normalized
  return new Intl.DisplayNames([locale], { type: 'region' }).of(iso2) ?? normalized
}
