import type { Theme, SxProps } from '@mui/material/styles';

import { mergeClasses } from 'minimal-shared/utils';

import { styled } from '@mui/material/styles';

import { layoutClasses } from './classes';

// ----------------------------------------------------------------------

export type LayoutSectionProps = React.ComponentProps<'div'> & {
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
  footerSection?: React.ReactNode;
  headerSection?: React.ReactNode;
  sidebarSection?: React.ReactNode;
  mini?: boolean;
};

export function LayoutSection({
  sx,
  children,
  footerSection,
  headerSection,
  sidebarSection,
  mini,
  className,
  ...other
}: LayoutSectionProps) {
  return (
    <LayoutRoot
      id="root__layout"
      className={mergeClasses([layoutClasses.root, className])}
      sx={sx}
      {...other}
    >
        {sidebarSection ? (
          <>
            {sidebarSection}
            <div className={`${layoutClasses.sidebarContainer} sidebar-container ${mini ? 'mini' : ''}`}>
              {headerSection}
              {children}
              {footerSection}
            </div>
          </>
        ) : (
          <>
            {headerSection}
            {children}
            {footerSection}
          </>
        )}
      </LayoutRoot>
  );
}

// ----------------------------------------------------------------------

const LayoutRoot = styled('div')``;

const LayoutSidebarContainer = styled('div')(() => ({
  display: 'flex',
  flex: '1 1 auto',
  flexDirection: 'column',
  minWidth: 0,
}));
