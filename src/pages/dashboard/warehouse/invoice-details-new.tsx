import { CONFIG } from 'src/global-config';

import { InvoiceDetailsEditView } from 'src/sections/warehouse/invoice-details-edit-view';

// ============================================================================

const metadata = { title: `Add Invoice Item | Warehouse - ${CONFIG.appName}` };

export default function Page() {
    return (
        <>
            <title>{metadata.title}</title>

            <InvoiceDetailsEditView isNew />
        </>
    );
}
