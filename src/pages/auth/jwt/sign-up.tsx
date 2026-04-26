import { CONFIG } from 'src/global-config';

import { AuthVisualLayout, SignUpForm } from 'src/sections/auth/components';

// ----------------------------------------------------------------------

const metadata = { title: `Sign up | Jwt - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AuthVisualLayout>
        <SignUpForm />
      </AuthVisualLayout>
    </>
  );
}
