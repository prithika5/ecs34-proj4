const baseProps = {
  viewBox: "0 0 64 64",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
};

function Face() {
  return (
    <>
      <circle cx="25" cy="31" r="2.4" fill="#111111" />
      <circle cx="39" cy="31" r="2.4" fill="#111111" />
      <path d="M27 40.5C28.6 42.2 30.2 43 32 43C33.8 43 35.4 42.2 37 40.5" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="20.5" cy="37.5" r="2.4" fill="#F8D7E4" />
      <circle cx="43.5" cy="37.5" r="2.4" fill="#F8D7E4" />
    </>
  );
}

export default function CuteCampusIcon({ variant, className = "", title }) {
  if (variant === "cow_lab") {
    return (
      <svg {...baseProps} className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
        {title ? <title>{title}</title> : null}
        <path d="M32 7C21.5 7 13 15.1 13 25.1C13 40.8 24.8 46.8 31.1 56.2C31.5 56.8 32.5 56.8 32.9 56.2C39.2 46.8 51 40.8 51 25.1C51 15.1 42.5 7 32 7Z" fill="#FFFFFF" stroke="#111111" strokeWidth="4.4" strokeLinejoin="round" />
        <path d="M18 15.2L24 18.6L20.7 23.3C16.7 22.9 14 19.9 14.3 16.7L18 15.2Z" fill="#F6B7D2" stroke="#111111" strokeWidth="3" strokeLinejoin="round" />
        <path d="M46 15.2L40 18.6L43.3 23.3C47.3 22.9 50 19.9 49.7 16.7L46 15.2Z" fill="#F6B7D2" stroke="#111111" strokeWidth="3" strokeLinejoin="round" />
        <path d="M22 11.5C21.4 7.4 19.4 5.7 17.2 5" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
        <path d="M42 11.5C42.6 7.4 44.6 5.7 46.8 5" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
        <path d="M31 13C22.1 12.2 17 16.9 17 22.3C17 26.4 19.4 31 24.4 31H28.6C31.2 31 33.2 28.9 33.2 26.3V18.6C33.2 16 35.4 13.4 38.5 12.8L31 13Z" fill="#111111" />
        <path d="M36.3 21.2C41.4 20.4 45.4 24.3 45.4 29.7C45.4 35.7 40.8 39 36.7 39H34.8C33.2 39 31.9 37.7 31.9 36.1V25.9C31.9 23.6 33.9 21.6 36.3 21.2Z" fill="#111111" />
        <path d="M31.8 31H35.4C38.6 31 41.2 33.6 41.2 36.8V40.3C41.2 43.5 38.6 46.1 35.4 46.1H31.8V31Z" fill="#111111" />
        <ellipse cx="32" cy="35.8" rx="8.2" ry="6.6" fill="#FFC3D7" stroke="#111111" strokeWidth="3" />
        <circle cx="28.8" cy="35.8" r="1.5" fill="#D46B95" />
        <circle cx="35.2" cy="35.8" r="1.5" fill="#D46B95" />
        <circle cx="22.8" cy="29.5" r="2.2" fill="#111111" />
        <circle cx="37.4" cy="29.5" r="2.2" fill="#FFFFFF" />
        <circle cx="38.4" cy="28.6" r="0.7" fill="#111111" />
        <path d="M41.5 9V20" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
        <path d="M42.8 10.2L53.4 14.3L42.8 18.4V10.2Z" fill="#12B7C8" stroke="#12B7C8" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M13 52C18.4 46.4 25.8 43.2 32 43.2C38.2 43.2 45.6 46.4 51 52" stroke="#111111" strokeWidth="3" strokeDasharray="1.5 5" strokeLinecap="round" />
      </svg>
    );
  }

  const variants = {
    union: (
      <>
        <rect x="11" y="18" width="42" height="30" rx="10" fill="#FFFFFF" stroke="#111111" strokeWidth="3.6" />
        <path d="M16 27H48" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
        <path d="M18 36H28" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
        <path d="M36 36H46" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
        <path d="M27 18L32 11L37 18" stroke="#111111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <Face />
      </>
    ),
    library: (
      <>
        <rect x="12" y="16" width="40" height="34" rx="12" fill="#FFFFFF" stroke="#111111" strokeWidth="3.6" />
        <rect x="18" y="21" width="7" height="24" rx="3.5" fill="#B8E7EE" stroke="#111111" strokeWidth="2.5" />
        <rect x="28.5" y="19" width="7" height="26" rx="3.5" fill="#FFFFFF" stroke="#111111" strokeWidth="2.5" />
        <rect x="39" y="23" width="7" height="22" rx="3.5" fill="#F8D7E4" stroke="#111111" strokeWidth="2.5" />
        <Face />
      </>
    ),
    silo: (
      <>
        <rect x="15" y="20" width="34" height="28" rx="12" fill="#FFFFFF" stroke="#111111" strokeWidth="3.6" />
        <rect x="25" y="11" width="14" height="12" rx="5" fill="#B8E7EE" stroke="#111111" strokeWidth="3" />
        <path d="M21 48C22.2 53.1 26 57 32 57C38 57 41.8 53.1 43 48" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
        <Face />
      </>
    ),
    arc: (
      <>
        <rect x="12" y="18" width="40" height="30" rx="14" fill="#FFFFFF" stroke="#111111" strokeWidth="3.6" />
        <path d="M20 40C23 31 27.7 26 32 26C36.3 26 41 31 44 40" stroke="#111111" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="24" cy="24" r="3" fill="#B8E7EE" stroke="#111111" strokeWidth="2.2" />
        <circle cx="40" cy="24" r="3" fill="#F8D7E4" stroke="#111111" strokeWidth="2.2" />
        <Face />
      </>
    ),
    mondavi: (
      <>
        <rect x="12" y="18" width="40" height="28" rx="12" fill="#FFFFFF" stroke="#111111" strokeWidth="3.6" />
        <path d="M20 32L27 26V38L20 32Z" fill="#F8D7E4" stroke="#111111" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M44 32L37 26V38L44 32Z" fill="#B8E7EE" stroke="#111111" strokeWidth="2.6" strokeLinejoin="round" />
        <Face />
      </>
    ),
    west_village: (
      <>
        <rect x="12" y="22" width="40" height="26" rx="12" fill="#FFFFFF" stroke="#111111" strokeWidth="3.6" />
        <path d="M17 22L32 11L47 22" stroke="#111111" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="27" y="33" width="10" height="15" rx="5" fill="#B8E7EE" stroke="#111111" strokeWidth="2.5" />
        <Face />
      </>
    ),
    research: (
      <>
        <rect x="13" y="18" width="38" height="30" rx="12" fill="#FFFFFF" stroke="#111111" strokeWidth="3.6" />
        <path d="M24 24H40" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
        <path d="M20 32H44" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
        <path d="M26 40H38" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
        <Face />
      </>
    ),
    walk: (
      <>
        <circle cx="32" cy="14" r="6.5" fill="#FFFFFF" stroke="#111111" strokeWidth="3" />
        <path d="M32 21V33" stroke="#111111" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M32 24L24 29" stroke="#111111" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M32 24L40 28" stroke="#111111" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M32 33L25 47" stroke="#111111" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M32 33L40 47" stroke="#111111" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="29.5" cy="13.4" r="1.1" fill="#111111" />
        <circle cx="34.5" cy="13.4" r="1.1" fill="#111111" />
        <circle cx="26" cy="18.5" r="2" fill="#F8D7E4" />
        <circle cx="38" cy="18.5" r="2" fill="#F8D7E4" />
      </>
    ),
    bike: (
      <>
        <circle cx="19" cy="41" r="9" fill="#FFFFFF" stroke="#111111" strokeWidth="3" />
        <circle cx="45" cy="41" r="9" fill="#FFFFFF" stroke="#111111" strokeWidth="3" />
        <path d="M19 41L28 25L36 41H24" stroke="#111111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M36 41L45 41L38 25H29" stroke="#111111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="33" cy="16" r="6.5" fill="#FFFFFF" stroke="#111111" strokeWidth="3" />
        <path d="M33 22.5L29 29" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
        <path d="M33 22.5L40 27" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
        <circle cx="30.5" cy="15.6" r="1.1" fill="#111111" />
        <circle cx="35.5" cy="15.6" r="1.1" fill="#111111" />
        <circle cx="28.3" cy="19.4" r="1.8" fill="#F8D7E4" />
        <circle cx="37.7" cy="19.4" r="1.8" fill="#F8D7E4" />
      </>
    ),
    shuttle: (
      <>
        <rect x="11" y="18" width="42" height="24" rx="10" fill="#FFFFFF" stroke="#111111" strokeWidth="3.4" />
        <path d="M18 26H46" stroke="#111111" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="21" cy="45" r="5" fill="#FFFFFF" stroke="#111111" strokeWidth="3" />
        <circle cx="43" cy="45" r="5" fill="#FFFFFF" stroke="#111111" strokeWidth="3" />
        <rect x="17" y="21" width="11" height="10" rx="4" fill="#B8E7EE" stroke="#111111" strokeWidth="2.2" />
        <rect x="32" y="21" width="14" height="10" rx="4" fill="#F8D7E4" stroke="#111111" strokeWidth="2.2" />
        <Face />
      </>
    )
  };

  return (
    <svg {...baseProps} className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title ? <title>{title}</title> : null}
      {variants[variant] || variants.union}
    </svg>
  );
}
