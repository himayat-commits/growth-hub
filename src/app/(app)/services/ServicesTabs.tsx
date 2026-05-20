'use client';

// Tab switcher for /(app)/services. Two tabs:
//   "Birdeye modules" — the existing PortalModuleGrid (paid platform features)
//   "Services"        — Payload-driven consultancy offerings
//
// State lives in URL hash so deep-linking + back/forward work naturally
// (?tab=… would force a full reload because the page is a Server Component
// for the modules half).

import { useState, useEffect, type ReactNode } from 'react';

export type ServicesTab = 'modules' | 'services';

export default function ServicesTabs({
  modules,
  services,
  initialTab = 'modules',
}: {
  modules: ReactNode;
  services: ReactNode;
  initialTab?: ServicesTab;
}) {
  const [tab, setTab] = useState<ServicesTab>(initialTab);

  // Read #services hash on mount + listen for changes.
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'services' || hash === 'modules') setTab(hash);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const select = (next: ServicesTab) => {
    setTab(next);
    // Update hash without scroll-jumping
    history.replaceState(null, '', `#${next}`);
  };

  return (
    <>
      <div className="gh-tabs" role="tablist" aria-label="Services view">
        <button
          role="tab"
          aria-selected={tab === 'modules'}
          className={`gh-tab ${tab === 'modules' ? 'is-active' : ''}`}
          onClick={() => select('modules')}
          type="button"
        >
          Birdeye modules
        </button>
        <button
          role="tab"
          aria-selected={tab === 'services'}
          className={`gh-tab ${tab === 'services' ? 'is-active' : ''}`}
          onClick={() => select('services')}
          type="button"
        >
          Services
        </button>
      </div>

      <div role="tabpanel" hidden={tab !== 'modules'}>
        {tab === 'modules' && modules}
      </div>
      <div role="tabpanel" hidden={tab !== 'services'}>
        {tab === 'services' && services}
      </div>
    </>
  );
}
