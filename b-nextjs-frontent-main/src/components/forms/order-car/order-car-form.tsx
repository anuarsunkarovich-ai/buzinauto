import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Href } from '@/components/ui/href'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HOME_PRIVACY } from '@/constants/breadcrumb'
import { useAnalytics } from '@/hooks/use-analytics'
import { createUserCarRequest } from '@/lib/services/user-request.service'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlertIcon, CircleUserIcon, Loader2Icon } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { OrderCarSchema } from './order-car-schema'

export type OrderCarFormPropsTypes = {
  onChangeOpen?: (value: boolean) => void
} & Partial<React.ReactPortal>

export const OrderCarForm: React.FC<OrderCarFormPropsTypes> = ({ onChangeOpen }) => {
  const { sendForm } = useAnalytics()

  const [loading, setLoading] = React.useState<boolean>(false)
  const form = useForm<z.infer<typeof OrderCarSchema>>({
    resolver: zodResolver(OrderCarSchema),
  })

  const onSubmit = React.useCallback(
    async (values: z.infer<typeof OrderCarSchema>) => {
      if (!values.isPrivacyAllowed) {
        return toast('Примите политику конфиденциальности', {
          icon: <CircleAlertIcon className="text-primary" />,
          position: 'top-center',
        })
      }
      setLoading(true)
      await createUserCarRequest(values.name, values.phone, values.auto)
      sendForm()
      setLoading(false)
      if (onChangeOpen) onChangeOpen(false)
      toast('Ожидайте звонка от менеджера', {
        icon: <CircleUserIcon className="text-green-600" />,
        position: 'top-center',
      })
    },
    [sendForm, onChangeOpen],
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имя</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Наталья"
                  onChange={field.onChange}
                  value={field.value}
                  autoComplete="name"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Номер телефона</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+79028738888"
                  onChange={field.onChange}
                  value={field.value}
                  autoComplete="tel"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="auto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Какой авто интересует?</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Mercedes Benz CLA 180"
                  onChange={field.onChange}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isPrivacyAllowed"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="cursor-pointer"
                    id="terms"
                    onCheckedChange={field.onChange}
                    checked={field.value}
                  />
                  <Label className="cursor-pointer" htmlFor="terms">
                    Я согласен с
                    <Href
                      target="_blank"
                      className="font-medium underline underline-offset-4"
                      href={HOME_PRIVACY.path}
                    >
                      политикой конфиденциальности
                    </Href>
                  </Label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="col-start-2" disabled={loading}>
          {loading && <Loader2Icon className="animate-spin" />}
          Заказать звонок
        </Button>
      </form>
    </Form>
  )
}
