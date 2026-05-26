import type { ReactNode } from 'react';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

type DataTableActionsContextValue = {
  settingsSlot: ReactNode;
  setSettingsSlot: (node: ReactNode) => void;
  clearSettingsSlot: () => void;
};

const DataTableActionsContext = createContext<DataTableActionsContextValue>({
  settingsSlot: null,
  setSettingsSlot: () => {},
  clearSettingsSlot: () => {},
});

export function DataTableActionsProvider({ children }: { children: ReactNode }) {
  const [settingsSlot, setSlot] = useState<ReactNode>(null);

  const setSettingsSlot = useCallback((node: ReactNode) => {
    setSlot(node);
  }, []);

  const clearSettingsSlot = useCallback(() => {
    setSlot(null);
  }, []);

  const value = useMemo(
    () => ({ settingsSlot, setSettingsSlot, clearSettingsSlot }),
    [settingsSlot, setSettingsSlot, clearSettingsSlot]
  );

  return (
    <DataTableActionsContext.Provider value={value}>
      {children}
    </DataTableActionsContext.Provider>
  );
}

export function useDataTableActionsContext() {
  return useContext(DataTableActionsContext);
}
