import { useLocalization, useTranslation } from '@helpwave/hightide'
import type {
  DomeTranslationEntries,
  DomeTranslationLocales
} from '@/i18n/translations'

export const useDomeTranslation = () => {
  return useTranslation<
    DomeTranslationLocales,
    DomeTranslationEntries
  >()
}

export const useLocale = useLocalization
