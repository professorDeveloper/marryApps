import { Helmet } from 'react-helmet-async';
import { CONFIG } from 'src/global-config';
import { DeductionsEditView } from 'src/sections/warehouse/deductions-edit-view';

// ============================================================================

const metadata = { title: `Deduction Details | Warehouse - ${CONFIG.appName}` };

export default function DeductionDetailsPage() {
    return (
        <>
            <Helmet>
                <title>{metadata.title}</title>
            </Helmet>

            <DeductionsEditView />
        </>
    );
}
