import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@helpwave/hightide'
import { deleteDomain } from '@/api/domain'
import type { Domain } from '@/api/types/domain'
import { useDomeTranslation } from '@/i18n/useDomeTranslation'
import { invalidateHostQueries } from '@/utils/hostQueries'

type DeleteDomainDialogProps = {
  domain: Domain,
  isOpen: boolean,
  onClose: () => void,
  onDeleted: () => void,
}

export const DeleteDomainDialog = ({
  domain,
  isOpen,
  onClose,
  onDeleted,
}: DeleteDomainDialogProps) => {
  const translation = useDomeTranslation()
  const queryClient = useQueryClient()

  const remove = useMutation({
    mutationFn: () => deleteDomain(domain.id),
    onSuccess: async () => {
      await invalidateHostQueries(queryClient)
      onDeleted()
    },
  })

  const close = () => {
    if (remove.isPending) {
      return
    }
    remove.reset()
    onClose()
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      isModal
      titleElement={<span className="typography-title-md">{translation('deleteDomainTitle')}</span>}
      description={translation('deleteDomainWarning')}
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
      {remove.isError && (
        <p className="typography-body text-negative" role="alert">{remove.error.message}</p>
      )}
    </ConfirmDialog>
  )
}
