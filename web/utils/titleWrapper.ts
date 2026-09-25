import { domeTranslation } from '@/i18n/translations'

const defaultTitle = domeTranslation['en-US'].appName

const titleWrapper = (title?: string) => title ? `${title} | ${defaultTitle}` : defaultTitle

export default titleWrapper
