/** @type {import('next').NextConfig} */
const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:8000'
const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080'
const keycloakRealm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'msdome'
const keycloakClientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'frontend-client'

const nextConfig = {
  distDir: 'build',
  reactStrictMode: true,
  output: 'export',
  env: {
    NEXT_PUBLIC_API_ORIGIN: apiOrigin,
    NEXT_PUBLIC_KEYCLOAK_URL: keycloakUrl,
    NEXT_PUBLIC_KEYCLOAK_REALM: keycloakRealm,
    NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: keycloakClientId,
  },
}

export default nextConfig
