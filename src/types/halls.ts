/**
 * Hall (Zal) types
 * API: /api/v1/halls
 */

export interface IHallItem {
    id: string;
    branch_id: string;
    name: string;
    name_i18n?: any;
    width: number;
    height: number;
    created_at?: string;
    updated_at?: string;
}

export interface IHallFormData {
    branch_id: string;
    name: string;
    name_i18n?: any;
    width: number;
    height: number;
}

export interface IHallCreateRequest {
    branch_id: string;
    name: string;
    name_i18n?: any;
    width: number;
    height: number;
}

export interface IHallUpdateRequest {
    name?: string;
    name_i18n?: any;
    width?: number;
    height?: number;
}
