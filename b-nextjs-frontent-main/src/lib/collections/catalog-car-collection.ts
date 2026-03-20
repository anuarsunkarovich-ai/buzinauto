import { Countries } from '@/constants/country'
import { CollectionConfig } from 'payload'
import { SlugCollectionAlias } from '../dictionaries/slug-collection.dictionary'

export const CatalogCarCollectionConfig: CollectionConfig = {
  slug: SlugCollectionAlias.CATALOG_CAR,
  labels: {
    plural: 'Каталог автомобилей',
    singular: 'Каталог автомобилей',
  },
  admin: {
    useAsTitle: 'model',
  },
  indexes: [{ fields: ['brand', 'model'] }],
  timestamps: true,
  fields: [
    {
      label: 'Изображения',
      name: 'images',
      type: 'relationship',
      relationTo: SlugCollectionAlias.AUCTION_MEDIA,
      required: false,
      hasMany: true,
      defaultValue: [],
    },
    {
      label: 'Аукционный лист',
      name: 'auctionList',
      type: 'relationship',
      relationTo: SlugCollectionAlias.AUCTION_MEDIA,
      required: false,
    },
    {
      label: 'Внешний идентификатор',
      name: 'externalId',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      type: 'row',
      fields: [
        {
          label: 'Номер лота',
          name: 'lot',
          type: 'number',
          required: true,
        },
        {
          label: 'Аукцион',
          name: 'auction',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          label: 'Марка',
          name: 'brand',
          type: 'text',
          index: true,
          required: true,
        },
        {
          label: 'Кузов',
          name: 'body',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          label: 'Модель',
          name: 'model',
          type: 'text',
          required: true,
          index: true,
        },
        {
          label: 'Отображаемая модель',
          name: 'modelDisplay',
          type: 'text',
          required: true,
        },
        {
          label: 'URI модель',
          name: 'modelSlug',
          type: 'text',
          required: true,
          index: true,
        },
      ],
    },
    {
      label: 'Год',
      name: 'year',
      type: 'number',
      required: true,
    },
    {
      label: 'Расположение руля',
      name: 'wheelPosition',
      type: 'select',
      options: [
        {
          value: 'right',
          label: 'Справа',
        },
        {
          value: 'left',
          label: 'Слева',
        },
      ],
      required: false,
    },
    {
      label: 'Трансмиссия',
      name: 'transmission',
      type: 'text',
      required: false,
    },
    {
      type: 'row',
      fields: [
        {
          label: 'Объем куб.см',
          name: 'enginePower',
          type: 'number',
          required: false,
        },
        {
          label: 'Мощность л.с.',
          name: 'horsepower',
          type: 'number',
          required: false,
        },
      ],
    },
    {
      label: 'Тип привода',
      name: 'driveType',
      type: 'text',
      required: false,
    },
    {
      label: 'Рейтинг',
      name: 'rating',
      type: 'text',
      required: false,
    },
    {
      label: 'Цена',
      name: 'price',
      type: 'group',
      fields: [
        {
          label: 'Валюта',
          name: 'currency',
          type: 'text',
          required: false,
        },
        {
          label: 'Начальная цена',
          name: 'start',
          type: 'number',
          required: false,
        },
        {
          label: 'Конечная цена',
          name: 'final',
          type: 'number',
          required: false,
        },
        {
          label: 'Средняя цена',
          name: 'avg',
          type: 'number',
          required: false,
        },
        {
          label: 'Средняя цена список',
          name: 'avgList',
          type: 'number',
          required: false,
          hasMany: true,
        },
      ],
      required: true,
    },
    {
      label: 'Таможенная пошлина',
      name: 'customsDuty',
      type: 'group',
      fields: [
        {
          label: 'Физ. лицо',
          name: 'individual',
          type: 'number',
          required: false,
        },
        {
          label: 'Юр. лицо',
          name: 'legalEntity',
          type: 'number',
          required: false,
        },
      ],
      required: false,
    },
    {
      label: 'Утилизационный сбор',
      name: 'disposalFee',
      type: 'group',
      fields: [
        {
          label: 'Физ. лицо',
          name: 'individual',
          type: 'number',
          required: false,
        },
        {
          label: 'Юр. лицо',
          name: 'legalEntity',
          type: 'number',
          required: false,
        },
      ],
      required: false,
    },
    {
      label: 'Страна',
      name: 'saleCountry',
      type: 'select',
      required: false,
      options: Countries,
      admin: {
        position: 'sidebar',
      },
    },
    {
      label: 'Двигатель',
      name: 'engineType',
      type: 'select',
      required: false,
      options: [
        {
          value: 'gasoline',
          label: 'Бензиновый',
        },
        {
          value: 'diesel',
          label: 'Дизельный',
        },
        {
          value: 'electric',
          label: 'Электрический',
        },
        {
          value: 'hybrid-gasoline',
          label: 'Гибрид бензиновый',
        },
        {
          value: 'hybrid-diesel',
          label: 'Гибрид дизельный',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      label: 'Пробег',
      name: 'mileageKm',
      type: 'number',
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      label: 'Дата аукциона',
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'yyy-MMM-d h:mm:ss OOO',
        },
      },
    },
    {
      label: 'Цвет',
      name: 'color',
      type: 'text',
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      label: 'Статус продажи',
      name: 'saleStatus',
      type: 'text',
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'isSold',
          type: 'checkbox',
          required: false,
          admin: {
            position: 'sidebar',
          },
        },
        {
          name: 'isSanctions',
          type: 'checkbox',
          required: false,
          admin: {
            position: 'sidebar',
          },
        },
        {
          name: 'isFinish',
          type: 'checkbox',
          required: false,
          index: true,
          admin: {
            position: 'sidebar',
          },
          defaultValue: false,
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
