/** @type {import('next').NextConfig} */
const apiOrigin = 'http://localhost:8000'

const nextConfig = {
  distDir: 'build',
  reactStrictMode: true,
  output: 'export',
  env: {
    NEXT_PUBLIC_API_ORIGIN: apiOrigin,
  },
}

export default nextConfig
