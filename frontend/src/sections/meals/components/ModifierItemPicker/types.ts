export interface ModifierItem {
    id: string;
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
}

export interface ModifierItemPickerApi {
    getModifierIds: () => string[];
    restoreFromPersisted: (modifierIds: string[]) => void;
    refresh: () => Promise<void>;
}

export const compositeKey = (id: string): string => `modifier:${id}`;
