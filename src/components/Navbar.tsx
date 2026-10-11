import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import {
  ShieldCheck,
  LogOut,
  Menu,
} from 'lucide-react';
import { WalletButton } from './WalletButton';

interface NavbarProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, showSidebarToggle = true }) => {
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md z-40 border-b border-surface-container px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle + Logo */}
      <div className="flex items-center gap-3">
        {showSidebarToggle && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-base font-bold text-on-surface tracking-tight leading-none">
              CertiChain
            </span>
            <span className="text-[10px] text-outline font-semibold uppercase tracking-wider mt-0.5">
              Academic Ledger
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Simplified Clean Navigation */}
      <div className="hidden md:flex items-center gap-1 lg:gap-2">
        <Link
          to="/verify"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-container transition-all flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Verify Credential</span>
        </Link>
        {role === 'student' ? (
          <Link
            to="/student/certificates"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-container transition-all flex items-center gap-1.5"
          >
            <span>My Certificates</span>
          </Link>
        ) : role === 'validator' || role === 'verifier' ? (
          <Link
            to="/recruiter/dashboard"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-container transition-all flex items-center gap-1.5"
          >
            <span>Recruiter Console</span>
          </Link>
        ) : (
          <>
            <Link
              to="/admin/issue"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-container transition-all flex items-center gap-1.5"
            >
              <span>Issue Certificate</span>
            </Link>
            <Link
              to="/admin/certificates"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-container transition-all flex items-center gap-1.5"
            >
              <span>Ledger</span>
            </Link>
          </>
        )}
      </div>

      {/* Right: Wallet & Auth Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Web3 Wallet Connect */}
        <WalletButton />

        {/* User Profile or Login */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                to={
                  role === 'admin' || role === 'university_admin'
                    ? '/admin/dashboard'
                    : role === 'student'
                    ? '/student/dashboard'
                    : '/recruiter/dashboard'
                }
                className="flex items-center gap-2 py-1 px-2 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container transition-all"
                title={`${currentUser.name} (${currentUser.title || role})`}
              >
                <div className="w-6 h-6 rounded-md bg-primary/15 text-primary border border-primary/30 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.name
                    ? currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'U'}
                </div>
                <span className="hidden sm:inline-block text-xs font-semibold text-on-surface max-w-[140px] truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                  {role === 'university_admin' || role === 'admin'
                    ? 'College'
                    : role === 'student'
                    ? 'Student'
                    : 'Recruiter'}
                </span>
              </Link>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-1.5 rounded-lg text-secondary hover:text-error hover:bg-surface-container transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" variant="primary">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
