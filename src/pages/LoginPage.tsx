import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import {
  ShieldCheck,
  Lock,
  Mail,
  GraduationCap,
  Eye,
  EyeOff,
  AlertCircle,
  Building,
  User as UserIcon,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import type { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [studentId, setStudentId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setAuthError('Please provide both an email address and password.');
      return;
    }
    if (authMode === 'register' && !fullName.trim()) {
      setAuthError('Please enter your full name to create an account.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (authMode === 'register') {
        await register(
          fullName.trim(),
          email.trim(),
          password,
          selectedRole,
          institution.trim() || undefined,
          studentId.trim() || undefined
        );
        setAuthSuccess('Account registered successfully! Redirecting...');
      } else {
        await login(email.trim(), selectedRole, password, fullName.trim() || undefined);
      }

      setIsLoading(false);

      // Route directly to the selected portal
      if (selectedRole === 'admin' || selectedRole === 'university_admin') {
        navigate('/admin/dashboard');
      } else if (selectedRole === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/recruiter/dashboard');
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setAuthError((err as Error)?.message || 'Authentication error. Please check your credentials.');
    }
  };

  const getRoleDisplayName = (r: UserRole) => {
    if (r === 'admin' || r === 'university_admin') return 'College';
    if (r === 'student') return 'Student';
    return 'Recruiter';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Brand Header */}
      <Link to="/" className="flex items-center gap-2.5 mb-6 group">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="font-headline-sm text-xl font-bold text-on-surface tracking-tight">
            CertiChain
          </span>
          <span className="text-[10px] text-outline uppercase tracking-wider font-semibold">
            Institutional Registry
          </span>
        </div>
      </Link>

      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container overflow-hidden p-6 sm:p-8">
        {/* Title & Description */}
        <div className="text-center mb-6">
          <h1 className="font-headline-sm text-xl font-bold text-on-surface tracking-tight">
            {authMode === 'signin' ? 'Portal Authentication' : 'Create an Account'}
          </h1>
          <p className="text-xs text-secondary mt-1">
            {authMode === 'signin'
              ? 'Select your role and sign in with your credentials.'
              : 'Register your dynamic profile with verified cryptographic access.'}
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Create Account */}
        <div className="grid grid-cols-2 p-1 mb-5 rounded-xl bg-surface-container border border-surface-container-high text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setAuthError(null);
            }}
            className={`py-2 rounded-lg transition-all text-center ${
              authMode === 'signin'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setAuthError(null);
            }}
            className={`py-2 rounded-lg transition-all text-center ${
              authMode === 'register'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Role Selector Tabs (College, Student, Recruiter) */}
        <div className="mb-5 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
            Select Portal Role
          </span>
          <div className="grid grid-cols-3 gap-2">
            {/* 1. College */}
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                selectedRole === 'admin' || selectedRole === 'university_admin'
                  ? 'bg-primary/10 border-primary text-primary shadow-xs font-bold'
                  : 'bg-surface-container-lowest border-surface-container text-secondary hover:border-primary/40'
              }`}
            >
              <Building className="w-4 h-4 text-primary" />
              <span className="text-xs">College</span>
            </button>

            {/* 2. Student */}
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                selectedRole === 'student'
                  ? 'bg-primary/10 border-primary text-primary shadow-xs font-bold'
                  : 'bg-surface-container-lowest border-surface-container text-secondary hover:border-primary/40'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-secondary" />
              <span className="text-xs">Student</span>
            </button>

            {/* 3. Recruiter */}
            <button
              type="button"
              onClick={() => setSelectedRole('validator')}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                selectedRole === 'validator' || selectedRole === 'verifier'
                  ? 'bg-primary/10 border-primary text-primary shadow-xs font-bold'
                  : 'bg-surface-container-lowest border-surface-container text-secondary hover:border-primary/40'
              }`}
            >
              <Briefcase className="w-4 h-4 text-amber-700" />
              <span className="text-xs">Recruiter</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {authSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{authSuccess}</span>
          </div>
        )}

        {/* Dynamic Credentials Form */}
        <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3.5 text-xs">
          {/* User Full Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-on-surface block">
                Full Name {authMode === 'signin' ? <span className="text-outline font-normal">(Optional display name)</span> : <span className="text-primary">*</span>}
              </label>
            </div>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required={authMode === 'register'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="font-semibold text-on-surface block mb-1">
              Email Address <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="font-semibold text-on-surface block mb-1">
              Password <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full h-10 pl-9 pr-10 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Registration Mode Additional Metadata */}
          {authMode === 'register' && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label className="font-semibold text-on-surface block mb-1">Institution / Organization</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Stanford University"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
                />
              </div>

              {selectedRole === 'student' && (
                <div className="flex-1">
                  <label className="font-semibold text-on-surface block mb-1">Student ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. SU-2026-001"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:border-brand-teal focus:bg-surface-container-lowest focus:outline-none transition-all"
                  />
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full h-10 mt-2 font-semibold shadow-xs"
          >
            {authMode === 'signin'
              ? `Sign In to ${getRoleDisplayName(selectedRole)} Portal`
              : `Create ${getRoleDisplayName(selectedRole)} Account`}
          </Button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-5 text-center flex items-center justify-between text-xs">
          <Link to="/" className="text-secondary hover:text-primary transition-colors">
            ← Return to Home
          </Link>
          <Link to="/verify" className="text-primary hover:underline font-medium">
            Public Verifier →
          </Link>
        </div>
      </div>
    </div>
  );
};
