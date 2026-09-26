import type { KeyboardEvent } from 'react'
import { Input, LabelledCheckbox } from '@helpwave/hightide'
import { managedWebsiteDomain } from '@/api/domain'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

type DomainNameFieldProps = {
  id: string,
  name: string,
  managed: boolean,
  locked: boolean,
  checking: boolean,
  failed: boolean,
  reason: string | null,
  onNameChange: (name: string) => void,
  onManagedChange: (managed: boolean) => void,
  onEnter: () => void,
}

export const DomainNameField = ({
  id,
  name,
  managed,
  locked,
  checking,
  failed,
  reason,
  onNameChange,
  onManagedChange,
  onEnter,
}: DomainNameFieldProps) => {
  const translation = useDomeTranslation()

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onEnter()
    }
  }

  return (
    <div className="flex-col-2">
      {!locked && (
        <LabelledCheckbox
          label={translation('managedDomain')}
          value={managed}
          onValueChange={onManagedChange}
        />
      )}
      <label className="flex-col-1" htmlFor={id}>
        <span className="typography-label-md">{translation('name')}</span>
        {managed ? (
          <span className="flex-row-2 items-center">
            <Input
              id={id}
              value={name}
              disabled={locked}
              onValueChange={onNameChange}
              placeholder="name"
              onKeyDown={onKeyDown}
            />
            <span className="typography-body shrink-0">{`.${managedWebsiteDomain}`}</span>
          </span>
        ) : (
          <Input
            id={id}
            value={name}
            onValueChange={onNameChange}
            placeholder="example.com"
            onKeyDown={onKeyDown}
          />
        )}
      </label>
      {locked && (
        <p className="typography-body text-description">{translation('managedDomainCannotBeEdited')}</p>
      )}
      {checking && (
        <p className="typography-body text-description">{translation('managedDomainChecking')}</p>
      )}
      {failed && (
        <p className="typography-body text-negative">{reason ?? translation('managedDomainUnavailable')}</p>
      )}
    </div>
  )
}
