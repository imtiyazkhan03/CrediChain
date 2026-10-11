import React, { useState } from 'react';

interface HeaderProps {
  currentPath: string;
  onOpenMobileMenu: () => void;
  onSearch: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onOpenMobileMenu,
  onSearch,
}) => {
  const [searchVal, setSearchVal] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getPageTitle = (path: string) => {
    switch (path) {
      case 'overview':
        return 'Overview';
      case 'certificates':
        return 'Certificates Ledger';
      case 'issue-certificate':
        return 'Issue Certificate';
      case 'students':
        return 'Students Registry';
      case 'verification-history':
        return 'Verification History';
      case 'settings':
        return 'Settings & Governance';
      default:
        return 'Overview';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-surface/90 backdrop-blur-xl z-40 flex items-center justify-between px-gutter border-b border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
      {/* Left side: Hamburger + Breadcrumb + Global search */}
      <div className="flex items-center gap-space-md sm:gap-space-lg flex-1 max-w-3xl">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors"
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-space-xs shrink-0">
          <span className="font-label-md text-label-md text-outline">Registrar Office</span>
          <span className="material-symbols-outlined text-outline text-label-sm">chevron_right</span>
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            {getPageTitle(currentPath)}
          </span>
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-lg min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            className="w-full h-10 pl-10 pr-12 rounded-lg bg-surface-container-low text-body-md font-body-md text-on-surface placeholder:text-outline border border-transparent focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all shadow-xs"
            placeholder="Search by Certificate ID, Student, Hash, or UID..."
            type="text"
            value={searchVal}
            onChange={handleInputChange}
          />
          <kbd className="hidden md:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-container font-code-mono text-code-mono text-[11px] text-on-surface-variant border border-outline-variant/30">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right side: Institution badge + Notifications + User avatar */}
      <div className="flex items-center gap-space-sm sm:gap-space-md shrink-0">
        {/* Institution Badge */}
        <div className="hidden xl:flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1.5 rounded-lg text-on-surface border border-surface-container">
          <span className="material-symbols-outlined text-primary text-label-md">account_balance</span>
          <span className="font-label-md text-label-md truncate max-w-[210px] font-medium">
            Stanford University - Registrar
          </span>
          <span className="material-symbols-outlined text-outline text-label-sm">expand_more</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error ring-2 ring-surface"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-surface-container rounded-xl shadow-xl p-space-sm z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container mb-2">
                <span className="font-label-md text-label-md font-semibold text-on-surface">
                  On-Chain Notifications
                </span>
                <span className="text-[11px] font-code-mono text-primary font-semibold">3 New</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="p-2 rounded-lg bg-surface-container-low/60 hover:bg-surface-container-low text-xs">
                  <div className="flex items-center justify-between font-semibold text-on-surface">
                    <span>Batch #411 Confirmed</span>
                    <span className="text-[10px] text-outline">12m ago</span>
                  </div>
                  <p className="text-secondary mt-0.5">45 engineering degrees secured on Ethereum.</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-low/60 hover:bg-surface-container-low text-xs">
                  <div className="flex items-center justify-between font-semibold text-on-surface">
                    <span>Google HR Verification</span>
                    <span className="text-[10px] text-outline">35m ago</span>
                  </div>
                  <p className="text-secondary mt-0.5">Elena Rostova credential attested successfully.</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-low/60 hover:bg-surface-container-low text-xs">
                  <div className="flex items-center justify-between font-semibold text-on-surface">
                    <span>Quorum Pending</span>
                    <span className="text-[10px] text-outline">1h ago</span>
                  </div>
                  <p className="text-secondary mt-0.5">Hon. Clara Morales signature needed for Batch #412.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-surface-container hidden sm:block"></div>

        {/* Profile Card */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-space-sm p-1 rounded-lg hover:bg-surface-container transition-colors text-left"
          >
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuChga8XlZMBMFXzAarFoDTwKkV0Ve3vxa2tW3qw1uW-6YS3sgfRPjBBU9WULILiubbOx1oLerO6QeLUBdaDiL2T0diCbvfKQ2SXJKUkzfqaiUm-wM_SmW8AYEztxVHVvaxvnii8uiSCjGLvlUBuK_-XEOui2ptFxFIzPb_HanovQr7wERY8cdQUvEtTX7aAdXFExdOh3Z5OgoHt0R2lzuTA-O44c9tbHx7FOXdiqV6SAoy47wggY34"
            />
            <div className="hidden md:flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                Dr. Evelyn Vance
              </span>
              <span className="font-label-sm text-label-sm text-outline truncate max-w-[170px] text-[11px]">
                University Registrar & Custodian
              </span>
            </div>
            <span className="material-symbols-outlined text-outline text-lg hidden md:block">
              unfold_more
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-surface-container rounded-xl shadow-xl p-2 z-50">
              <div className="px-3 py-2 border-b border-surface-container mb-1">
                <p className="text-xs font-semibold text-on-surface">Dr. Evelyn Vance</p>
                <p className="text-[11px] text-outline truncate">evance@stanford.edu</p>
                <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-code-mono text-primary font-semibold bg-surface-container px-1.5 py-0.5 rounded">
                  <span>Signer: 0x92c...881f</span>
                </div>
              </div>
              <button className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container rounded-md flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">key</span>
                Hardware Security Key
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container rounded-md flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">shield</span>
                Registrar Credentials
              </button>
              <div className="border-t border-surface-container my-1"></div>
              <button className="w-full text-left px-3 py-1.5 text-xs text-error hover:bg-error-container/40 rounded-md flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">logout</span>
                Disconnect Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
