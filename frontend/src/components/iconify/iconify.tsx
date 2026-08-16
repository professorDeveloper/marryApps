import type { IconProps } from '@iconify/react';
import type { IconifyName } from './register-icons';

import { Icon } from '@iconify/react';
import { mergeClasses } from 'minimal-shared/utils';
import { useId, useSyncExternalStore } from 'react';

import { styled } from '@mui/material/styles';

import { iconifyClasses } from './classes';
import {
  isKnownIcon,
  isIconsRegistered,
  registerIconsAsync,
  subscribeIconsRegistered,
} from './register-icons';

// ----------------------------------------------------------------------

// Kick off the icon registry download as soon as this module is evaluated so
// the async chunk loads in parallel with app bootstrap, off the critical path.
registerIconsAsync();

export type IconifyProps = React.ComponentProps<typeof IconRoot> &
  Omit<IconProps, 'icon'> & {
    icon: IconifyName;
  };

export function Iconify({ className, icon, width = 20, height, sx, ...other }: IconifyProps) {
  const uniqueId = useId();
  const ready = useSyncExternalStore(
    subscribeIconsRegistered,
    isIconsRegistered,
    isIconsRegistered
  );

  const sizingSx = [
    {
      width,
      flexShrink: 0,
      height: height ?? width,
      display: 'inline-flex',
    },
    ...(Array.isArray(sx) ? sx : [sx]),
  ];

  if (!ready) {
    // Rendering an unregistered <Icon> would make @iconify/react fetch it from
    // api.iconify.design; show a same-sized placeholder until the registry lands.
    return (
      <PlaceholderRoot
        id={uniqueId}
        className={mergeClasses([iconifyClasses.root, className])}
        sx={sizingSx}
      />
    );
  }

  if (import.meta.env.DEV && !isKnownIcon(icon)) {
    console.warn(
      [
        `Icon "${icon}" is currently loaded online, which may cause flickering effects.`,
        `To ensure a smoother experience, please register your icon collection for offline use.`,
        `More information is available at: https://docs.minimals.cc/icons/`,
      ].join('\n')
    );
  }

  return (
    <IconRoot
      ssr
      id={uniqueId}
      icon={icon}
      className={mergeClasses([iconifyClasses.root, className])}
      sx={sizingSx}
      {...other}
    />
  );
}

// ----------------------------------------------------------------------

const IconRoot = styled(Icon)``;

const PlaceholderRoot = styled('span')``;
