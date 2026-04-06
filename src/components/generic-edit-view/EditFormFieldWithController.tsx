import type { FC } from 'react';
import type { FieldConfig } from './types';

import { Controller, useFormContext } from 'react-hook-form';

import { EditFormField } from './edit-form-field';

interface EditFormFieldWithControllerProps {
    field: FieldConfig;
}

export const EditFormFieldWithController: FC<EditFormFieldWithControllerProps> = ({ field }) => {
    const { control } = useFormContext();

    return (
        <Controller
            name={field.key}
            control={control}
            defaultValue={field.defaultValue ?? null}
            render={({ field: { onChange, value } }) => (
                <EditFormField
                    field={field}
                    value={value ?? field.defaultValue ?? ''}
                    onChange={onChange}
                />
            )}
        />
    );
};
