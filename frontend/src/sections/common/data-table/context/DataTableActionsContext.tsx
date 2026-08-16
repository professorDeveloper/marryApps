import type { ReactNode } from 'react';

import { useMemo, useState, useContext, useCallback, createContext } from 'react';

type DataTableSettingsActionsValue = {
  setSettingsSlot: (node: ReactNode) => void;
  clearSettingsSlot: () => void;
};

// Split into two contexts so `DataTable` (which only needs the setters) never
// re-renders when `settingsSlot` itself changes. Only `SectionTabsBar` cares
// about the slot content; `actionsValue` below is created once and never
// changes, so subscribing to it never triggers a re-render.
const DataTableSettingsSlotContext = createContext<ReactNode>(null);
DataTableSettingsSlotContext.displayName = 'DataTableSettingsSlotContext';

const DataTableSettingsActionsContext = createContext<DataTableSettingsActionsValue>({
  setSettingsSlot: () => {},
  clearSettingsSlot: () => {},
});
DataTableSettingsActionsContext.displayName = 'DataTableSettingsActionsContext';

export function DataTableActionsProvider({ children }: { children: ReactNode }) {
  const [settingsSlot, setSlot] = useState<ReactNode>(null);

  const setSettingsSlot = useCallback((node: ReactNode) => {
    setSlot(node);
  }, []);

  const clearSettingsSlot = useCallback(() => {
    setSlot(null);
  }, []);

  const actionsValue = useMemo(
    () => ({ setSettingsSlot, clearSettingsSlot }),
    [setSettingsSlot, clearSettingsSlot]
  );

  return (
    <DataTableSettingsActionsContext.Provider value={actionsValue}>
      <DataTableSettingsSlotContext.Provider value={settingsSlot}>
        {children}
      </DataTableSettingsSlotContext.Provider>
    </DataTableSettingsActionsContext.Provider>
  );
}

export function useDataTableSettingsActions() {
  return useContext(DataTableSettingsActionsContext);
}

export function useDataTableSettingsSlot() {
  return useContext(DataTableSettingsSlotContext);
}
