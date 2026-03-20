'use client'

import { Dialog, DialogTrigger } from '@radix-ui/react-dialog'
import { FC, ReactPortal, useState } from 'react'
import { CallbackForm } from '../forms/callback/callback-form'
import { Button } from '../ui/button'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'

export type DialogCallbackCarPropsTypes = {} & Partial<ReactPortal>

export const DialogCallbackCar: FC<DialogCallbackCarPropsTypes> = () => {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">Задать вопрос</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Обратная связь</DialogTitle>
          <DialogDescription>
            Мы свяжемся с вами в блажащие время, ожидайте звонка
          </DialogDescription>
        </DialogHeader>
        <CallbackForm onChangeOpen={setOpen} />
      </DialogContent>
    </Dialog>
  )
}
