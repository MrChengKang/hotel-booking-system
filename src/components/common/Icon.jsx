export default function Icon({ name, size = 24, ...props }) {
  const paths = {
    bed: <><path d="M3 21V8m18 13V8M3 17h18M3 13h18v4M5 13V5h14v8M7 9h3v4m4-4h3v4" /></>,
    bath: <><path d="M3 12h18v4a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Zm2 0V5a3 3 0 0 1 6 0M6 21v2m12-2v2" /></>,
    wifi: <><path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-10 4a5 5 0 0 1 6 0"/><circle cx="12" cy="20" r="1" /></>,
    coffee: <><path d="M4 9h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm13 0h2a3 3 0 0 1 0 6h-2M3 23h16M7 2v3m4-4v4m4-3v3" /></>,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 22h8m-4-5v5" /></>,
    wind: <><path d="M2 8h13a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M2 17h7a3 3 0 1 1-3 3" /></>,
    share: <><path d="M12 16V2m-4 4 4-4 4 4M7 10H4v12h16V10h-3" /></>,
    user: <><circle cx="12" cy="7" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3" /></>,
    clipboard: <><rect x="4" y="4" width="16" height="18" rx="3" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M8 11h8m-8 5h5" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4.2 4.2l1.5 1.5m12.6 12.6 1.5 1.5M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" /></>,
    moon: <path d="M21 13A9 9 0 0 1 11 3 9 9 0 1 0 21 13Z" />,
    bulb: <><path d="M8 17c0-3-3-4-3-8a7 7 0 0 1 14 0c0 4-3 5-3 8Zm1 3h6m-5 3h4M2 8H0m24 0h-2M4 2 2 0m18 2 2-2" /></>,
    help: <><circle cx="12" cy="12" r="10" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01" /></>,
    logout: <><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4m6-13 5 5-5 5m-7-5h12" /></>,
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="7.5" />
        <path d="m16.5 16.5 5 5" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.8" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 2v6m10-6v6M3 11h18" />
      </>
    ),
    guests: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M2 21v-3a7 7 0 0 1 14 0v3Zm17-15v8m-4-4h8" />
      </>
    ),
    chevron: <path d="m9 5 7 7-7 7" />,
    down: <path d="m6 9 6 6 6-6" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18" />
      </>
    ),
    bell: (
      <>
        <path d="M5 10a7 7 0 0 1 14 0v5l2 3H3l2-3Zm5 11h4" />
      </>
    ),
    money: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M5 9h1m12 6h1" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
