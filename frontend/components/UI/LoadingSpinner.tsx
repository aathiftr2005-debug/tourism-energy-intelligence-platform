'use client';

interface Props {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export default function LoadingSpinner({ size = 'md' }: Props) {
  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-transparent`}
      style={{ borderTopColor: '#00d4ff', borderRightColor: '#00d4ff', filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.3))' }}
    />
  );
}
