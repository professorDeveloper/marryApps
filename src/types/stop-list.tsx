// ============================================================================
// STOP LIST TYPES
// ============================================================================

export type StopListType = 'goods' | 'ingredient';

/**
 * Raw API shape, as returned by GET /api/v1/stop-list
 */
export interface IStopListItem {
    id: string;
    branch_id: string;
    type: StopListType;
    ingredient_id?: string | null;
    good_id?: string | null;
    quantity?: string | null;
    reason?: string | null;
    expires_at?: number | null;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
}

/**
 * POST /api/v1/stop-list body
 */
export interface ICreateStopListRequest {
    type: StopListType;
    ingredient_id?: string;
    good_id?: string;
    quantity?: string;
    reason?: string;
    duration_minutes?: number;
}
