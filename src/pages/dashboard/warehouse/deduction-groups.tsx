import { Helmet } from 'react-helmet-async';
import { CONFIG } from 'src/global-config';
import { DeductionGroupsListView } from 'src/sections/warehouse/deduction-groups-list-view';

// ============================================================================

const metadata = { title: `Deduction Groups | Warehouse - ${CONFIG.appName}` };

export default function DeductionGroupsPage() {
    return (
        <>
            <Helmet>
                <title>{metadata.title}</title>
            </Helmet>

            <DeductionGroupsListView />
        </>
    );
}
