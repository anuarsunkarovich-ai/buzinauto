/* eslint-disable react-hooks/incompatible-library */
'use client'

import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox/combobox'
import { ExtendedCombobox } from '@/components/ui/combobox/extended-combobox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input, InputNumber } from '@/components/ui/input'
import { Countries, Country, CountryPathname, CountryPathnameDefault } from '@/constants/country'
import { Ratings } from '@/constants/rating'
import { useBrands } from '@/hooks/use-brands'
import { useCurrency } from '@/hooks/use-currency'
import { useModels } from '@/hooks/use-models'
import { useBodyTypes } from '@/hooks/use-body-types'
import { toModelDisplay, toUrlSlug } from '@/lib/transform'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'
import {
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  useForm,
  UseFormStateReturn,
} from 'react-hook-form'
import { z } from 'zod'
import { filterAutoSchema } from './filter-auto-schema'

export type FilterAutoPropsTypes = {
  defaultValues?: Partial<Record<keyof z.infer<typeof filterAutoSchema>, string>>
  onSearch?: (values: z.infer<typeof filterAutoSchema>) => void | Promise<void>
} & Partial<React.ReactPortal>

export type RenderArgs<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  field: ControllerRenderProps<TFieldValues, TName>
  fieldState: ControllerFieldState
  formState: UseFormStateReturn<TFieldValues>
}

const normalizeOptionValue = (value?: string) => toUrlSlug(value || '')

