import { useEffect } from 'react';
import { CONFIG } from 'src/global-config';
import { DeductionsEditView } from 'src/sections/warehouse/deductions-edit-view';

// ============================================================================

const metadata = { title: `Deduction Details | Warehouse - ${CONFIG.appName}` };

export default function DeductionDetailsPage() {
    useEffect(() => {
        document.title = metadata.title;
    }, []); 
    return (
        <>
            <DeductionsEditView />
        </>
    );
}
