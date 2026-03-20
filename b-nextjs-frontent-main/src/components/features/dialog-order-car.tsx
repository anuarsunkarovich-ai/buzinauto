import { useAnalytics } from '@/hooks/use-analytics'
import { Dialog, DialogTrigger } from '@radix-ui/react-dialog'
import { FC, useState } from 'react'
import { OrderCarForm } from '../forms/order-car/order-car-form'
import { Button } from '../ui/button'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'

export type DialogOrderCarPropsTypes = {
  renderTrigger?: () => React.ReactNode
}

export const DialogOrderCar: FC<DialogOrderCarPropsTypes> = ({ renderTrigger }) => {
  const [open, setOpen] = useState(false)
  const { triggerFormClick } = useAnalytics()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {renderTrigger ? (
          renderTrigger()
        ) : (
          <Button className="cursor-pointer" onClick={triggerFormClick}>
            Купить автомобиль
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Заказать звонок</DialogTitle>
          <DialogDescription>
            Мы свяжемся с вами в блажащие время, ожидайте звонка
          </DialogDescription>
        </DialogHeader>
        <OrderCarForm onChangeOpen={setOpen} />
      </DialogContent>
    </Dialog>
  )
}
