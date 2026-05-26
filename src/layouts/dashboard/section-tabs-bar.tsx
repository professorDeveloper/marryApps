import type { NavSectionProps, NavItemProps } from 'src/components/nav-section';

import { memo } from 'react';

import { RouterLink } from 'src/routes/components';
import { usePathname } from 'src/routes/hooks';
import { useDataTableActionsContext } from 'src/sections/common/data-table/context/DataTableActionsContext';

// ---------------------------------------------------------------------------

type SectionTabsBarProps = {
  data: NavSectionProps['data'];
  checkPermissions?: (allowedRoles?: NavItemProps['allowedRoles']) => boolean;
};

function pathMatchesSection(pathname: string, sectionPath: string, children?: { path: string }[]) {
  // Match if pathname starts with any child path
  if (children) {
    return children.some((c) => pathname === c.path || pathname.startsWith(c.path + '/'));
  }
  return pathname === sectionPath || pathname.startsWith(sectionPath + '/');
}

export const SectionTabsBar = memo(function SectionTabsBar({ data, checkPermissions }: SectionTabsBarProps) {
  const pathname = usePathname();
  const { settingsSlot } = useDataTableActionsContext();

  const allTopItems = data.flatMap((group) => group.items);
  const activeItem = allTopItems.find((item) =>
    pathMatchesSection(pathname, item.path, item.children)
  );
  const tabs = activeItem?.children;

  if (!tabs || tabs.length < 1) return null;

  return (
    <div className="section-tabs-bar">
      {tabs.map((tab) => {
        if (tab.allowedRoles && checkPermissions && checkPermissions(tab.allowedRoles)) return null;
        const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/');
        return (
          <RouterLink
            key={tab.path}
            href={tab.path}
            className={`stab${isActive ? ' active' : ''}`}
          >
            {tab.title}
          </RouterLink>
        );
      })}
      {settingsSlot && (
        <div className="stab-settings-slot">
          {settingsSlot}
        </div>
      )}
    </div>
  );
});
