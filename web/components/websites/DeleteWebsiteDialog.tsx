import { useState } from 'react'
import { useRouter } from 'next/router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog, IconButton } from '@helpwave/hightide'
import { PencilIcon } from 'lucide-react'
import { useDomainsQuery } from '@/api/domain'
import type { Domain } from '@/api/types/domain'
import type { Website } from '@/api/types/website'
import { deleteWebsite } from '@/api/website'
import { EditDomainDialog } from '@/components/domains/EditDomainDialog'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { domainLabel } from '@/utils/domains'
import { invalidateHostQueries } from '@/utils/hostQueries'

type DeleteWebsiteDialogProps = {
  website: Website,
  isOpen: boolean,
  onClose: () => void,
  onDeleted: () => void,
}

export const DeleteWebsiteDialog = ({
  website,
  isOpen,
  onClose,
  onDeleted,
}: DeleteWebsiteDialogProps) => {
  const translation = useDomeTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const domainsQuery = useDomainsQuery()
  const [editingDomain, setEditingDomain] = useState<Domain | undefined>()
  const affectedDomains = (domainsQuery.data ?? website.domains)
    .filter((domain) => domain.website_id === website.id)

  const remove = useMutation({
    mutationFn: () => deleteWebsite(website.id),
    onSuccess: async () => {
      await invalidateHostQueries(queryClient)
      if (router.query['id'] === website.id && router.pathname.startsWith('/website/')) {
        await router.push('/websites')
      }
      onDeleted()
    },
  })

  const close = () => {
    if (remove.isPending) {
      return
    }
    remove.reset()
    setEditingDomain(undefined)
    onClose()
  }

  return (
    <>
      <ConfirmDialog
        isOpen={isOpen}
        isModal
        titleElement={<span className="typography-title-md">{translation('deleteWebsiteTitle')}</span>}
        description={affectedDomains.length > 0
          ? translation('deleteWebsiteDomains')
          : translation('deleteWebsiteBody')}
        confirmType="negative"
        onCancel={close}
        onConfirm={() => {
          if (!remove.isPending) {
            remove.mutate()
          }
        }}
        buttonOverwrites={[
          { text: translation('cancel'), disabled: remove.isPending },
          {},
          { text: translation('delete'), disabled: remove.isPending },
        ]}
      >
        {affectedDomains.length > 0 && (
          <ul className="flex-col-2">
            {affectedDomains.map((domain) => (
              <li key={domain.id} className="flex-row-2 items-center justify-between gap-2">
                <span className="typography-body min-w-0 truncate">{domainLabel(domain)}</span>
                <IconButton
                  size="sm"
                  color="primary"
                  coloringStyle="text"
                  tooltip={translation('editDomain')}
                  aria-label={translation('editDomain')}
                  onClick={() => setEditingDomain(domain)}
                >
                  <PencilIcon className="size-5" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
        {remove.isError && (
          <p className="typography-body text-negative" role="alert">{remove.error.message}</p>
        )}
      </ConfirmDialog>
      {editingDomain && (
        <EditDomainDialog
          domain={editingDomain}
          isOpen
          onClose={() => setEditingDomain(undefined)}
        />
      )}
    </>
  )
}
