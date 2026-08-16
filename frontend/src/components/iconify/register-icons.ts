import type { IconifyJSON } from '@iconify/react';

import { addCollection } from '@iconify/react';

// ----------------------------------------------------------------------

// Type-only query — erased at compile time, so the ~240KB icon map stays out
// of the startup bundle and loads via registerIconsAsync() instead.
export type IconifyName = keyof typeof import('./icon-sets').default;

// ----------------------------------------------------------------------

let status: 'idle' | 'loading' | 'ready' = 'idle';
let registeredNames: Set<string> | null = null;
const listeners = new Set<() => void>();

export function isIconsRegistered(): boolean {
  return status === 'ready';
}

export function subscribeIconsRegistered(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * True once registration completed and the name is in the offline registry.
 * Returns true while the registry is still loading to avoid false warnings.
 */
export function isKnownIcon(name: string): boolean {
  return registeredNames ? registeredNames.has(name) : true;
}

export async function registerIconsAsync(): Promise<void> {
  if (status !== 'idle') return;
  status = 'loading';

  const { default: allIcons } = await import('./icon-sets');

  const iconSets = Object.entries(allIcons).reduce((acc, [key, value]) => {
    const [prefix, iconName] = key.split(':');
    const existingPrefix = acc.find((item) => item.prefix === prefix);

    if (existingPrefix) {
      existingPrefix.icons[iconName] = value;
    } else {
      acc.push({
        prefix,
        icons: {
          [iconName]: value,
        },
      });
    }

    return acc;
  }, [] as IconifyJSON[]);

  iconSets.forEach((iconSet) => {
    const iconSetConfig = {
      ...iconSet,
      width: (iconSet.prefix === 'carbon' && 32) || 24,
      height: (iconSet.prefix === 'carbon' && 32) || 24,
    };

    addCollection(iconSetConfig);
  });

  registeredNames = new Set(Object.keys(allIcons));
  status = 'ready';
  listeners.forEach((listener) => listener());
}
