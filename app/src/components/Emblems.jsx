import React from 'react';

export function Mask({filled=true,className='',...props}){return <svg className={`mask ${className}`} viewBox="0 0 32 42" aria-hidden="true" {...props}><rect x="5" y="8" width="22" height="27" rx="3" fill={filled?'currentColor':'none'} stroke="currentColor" strokeWidth="2"/><path d="m7 10 18 23M25 10 7 33M12 8V4h8v4" stroke={filled?'#705371':'currentColor'} strokeWidth="1.5"/></svg>;}

export function LumenSpool({ value = 75, className = '' }) {
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <circle cx="32" cy="32" r="27" stroke="currentColor" strokeOpacity=".25" strokeWidth="1" />
    <circle cx="32" cy="32" r="23" stroke="currentColor" strokeOpacity=".75" strokeWidth="1.5" strokeDasharray={`${value * 1.445} 145`} transform="rotate(-90 32 32)" />
    <path d="M26 19C37 15 48 29 42 41C37 51 19 41 20 30C22 18 42 21 43 32C44 45 25 45 23 33C23 23 40 20 42 34C42 43 29 46 26 36C22 23 35 16 41 28C46 38 35 46 29 39" stroke="currentColor" strokeWidth="1.6" />
    <path d="M32 1 34 6 32 10 30 6ZM32 54 34 58 32 63 30 58ZM1 32 6 30 10 32 6 34ZM54 32 58 30 63 32 58 34Z" fill="currentColor" />
  </svg>;
}

export function Prism({className='',...props}){return <svg viewBox="0 0 52 52" className={className} {...props} fill="none" aria-hidden="true"><path d="m26 7 17 31H9Z" stroke="currentColor" strokeWidth="2"/><path d="m26 7-6 31m6-31 8 31M9 38l17 8 17-8" stroke="currentColor"/><circle cx="26" cy="29" r="4" fill="currentColor"/></svg>;}

export function Thread({ className = '' }) {
  return <svg viewBox="0 0 52 52" className={className} fill="none" aria-hidden="true">
    <path d="M7 37C10 17 36 9 39 23C41 36 18 43 16 29C13 17 36 9 41 19C48 35 22 42 23 25C23 11 39 12 45 7M13 44 39 9" stroke="currentColor" strokeWidth="1.3" />
  </svg>;
}

export function Rosary({ className = '' }) {
  return <svg className={className} viewBox="0 0 30 34" fill="none" aria-hidden="true">
    <path d="m15 2 10 9-2 14-8 7-9-7-2-14Z" stroke="currentColor" strokeWidth="1.3" />
    <path d="m15 2-3 12 3 18 3-18ZM5 11l7 3 13-3M6 25l6-11 11 11" stroke="currentColor" strokeWidth="1" />
  </svg>;
}

export function Ornament({ className = '' }) {
  return <svg viewBox="0 0 150 20" fill="none" className={className} aria-hidden="true">
    <path d="M0 10H54L63 4 72 10 63 16 54 10M150 10H96L87 4 78 10 87 16 96 10M75 2 80 10 75 18 70 10Z" stroke="currentColor" strokeWidth=".8" />
  </svg>;
}

export function BellMark({ filled = false, className = '' }) {
  return <svg viewBox="0 0 36 42" fill="none" className={className} aria-hidden="true">
    <path d="M18 3v5M11 13q7-10 14 0c-1 6 0 12 6 18q-13 7-26 0c6-6 7-12 6-18Z" stroke="currentColor" fill={filled ? 'currentColor' : 'none'} fillOpacity=".15" strokeWidth="1.4" />
    <path d="M8 29q10 6 20 0M18 35v5M14 13l-2 10" stroke="currentColor" strokeWidth="1.2" />
  </svg>;
}
