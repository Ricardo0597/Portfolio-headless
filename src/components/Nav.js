'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: null, external: '/', label: '← Portfolio' },
  { href: '/', label: 'Headless' },
  { href: '/constellation', label: 'Constellation' },
  { href: '/search', label: 'Ask My Portfolio' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav style={{
      display: 'flex',
      gap: '0',
      padding: '6px 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      fontSize: '11px',
      fontFamily: 'JetBrains Mono, monospace',
      flexWrap: 'wrap',
    }}>
      {LINKS.map((link, i) => {
        const isActive = link.href !== null && pathname === link.href;
        const style = {
          color: isActive ? 'var(--accent)' : 'var(--text-muted)',
          textDecoration: 'none',
          padding: '2px 8px',
          transition: 'color 0.15s',
        };

        const el = link.external
          ? <a key={link.label} href={link.external} style={style}>{link.label}</a>
          : <Link key={link.label} href={link.href} style={style}>{link.label}</Link>;

        return (
          <span key={link.label} style={{ display: 'flex', alignItems: 'center' }}>
            {el}
            {i < LINKS.length - 1 && (
              <span style={{ color: 'var(--border)', userSelect: 'none' }}>/</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
