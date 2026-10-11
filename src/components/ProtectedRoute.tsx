import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { role, currentUser } = useAuth();
  const location = useLocation();

  // If user is not authenticated or a visitor without allowed access
  const isVerifierOrVisitor = role === 'verifier';
  if (!currentUser || (isVerifierOrVisitor && !allowedRoles.includes('verifier') && !allowedRoles.includes('validator'))) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization with alias support (university_admin matches admin, etc.)
  const isAuthorized = allowedRoles.some((allowed) => {
    if (allowed === role) return true;
    if (allowed === 'admin' && (role === 'university_admin' || role === 'admin')) return true;
    if (allowed === 'university_admin' && (role === 'university_admin' || role === 'admin')) return true;
    if (
      (allowed === 'validator' || allowed === 'verifier' || allowed === 'authority') &&
      (role === 'validator' || role === 'verifier' || role === 'authority')
    ) {
      return true;
    }
    return false;
  });

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-container-lowest border border-error/30 rounded-2xl p-6 sm:p-8 text-center shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="font-headline-sm text-lg font-bold text-on-surface mb-2">
            Restricted Portal Access
          </h2>
          <p className="text-xs text-secondary leading-relaxed mb-4">
            Your current account role is <span className="font-semibold text-on-surface uppercase">[{role}]</span>, which is not authorized to access this administration view. Required role: <span className="font-semibold text-primary uppercase">[{allowedRoles.join(', ')}]</span>.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to={
                role === 'student'
                  ? '/student/dashboard'
                  : role === 'validator' || role === 'verifier'
                  ? '/recruiter/dashboard'
                  : '/admin/dashboard'
              }
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Your Authorized Dashboard
            </Link>
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center px-4 py-2 rounded-xl bg-surface-container text-xs text-outline font-medium hover:text-on-surface transition-colors"
            >
              Switch Account in Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
