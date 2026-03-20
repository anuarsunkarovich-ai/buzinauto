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
import { Textarea } from '@/components/ui/textarea'
import { HOME_PRIVACY } from '@/constants/breadcrumb'
import { createCallbackUserRequest } from '@/lib/services/user-request.service'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlertIcon, CircleUserIcon, Loader2Icon } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { CallbackSchema } from './callback-schema'

export type CallbackFormPropsTypes = {
  onChangeOpen?: (value: boolean) => void
} & Partial<React.ReactPortal>

export const CallbackForm: React.FC<CallbackFormPropsTypes> = ({ onChangeOpen }) => {
  const [loading, setLoading] = React.useState<boolean>(false)
  const form = useForm<z.infer<typeof CallbackSchema>>({
    resolver: zodResolver(CallbackSchema),
  })

  const onSubmit = React.useCallback(
    async (values: z.infer<typeof CallbackSchema>) => {
      if (!values.isPrivacyAllowed) {
        return toast('Примите политику конфиденциальности', {
          icon: <CircleAlertIcon className="text-primary" />,
          position: 'top-center',
        })
      }
      setLoading(true)
      await createCallbackUserRequest(values.name, values.phone, values.email, values.issue)
      setLoading(false)
      if (onChangeOpen) onChangeOpen(false)
      toast('Ожидайте ответа на почту', {
        icon: <CircleUserIcon className="text-green-600" />,
        position: 'top-center',
      })
    },
    [onChangeOpen, setLoading],
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Электронная почта</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="natalia@buzinavto.ru"
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
          name="issue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ваш вопрос</FormLabel>
              <FormControl>
                <Textarea placeholder="Ваш вопрос" onChange={field.onChange} value={field.value} />
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
