import { useTranslation } from 'react-i18next';

import { EmployeeListView } from 'src/sections/user/employee';

export function RestaurantStaffPage() {
    const { t } = useTranslation('menu');

    return (
        <EmployeeListView
            role="user"
            useStaffApi
            title={t('overview.employe.staff')}
        />
    );
}
