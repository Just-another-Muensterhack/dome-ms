export const keycloakConfig = {
  url: process.env['NEXT_PUBLIC_KEYCLOAK_URL'] ?? 'http://localhost:8080',
  realm: process.env['NEXT_PUBLIC_KEYCLOAK_REALM'] ?? 'msdome',
  clientId: process.env['NEXT_PUBLIC_KEYCLOAK_CLIENT_ID'] ?? 'frontend-client',
}

const TOKEN_KEY = 'msdome.access_token'

type TokenResponse = {
  access_token: string
}

export const keycloakTokenUrl = (): string => (
  `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`
)

export const getAccessToken = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined
  }

  const token = window.sessionStorage.getItem(TOKEN_KEY)
  return token === null || token.length === 0 ? undefined : token
}

export const setAccessToken = (token: string | undefined): void => {
  if (typeof window === 'undefined') {
    return
  }

  if (token === undefined || token.length === 0) {
    window.sessionStorage.removeItem(TOKEN_KEY)
    return
  }

  window.sessionStorage.setItem(TOKEN_KEY, token)
}

export const loginWithPassword = async (username: string, password: string): Promise<void> => {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: keycloakConfig.clientId,
    username,
    password,
    scope: 'openid profile email',
  })

  const response = await fetch(keycloakTokenUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    throw new Error('Keycloak login failed')
  }

  const data = await response.json() as TokenResponse
  setAccessToken(data.access_token)
}

export const logout = (): void => {
  setAccessToken(undefined)
}
