import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InfoIcon } from 'lucide-react'
import * as React from 'react'

export type DialogDetailedCarTooltipPropsTypes = {
  tip: string
}

export const DialogDetailedCarTooltip: React.FC<DialogDetailedCarTooltipPropsTypes> = ({ tip }) => {
  const [openTip, setOpenTip] = React.useState<boolean>(false)

  const handler = React.useCallback(() => {
    setOpenTip((e) => !e)
  }, [])

  const onOpenChange = React.useCallback((value: boolean) => {
    if (!value) setOpenTip(false)
  }, [])

  return (
    <Tooltip open={openTip} onOpenChange={onOpenChange}>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9" onClick={handler}>
          <InfoIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="mr-4">
        <Text as="p" className="max-w-64 text-center">
          {tip}
        </Text>
      </TooltipContent>
    </Tooltip>
  )
}
