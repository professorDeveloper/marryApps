import { CONFIG } from 'src/global-config';

import { ProfileView } from 'src/sections/profile/profile-view';

const metadata = { title: `Profile | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ProfileView />
    </>
  );
}
