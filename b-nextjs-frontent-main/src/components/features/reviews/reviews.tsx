import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import * as React from 'react'
import { ReviewCard } from './reviews-card'
import { getManyReviewCards } from '@/lib/query/query-promise'

export type ReviewsPropsTypes = {} & Partial<React.ReactPortal>

export const Reviews: React.FC<ReviewsPropsTypes> = async () => {

  const { docs } = await getManyReviewCards()
  
  const reviewCards = docs.map((card) => ({
    id: card.id,
    name: card.name,
    shortText: card.shortText,
    avatarURL: typeof card.images === 'string' ? card.images : card.images.url || '',
    externalLink: card.externalLink,
    countStars: card.countStars,
  }))

  return (
    <Carousel
      opts={{
        align: 'center',
        loop: true,
      }}
      className="w-full justify-center"
    >
      <CarouselContent className="-ml-5 w-full">
        {reviewCards.map(({ id, ...card }) => (
          <CarouselItem key={id} className="max-w-fit pl-5">
            <ReviewCard
              className="h-full justify-between select-none"
              name={card.name}
              externalLink={card.externalLink}
              shortText={card.shortText}
              avatarURL={card.avatarURL}
              countStars={card.countStars || 5}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-0" />
      <CarouselNext className="-right-0" />
    </Carousel>
  )
}
