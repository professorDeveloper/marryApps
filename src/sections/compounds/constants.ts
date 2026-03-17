
import { CardSection } from "src/components/generic-edit-view/types";

export const IMAGE_SECTION: CardSection = {
    id: 'image',
    title: 'semifinishedProducts.imageTitle',
    fields: [
        {
            key: 'picture_url',
            label: 'semifinishedProducts.imageUrl',
            type: 'url',
            placeholder: 'https://example.com/image.jpg',
            defaultValue: '',
        },
    ],
};

export const BASIC_INFO_SECTION: CardSection = {
    id: 'basic',
    title: 'semifinishedProducts.basicTitle',
    columns: 1,
    fields: [
        {
            key: 'name',
            label: 'semifinishedProducts.name',
            type: 'text',
            required: true,
            defaultValue: '',
            // helperText: 'Asosiy nomi Uzbek tilida kiritiladi va translation uz fieldiga avtomatik yuboriladi',
        },
        {
            key: 'name_en',
            label: 'semifinishedProducts.nameEn',
            type: 'text',
            required: false,
            defaultValue: '',
        },
        {
            key: 'name_ru',
            label: 'semifinishedProducts.nameRu',
            type: 'text',
            required: false,
            defaultValue: '',
        },
        {
            key: 'description',
            label: 'semifinishedProducts.description',
            type: 'textarea',
            rows: 3,
            defaultValue: '',
        },
        {
            key: 'department_id',
            label: 'semifinishedProducts.department',
            type: 'text',
            required: true,
        },
    ],
};

export const PRICING_SECTION: CardSection = {
    id: 'pricing',
    title: 'semifinishedProducts.pricingTitle',
    columns: 2,
    fields: [
        // {
        //     key: 'price',
        //     label: 'semifinishedProducts.price',
        //     type: 'text',
        //     required: false,
        //     placeholder: '0',
        // },
        {
            key: 'quantity',
            label: 'semifinishedProducts.quantity',
            type: 'number',
            required: true,
            // placeholder: '0',
        },
        {
            key: 'measurement',
            label: 'semifinishedProducts.measurement',
            type: 'text',
            required: true,
            defaultValue: 'kg',
        },
    ],
};


export const MEASUREMENT_OPTIONS = ['kg', 'piece', 'l'];
