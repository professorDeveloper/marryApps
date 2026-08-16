export type MealItemType = 'ingredient' | 'compound';

export interface MealItem {
    id: string;
    name: string;
    measurement: string;
    type: MealItemType;
    price_per_unit?: string;
}

export interface MealItemRow extends MealItem {
    quantity: number;
}

export interface MealItemTypeFilter {
    ingredient: boolean;
    compound: boolean;
}

export interface MealItemPickerApi {
    getCalculations: () => {
        ingredient_calculations: { ingredient_id: string; quantity: string }[];
        compound_calculations: { compound_id: string; quantity: string }[];
    };
    restoreFromPersisted: (
        ingredientCalcs: { ingredient_id: string; quantity: string }[],
        compoundCalcs: { compound_id: string; quantity: string }[]
    ) => void;
    refresh: () => Promise<void>;
}

export const compositeKey = (type: MealItemType, id: string): string => `${type}:${id}`;
