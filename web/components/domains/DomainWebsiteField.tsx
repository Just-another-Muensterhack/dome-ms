import { useState } from 'react'
import { IconButton, Select } from '@helpwave/hightide'
import { Plus } from 'lucide-react'
import { useWebsites } from '@/api/website'
import { AddWebsiteDialog } from '@/components/websites/AddWebsiteDialog'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'

type DomainWebsiteFieldProps = {
  websiteId: string,
  onWebsiteIdChange: (websiteId: string) => void,
}

export const DomainWebsiteField = ({
  websiteId,
  onWebsiteIdChange,
}: DomainWebsiteFieldProps) => {
  const translation = useDomeTranslation()
  const websites = useWebsites()
  const websiteOptions = websites.data ?? []
  const hasNoWebsites = websites.isSuccess && websiteOptions.length === 0
  const [isAddWebsiteOpen, setIsAddWebsiteOpen] = useState(false)

  return (
    <div className="flex-col-1">
      <span className="typography-label-md">{translation('website')}</span>
      {hasNoWebsites ? (
        <div className="flex-row-2 items-center">
          <span className="typography-body min-w-0 grow">{translation('noWebsite')}</span>
          <IconButton
            size="sm"
            color="primary"
            coloringStyle="text"
            className="shrink-0"
            tooltip={translation('addWebsite')}
            aria-label={translation('addWebsite')}
            onClick={() => setIsAddWebsiteOpen(true)}
          >
            <Plus className="size-5" />
          </IconButton>
        </div>
      ) : (
        <Select
          value={websiteId.length > 0 ? websiteId : undefined}
          onValueChange={(value) => onWebsiteIdChange(value ?? '')}
          placeholder={translation('selectWebsite')}
        >
          <Select.Option value="" label={translation('noWebsite')}>
            {translation('noWebsite')}
          </Select.Option>
          {websiteOptions.map((website) => (
            <Select.Option key={website.id} value={website.id} label={website.name}>
              {website.name}
            </Select.Option>
          ))}
        </Select>
      )}
      <AddWebsiteDialog
        isOpen={isAddWebsiteOpen}
        onClose={() => setIsAddWebsiteOpen(false)}
        onCreated={(website) => onWebsiteIdChange(website.id)}
      />
    </div>
  )
}
