import type { ReactNode } from 'react'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { websiteContentPreviewUrl } from '@/utils/websiteContent'

type WebsiteSnapshotPreviewProps = {
  websiteId: string,
  selectedId: string,
  mobilePreview: boolean,
  sidebar: ReactNode,
}

export const WebsiteSnapshotPreview = ({
  websiteId,
  selectedId,
  mobilePreview,
  sidebar,
}: WebsiteSnapshotPreviewProps) => {
  const translation = useDomeTranslation()

  return (
    <section className="flex-col-4 desktop:flex-row-4 desktop:items-start grow">
      <div className={mobilePreview ? 'mx-auto w-full max-w-sm min-w-0 grow h-full' : 'min-w-0 grow w-full h-full'}>
        <iframe
          key={selectedId}
          title={translation('editorPreviewFrame')}
          sandbox=""
          src={websiteContentPreviewUrl(websiteId, selectedId)}
          className="h-[36rem] w-full rounded-lg border border-neutral bg-white desktop:h-full"
        />
      </div>
      <div className="w-full shrink-0 desktop:w-80">
        {sidebar}
      </div>
    </section>
  )
}
