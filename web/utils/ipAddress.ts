const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/

export const isIpv4Address = (value: string): boolean => ipv4Pattern.test(value)

export const isIpv6Address = (value: string): boolean => {
  if (!value.includes(':') || value.includes(':::')) {
    return false
  }

  try {
    const hostname = new URL(`http://[${value}]/`).hostname
    return hostname.startsWith('[') && hostname.endsWith(']') && hostname.includes(':')
  } catch {
    return false
  }
}

export const ipAddressVersion = (value: string): 'ipv4' | 'ipv6' | null => {
  const trimmed = value.trim()
  if (isIpv4Address(trimmed)) {
    return 'ipv4'
  }
  if (isIpv6Address(trimmed)) {
    return 'ipv6'
  }
  return null
}