export const FilterAuto: React.FC<FilterAutoPropsTypes> = ({
  defaultValues,
  onSearch,
}) => {
  const pathname = usePathname()
  const router = useRouter()

  const form = useForm<any>({
    resolver: zodResolver(filterAutoSchema),
    defaultValues: {
      make: defaultValues?.make,
      body: defaultValues?.body,
      model: defaultValues?.model,
      maxYear: defaultValues?.maxYear ? parseInt(defaultValues.maxYear) : undefined,
      minYear: defaultValues?.minYear ? parseInt(defaultValues.minYear) : undefined,
      maxEnginePower: defaultValues?.maxEnginePower
        ? parseInt(defaultValues.maxEnginePower)
        : undefined,
      minEnginePower: defaultValues?.minEnginePower
        ? parseInt(defaultValues.minEnginePower)
        : undefined,
      maxMileageKm: defaultValues?.maxMileageKm ? parseInt(defaultValues.maxMileageKm) : undefined,
      minMileageKm: defaultValues?.minMileageKm ? parseInt(defaultValues.minMileageKm) : undefined,
      minPrice: defaultValues?.minPrice ? parseInt(defaultValues.minPrice) : undefined,
      maxPrice: defaultValues?.maxPrice ? parseInt(defaultValues.maxPrice) : undefined,
      auctionDate: defaultValues?.auctionDate,
      rating: defaultValues?.rating,
      saleCountry:
        (defaultValues?.saleCountry as Country) ||
        CountryPathname.find((e) => pathname.includes(e.pathname))?.country ||
        CountryPathnameDefault,
    },
  })

  const selectedMake = form.watch('make')
  const selectedModel = form.watch('model')
  const previousSelectedMakeRef = React.useRef<string | undefined>(defaultValues?.make)

  const [brandSearchQuery, setBrandSearchQuery] = React.useState('')
  const [modelSearchQuery, setModelSearchQuery] = React.useState('')

  const {
    brands,
    loading: brandsLoading,
    hasNext: brandsHasNext,
    loadMore: loadMoreBrands,
  } = useBrands(brandSearchQuery, form.watch('saleCountry'))

  const resolvedSelectedMake = React.useMemo(() => {
    if (!selectedMake) return ''
    const match = brands.find(
      (brand) =>
        brand.brand === selectedMake ||
        brand.brandName === selectedMake ||
        toUrlSlug(brand.brand) === toUrlSlug(selectedMake) ||
        toUrlSlug(brand.brandName) === toUrlSlug(selectedMake),
    )
    return match?.brand || selectedMake
  }, [brands, selectedMake])

  const {
    models,
    loading: modelsLoading,
    hasNext: modelsHasNext,
    loadMore: loadMoreModels,
  } = useModels(resolvedSelectedMake, modelSearchQuery, form.watch('saleCountry'), !!resolvedSelectedMake)

  React.useEffect(() => {
    const previousSelectedMake = previousSelectedMakeRef.current
    const normalizedCurrentMake = normalizeOptionValue(selectedMake)
    const normalizedPreviousMake = normalizeOptionValue(previousSelectedMake)
    const normalizedDefaultMake = normalizeOptionValue(defaultValues?.make)

    previousSelectedMakeRef.current = selectedMake

    if (!selectedMake || !previousSelectedMake) {
      return
    }

    if (normalizedCurrentMake === normalizedPreviousMake) {
      return
    }

    if (normalizedCurrentMake === normalizedDefaultMake) {
      return
    }

    if (normalizedPreviousMake === normalizedDefaultMake && !selectedModel) {
      return
    }

    if (selectedModel) {
      form.setValue('model', '')
      setModelSearchQuery('')
    }
  }, [defaultValues?.make, form, selectedMake, selectedModel])

  // Clear body field when model changes
  React.useEffect(() => {
    const currentBody = form.getValues('body')
    if (currentBody && !selectedModel) {
      form.setValue('body', '')
    }
  }, [selectedModel, form])

  const brandOptions = React.useMemo(
    () =>
      brands.map((brand) => ({
        id: brand.brand,
        name: brand.brandName || toModelDisplay(brand.brand),
      })),
    [brands],
  )

  const modelOptions = React.useMemo(
    () =>
      models.map((model) => ({
        id: model.modelSlug || model.model,
        name: model.modelDisplay || model.model,
        slug: model.modelSlug,
      })),
    [models],
  )

  const resolvedSelectedModel = React.useMemo(() => {
    if (!selectedModel) return ''
    const match = models.find(
      (model) =>
        model.model === selectedModel ||
        model.modelSlug === selectedModel ||
        model.modelDisplay === selectedModel ||
        toUrlSlug(model.model) === toUrlSlug(selectedModel) ||
        toUrlSlug(model.modelDisplay) === toUrlSlug(selectedModel) ||
        toUrlSlug(model.modelSlug) === toUrlSlug(selectedModel),
    )
    return match?.modelSlug || match?.model || selectedModel
  }, [models, selectedModel])

  const {
    bodyTypes,
    loading: bodyTypesLoading,
  } = useBodyTypes(resolvedSelectedMake, resolvedSelectedModel, form.watch('saleCountry'), !!resolvedSelectedMake && !!resolvedSelectedModel)

  const bodyOptions = React.useMemo(
    () =>
      bodyTypes.map((bodyType: any) => ({
        id: bodyType.body,
        name: bodyType.body,
      })),
    [bodyTypes],
  )

  React.useEffect(() => {
    if (!defaultValues?.make || !brands.length) return

    const normalizedDefaultMake = toUrlSlug(defaultValues.make)
    const resolvedBrand = brands.find((brand) => {
      return (
        toUrlSlug(brand.brand) === normalizedDefaultMake ||
        toUrlSlug(brand.brandName) === normalizedDefaultMake
      )
    })

    if (resolvedBrand && selectedMake !== resolvedBrand.brand) {
      form.setValue('make', resolvedBrand.brand)
    }
  }, [brands, defaultValues?.make, form, selectedMake])

  React.useEffect(() => {
    if (!defaultValues?.model || !models.length) return

    const normalizedDefaultModel = toUrlSlug(defaultValues.model)
    const resolvedModel = models.find((model) => {
      return (
        toUrlSlug(model.model) === normalizedDefaultModel ||
        toUrlSlug(model.modelDisplay) === normalizedDefaultModel ||
        toUrlSlug(model.modelSlug) === normalizedDefaultModel
      )
    })

    if (resolvedModel && selectedModel !== resolvedModel.modelSlug) {
      form.setValue('model', resolvedModel.modelSlug || resolvedModel.model)
    }
  }, [defaultValues?.model, form, models, selectedModel])

  React.useEffect(() => {
    if (resolvedSelectedMake && selectedMake !== resolvedSelectedMake) {
      form.setValue('make', resolvedSelectedMake)
    }
  }, [form, resolvedSelectedMake, selectedMake])

  React.useEffect(() => {
    if (resolvedSelectedModel && selectedModel !== resolvedSelectedModel) {
      form.setValue('model', resolvedSelectedModel)
    }
  }, [form, resolvedSelectedModel, selectedModel])

  const { convert } = useCurrency()

  const onSubmit = React.useCallback(
    async (values: any) => {
      const selectedModel = models.find((m) => (m.modelSlug || m.model) === values.model)
      const country = CountryPathname.find((e) => e.country === values.saleCountry)
      const currency = country?.country === Country.JAPAN ? 'JPY' : 'CNY'

      const query = new URLSearchParams()
      if (values.rating) {
        query.set('rating', values.rating)
      }
      if (values.maxMileageKm) {
        query.set('maxMileageKm', values.maxMileageKm.toString())
      }
      if (values.minMileageKm) {
        query.set('minMileageKm', values.minMileageKm.toString())
      }
      if (values.minYear) {
        query.set('minYear', values.minYear.toString())
      }
      if (values.maxYear) {
        query.set('maxYear', values.maxYear.toString())
      }
      if (values.minEnginePower) {
        query.set('minEnginePower', values.minEnginePower.toString())
      }
      if (values.maxEnginePower) {
        query.set('maxEnginePower', values.maxEnginePower.toString())
      }
      if (values.minPrice) {
        query.set('currency', currency)
        query.set('minPrice', convert('RUB', currency, values.minPrice).toString())
      }
      if (values.maxPrice) {
        query.set('currency', currency)
        query.set('maxPrice', convert('RUB', currency, values.maxPrice).toString())
      }
      if (values.auctionDate) {
        query.set('auctionDate', values.auctionDate)
      }
      if (values.body) {
        query.set('body', values.body)
      }

      if (onSearch) {
        await onSearch({
          ...values,
          make: resolvedSelectedMake || values.make,
          model: resolvedSelectedModel || values.model,
        })
        return
      }

      const isStatsPath = pathname.includes('/stats')
      const targetSubPath = isStatsPath ? 'stats' : 'cars'

      if (values.make && values.model && selectedModel) {
        // Resolve the brands/models from the lists to get names for the URL
        const brandMatch = brands.find(b => b.brand === values.make)
        const modelMatch = models.find(m => (m.modelSlug || m.model) === values.model)
        
        const makeSlug = toUrlSlug(brandMatch?.brandName || values.make)
        const modelSlug = modelMatch?.modelSlug || toUrlSlug(modelMatch?.modelDisplay || values.model)
        
        router.push(`${country?.pathname}/${targetSubPath}/${makeSlug}/${modelSlug}?${query.toString()}`)
        return
      } else if (values.make) {
        const brandMatch = brands.find(b => b.brand === values.make)
        const makeSlug = toUrlSlug(brandMatch?.brandName || values.make)
        
        router.push(`${country?.pathname}/${targetSubPath}/${makeSlug}?${query.toString()}`)
        return
      }
      router.push(`${country?.pathname}${isStatsPath ? '/stats' : ''}?${query.toString()}`)
    },
    [
      brands,
      models,
      convert,
      defaultValues?.make,
      defaultValues?.model,
      onSearch,
      pathname,
      resolvedSelectedMake,
      resolvedSelectedModel,
      router,
    ],
  )

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid w-full grid-cols-2 items-end gap-4"
      >
        <FormField
          control={form.control}
          name="saleCountry"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Страна</FormLabel>
              <FormControl className="mb-0">
                <Combobox
                  className="select-none"
                  options={Countries}
                  valueKey="value"
                  labelKey="label"
                  placeholder={'Страна...'}
                  searchPlaceholder="Найти страну..."
                  emptyMessage={'Упс... Ничего не найдено'}
                  onChange={(value) => {
                    field.onChange(value)
                  }}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="make"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Марка</FormLabel>
              <FormControl>
                <ExtendedCombobox
                  className="select-none"
                  options={brandOptions}
                  valueKey="id"
                  labelKey="name"
                  placeholder="Марка..."
                  searchPlaceholder="Найти марку..."
                  loadingMessage="Загрузка..."
                  emptyMessage={brandsLoading ? 'Загрузка...' : 'Упс... Ничего не найдено'}
                  onChange={(value) => {
                    field.onChange(value)
                    setBrandSearchQuery('')
                  }}
                  value={field.value}
                  onSearch={setBrandSearchQuery}
                  loading={brandsLoading}
                  hasMore={brandsHasNext}
                  onLoadMore={loadMoreBrands}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Модель</FormLabel>
              <FormControl>
                <ExtendedCombobox
                  className="select-none"
                  options={modelOptions}
                  valueKey="id"
                  labelKey="name"
                  placeholder={selectedMake ? 'Модель...' : 'Сначала выберите марку'}
                  searchPlaceholder="Найти модель..."
                  loadingMessage="Загрузка..."
                  emptyMessage={
                    !selectedMake
                      ? 'Сначала выберите марку'
                      : modelsLoading
                        ? 'Загрузка...'
                        : 'Упс... Ничего не найдено'
                  }
                  disabled={!selectedMake}
                  onChange={(value) => {
                    field.onChange(value)
                    setModelSearchQuery('')
                  }}
                  value={field.value}
                  onSearch={setModelSearchQuery}
                  loading={modelsLoading}
                  hasMore={modelsHasNext}
                  onLoadMore={loadMoreModels}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Рейтинг</FormLabel>
              <FormControl className="mb-0">
                <Combobox
                  className="select-none"
                  options={Ratings}
                  valueKey="value"
                  labelKey="label"
                  placeholder={'Рейтинг...'}
                  searchPlaceholder="Найти рейтинг..."
                  emptyMessage={'Упс... Ничего не найдено'}
                  onChange={(value) => {
                    field.onChange(value)
                  }}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Модель кузова</FormLabel>
              <FormControl>
                <Combobox
                  className="select-none"
                  options={bodyOptions}
                  valueKey="id"
                  labelKey="name"
                  placeholder={!selectedModel ? 'Сначала выберите модель' : 'Код кузова...'}
                  searchPlaceholder="Найти код кузова..."
                  emptyMessage={
                    !selectedModel
                      ? 'Сначала выберите модель'
                      : bodyTypesLoading
                        ? 'Загрузка...'
                        : 'Упс... Ничего не найдено'
                  }
                  disabled={!selectedModel || bodyTypesLoading}
                  onChange={(value: string) => {
                    field.onChange(value)
                  }}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="minYear"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Минимальный год</FormLabel>
              <FormControl className="mb-0">
                <InputNumber
                  className="select-none"
                  placeholder={'Минимальный год...'}
                  onChange={(value) => {
                    field.onChange(value)
                  }}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxYear"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Максимальный год</FormLabel>
              <FormControl className="mb-0">
                <InputNumber
                  className="select-none"
                  placeholder={'Максимальный год...'}
                  onChange={(value) => {
                    field.onChange(value)
                  }}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="minEnginePower"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Минимальный объём двигателя (л)</FormLabel>
              <FormControl className="mb-0">
                <InputNumber
                  className="select-none"
                  placeholder={'Минимальный объём двигателя...'}
                  onChange={(value) => {
                    field.onChange(value)
                  }}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxEnginePower"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Максимальный объём двигателя (л)</FormLabel>
              <FormControl className="mb-0">
                <InputNumber
                  className="select-none"
                  placeholder={'Максимальный объём двигателя...'}
                  onChange={(value) => {
                    field.onChange(value)
                  }}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="minMileageKm"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Минимальный пробег (км)</FormLabel>
              <FormControl className="mb-0">
                <InputNumber
                  className="select-none"
                  placeholder={'Минимальный пробег...'}
                  onChange={(value) => {
                    field.onChange(value)
                  }}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxMileageKm"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Максимальный пробег (км)</FormLabel>
              <FormControl className="mb-0">
                <InputNumber
                  className="select-none"
                  placeholder={'Максимальный пробег...'}
                  onChange={(value) => {
                    field.onChange(value)
                  }}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="minPrice"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Минимальная цена (₽)</FormLabel>
              <FormControl className="mb-0">
                <InputNumber
                  className="select-none"
                  placeholder={'Минимальная цена...'}
                  onChange={(value) => {
                    field.onChange(value)
                  }}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxPrice"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Максимальная цена (₽)</FormLabel>
              <FormControl className="mb-0">
                <InputNumber
                  className="select-none"
                  placeholder={'Максимальная цена...'}
                  onChange={(value) => {
                    field.onChange(value)
                  }}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="auctionDate"
          render={({ field }) => (
            <FormItem
              className={`
                col-span-2
                md:col-span-1
              `}
            >
              <FormLabel>Дата аукциона</FormLabel>
              <FormControl className="mb-0">
                <Input
                  className="select-none"
                  type="date"
                  placeholder="Дата аукциона..."
                  onChange={(event) => {
                    field.onChange(event.target.value)
                  }}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className={`
            col-span-2 col-start-1
            hover:cursor-pointer
            md:col-span-1
          `}
        >
          Найти автомобиль
        </Button>
      </form>
    </Form>
  )
}
