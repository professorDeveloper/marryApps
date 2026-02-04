import { Helmet } from 'react-helmet-async';
import { CONFIG } from 'src/global-config';
import { DeductionsListView } from 'src/sections/warehouse/deductions-list-view';

// ============================================================================

const metadata = { title: `Deductions | Warehouse - ${CONFIG.appName}` };

export default function DeductionsPage() {
    return (
        <>
            <Helmet>
                <title>{metadata.title}</title>
            </Helmet>

            <DeductionsListView />
        </>
    );
}
