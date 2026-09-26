import { clearOnboardingTimestamp } from '@/utils/onboarding'

export const keycloakConfig = {
  url: process.env['NEXT_PUBLIC_KEYCLOAK_URL'] ?? 'http://localhost:8080',
  realm: process.env['NEXT_PUBLIC_KEYCLOAK_REALM'] ?? 'msdome',
  clientId: process.env['NEXT_PUBLIC_KEYCLOAK_CLIENT_ID'] ?? 'frontend-client',
}

const ACCESS_TOKEN_KEY = 'msdome.access_token'
const REFRESH_TOKEN_KEY = 'msdome.refresh_token'
const ID_TOKEN_KEY = 'msdome.id_token'
const EXPIRES_AT_KEY = 'msdome.expires_at'
const PKCE_KEY = 'msdome.pkce'

const AUTH_SCOPE = 'openid profile email'

type TokenResponse = {
  access_token: string,
  refresh_token?: string,
  id_token?: string,
  expires_in?: number,
}

type PkceSession = {
  verifier: string,
  state: string,
}

const callbackExchanges = new Map<string, Promise<void>>()
let refreshInFlight: Promise<string | undefined> | undefined

const issuerPath = (path: string): string => (
  `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/${path}`
)

export const keycloakTokenUrl = (): string => issuerPath('token')

export const authCallbackPath = '/auth/callback'

export const redirectUri = (): string => {
  if (typeof window === 'undefined') {
    return ''
  }

  return `${window.location.origin}${authCallbackPath}`
}

const base64Url = (bytes: Uint8Array): string => {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

const randomString = (size: number): string => {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return base64Url(bytes)
}

const codeChallenge = async (verifier: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64Url(new Uint8Array(digest))
}

const readStorage = (key: string): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined
  }

  const value = window.sessionStorage.getItem(key)
  return value === null || value.length === 0 ? undefined : value
}

const writeStorage = (key: string, value: string | undefined): void => {
  if (typeof window === 'undefined') {
    return
  }

  if (value === undefined || value.length === 0) {
    window.sessionStorage.removeItem(key)
    return
  }

  window.sessionStorage.setItem(key, value)
}

export const getAccessToken = (): string | undefined => readStorage(ACCESS_TOKEN_KEY)

export const setAccessToken = (token: string | undefined): void => {
  writeStorage(ACCESS_TOKEN_KEY, token)
}

const clearSession = (): void => {
  writeStorage(ACCESS_TOKEN_KEY, undefined)
  writeStorage(REFRESH_TOKEN_KEY, undefined)
  writeStorage(ID_TOKEN_KEY, undefined)
  writeStorage(EXPIRES_AT_KEY, undefined)
  writeStorage(PKCE_KEY, undefined)
}

const storeTokens = (data: TokenResponse): void => {
  setAccessToken(data.access_token)
  if (data.refresh_token !== undefined) {
    writeStorage(REFRESH_TOKEN_KEY, data.refresh_token)
  }
  if (data.id_token !== undefined) {
    writeStorage(ID_TOKEN_KEY, data.id_token)
  }
  if (data.expires_in !== undefined) {
    writeStorage(EXPIRES_AT_KEY, String(Date.now() + data.expires_in * 1000 - 10_000))
  }
}

const requestToken = async (body: URLSearchParams): Promise<TokenResponse> => {
  const response = await fetch(keycloakTokenUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    throw new Error('Keycloak token request failed')
  }

  return await response.json() as TokenResponse
}

const tokenIsCurrent = (): boolean => {
  const token = getAccessToken()
  if (token === undefined) {
    return false
  }

  const expiresAt = Number(readStorage(EXPIRES_AT_KEY) ?? '0')
  return expiresAt === 0 || Date.now() < expiresAt
}

const refreshAccessToken = (): Promise<string | undefined> => {
  if (refreshInFlight !== undefined) {
    return refreshInFlight
  }

  refreshInFlight = (async () => {
    const refreshToken = readStorage(REFRESH_TOKEN_KEY)
    if (refreshToken === undefined) {
      clearSession()
      return undefined
    }

    try {
      const data = await requestToken(new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: keycloakConfig.clientId,
        refresh_token: refreshToken,
      }))
      storeTokens(data)
      return data.access_token
    } catch {
      clearSession()
      return undefined
    }
  })().finally(() => {
    refreshInFlight = undefined
  })

  return refreshInFlight
}

export const ensureAccessToken = async (): Promise<string | undefined> => {
  if (tokenIsCurrent()) {
    return getAccessToken()
  }

  return await refreshAccessToken()
}

const beginAuthorization = async (endpoint: string): Promise<void> => {
  const verifier = randomString(32)
  const state = randomString(16)
  writeStorage(PKCE_KEY, JSON.stringify({ verifier, state } satisfies PkceSession))
  const challenge = await codeChallenge(verifier)
  const params = new URLSearchParams({
    client_id: keycloakConfig.clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: AUTH_SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  window.location.assign(`${endpoint}?${params.toString()}`)
}

export const startLogin = async (): Promise<void> => {
  await beginAuthorization(issuerPath('auth'))
}

export const startSignUp = async (): Promise<void> => {
  await beginAuthorization(issuerPath('registrations'))
}

const completeAuthorizationCode = async (code: string, state: string): Promise<void> => {
  const raw = readStorage(PKCE_KEY)
  writeStorage(PKCE_KEY, undefined)
  if (raw === undefined) {
    if (getAccessToken() !== undefined) {
      return
    }
    throw new Error('Missing login session')
  }

  const pkce = JSON.parse(raw) as PkceSession
  if (pkce.state !== state) {
    throw new Error('Login state mismatch')
  }

  const data = await requestToken(new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: keycloakConfig.clientId,
    code,
    redirect_uri: redirectUri(),
    code_verifier: pkce.verifier,
  }))
  storeTokens(data)
}

export const consumeAuthorizationCallback = (search: string): Promise<void> => {
  const params = new URLSearchParams(search)
  const error = params.get('error')
  if (error !== null) {
    return Promise.reject(new Error(error))
  }

  const code = params.get('code')
  const state = params.get('state')
  if (code === null || state === null) {
    if (getAccessToken() !== undefined) {
      return Promise.resolve()
    }
    return Promise.reject(new Error('Missing authorization code'))
  }

  const existing = callbackExchanges.get(code)
  if (existing !== undefined) {
    return existing
  }

  const exchange = completeAuthorizationCode(code, state)
  callbackExchanges.set(code, exchange)
  return exchange
}

export const logout = (): void => {
  const idToken = readStorage(ID_TOKEN_KEY)
  const params = new URLSearchParams({
    client_id: keycloakConfig.clientId,
    post_logout_redirect_uri: typeof window === 'undefined' ? '/' : `${window.location.origin}/`,
  })
  if (idToken !== undefined) {
    params.set('id_token_hint', idToken)
  }

  clearSession()
  clearOnboardingTimestamp()
  window.location.assign(`${issuerPath('logout')}?${params.toString()}`)
}
