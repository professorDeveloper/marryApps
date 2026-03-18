import { useEffect } from 'react';
import { CONFIG } from 'src/global-config';
import { DeductionGroupsListView } from 'src/sections/warehouse/deduction-groups-list-view';

// ============================================================================

const metadata = { title: `Deduction Groups | Warehouse - ${CONFIG.appName}` };

export default function DeductionGroupsPage() {
    useEffect(() => {
        document.title = metadata.title;
    }, []);

    return (
        <>
            <DeductionGroupsListView />
        </>
    );
}
