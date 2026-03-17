import { useEffect } from 'react';
import { CONFIG } from 'src/global-config';
import { DeductionsListView } from 'src/sections/warehouse/deductions-list-view';

// ============================================================================

const metadata = { title: `Deductions | Warehouse - ${CONFIG.appName}` };

export default function DeductionsPage() {
    useEffect(() => {
        document.title = metadata.title;
    }, []);

    return <DeductionsListView />;
}