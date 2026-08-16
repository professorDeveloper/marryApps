import { CONFIG } from 'src/global-config';

import { HalfMeals } from 'src/sections/menu/compounds/compounds-list-view';

// ============================================================================

const metadata = { title: `Orders | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return <HalfMeals />;
}
