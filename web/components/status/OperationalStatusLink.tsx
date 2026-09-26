import { statusPageUrl, useSystemStatus } from '@/api/status'

type OperationalStatusLinkProps = {
  label: string,
  appearance: 'landing' | 'dashboard',
}

const classNameFor = {
  landing: 'status',
  dashboard: 'inline-flex w-fit items-center gap-2 rounded-full bg-surface px-3 py-1.5 typography-label text-positive transition-colors hover:bg-surface-variant',
} as const

const dotClassNameFor = {
  landing: 'status-dot',
  dashboard: 'size-2 shrink-0 rounded-full bg-positive',
} as const

export const OperationalStatusLink = ({
  label,
  appearance,
}: OperationalStatusLinkProps) => {
  const status = useSystemStatus()

  if (status.data?.operational !== true) {
    return null
  }

  return (
    <a href={statusPageUrl} target="_blank" rel="noopener noreferrer" className={classNameFor[appearance]}>
      <span className={dotClassNameFor[appearance]} aria-hidden="true" />
      {label}
    </a>
  )
}
