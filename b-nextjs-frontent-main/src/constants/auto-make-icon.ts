import {
  BMWIcon,
  HondaIcon,
  LexusIcon,
  MercedesBenzIcon,
  NissanIcon,
  ToyotaIcon,
} from '@/components/ui/icons'
import { FerrariIcon } from '@/components/ui/icons/ferrari-icon'
import { LamborghiniIcon } from '@/components/ui/icons/lamborghini-icon'
import { MitsubishiIcon } from '@/components/ui/icons/mitsubishi-icon'
import { SubaruIcon } from '@/components/ui/icons/subaru-icon'

export const CAR_BRAND_ICON = [
  {
    logo: LamborghiniIcon,
    label: 'Lamborghini ',
    url: '/japan/cars/lamborghini',
  },
  {
    logo: MitsubishiIcon,
    label: 'Mitsubishi ',
    url: '/japan/cars/mitsubishi',
  },
  {
    logo: SubaruIcon,
    label: 'Subaru ',
    url: '/japan/cars/subaru',
  },
  {
    logo: FerrariIcon,
    label: 'Ferrari',
    url: '/japan/cars/ferrari',
  },
  {
    logo: BMWIcon,
    label: 'BMW',
    url: '/japan/cars/bmw',
  },
  {
    logo: HondaIcon,
    label: 'Honda',
    url: '/japan/cars/honda',
  },
  {
    logo: LexusIcon,
    label: 'Lexus',
    url: '/japan/cars/lexus',
  },
  {
    logo: NissanIcon,
    label: 'Nissan',
    url: '/japan/cars/nissan',
  },
  {
    logo: ToyotaIcon,
    label: 'Toyota',
    url: '/japan/cars/toyota',
  },
  {
    logo: MercedesBenzIcon,
    label: 'Mercedes',
    url: '/japan/cars/mercedes-benz',
  },
] as const
