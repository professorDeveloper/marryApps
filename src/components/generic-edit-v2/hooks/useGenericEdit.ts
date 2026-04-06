import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Core hook for GenericEditV2.
 *
 * Keeps a **local copy** of the data so parent never re-renders while
 * the user is typing. Resets only when the record identity changes
 * (detected via `data.id`).
 */
export function useGenericEdit<T extends Record<string, any>>(
    data: T | null,
    onSubmit: (data: T) => void | Promise<void>,
) {
    const buildInitial = useCallback((): T => (data ?? {} as T), [data]);

    const [localData, setLocalData] = useState<T>(buildInitial);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track identity so we only reset when the *record* changes, not on every
    // parent render.
    const prevIdRef = useRef<string | undefined>((data as any)?.id);

    useEffect(() => {
        const nextId = (data as any)?.id;
        if (nextId !== prevIdRef.current || (!prevIdRef.current && data)) {
            prevIdRef.current = nextId;
            setLocalData(data ?? {} as T);
        }
    }, [data]);

    // ── Field-level change ───────────────────────────────────────────────
    const handleFieldChange = useCallback((key: string, value: any) => {
        setLocalData((prev) => ({ ...prev, [key]: value }));
    }, []);

    // ── Dirty check ──────────────────────────────────────────────────────
    const isDirty = useCallback(() => {
        if (!data) return Object.keys(localData).length > 0;
        return JSON.stringify(localData) !== JSON.stringify(data);
    }, [localData, data]);

    // ── Reset ────────────────────────────────────────────────────────────
    const reset = useCallback(() => {
        setLocalData(data ?? {} as T);
        setError(null);
    }, [data]);

    // ── Submit ───────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        setSubmitting(true);
        setError(null);
        try {
            await onSubmit(localData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSubmitting(false);
        }
    }, [localData, onSubmit]);

    return {
        localData,
        setLocalData,
        handleFieldChange,
        handleSubmit,
        submitting,
        error,
        setError,
        isDirty,
        reset,
    };
}
