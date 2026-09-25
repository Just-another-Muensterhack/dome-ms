import { getAccessToken } from '@/utils/auth'

const apiOrigin = process.env['NEXT_PUBLIC_API_ORIGIN'] ?? 'http://localhost:8000'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const formatDetail = (detail: unknown): string | undefined => {
  if (typeof detail === 'string' && detail.length > 0) {
    return detail
  }

  if (detail === null || typeof detail !== 'object') {
    return undefined
  }

  const messages = Object.entries(detail).flatMap(([field, value]) => {
    const parts = Array.isArray(value) ? value.map(String) : [String(value)]
    return parts
      .filter((part) => part.length > 0)
      .map((part) => field === '__all__' ? part : `${field}: ${part}`)
  })

  return messages.length > 0 ? messages.join(' ') : undefined
}

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = await response.json() as { detail?: unknown }
    return formatDetail(body.detail) ?? (response.statusText || 'Request failed')
  } catch {
    return response.statusText || 'Request failed'
  }
}

export const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const accessToken = getAccessToken()
  if (accessToken !== undefined && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${apiOrigin}${path}`, {
    ...init,
    headers,
  })

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }

  return await response.json() as T
}
