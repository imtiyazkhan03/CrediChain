import React from 'react';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-surface-container-lowest rounded-xl border border-surface-container shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-outline-variant/60' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 sm:p-5 border-b border-surface-container ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <h3 className={`font-headline-sm text-base sm:text-lg font-semibold text-on-surface tracking-tight ${className}`}>
      {children}
    </h3>
  );
};

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 sm:p-5 border-t border-surface-container bg-surface-container-low/30 rounded-b-xl ${className}`}>
      {children}
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-surface-container-high rounded-md ${className}`} />;
};
