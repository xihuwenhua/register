import {
  balancesAtom,
  chainIdAtom,
  TokenBalance,
  walletAtom,
} from '@/state/atoms'
import { Token } from '@/types'
import {
  ZapDeployBody,
  ZapDeployUngovernedBody,
} from '@/views/yield-dtf/issuance/components/zapV2/api/types'
import { reducedZappableTokens } from '@/views/yield-dtf/issuance/components/zapV2/constants'
import { atom } from 'jotai'
import { atomWithReset } from 'jotai/utils'
import { Address, parseEther, parseUnits } from 'viem'
import { basketAtom, daoTokenAddressAtom } from '../../../atoms'
import { calculateRevenueDistribution } from '../../../utils'
import { indexDeployFormDataAtom } from '../atoms'
import { basketRequiredAmountsAtom } from '../manual/atoms'
import { PriceControl } from '@reserve-protocol/dtf-rebalance-lib'

export const inputTokenAtom = atom<Token | undefined>(undefined)
export const inputAmountAtom = atomWithReset<string>('')
export const slippageAtom = atomWithReset<string>('100')

export const defaultInputTokenAtom = atom<Token>((get) => {
  const chainId = get(chainIdAtom)
  return reducedZappableTokens[chainId][0]
})

export const inputBalanceAtom = atom<TokenBalance | undefined>((get) => {
  const balances = get(balancesAtom)
  const token = get(inputTokenAtom) || get(defaultInputTokenAtom)
  return balances[token.address]
})

export const tokensAtom = atom<(Token & { balance?: string })[]>((get) => {
  const chainId = get(chainIdAtom)
  const balances = get(balancesAtom)
  return reducedZappableTokens[chainId].map((token) => ({
    ...token,
    balance: balances[token.address]?.balance,
  }))
})

export const ongoingTxAtom = atom<boolean>(false)

export const zapDeployPayloadAtom = atom<
  ZapDeployBody | ZapDeployUngovernedBody | undefined
>((get) => {
  const tokenIn = get(inputTokenAtom) || get(defaultInputTokenAtom)
  const amountIn = get(inputAmountAtom)
  const formData = get(indexDeployFormDataAtom)
  const tokenAmounts = get(basketRequiredAmountsAtom)
  const stToken = get(daoTokenAddressAtom)
  const basket = get(basketAtom)
  const wallet = get(walletAtom)
  const slippage = get(slippageAtom)

  if (!formData || !wallet || !Number(amountIn)) {
    return undefined
  }

  const commonZapParams = {
    tokenIn: tokenIn.address,
    amountIn: parseUnits(amountIn, tokenIn.decimals).toString(),
    signer: wallet,
    slippage: slippage ? 1 / Number(slippage) : undefined,
  }

  const basicDetails = {
    name: formData.tokenName,
    symbol: formData.symbol,
    assets: basket.map((token) => token.address),
    amounts: basket.map((token) =>
      parseUnits(
        tokenAmounts[token.address].toFixed(token.decimals),
        token.decimals
      ).toString()
    ),
  }

  const additionalDetails = {
    auctionLength: Math.floor((formData.auctionLength || 0) * 60).toString(),
    feeRecipients: calculateRevenueDistribution(formData, wallet, stToken).map(
      ({ recipient, portion }) => ({ recipient, portion: portion.toString() })
    ),
    tvlFee: parseEther(((formData.folioFee || 0) / 100).toString()).toString(),
    mintFee: parseEther(((formData.mintFee || 0) / 100).toString()).toString(),
    mandate: formData.mandate || '',
  }

  const guardians = formData.guardians.filter(Boolean) as Address[]
  const brandManagers = formData.brandManagers.filter(Boolean) as Address[]
  const auctionLaunchers = formData.auctionLaunchers.filter(
    Boolean
  ) as Address[]
  const basketManagers = [] as Address[]

  const folioFlags = {
    trustedFillerEnabled: true,
    rebalanceControl: {
      weightControl: formData.weightControl, // false -> tracking / true -> native
      priceControl: PriceControl.PARTIAL,
    },
  }

  // Ungoverned DTF
  if (!stToken) {
    const owner = formData.governanceWalletAddress
    if (!owner) return undefined

    return {
      ...commonZapParams,
      owner,
      basicDetails,
      additionalDetails,
      folioFlags,
      basketManagers,
      auctionLaunchers,
      brandManagers,
    }
  }

  // Governed DTF
  const ownerGovParams = {
    votingDelay: Math.floor(
      (formData.governanceVotingDelay || 0) * 86400
    ).toString(),
    votingPeriod: Math.floor(
      (formData.governanceVotingPeriod || 0) * 86400
    ).toString(),
    proposalThreshold: parseEther(
      ((formData.governanceVotingThreshold || 0) / 100).toString()
    ).toString(),
    quorumThreshold: parseEther(
      ((formData.governanceVotingQuorum || 0) / 100).toString()
    ).toString(),
    timelockDelay: Math.floor(
      (formData.governanceExecutionDelay || 0) * 86400
    ).toString(),
    guardians,
  }

  const tradingGovParams = {
    votingDelay: Math.floor(
      (formData.basketVotingDelay || 0) * 3600
    ).toString(),
    votingPeriod: Math.floor(
      (formData.basketVotingPeriod || 0) * 3600
    ).toString(),
    proposalThreshold: parseEther(
      ((formData.basketVotingThreshold || 0) / 100).toString()
    ).toString(),
    quorumThreshold: parseEther(
      ((formData.basketVotingQuorum || 0) / 100).toString()
    ).toString(),
    timelockDelay: Math.floor(
      (formData.basketExecutionDelay || 0) * 3600
    ).toString(),
    guardians,
  }

  return {
    ...commonZapParams,
    stToken,
    basicDetails,
    additionalDetails,
    folioFlags,
    ownerGovParams,
    tradingGovParams,
    basketManagers,
    auctionLaunchers,
    brandManagers,
  }
})
