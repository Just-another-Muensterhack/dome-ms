import { useState } from 'react'
import { IconButton, LanguageDialog, ThemeDialog } from '@helpwave/hightide'
import { Languages, SunMoon } from 'lucide-react'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

type AppearanceDialog = 'language' | 'theme'

export const AppearanceControls = () => {
  const translation = useDomeTranslation()
  const [open, setOpen] = useState<AppearanceDialog | null>(null)
  const close = () => setOpen(null)

  return (
    <>
      <div className="flex-row-1 items-center">
        <IconButton
          color="neutral"
          coloringStyle="text"
          tooltip={translation('language')}
          onClick={() => setOpen('language')}
        >
          <Languages className="size-5" />
        </IconButton>
        <IconButton
          color="neutral"
          coloringStyle="text"
          tooltip={translation('theme')}
          onClick={() => setOpen('theme')}
        >
          <SunMoon className="size-5" />
        </IconButton>
      </div>
      <LanguageDialog isOpen={open === 'language'} onClose={close} />
      <ThemeDialog isOpen={open === 'theme'} onClose={close} />
    </>
  )
}
