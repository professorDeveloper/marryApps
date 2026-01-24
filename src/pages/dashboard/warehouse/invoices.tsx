import { CONFIG } from 'src/global-config';

import { InvoicesListView } from 'src/sections/warehouse/supplier-list-view';

// ============================================================================

const metadata = { title: `Invoices | Warehouse - ${CONFIG.appName}` };

export default function Page() {
    return (
        <>
            <title>{metadata.title}</title>

            <InvoicesListView />
        </>
    );
}
