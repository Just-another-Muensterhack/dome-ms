import Document, { Html, Head, Main, NextScript } from 'next/document'
import { domeTranslation } from '@/i18n/translations'

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta name="description" content={domeTranslation['en-US'].appName} />
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
