import { useState } from 'react'
import { Button, Dialog } from '@helpwave/hightide'
import type { Domain } from '@/api/types/domain'
import { WebsiteUrlLink } from '@/components/websites/WebsiteUrlLink'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { domainLabel } from '@/utils/domains'
import { deploymentPreview } from '@/utils/websites'

type WebsiteDeploymentsProps = {
  websiteName: string,
  deployments: Domain[],
}

const deploymentUrl = (domain: Domain): string => `https://${domain.name}`

export const WebsiteDeployments = ({
  websiteName,
  deployments,
}: WebsiteDeploymentsProps) => {
  const translation = useDomeTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const preview = deploymentPreview(deployments)

  if (deployments.length === 0) {
    return (
      <p className="typography-body text-description">{translation('noDeployments')}</p>
    )
  }

  return (
    <div className="flex-col-2">
      {preview.visible.map((deployment) => (
        <WebsiteUrlLink key={deployment.id} url={deploymentUrl(deployment)} label={domainLabel(deployment)} />
      ))}
      {preview.hiddenCount > 0 && (
        <Button
          type="button"
          size="sm"
          color="primary"
          coloringStyle="text"
          className="self-start"
          onClick={() => setIsOpen(true)}
        >
          {translation('moreCount', { count: String(preview.hiddenCount) })}
        </Button>
      )}
      <Dialog
        isOpen={isOpen}
        isModal
        titleElement={<span className="typography-title-md">{websiteName}</span>}
        description={translation('deploymentUrlsFor', { name: websiteName })}
        onClose={() => setIsOpen(false)}
      >
        <div className="flex-col-2">
          {deployments.map((deployment) => (
            <WebsiteUrlLink key={deployment.id} url={deploymentUrl(deployment)} label={domainLabel(deployment)} />
          ))}
        </div>
      </Dialog>
    </div>
  )
}
