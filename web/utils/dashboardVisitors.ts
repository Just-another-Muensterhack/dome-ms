import type { WebsiteAnalytics } from '@/api/types/websiteAnalytics'

export const dayMs = 24 * 60 * 60 * 1000

export type VisitorCountrySegment = {
  id: string,
  label: string,
  value: number,
}

export const visitorCountrySegments = (
  visitors: WebsiteAnalytics['visitors'],
  limit = 4
): VisitorCountrySegment[] => {
  const countries = Object.entries(visitors)
    .filter(([code]) => code !== 'all')
    .map(([code, count]) => ({ code, count }))
    .sort((left, right) => right.count - left.count)

  const leading = countries.slice(0, limit)
  const remaining = countries.slice(limit)
  const segments = leading.map((country) => ({
    id: country.code,
    label: country.code,
    value: country.count,
  }))

  if (remaining.length === 0) return segments

  return [
    ...segments,
    {
      id: 'others',
      label: 'others',
      value: remaining.reduce((sum, country) => sum + country.count, 0),
    },
  ]
}

export const requestsInRange = (
  requests: { count: number, date: Date }[],
  now: Date,
  spanMs: number
) => {
  const start = now.getTime() - spanMs
  return requests
    .filter((request) => {
      const time = request.date.getTime()
      return time >= start && time <= now.getTime()
    })
    .sort((left, right) => left.date.getTime() - right.date.getTime())
}

export const countInRange = (
  requests: { count: number, date: Date }[],
  now: Date,
  spanMs: number
) => requestsInRange(requests, now, spanMs).reduce((sum, request) => sum + request.count, 0)
