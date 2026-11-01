/* The few icons the site uses, inline, instead of a whole icon font. */
import type { ReactNode } from 'react';

function Icon({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      {children}
    </svg>
  );
}

export function EnvelopeIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M3 5h18a1.5 1.5 0 0 1 1.5 1.5v.7L12 13.4 1.5 7.2v-.7A1.5 1.5 0 0 1 3 5Zm-1.5 4.5v8A1.5 1.5 0 0 0 3 19h18a1.5 1.5 0 0 0 1.5-1.5v-8L12 15.6Z" /></Icon>;
}

export function ClockIcon({ size }: { size?: number }) {
  return <Icon size={size}><path fillRule="evenodd" d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21Zm1.2 5h-2.4v6.2l4.6 3.4 1.4-1.9-3.6-2.7Z" /></Icon>;
}

export function PhoneIcon({ size }: { size?: number }) {
  return <Icon size={size}><path fillRule="evenodd" d="M8 1.5h8A2.5 2.5 0 0 1 18.500 4v16a2.500 2.500 0 0 1-2.500 2.500H8A2.500 2.500 0 0 1 5.500 20V4A2.500 2.500 0 0 1 8 1.500Zm4 18a1.200 1.200 0 1 0 0 2.400 1.200 1.200 0 0 0 0-2.400Z" /></Icon>;
}

export function SpinnerIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="3.500" r="2.200" /><circle cx="18" cy="6" r="1.900" /><circle cx="20.500" cy="12" r="1.700" />
      <circle cx="18" cy="18" r="1.500" /><circle cx="12" cy="20.500" r="2.200" /><circle cx="6" cy="18" r="1.900" />
      <circle cx="3.500" cy="12" r="1.700" /><circle cx="6" cy="6" r="1.500" />
    </Icon>
  );
}

export function BellIcon({ off, size }: { off?: boolean; size?: number }) {
  return (
    <Icon size={size}>
      <path d="M12 2.500a1.500 1.500 0 0 0-1.500 1.500v.6A6.500 6.500 0 0 0 5.500 11v4.200L3.500 18v1h17v-1l-2-2.800V11a6.500 6.500 0 0 0-5-6.400V4A1.500 1.500 0 0 0 12 2.500ZM9.500 20.500a2.500 2.500 0 0 0 5 0Z" />
      {off && <path d="m3.700 2.300 18 18-1.400 1.400-18-18Z" />}
    </Icon>
  );
}

export function MoonIcon({ size }: { size?: number }) {
  return <Icon size={size}><path d="M20.500 14.700A9 9 0 0 1 9.300 3.500a9 9 0 1 0 11.200 11.200Z" /></Icon>;
}

export function SunIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="4.800" />
      <path d="M11 1.500h2v3.200h-2Zm0 17.800h2v3.200h-2ZM1.500 11h3.200v2H1.500Zm17.800 0h3.200v2h-3.200ZM4 2.600l2.300 2.300-1.400 1.400L2.600 4Zm15.100 15.100 2.300 2.300-1.400 1.400-2.300-2.300ZM2.600 20l2.300-2.300 1.400 1.400L4 21.400ZM17.700 4.900 20 2.600 21.400 4l-2.300 2.300Z" />
    </Icon>
  );
}
