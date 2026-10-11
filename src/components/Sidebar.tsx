import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  FileCheck,
  PlusCircle,
  GraduationCap,
  Wallet,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  isHighlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { role, currentUser } = useAuth();

  const adminLinks: NavItem[] = [
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, badge: 'Live' },
    { to: '/admin/certificates', label: 'Certificates Ledger', icon: FileCheck, badge: '1.4k' },
    { to: '/admin/issue', label: 'Issue Certificate', icon: PlusCircle, isHighlight: true },
    { to: '/verify', label: 'Public Verifier', icon: ShieldCheck },
  ];

  const studentLinks: NavItem[] = [
    { to: '/student/dashboard', label: 'Student Overview', icon: GraduationCap },
    { to: '/student/certificates', label: 'Certificate Wallet', icon: Wallet, badge: '1 Active' },
    { to: '/verify', label: 'Verify Credentials', icon: ShieldCheck },
  ];

  const recruiterLinks: NavItem[] = [
    { to: '/recruiter/dashboard', label: 'Recruiter Console', icon: ShieldCheck, badge: 'HR' },
    { to: '/verify', label: 'Candidate Verifier', icon: FileCheck },
  ];

  const currentLinks =
    role === 'student'
      ? studentLinks
      : role === 'validator' || role === 'verifier'
      ? recruiterLinks
      : adminLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-on-surface/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-inverse-surface z-50 flex flex-col justify-between shadow-xl transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Brand header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-surface-variant/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-xs">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-sm font-bold text-surface-container-lowest tracking-tight truncate">
                  CertiChain
                </span>
                <span className="text-[10px] text-outline-variant uppercase tracking-wider truncate font-semibold">
                  {currentUser.institution || 'Institutional Registry'}
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-md text-surface-container hover:bg-surface-variant/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Persona Header Card */}
          <div className="p-4 mx-3 my-3 rounded-xl bg-surface-container-low/10 border border-white/5 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-white border border-primary/40 flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
              {currentUser.name
                ? currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-white block truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-outline-variant block truncate">
                {currentUser.title}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-5 pt-2 pb-1">
            <span className="text-[10px] font-semibold text-outline-variant uppercase tracking-wider">
              Navigation
            </span>
          </div>

          <nav className="px-3 flex flex-col gap-1">
            {currentLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                        : 'text-inverse-on-surface hover:bg-surface-variant/15 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-outline-variant group-hover:text-white transition-colors" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-code-mono bg-inverse-surface/80 text-primary-fixed border border-primary/20">
                      {item.badge}
                    </span>
                  )}

                  {item.isHighlight && (
                    <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Network status widget footer */}
        <div className="p-4 bg-inverse-surface border-t border-surface-variant/10">
          <div className="bg-surface-container-low/10 border border-white/10 p-3 rounded-lg flex flex-col gap-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-outline-variant uppercase tracking-wider text-[9px] font-semibold">
                Network Status
              </span>
              <span className="inline-flex items-center gap-1 text-primary-fixed text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-pulse"></span>
                Synced
              </span>
            </div>
            <div className="flex flex-col pt-1">
              <span className="text-white font-medium truncate">Ethereum Mainnet</span>
              <span className="font-code-mono text-outline-variant text-[10px]">Block #19,842,109</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-outline-variant text-[10px]">
              <span>14.2 Gwei</span>
              <span className="text-primary-fixed">99.98% Latency</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
