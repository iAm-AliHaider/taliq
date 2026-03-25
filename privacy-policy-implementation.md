# Implementation Guide: PDPL Privacy Policy for Taliq

## Overview
This guide outlines steps to integrate the drafted PDPL-compliant privacy policy into the Taliq Next.js frontend. The policy must be available in both English and Arabic (PDPL Article 5 requires Arabic as primary language).

## Prerequisites
- Arabic translation of the privacy policy draft.
- Taliq frontend repository access.

## Steps

### 1. Translate to Arabic
- Obtain professional translation of `privacy-policy.md` to Arabic.
- Ensure technical terms align with PDPL Implementing Regulations.
- Save as `privacy-policy-ar.md`.

### 2. Create Privacy Policy Page
Create `frontend/src/app/privacy-policy/page.tsx`:

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Taliq',
  description: 'Taliq Privacy Policy - Personal Data Protection Law (PDPL) Compliance',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
          
          {/* English Version */}
          <div className="prose prose-slate max-w-none mb-12">
            {/* Insert English policy content here */}
          </div>
          
          <hr className="my-8" />
          
          {/* Arabic Version */}
          <div className="prose prose-slate max-w-none text-right" dir="rtl">
            {/* Insert Arabic policy content here */}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3. Add Footer Link
Update footer component (likely in `frontend/src/components/Footer.tsx` or layout):

```tsx
<a href="/privacy-policy" className="text-slate-400 hover:text-slate-600 transition">
  Privacy Policy
</a>
```

### 4. Implement Consent Banner (if needed)
For cookie tracking or data collection consent:

```tsx
// Add to layout.tsx
'use client';
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
  const [consent, setConsent] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem('taliq-consent');
    if (saved) setConsent(true);
  }, []);
  
  if (!consent) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 z-50">
        <p className="text-sm mb-2">We use cookies to improve your experience.</p>
        <div className="flex gap-2">
          <button onClick={() => { localStorage.setItem('taliq-consent', 'true'); setConsent(true); }}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm">
            Accept
          </button>
          <a href="/privacy-policy" className="px-4 py-2 border border-white rounded-lg text-sm">
            Learn More
          </a>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
```

### 5. Update Data Collection Forms
Add privacy policy links to registration/login forms with consent checkboxes where required.

### 6. Testing & Deployment
- Test page loads correctly.
- Verify Arabic text displays properly (RTL).
- Run `npm run build` to ensure no errors.
- Commit: `git add . && git commit -m "feat: Add PDPL-compliant privacy policy page"`
- Push to trigger Coolify deployment.

## Compliance Checklist
- [ ] Policy available in Arabic and English
- [ ] Covers all PDPL rights and requirements
- [ ] Accessible via footer link
- [ ] Consent mechanisms implemented
- [ ] Data subject contact details provided
- [ ] Reviewed by legal team
- [ ] Registered with SDAIA if required

## References
- PDPL Royal Decree M/19
- Implementing Regulations (September 2023)
- SDAIA Guidelines: https://dgp.sdaia.gov.sa