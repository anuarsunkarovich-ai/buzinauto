export const AUCTION = {
  JAPANESE: 'Japanese',
  CHINESE: 'Chinese',
}

export const AUCTION_KEY = Object.keys(AUCTION) as Array<keyof typeof AUCTION>

export const AUCTION_ARRAY = Object.entries(AUCTION).map(([key, value]) => ({
  id: key,
  name: value,
})) as Array<{ id: keyof typeof AUCTION; name: string }>
