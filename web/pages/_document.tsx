import Document, { Html, Head, Main, NextScript } from 'next/document'
import { domeTranslation } from '@/i18n/translations'

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta name="description" content={domeTranslation['en-US'].appName} />
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
