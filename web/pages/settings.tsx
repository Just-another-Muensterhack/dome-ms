import type { NextPage } from 'next'
import { LanguageSelect, LoadingAndErrorComponent, ThemeSelect } from '@helpwave/hightide'
import { useCurrentUser } from '@/api/user'
import { Page } from '@/components/layout/Page'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

const Settings: NextPage = () => {
  const translation = useDomeTranslation()
  const currentUser = useCurrentUser()
  const user = currentUser.data
  const displayName = user
    ? [user.first_name, user.last_name].filter((part) => part.length > 0).join(' ')
    : ''

  return (
    <Page pageTitle={translation('settings')}>
      <div className="flex-col-6 max-w-md">
        <h1 className="typography-title-lg">{translation('settings')}</h1>
        <LoadingAndErrorComponent
          isLoading={currentUser.isPending}
          hasError={currentUser.isError}
          loadingComponent={<p className="typography-body text-description">{translation('loadingAccount')}</p>}
          errorComponent={<p className="typography-body text-description">{translation('accountUnavailable')}</p>}
        >
          {user && (
            <div className="flex-col-1">
              <p className="typography-title-sm">{displayName || user.username}</p>
              <p className="typography-body text-description">{user.email}</p>
            </div>
          )}
        </LoadingAndErrorComponent>
        <div className="flex-col-2">
          <h2 className="typography-title-sm">{translation('language')}</h2>
          <LanguageSelect />
        </div>
        <div className="flex-col-2">
          <h2 className="typography-title-sm">{translation('theme')}</h2>
          <ThemeSelect />
        </div>
      </div>
    </Page>
  )
}

export default Settings
