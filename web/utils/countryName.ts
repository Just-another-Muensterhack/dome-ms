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

export const countryName = (iso3: string, locale = 'en') => {
  const iso2 = iso2ByIso3[iso3]
  if (!iso2) return iso3
  return new Intl.DisplayNames([locale], { type: 'region' }).of(iso2) ?? iso3
}
