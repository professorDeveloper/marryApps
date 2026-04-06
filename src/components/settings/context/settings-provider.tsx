import type { SettingsState, SettingsProviderProps } from '../types';

import { isEqual } from 'es-toolkit';
import { getStorage as getStorageValue } from 'minimal-shared/utils';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { SettingsContext } from './settings-context';
import { SETTINGS_STORAGE_KEY } from '../settings-config';

// ----------------------------------------------------------------------

/**
 * Deferred localStorage persistence — writes are batched via requestIdleCallback / setTimeout
 * so they never block the main thread during UI transitions (e.g. sidebar toggle).
 */
function useDeferredLocalStorage<T extends Record<string, unknown>>(
  storageKey: string,
  defaultValue: T
) {
  const [state, _setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && stored !== 'undefined') {
        const parsed = JSON.parse(stored);
        return { ...defaultValue, ...parsed };
      }
    } catch {
      // ignore
    }
    return defaultValue;
  });

  const pendingWrite = useRef<ReturnType<typeof setTimeout> | number | null>(null);

  const persistToStorage = useCallback(
    (value: T) => {
      if (pendingWrite.current !== null) {
        // Cancel any pending write
        if (typeof cancelIdleCallback !== 'undefined' && typeof pendingWrite.current === 'number') {
          cancelIdleCallback(pendingWrite.current);
        } else {
          clearTimeout(pendingWrite.current as ReturnType<typeof setTimeout>);
        }
      }

      const doWrite = () => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(value));
        } catch (e) {
          console.error('Error writing to localStorage:', e);
        }
        pendingWrite.current = null;
      };

      if (typeof requestIdleCallback !== 'undefined') {
        pendingWrite.current = requestIdleCallback(doWrite, { timeout: 500 });
      } else {
        pendingWrite.current = setTimeout(doWrite, 50);
      }
    },
    [storageKey]
  );

  const setState = useCallback(
    (updateValue: Partial<T>) => {
      _setState((prev) => {
        const next = { ...prev, ...updateValue };
        persistToStorage(next);
        return next;
      });
    },
    [persistToStorage]
  );

  const setField = useCallback(
    (name: keyof T, value: T[keyof T]) => {
      _setState((prev) => {
        const next = { ...prev, [name]: value };
        persistToStorage(next);
        return next;
      });
    },
    [persistToStorage]
  );

  const resetState = useCallback(
    (resetValue: T) => {
      _setState(resetValue);
      persistToStorage(resetValue);
    },
    [persistToStorage]
  );

  return { state, setState, setField, resetState };
}

// ----------------------------------------------------------------------

export function SettingsProvider({
  children,
  defaultSettings,
  storageKey = SETTINGS_STORAGE_KEY,
}: SettingsProviderProps) {
  const { state, setState, resetState, setField } = useDeferredLocalStorage<SettingsState>(
    storageKey,
    defaultSettings
  );

  const [openDrawer, setOpenDrawer] = useState(false);

  const onToggleDrawer = useCallback(() => {
    setOpenDrawer((prev) => !prev);
  }, []);

  const onCloseDrawer = useCallback(() => {
    setOpenDrawer(false);
  }, []);

  const canReset = !isEqual(state, defaultSettings);

  const onReset = useCallback(() => {
    resetState(defaultSettings);
  }, [defaultSettings, resetState]);

  // Version check and reset handling
  useEffect(() => {
    const storedValue = getStorageValue<SettingsState>(storageKey);

    if (storedValue) {
      try {
        if (!storedValue.version || storedValue.version !== defaultSettings.version) {
          onReset();
        }
      } catch {
        onReset();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memoizedValue = useMemo(
    () => ({
      canReset,
      onReset,
      openDrawer,
      onCloseDrawer,
      onToggleDrawer,
      state,
      setState,
      setField,
    }),
    [canReset, onReset, openDrawer, onCloseDrawer, onToggleDrawer, state, setField, setState]
  );

  return <SettingsContext value={memoizedValue}>{children}</SettingsContext>;
}
