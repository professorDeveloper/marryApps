import { useTranslation } from 'react-i18next';

import { EmployeeListView } from 'src/sections/user/employee-list-view';

export function RestaurantStaffPage() {
    const { t } = useTranslation('menu');

    return (
        <EmployeeListView
            role="user"
            title={t('overview.employe.staff')}
        />
    );
}
