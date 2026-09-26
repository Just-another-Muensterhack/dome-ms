import type { NextPage } from 'next'
import { LandingPage } from '@/components/landing/LandingPage'
import { NoIndex } from '@/components/seo/SiteGraph'

const LoginPage: NextPage = () => (
  <>
    <NoIndex />
    <LandingPage />
  </>
)

export default LoginPage
