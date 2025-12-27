import { CONFIG } from 'src/global-config';

import { HalfMeals } from 'src/sections/semifinished/semifinished-list-view';

// ============================================================================

const metadata = { title: `Orders | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return <HalfMeals />;
}
