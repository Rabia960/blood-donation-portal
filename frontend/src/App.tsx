import { useMemo, useState, type ReactNode } from "react";

type IconName =
  | "grid"
  | "search"
  | "heart"
  | "calendar"
  | "history"
  | "bell"
  | "phone"
  | "pin"
  | "clock"
  | "arrow"
  | "menu"
  | "close"
  | "drop";

const paths: Record<IconName, ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z" />
  ),
  pin: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  drop: <path d="M12 2.7s-6 6.7-6 11a6 6 0 0 0 12 0c0-4.3-6-11-6-11Z" />,
};

function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const bloodTypes = [
  { type: "A+", units: 12, status: "Available", tone: "green" },
  { type: "A−", units: 4, status: "Low stock", tone: "amber" },
  { type: "B+", units: 8, status: "Available", tone: "green" },
  { type: "B−", units: 2, status: "Critical", tone: "red" },
  { type: "AB+", units: 6, status: "Available", tone: "green" },
  { type: "AB−", units: 1, status: "Critical", tone: "red" },
  { type: "O+", units: 15, status: "Available", tone: "green" },
  { type: "O−", units: 3, status: "Low stock", tone: "amber" },
];

const centers = [
  {
    initials: "CG",
    name: "City General Hospital",
    need: "O−",
    distance: "1.2 km away",
    hours: "Open 24 hours",
  },
  {
    initials: "RC",
    name: "Red Cross Donation Center",
    need: "B−",
    distance: "2.8 km away",
    hours: "Open until 8:00 PM",
  },
  {
    initials: "SM",
    name: "St. Mary’s Medical Center",
    need: "AB−",
    distance: "4.1 km away",
    hours: "Open until 10:00 PM",
  },
];

const navItems: { label: string; icon: IconName }[] = [
  { label: "Overview", icon: "grid" },
  { label: "Find blood", icon: "search" },
  { label: "Donate blood", icon: "heart" },
  { label: "Appointments", icon: "calendar" },
  { label: "Donation history", icon: "history" },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="logo-mark">
        <Icon name="drop" size={23} />
      </div>
      <div>
        <div className="text-[18px] font-extrabold leading-none tracking-[-0.04em]">LifeFlow</div>
        <div className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.24em] text-stone-400">
          Blood Network
        </div>
      </div>
    </div>
  );
}

