import { useAtomValue, useSetAtom } from 'jotai'
import {
  dtfSettingsProposalCalldatasAtom,
  isProposalConfirmedAtom,
  proposalDescriptionAtom,
} from '../atoms'
import ProposalDescriptionForm from '@/components/governance/proposal-description-form'
import { useEffect } from 'react'
import { indexDTFAtom } from '@/state/dtf/atoms'
import DTFSettingsProposalPreview from './dtf-settings-proposal-preview'

const ProposalDescription = () => {
  const setDescription = useSetAtom(proposalDescriptionAtom)
  const setConfirmed = useSetAtom(isProposalConfirmedAtom)

  useEffect(() => {
    return () => {
      setDescription(undefined)
    }
  }, [])

  return (
    <ProposalDescriptionForm
      onChange={setDescription}
      onBack={() => setConfirmed(false)}
    />
  )
}

const ProposalPreview = () => {
  const calldatas = useAtomValue(dtfSettingsProposalCalldatasAtom)
  // Should always be set at this stage
  const vaultAddress = useAtomValue(indexDTFAtom)?.stToken?.id ?? '0x'

  return (
    <div className="bg-background rounded-4xl">
      <DTFSettingsProposalPreview
        calldatas={calldatas}
        address={vaultAddress}
      />
    </div>
  )
}

const ConfirmVaultProposal = () => {
  return (
    <div className="flex flex-col gap-1 bg-secondary rounded-3xl p-1">
      <ProposalDescription />
      <ProposalPreview />
    </div>
  )
}

export default ConfirmVaultProposal
