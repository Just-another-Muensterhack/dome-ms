import type { NextPage } from 'next'
import { DesignLanding } from '@/components/landing/DesignLanding'
import { SiteGraph } from '@/components/seo/SiteGraph'

const Home: NextPage = () => (
  <>
    <SiteGraph />
    <DesignLanding />
  </>
)

export default Home