function App() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("All types");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<{ title: string; detail: string } | null>(null);

  const filteredBlood =
    filter === "All types" ? bloodTypes : bloodTypes.filter((blood) => blood.status === filter);
  const filteredCenters = useMemo(
    () => centers.filter((center) => center.name.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const selectNav = (label: string) => {
    setActiveNav(label);
    setMenuOpen(false);
    if (label !== "Overview") {
      setDialog({
        title: label,
        detail: `Your ${label.toLowerCase()} workspace is ready to explore.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-[#171716]">
      <header className="mobile-header">
        <Logo />
        <div className="flex items-center gap-2">
          <button className="icon-button" aria-label="Notifications">
            <Icon name="bell" size={19} />
            <span className="notification-dot" />
          </button>
          <button
            className="icon-button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? "close" : "menu"} size={21} />
          </button>
        </div>
      </header>

      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="px-7 pt-8">
          <Logo />
        </div>
        <nav className="mt-14 space-y-1.5 px-4" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activeNav === item.label ? "nav-item-active" : ""}`}
              onClick={() => selectNav(item.label)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="support-card">
          <div className="support-accent" />
          <div className="relative z-10">
            <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
              <Icon name="phone" size={17} />
            </div>
            <h3 className="font-bold text-white">Need help?</h3>
            <p className="mt-2 text-[12px] leading-5 text-stone-400">
              Our support line is available around the clock.
            </p>
            <a
              href="tel:18005433569"
              className="mt-3 inline-block text-[12px] font-bold text-white underline underline-offset-4"
            >
              Call 1-800-LIFEFLOW
            </a>
          </div>
        </div>
      </aside>

      <main className="main-shell">
        <section className="topbar">
          <div>
            <p className="text-[12px] font-medium text-stone-400">Wednesday, May 14</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold tracking-[-0.04em]">
              Good morning, Alex
            </h1>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <button className="icon-button" aria-label="Notifications">
              <Icon name="bell" size={20} />
              <span className="notification-dot" />
            </button>
            <div className="mx-1 h-8 w-px bg-stone-200" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8e2dc] text-[12px] font-bold">
              AM
            </div>
            <span className="text-[14px] font-bold">Alex Morgan</span>
          </div>
        </section>

        <div className="content">
          <section className="hero">
            <div className="hero-rings" />
            <div className="relative z-10 max-w-[580px]">
              <div className="emergency-pill">
                <span />
                Emergency appeal
              </div>
              <h2 className="mt-6 text-[40px] font-extrabold leading-[1.04] tracking-[-0.055em] sm:text-[48px]">
                Your blood can save
                <br />a life today.
              </h2>
              <p className="mt-4 max-w-[560px] text-[14px] leading-6 text-white/78 sm:text-[15px]">
                Local hospitals urgently need O−, B−, and AB− blood. One donation can help save up
                to three lives.
              </p>
            </div>
            <div className="relative z-10 flex w-full flex-col gap-3 sm:w-[235px]">
              <button
                className="hero-button hero-button-primary"
                onClick={() =>
                  setDialog({
                    title: "Schedule a donation",
                    detail: "Choose a nearby center and a convenient time to make your donation.",
                  })
                }
              >
                Schedule donation <Icon name="arrow" size={17} />
              </button>
              <button
                className="hero-button hero-button-secondary"
                onClick={() =>
                  setDialog({
                    title: "Emergency blood request",
                    detail:
                      "We’ll help you connect with the closest verified blood center immediately.",
                  })
                }
              >
                Request emergency blood
              </button>
            </div>
          </section>

          <section className="mt-9">
            <div className="section-heading">
              <div>
                <div className="flex items-center gap-3">
                  <h2>Blood availability</h2>
                  <span className="live-badge">
                    <span />
                    Live
                  </span>
                </div>
                <p>Updated 3 minutes ago across nearby centers</p>
              </div>
              <select
                aria-label="Filter blood availability"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option>All types</option>
                <option>Available</option>
                <option>Low stock</option>
                <option>Critical</option>
              </select>
            </div>

            <div className="blood-grid">
              {filteredBlood.map((blood) => (
                <article
                  className={`blood-card ${blood.tone === "red" ? "blood-card-critical" : ""}`}
                  key={blood.type}
                >
                  <div className="flex items-start justify-between">
                    <div className={`drop-box ${blood.tone === "red" ? "drop-box-critical" : ""}`}>
                      <Icon name="drop" size={19} />
                    </div>
                    <span className={`status-dot status-${blood.tone}`} />
                  </div>
                  <div className="mt-7">
                    <h3>{blood.type}</h3>
                    <p>
                      {blood.units} {blood.units === 1 ? "unit" : "units"}
                    </p>
                    <div className={`status-label text-${blood.tone}`}>{blood.status}</div>
                  </div>
                </article>
              ))}
            </div>
            {filteredBlood.length === 0 && (
              <div className="empty-state">No inventory matches this filter.</div>
            )}
          </section>

          <section className="dashboard-grid">
            <div className="centers-panel">
              <div className="section-heading mb-3">
                <div>
                  <h2>Nearby donation centers</h2>
                  <p>Centers within 5 km of your location</p>
                </div>
                <label className="search-field">
                  <Icon name="search" size={17} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search centers"
                    aria-label="Search donation centers"
                  />
                </label>
              </div>
              <div>
                {filteredCenters.map((center) => (
                  <div className="center-row" key={center.name}>
                    <div className="center-initials">{center.initials}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[14px] font-bold">{center.name}</h3>
                        <span className="need-badge">Needs {center.need}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-400">
                        <span className="flex items-center gap-1">
                          <Icon name="pin" size={13} /> {center.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="clock" size={13} /> {center.hours}
                        </span>
                      </div>
                    </div>
                    <button
                      className="book-button"
                      onClick={() =>
                        setDialog({
                          title: `Book at ${center.name}`,
                          detail: `Select a time to donate at ${center.name}. They currently need ${center.need} blood.`,
                        })
                      }
                    >
                      Book a slot
                    </button>
                  </div>
                ))}
                {filteredCenters.length === 0 && (
                  <div className="empty-state">No centers found for “{query}”.</div>
                )}
              </div>
            </div>

            <aside className="impact-card">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/9 text-[#fb4b59]">
                  <Icon name="heart" size={22} />
                </div>
                <span className="impact-pill">Your impact</span>
              </div>
              <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400">
                Last donation
              </p>
              <h3 className="mt-2 text-[20px] font-extrabold">February 21, 2025</h3>
              <div className="my-6 h-px bg-white/10" />
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <strong>12</strong>
                  <span>Total donations</span>
                </div>
                <div>
                  <strong>36</strong>
                  <span>Lives impacted</span>
                </div>
              </div>
              <div className="eligibility">
                <div className="flex items-center justify-between text-[12px] font-bold">
                  <span>You’re eligible to donate</span>
                  <span className="text-emerald-400">✓</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-full rounded-full bg-[#ed3343]" />
                </div>
              </div>
            </aside>
          </section>
        </div>
      </main>

      {dialog && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setDialog(null)}>
          <div
            className="dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="dialog-close" aria-label="Close" onClick={() => setDialog(null)}>
              <Icon name="close" size={19} />
            </button>
            <div className="dialog-icon">
              <Icon name="drop" size={24} />
            </div>
            <h2 id="dialog-title">{dialog.title}</h2>
            <p>{dialog.detail}</p>
            <button className="dialog-action" onClick={() => setDialog(null)}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
