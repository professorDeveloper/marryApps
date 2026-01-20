import { CONFIG } from 'src/global-config';

import { InvoiceDetailsStandaloneListView } from 'src/sections/warehouse/invoice-details-standalone-list-view';

// ============================================================================

const metadata = { title: `Invoice Items (Kirimlar) | Warehouse - ${CONFIG.appName}` };

export default function Page() {
    return (
        <>
            <title>{metadata.title}</title>

            <InvoiceDetailsStandaloneListView />
        </>
    );
}
