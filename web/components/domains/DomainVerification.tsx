import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Chip, Expandable } from '@helpwave/hightide'
import { verifyDomain } from '@/api/domain'
import type { Domain } from '@/api/types/domain'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { invalidateHostQueries } from '@/utils/hostQueries'
import { isDomainVerified } from '@/utils/domains'

type DomainVerificationProps = {
  domain: Domain,
}

export const DomainVerification = ({
  domain,
}: DomainVerificationProps) => {
  const translation = useDomeTranslation()
  const queryClient = useQueryClient()
  const [current, setCurrent] = useState(domain)
  const verified = isDomainVerified(current)

  const verify = useMutation({
    mutationFn: () => verifyDomain(current.id),
    onSuccess: async (next) => {
      setCurrent(next)
      await invalidateHostQueries(queryClient)
    },
  })

  const statusLabel = verified ? translation('verified') : translation('unverified')

  return (
    <Expandable
      contentExpandedClassName="max-h-none h-auto"
      trigger={(
        <span className="flex-row-2 items-center min-w-0">
          <span className="typography-label-md">{translation('verifyDomain')}</span>
          <Chip
            color={verified ? 'positive' : 'neutral'}
            coloringStyle="tonal"
            size="sm"
          >
            {statusLabel}
          </Chip>
        </span>
      )}
    >
      <div className="flex-col-2">
        <p className="typography-body">
          <span className="text-description">{translation('status')}</span>
          {' '}
          {statusLabel}
        </p>
        <div className="flex-col-1">
          <span className="typography-label-md">{translation('challengeUrl')}</span>
          <span className="typography-body break-all">{current.record_name}</span>
        </div>
        <div className="flex-col-1">
          <span className="typography-label-md">{translation('challengeHash')}</span>
          <span className="typography-body break-all">{current.record_value}</span>
        </div>
        <Button
          type="button"
          color="neutral"
          coloringStyle="outline"
          className="self-start"
          disabled={verify.isPending}
          onClick={() => verify.mutate()}
        >
          {translation('testAgain')}
        </Button>
        {verify.isError && (
          <p className="typography-body text-negative">{verify.error.message}</p>
        )}
      </div>
    </Expandable>
  )
}
