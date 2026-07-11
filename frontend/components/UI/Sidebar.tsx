'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: '\ud83c\udf0d', label: 'Dashboard' },
  { href: '/forecast', icon: '\ud83d\udcc8', label: 'Forecasts' },
  { href: '/stress', icon: '\u26a1', label: 'Stress Scores' },
  { href: '/map', icon: '\ud83d\uddfa\ufe0f', label: 'Europe Map' },
  { href: '/assistant', icon: '\ud83e\udd16', label: 'AI Assistant' },
  { href: '/simulator', icon: '\ud83d\udd04', label: 'Simulator' },
  { href: '/api-access', icon: '\ud83d\udd11', label: 'API Access' },
  { href: '/settings', icon: '\u2699\ufe0f', label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { close(); }, [pathname, close]);

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && <div className="sidebar-backdrop" onClick={close} aria-hidden="true" />}

      <aside className={`tei-sidebar ${open ? 'sidebar-open' : ''}`} aria-label="Main navigation">
        <div className="sb-logo">
          <div className="sb-logo__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#sb-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs><linearGradient id="sb-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="var(--color-accent)" /><stop offset="100%" stopColor="var(--color-accent-secondary)" /></linearGradient></defs>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <h1 className="sb-logo__text">Tourism Energy</h1>
            <p className="sb-logo__sub">Intelligence Platform</p>
          </div>
        </div>

        <nav className="sb-nav" aria-label="Page sections">
          <div className="sb-nav__group">
            <span className="sb-nav__label">Overview</span>
            {navItems.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                {pathname === item.href && <span className="nav-item__indicator" />}
              </Link>
            ))}
          </div>
          <div className="sb-nav__group">
            <span className="sb-nav__label">Tools</span>
            {navItems.slice(4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                {pathname === item.href && <span className="nav-item__indicator" />}
              </Link>
            ))}
          </div>
        </nav>

        <div className="sb-footer">
          <div className="sb-footer__status">
            <div className="live-dot" aria-hidden="true" />
            <span>Live Data</span>
          </div>
          <span className="sb-footer__flag" aria-hidden="true">{'\ud83c\uddea\ud83c\uddfa'}</span>
        </div>
      </aside>
    </>
  );
}
