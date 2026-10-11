import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import {
  ShieldCheck,
  Search,
  UserCheck,
  LogOut,
  ChevronDown,
  Menu,
  GraduationCap,
  Building,
  Eye,
} from 'lucide-react';
import { WalletButton } from './WalletButton';

interface NavbarProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, showSidebarToggle = true }) => {
  const { currentUser, role, switchRole, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/verify/${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleRoleChange = (newRole: 'admin' | 'student' | 'authority' | 'verifier') => {
    switchRole(newRole);
    setShowRoleMenu(false);
    if (newRole === 'admin') navigate('/admin/dashboard');
    else if (newRole === 'student') navigate('/student/dashboard');
    else if (newRole === 'authority') navigate('/authority/dashboard');
    else navigate('/');
  };

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

      {/* Center: Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Verify by Certificate ID, Keccak hash, or student UID..."
            className="w-full h-9 pl-9 pr-12 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface placeholder:text-outline focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-container font-code-mono text-[10px] text-outline border border-surface-container-high">
            Enter ↵
          </kbd>
        </div>
      </form>

      {/* Right: Role Switcher & Persona Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Web3 Wallet Connect Button */}
        <WalletButton />

        {/* Role Switcher Pill Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container text-xs font-semibold text-on-surface transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-brand-teal"></span>
            <span className="capitalize">{role} Mode</span>
            <ChevronDown className="w-3.5 h-3.5 text-outline" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-surface-container rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 text-xs">
              <div className="px-2.5 py-1.5 border-b border-surface-container mb-1">
                <p className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Switch Active Persona
                </p>
              </div>

              <button
                onClick={() => handleRoleChange('admin')}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left ${
                  role === 'admin' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surface-container text-on-surface'
                }`}
              >
                <Building className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="block font-medium">University Admin</span>
                  <span className="text-[10px] text-outline">Issue, revoke & manage</span>
                </div>
              </button>

              <button
                onClick={() => handleRoleChange('student')}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left ${
                  role === 'student' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surface-container text-on-surface'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="block font-medium">Student (Alumna)</span>
                  <span className="text-[10px] text-outline">Wallet, QR & download PDF</span>
                </div>
              </button>

              <button
                onClick={() => handleRoleChange('authority')}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left ${
                  role === 'authority' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surface-container text-on-surface'
                }`}
              >
                <UserCheck className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="block font-medium">Education Authority</span>
                  <span className="text-[10px] text-outline">Read-only oversight & audits</span>
                </div>
              </button>

              <button
                onClick={() => handleRoleChange('verifier')}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left ${
                  role === 'verifier' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surface-container text-on-surface'
                }`}
              >
                <Eye className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="block font-medium">Public Verifier</span>
                  <span className="text-[10px] text-outline">Verify any certificate</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* User Profile or Login */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                to={
                  role === 'admin'
                    ? '/admin/dashboard'
                    : role === 'student'
                    ? '/student/dashboard'
                    : role === 'authority'
                    ? '/authority/dashboard'
                    : '/'
                }
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-container transition-colors"
                title={`${currentUser.name} (${currentUser.title})`}
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-primary/30"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline-block text-xs font-semibold text-on-surface max-w-[110px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
              </Link>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-1.5 rounded-lg text-secondary hover:text-error hover:bg-surface-container transition-colors"
                title="Switch Account / Sign Out"
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
