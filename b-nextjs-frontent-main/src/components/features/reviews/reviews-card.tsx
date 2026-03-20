import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import * as React from 'react'

import { Href } from '@/components/ui/href'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

export type ReviewCardPropsTypes = {
  name: string
  avatarURL: string
  shortText: string
  externalLink: string
  countStars?: number
  className?: string
} & Partial<React.ReactPortal>

export const ReviewCard: React.FC<ReviewCardPropsTypes> = ({
  name,
  avatarURL,
  shortText,
  externalLink,
  countStars = 5,
  className = '',
}) => {
  return (
    <Card className={cn('w-full max-w-sm', className)}>
      <CardHeader className="flex space-x-3">
        <Avatar className="max-w-16 rounded-full">
          <AvatarImage src={avatarURL} alt="@shadcn" className="rounded-full" />
          <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col space-y-2">
          <div className="flex flex-col">
            <Text as="span" usingStyleFrom="none">
              {name}
            </Text>
            <Text as="small">Видео-отзыв</Text>
          </div>
          <div className="flex space-x-2">
              {Array.from({ length: countStars || 0 }).map((_, index) => (
                <Star key={index} fill="yellow" className="max-w-3.5" />
              ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Text>{shortText}</Text>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full" asChild>
          <Href href={externalLink} target="_blank">
            Полный отзыв
          </Href>
        </Button>
      </CardFooter>
    </Card>
  )
}
