import TokenLogo from '@/components/token-logo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { indexDTFAtom, indexDTFBrandAtom } from '@/state/dtf/atoms'
import { ROUTES } from '@/utils/constants'
import { t } from '@lingui/macro'
import { useAtomValue } from 'jotai'
import {
  Globe,
  Blend,
  Landmark,
  ArrowLeftRight,
  Fingerprint,
  ChevronDown,
  Wallet,
  Wallet2,
  CirclePlus,
} from 'lucide-react'
import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { Address } from 'viem'
import { useAccount, useWatchAsset } from 'wagmi'

const NavigationItem = ({
  icon,
  label,
  route,
}: {
  icon: React.ReactNode
  label: string
  route: string
}) => {
  return (
    <NavLink to={route}>
      {({ isActive }) => (
        <div
          className={cn(
            'flex items-center transition-all rounded-full gap-2  hover:text-primary',
            isActive
              ? 'text-primary bg-primary/10 md:bg-transparent'
              : 'text-text'
          )}
        >
          {/* <div
            className={cn(
              'flex items-center justify-center rounded-full h-6 w-6 border border-border',
              isActive ? 'bg-primary/10' : 'bg-border'
            )}
          > */}
          <div className="h-10 w-10 md:h-6 md:w-6 flex items-center justify-center">
            {icon}
          </div>
          {/* </div> */}
          <div className="text-base hidden md:block">{label}</div>
        </div>
      )}
    </NavLink>
  )
}

const NavigationHeader = () => {
  const indexDTF = useAtomValue(indexDTFAtom)
  const brand = useAtomValue(indexDTFBrandAtom)
  const { address: walletAddress, chainId } = useAccount()
  const { watchAsset } = useWatchAsset()

  const handleWatchAsset = () => {
    if (!indexDTF || !walletAddress) return

    watchAsset({
      type: 'ERC20',
      options: {
        address: indexDTF.id as Address,
        symbol: indexDTF.token.symbol,
        decimals: indexDTF.token.decimals,
      },
    })
  }

  return (
    <div className="items-center gap-2 hidden lg:flex">
      <TokenLogo
        src={brand?.dtf?.icon || undefined}
        alt={indexDTF?.token.symbol ?? 'dtf token logo'}
        size="lg"
      />
      <div className="text-base font-semibold truncate">
        {indexDTF?.token.symbol}
      </div>
      {!!walletAddress && !!indexDTF && chainId === indexDTF.chainId && (
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto relative"
          onClick={handleWatchAsset}
        >
          <Wallet2 strokeWidth={1.5} size={16} />
          <CirclePlus
            strokeWidth={1.5}
            size={12}
            className="absolute bottom-2 right-1 bg-background"
          />
        </Button>
      )}
    </div>
  )
}

const NavigationItems = () => {
  const dtf = useAtomValue(indexDTFAtom)

  const items = useMemo(
    () => [
      {
        icon: <Globe strokeWidth={1.5} size={16} />,
        label: t`Overview`,
        route: ROUTES.OVERVIEW,
      },
      {
        icon: <Blend strokeWidth={1.5} size={16} />,
        label: t`Mint + Redeem`,
        route: ROUTES.ISSUANCE,
      },
      {
        icon: <Landmark strokeWidth={1.5} size={16} />,
        label: t`Governance`,
        route: ROUTES.GOVERNANCE,
      },
      {
        icon: <ArrowLeftRight strokeWidth={1.5} size={16} />,
        label: t`Auctions`,
        route: ROUTES.AUCTIONS,
      },
      {
        icon: <Fingerprint strokeWidth={1.5} size={16} />,
        label: t`Details + Roles`,
        route: ROUTES.SETTINGS,
      },
    ],
    [dtf?.token.symbol]
  )

  return (
    <div className="flex lg:flex-col gap-5 justify-evenly lg:justify-start">
      {items.map((item) => (
        <NavigationItem key={item.route} {...item} />
      ))}
    </div>
  )
}

const IndexDTFNavigation = () => {
  return (
    <div className="w-full lg:sticky lg:top-0 p-3 md:p-6 fixed bottom-0 border-t lg:border-t-0 lg:w-56 flex-shrink-0 bg-background z-[1] h-16 lg:h-full">
      <div className="sticky top-6">
        <NavigationHeader />
        <Separator className="my-4 hidden lg:block" />
        <NavigationItems />
      </div>
    </div>
  )
}

export default IndexDTFNavigation
