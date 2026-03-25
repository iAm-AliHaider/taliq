# Implementation Guide: Terms of Service for Taliq

## Overview
Integrate the drafted ToS into Taliq's Next.js frontend for user acceptance during registration and account setup.

## Prerequisites
- Arabic translation of ToS.
- Taliq frontend access.

## Steps

### 1. Translate to Arabic
Obtain professional translation to Arabic for compliance.

### 2. Create ToS Page
Add `frontend/src/app/terms-of-service/page.tsx`:

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Taliq',
  description: 'Taliq Terms of Service',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Terms of Service</h1>
          {/* Insert ToS content */}
        </div>
      </div>
    </div>
  );
}
```

### 3. Add to Registration Flow
In signup form, add checkbox:

```tsx
const [acceptTos, setAcceptTos] = useState(false);

// Checkbox
<label>
  <input type="checkbox" checked={acceptTos} onChange={e => setAcceptTos(e.target.checked)} required />
  I agree to the <a href="/terms-of-service" className="text-blue-600">Terms of Service</a>.
</label>
```

### 4. Update Footer
Add link in footer.

### 5. Testing & Deployment
- Test acceptance flow.
- Commit: `git add . && git commit -m "feat: Add ToS page and acceptance flow"`
- Push to deploy.

## Checklist
- [ ] ToS in Arabic and English
- [ ] Acceptance during signup
- [ ] Reviewed by legal
- [ ] Updated with changes