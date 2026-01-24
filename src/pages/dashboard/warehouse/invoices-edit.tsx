import { CONFIG } from 'src/global-config';

import { InvoicesEditView } from 'src/sections/warehouse/supplier-edit-view';

// ============================================================================

const metadata = { title: `Edit Invoice | Warehouse - ${CONFIG.appName}` };

export default function Page() {
    return (
        <>
            <title>{metadata.title}</title>

            <InvoicesEditView />
        </>
    );
}
