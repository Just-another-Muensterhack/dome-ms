import Head from 'next/head'
import { siteDescription, siteImagePath, siteName, siteOrigin, siteTitle } from '@/utils/site'

type SiteGraphProps = {
  title?: string,
  description?: string,
  path?: string,
}

const pageUrl = (path: string) => {
  if (path === '/') {
    return `${siteOrigin}/`
  }
  return `${siteOrigin}${path.startsWith('/') ? path : `/${path}`}`
}

export const SiteGraph = ({
  title = siteTitle,
  description = siteDescription,
  path = '/',
}: SiteGraphProps) => {
  const url = pageUrl(path)
  const image = `${siteOrigin}${siteImagePath}`
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteOrigin}/#website`,
        name: siteName,
        url: `${siteOrigin}/`,
        description,
        inLanguage: 'de',
      },
      {
        '@type': 'Organization',
        '@id': `${siteOrigin}/#organization`,
        name: siteName,
        url: `${siteOrigin}/`,
        description,
        logo: image,
      },
    ],
  }

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} key="description" />
      <meta name="robots" content="index, follow" key="robots" />
      <link rel="canonical" href={url} key="canonical" />
      <meta property="og:type" content="website" key="og:type" />
      <meta property="og:site_name" content={siteName} key="og:site_name" />
      <meta property="og:locale" content="de_DE" key="og:locale" />
      <meta property="og:title" content={title} key="og:title" />
      <meta property="og:description" content={description} key="og:description" />
      <meta property="og:url" content={url} key="og:url" />
      <meta property="og:image" content={image} key="og:image" />
      <meta property="og:image:type" content="image/png" key="og:image:type" />
      <meta property="og:image:width" content="1200" key="og:image:width" />
      <meta property="og:image:height" content="630" key="og:image:height" />
      <meta property="og:image:alt" content={title} key="og:image:alt" />
      <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta name="twitter:title" content={title} key="twitter:title" />
      <meta name="twitter:description" content={description} key="twitter:description" />
      <meta name="twitter:image" content={image} key="twitter:image" />
      <meta name="twitter:image:alt" content={title} key="twitter:image:alt" />
      <meta name="theme-color" content="#143F33" key="theme-color" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replaceAll('<', '\\u003c') }}
      />
    </Head>
  )
}

export const NoIndex = () => (
  <Head>
    <meta name="robots" content="noindex, nofollow" key="robots" />
  </Head>
)
