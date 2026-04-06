import type { ColumnDef } from 'src/sections/warehouse/utils/components/item-picker';

export const OUTGOING_INVOICE_COLUMNS: ColumnDef[] = [
    {
        key: 'quantity',
        header: '', // set dynamically via t()
        width: 'minmax(120px, auto)',
        editable: true,
        type: 'number',
        step: '0.01',
        min: '0',
        align: 'center',
    },
    {
        key: 'price_per_unit',
        header: '', // set dynamically via t()
        width: 'minmax(120px, auto)',
        editable: false,
        align: 'right',
    },
    {
        key: 'total',
        header: '', // set dynamically via t()
        width: 'minmax(120px, auto)',
        editable: false,
        align: 'right',
    },
];
