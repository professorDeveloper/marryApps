export interface CompoundEditViewProps {
    compoundId?: string;
    isNew?: boolean;
}

export interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

export interface PendingCalculation {
    ingredient_calculations?: Array<{ ingredient_id: string; quantity: string }>;
    compound_calculations?: Array<{ compound_id: string; quantity: string }>;
}
