import type { Domain } from '@/api/types/domain'
import type { Website } from '@/api/types/website'

const previewLimit = 3
const collapsedPreviewCount = 2

export type DeploymentPreview = {
  visible: Domain[],
  hiddenCount: number,
}

export const deploymentPreview = (deployments: Domain[]): DeploymentPreview => {
  if (deployments.length > previewLimit) {
    return {
      visible: deployments.slice(0, collapsedPreviewCount),
      hiddenCount: deployments.length - collapsedPreviewCount,
    }
  }

  return {
    visible: deployments,
    hiddenCount: 0,
  }
}

export const websitesMatchingName = (websites: Website[], query: string): Website[] => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return websites
  }

  return websites.filter((website) => website.name.toLowerCase().includes(normalizedQuery))
}
