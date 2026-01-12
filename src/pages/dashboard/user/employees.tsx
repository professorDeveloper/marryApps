import { useTranslation } from 'react-i18next';

import { EmployeeListView } from 'src/sections/user/employee-list-view';

export function EmployeesPage() {
    const { t } = useTranslation('menu');
    
    return (
        <EmployeeListView
            role="admin"
            title={t('overview.employe.admin')}
        />
    );
}
