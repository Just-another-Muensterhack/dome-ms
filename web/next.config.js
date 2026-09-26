import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:8000'
const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080'
const keycloakRealm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'msdome'
const keycloakClientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'frontend-client'

const webRoot = dirname(fileURLToPath(import.meta.url))
const skippedDirectories = new Set(['node_modules', 'build', 'out', '.next'])
const publicEnvKeys = [
  'NEXT_PUBLIC_API_ORIGIN',
  'NEXT_PUBLIC_KEYCLOAK_URL',
  'NEXT_PUBLIC_KEYCLOAK_REALM',
  'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID',
]

const buildIdFromSource = () => {
  const hash = createHash('sha256')
  const visit = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      if (skippedDirectories.has(name)) continue
      const path = join(directory, name)
      const info = statSync(path)
      if (info.isDirectory()) {
        visit(path)
        continue
      }
      if (!info.isFile()) continue
      hash.update(relative(webRoot, path).split(sep).join('/'))
      hash.update('\0')
      hash.update(readFileSync(path))
      hash.update('\0')
    }
  }
  visit(webRoot)
  for (const key of publicEnvKeys) {
    hash.update(key)
    hash.update('\0')
    hash.update(process.env[key] ?? '')
    hash.update('\0')
  }
  return hash.digest('hex').slice(0, 24)
}

const nextConfig = {
  distDir: 'build',
  reactStrictMode: true,
  output: 'export',
  generateBuildId: () => process.env.NEXT_BUILD_ID || buildIdFromSource(),
  env: {
    NEXT_PUBLIC_API_ORIGIN: apiOrigin,
    NEXT_PUBLIC_KEYCLOAK_URL: keycloakUrl,
    NEXT_PUBLIC_KEYCLOAK_REALM: keycloakRealm,
    NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: keycloakClientId,
  },
}

export default nextConfig
