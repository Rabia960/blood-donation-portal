import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getDashboard,
  getDonations,
  getDonors,
  getCenters,
  registerDonor,
  getCurrentLocation,
  getNearbyDonors,
  getNearbyDonorsForRequest,
  submitBloodRequest,
  type DashboardData,
  type Donation,
  type Donor,
  type Center,
  type DonorInput,
  type GPSLocation,
  type NearbyDonor,
  type NearbyCenter,
  type BloodRequestInput,
} from "./api";
import CentersMap from "./components/CentersMap";
import AppointmentsPanel from "./components/AppointmentsPanel";

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
        <div className="text-[18px] font-extrabold leading-none tracking-[-0.04em]">
          LifeFlow
        </div>
        <div className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.24em] text-stone-400">
          Blood Network
        </div>
      </div>
    </div>
  );
}

function calculateDistanceKm(a: GPSLocation, b: GPSLocation): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDifference = toRadians(b.latitude - a.latitude);
  const longitudeDifference = toRadians(b.longitude - a.longitude);
  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) *
      Math.cos(toRadians(b.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function App() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("All types");
  const [query, setQuery] = useState("");

  const [dialog, setDialog] = useState<{
    title: string;
    detail: string;
  } | null>(null);

  const [donorSubmitting, setDonorSubmitting] = useState(false);
  const [donorMessage, setDonorMessage] = useState("");
  const [donorError, setDonorError] = useState("");
  const [donorLocation, setDonorLocation] = useState<GPSLocation | null>(null);
  const [donorLocationMessage, setDonorLocationMessage] = useState("");
  const [donorLocationLoading, setDonorLocationLoading] = useState(false);

  const [searchLocation, setSearchLocation] = useState<GPSLocation | null>(null);
  const [nearbyDonors, setNearbyDonors] = useState<NearbyDonor[]>([]);
  const [donorSearchLoading, setDonorSearchLoading] = useState(false);
  const [donorSearchError, setDonorSearchError] = useState("");
  const [searchBloodGroup, setSearchBloodGroup] = useState("");
  const [searchRadius, setSearchRadius] = useState("10");

  const [nearbyCenters, setNearbyCenters] = useState<NearbyCenter[]>([]);
  const [centerUserLocation, setCenterUserLocation] = useState<GPSLocation | null>(null);
  const [centerSearchLoading, setCenterSearchLoading] = useState(false);
  const [centerSearchError, setCenterSearchError] = useState("");

  const [requestLocation, setRequestLocation] = useState<GPSLocation | null>(null);
  const [requestLocationMessage, setRequestLocationMessage] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestDonors, setRequestDonors] = useState<NearbyDonor[]>([]);

  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationDonors, setDonationDonors] = useState<Donor[]>([]);
  const [donationLoading, setDonationLoading] = useState(false);
  const [donationError, setDonationError] = useState("");

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [dashboardData, centerData] = await Promise.all([
          getDashboard(),
          getCenters(),
        ]);

        if (!cancelled) {
          setDashboard(dashboardData);
          setCenters(centerData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load dashboard data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const bloodTypes = bloodGroups.map((type) => {
    const units = dashboard?.inventory_by_blood_group[type] ?? 0;

    const status = !dashboard
      ? loading
        ? "Loading"
        : "Unavailable"
      : units <= 2
        ? "Critical"
        : units <= 4
          ? "Low stock"
          : "Available";

    const tone = !dashboard || units <= 4 ? "amber" : "green";

    return {
      type: type.replace("-", "−"),
      units,
      status,
      tone: dashboard && units <= 2 ? "red" : tone,
    };
  });

  const filteredBlood =
    filter === "All types"
      ? bloodTypes
      : bloodTypes.filter((blood) => blood.status === filter);

  const filteredCenters = useMemo(
    () =>
      centers.filter((center) =>
        `${center.name} ${center.city} ${center.address}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [centers, query]
  );

  const orderedCenters = useMemo(() => {
    const matchingIds = new Set(filteredCenters.map((center) => center.id));
    const nearby = nearbyCenters.filter((center) => matchingIds.has(center.id));
    const nearbyIds = new Set(nearby.map((center) => center.id));
    const remaining = filteredCenters.filter((center) => !nearbyIds.has(center.id));
    return [...nearby, ...remaining];
  }, [nearbyCenters, filteredCenters]);

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  // ---------------- GPS ACTIONS ----------------

  const detectDonorLocation = async () => {
    setDonorLocationLoading(true);
    setDonorLocationMessage("");
    setDonorError("");

    try {
      const location = await getCurrentLocation();
      setDonorLocation(location);
      setDonorLocationMessage("Your location has been captured.");
    } catch (err) {
      setDonorLocationMessage(
        err instanceof Error ? err.message : "Could not detect your location."
      );
    } finally {
      setDonorLocationLoading(false);
    }
  };

  const detectSearchLocation = async () => {
    setDonorSearchLoading(true);
    setDonorSearchError("");
    setNearbyDonors([]);

    try {
      const location = await getCurrentLocation();
      setSearchLocation(location);

      const results = await getNearbyDonors(
        location,
        Number(searchRadius),
        searchBloodGroup || undefined
      );

      setNearbyDonors(results);
    } catch (err) {
      setDonorSearchError(
        err instanceof Error ? err.message : "Nearby donor search failed."
      );
    } finally {
      setDonorSearchLoading(false);
    }
  };

  const searchNearbyCenters = async () => {
    setCenterSearchLoading(true);
    setCenterSearchError("");

    try {
      const location = await getCurrentLocation();
      setCenterUserLocation(location);

      // Only centres with verified coordinates are eligible for distance sorting.
      const results: NearbyCenter[] = centers
        .filter(
          (center) =>
            center.active &&
            center.location_verified &&
            center.latitude !== null &&
            center.longitude !== null
        )
        .map((center) => ({
          ...center,
          distance_km: calculateDistanceKm(location, {
            latitude: center.latitude as number,
            longitude: center.longitude as number,
          }),
        }))
        .filter((center) => center.distance_km <= 25)
        .sort((a, b) => a.distance_km - b.distance_km);

      setNearbyCenters(results);
    } catch (err) {
      setCenterUserLocation(null);
      setNearbyCenters([]);
      setCenterSearchError(
        err instanceof Error ? err.message : "Nearby center search failed."
      );
    } finally {
      setCenterSearchLoading(false);
    }
  };

  const detectRequestLocation = async () => {
    setRequestLocationMessage("");

    try {
      const location = await getCurrentLocation();
      setRequestLocation(location);
      setRequestLocationMessage("Emergency location captured.");
    } catch (err) {
      setRequestLocationMessage(
        err instanceof Error ? err.message : "Could not detect your location."
      );
    }
  };

  // ---------------- DONOR REGISTRATION ----------------

  const handleDonorSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const donor: DonorInput = {
      full_name: String(form.get("full_name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      blood_group: String(form.get("blood_group") || ""),
      city: String(form.get("city") || ""),
      age: Number(form.get("age")),
      latitude: donorLocation?.latitude ?? null,
      longitude: donorLocation?.longitude ?? null,
    };

    setDonorSubmitting(true);
    setDonorMessage("");
    setDonorError("");

    try {
      await registerDonor(donor);

      setDonorMessage("Registration successful!");
      formElement.reset();
      setDonorLocation(null);
      setDonorLocationMessage("");
      setDashboard(await getDashboard());
    } catch (err) {
      setDonorError(
        err instanceof Error ? err.message : "Registration failed."
      );
    } finally {
      setDonorSubmitting(false);
    }
  };

  // ---------------- EMERGENCY REQUEST ----------------

  const handleEmergencySubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const request: BloodRequestInput = {
      patient_name: String(form.get("patient_name") || ""),
      blood_group: String(form.get("blood_group") || ""),
      units: Number(form.get("units")),
      hospital: String(form.get("hospital") || ""),
      city: String(form.get("city") || ""),
      contact_phone: String(form.get("contact_phone") || ""),
      urgency: form.get("urgency") as "normal" | "urgent" | "critical",
      notes: String(form.get("notes") || ""),
      latitude: requestLocation?.latitude ?? null,
      longitude: requestLocation?.longitude ?? null,
    };

    setRequestSubmitting(true);
    setRequestError("");
    setRequestMessage("");
    setRequestDonors([]);

    try {
      const result = await submitBloodRequest(request);
      const createdRequest = result as { id?: number };

      setRequestMessage("Emergency blood request submitted successfully.");

      if (createdRequest?.id && requestLocation) {
        try {
          const donors = await getNearbyDonorsForRequest(createdRequest.id, 25);
          setRequestDonors(donors);
        } catch {
          // Request was created even if the nearby donor lookup fails.
        }
      }

      formElement.reset();
      setRequestLocation(null);
      setRequestLocationMessage("");
      setDashboard(await getDashboard());
    } catch (err) {
      setRequestError(
        err instanceof Error ? err.message : "Could not submit the request."
      );
    } finally {
      setRequestSubmitting(false);
    }
  };

  // ---------------- NAVIGATION ----------------

  const selectNav = (label: string) => {
    setActiveNav(label);
    setMenuOpen(false);

    if (label === "Overview") {
      setDialog(null);
      return;
    }

    if (label === "Find blood") {
      setDonorSearchError("");
      setNearbyDonors([]);
      setDialog({
        title: "Find blood",
        detail: "Find available blood donors near your current location.",
      });
      return;
    }

    if (label === "Donate blood") {
      setDonorMessage("");
      setDonorError("");
      setDonorLocation(null);
      setDonorLocationMessage("");
      setDialog({
        title: "Donate blood",
        detail: "Register as a blood donor.",
      });
      return;
    }

    if (label === "Donation history") {
      setDialog({
        title: label,
        detail: "View recorded blood donations.",
      });
      setDonationLoading(true);
      setDonationError("");

      Promise.all([getDonations(), getDonors()])
        .then(([records, donorRecords]) => {
          setDonations(records);
          setDonationDonors(donorRecords);
        })
        .catch((err) => {
          setDonationError(
            err instanceof Error ? err.message : "Could not load donation history."
          );
        })
        .finally(() => setDonationLoading(false));

      return;
    }

    setDialog({
      title: label,
      detail: "Book and manage donation appointments.",
    });
  };

  // ---------------- RENDER ----------------

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
              className={`nav-item ${
                activeNav === item.label ? "nav-item-active" : ""
              }`}
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
            <p className="text-[12px] font-medium text-stone-400">{today}</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold tracking-[-0.04em]">
              Welcome to LifeFlow
            </h1>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <button className="icon-button" aria-label="Notifications">
              <Icon name="bell" size={20} />
              <span className="notification-dot" />
            </button>

            <div className="mx-1 h-8 w-px bg-stone-200" />

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8e2dc] text-[12px] font-bold">
              LF
            </div>

            <span className="text-[14px] font-bold">LifeFlow Network</span>
          </div>
        </section>

        <div className="content">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Could not load backend data: {error}. Check that the backend
              server is running and the Vite API proxy is configured.
            </div>
          )}

          {loading && (
            <div className="mb-5 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500">
              Loading dashboard data from the backend...
            </div>
          )}

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
                Local hospitals urgently need O−, B−, and AB− blood. One
                donation can help save up to three lives.
              </p>
            </div>

            <div className="relative z-10 flex w-full flex-col gap-3 sm:w-[235px]">
              <button
                className="hero-button hero-button-primary"
                onClick={() =>
                  setDialog({
                    title: "Schedule a donation",
                    detail:
                      "Choose a registered donor and centre to book a donation appointment.",
                  })
                }
              >
                Schedule donation <Icon name="arrow" size={17} />
              </button>

              <button
                className="hero-button hero-button-secondary"
                onClick={() => {
                  setRequestLocation(null);
                  setRequestLocationMessage("");
                  setRequestMessage("");
                  setRequestError("");
                  setRequestDonors([]);
                  setDialog({
                    title: "Emergency blood request",
                    detail: "Submit an emergency blood requirement.",
                  });
                }}
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
                    Database
                  </span>
                </div>
                <p>Demo database inventory — not verified live stock</p>
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
                  className={`blood-card ${
                    blood.tone === "red" ? "blood-card-critical" : ""
                  }`}
                  key={blood.type}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`drop-box ${
                        blood.tone === "red" ? "drop-box-critical" : ""
                      }`}
                    >
                      <Icon name="drop" size={19} />
                    </div>
                    <span className={`status-dot status-${blood.tone}`} />
                  </div>

                  <div className="mt-7">
                    <h3>{blood.type}</h3>
                    <p>
                      {dashboard
                        ? `${blood.units} ${
                            blood.units === 1 ? "unit" : "units"
                          }`
                        : "—"}
                    </p>
                    <div className={`status-label text-${blood.tone}`}>
                      {blood.status}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredBlood.length === 0 && (
              <div className="empty-state">
                No inventory matches this filter.
              </div>
            )}
          </section>

          <section className="dashboard-grid">
            <div className="centers-panel">
              <div className="section-heading mb-3">
                <div>
                  <h2>Nearby donation centers</h2>
                  <p>
                    {centerUserLocation
                      ? "Verified nearby centres first, followed by the full directory"
                      : "Use your location to sort verified nearby centres first"}
                  </p>
                </div>

                <button
                  className="book-button"
                  onClick={searchNearbyCenters}
                  disabled={centerSearchLoading}
                >
                  {centerSearchLoading
                    ? "Locating..."
                    : "Use my location"}
                </button>
              </div>

              {centerSearchError && (
                <p className="mb-3 text-sm text-red-600">
                  {centerSearchError}
                </p>
              )}

              <div className="mb-4">
                <CentersMap centers={centers} userLocation={centerUserLocation} />
              </div>

              <label className="search-field mb-3">
                <Icon name="search" size={17} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search centers"
                  aria-label="Search donation centers"
                />
              </label>

              <div>
                {orderedCenters.map((center) => {
                  const nearbyMatch = nearbyCenters.find((item) => item.id === center.id);
                  return (
                  <div className="center-row" key={center.id}>
                    <div className="center-initials">
                      {center.name
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((word) => word[0]?.toUpperCase())
                        .join("")}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[14px] font-bold">
                          {center.name}
                        </h3>
                        <span className="need-badge">
                          {center.active ? "Active" : "Inactive"}
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500">
                          {center.location_verified ? "Location verified" : "Location not verified"}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-400">
                        <span className="flex items-center gap-1">
                          <Icon name="pin" size={13} /> {center.address},{" "}
                          {center.city}
                        </span>

                        <span className="flex items-center gap-1">
                          <Icon name="clock" size={13} />{" "}
                          {center.opening_hours}
                        </span>

                        {nearbyMatch && (
                          <span className="font-semibold text-emerald-700">
                            {nearbyMatch.distance_km.toFixed(1)} km away
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      className="book-button"
                      onClick={() =>
                        setDialog({
                          title: `Book at ${center.name}`,
                          detail: `Contact ${center.name} at ${
                            center.phone || "the center directly"
                          } to confirm availability and arrange a donation. Appointment booking is not connected yet.`,
                        })
                      }
                    >
                      Center details
                    </button>
                  </div>
                  );
                })}

                {orderedCenters.length === 0 && (
                  <div className="empty-state">
                    {query
                      ? `No centers found for “${query}”.`
                      : "No registered centres were returned by the backend."}
                  </div>
                )}
              </div>
            </div>

            <aside className="impact-card">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/9 text-[#fb4b59]">
                  <Icon name="heart" size={22} />
                </div>
                <span className="impact-pill">Network overview</span>
              </div>

              <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400">
                Backend summary
              </p>

              <h3 className="mt-2 text-[20px] font-extrabold">
                {loading
                  ? "Loading data..."
                  : error
                    ? "Data unavailable"
                    : "Current totals"}
              </h3>

              <div className="my-6 h-px bg-white/10" />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <strong>{dashboard?.available_donors ?? "—"}</strong>
                  <span>Available donors</span>
                </div>

                <div>
                  <strong>{dashboard?.active_centers ?? "—"}</strong>
                  <span>Active centers</span>
                </div>

                <div>
                  <strong>{dashboard?.pending_requests ?? "—"}</strong>
                  <span>Pending requests</span>
                </div>

                <div>
                  <strong>{dashboard?.total_inventory_units ?? "—"}</strong>
                  <span>Inventory units</span>
                </div>
              </div>

              <div className="eligibility">
                <div className="text-[12px] font-bold">
                  These are network totals, not personal donation history.
                </div>
              </div>
            </aside>
          </section>
        </div>
      </main>

      {/* ---------------- DIALOGS ---------------- */}

      {dialog && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={() => setDialog(null)}
        >
          <div
            className="dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="dialog-close"
              aria-label="Close"
              onClick={() => setDialog(null)}
            >
              <Icon name="close" size={19} />
            </button>

            <div className="dialog-icon">
              <Icon name="drop" size={24} />
            </div>

            <h2 id="dialog-title">{dialog.title}</h2>

            {/* DONOR REGISTRATION */}

            {dialog.title === "Donate blood" ? (
              <form
                className="mt-5 space-y-3 text-left"
                onSubmit={handleDonorSubmit}
              >
                <p className="text-center">Register as a blood donor</p>

                <input
                  className="w-full rounded-lg border p-3 text-sm"
                  name="full_name"
                  placeholder="Full name"
                  minLength={2}
                  required
                />

                <input
                  className="w-full rounded-lg border p-3 text-sm"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  required
                />

                <input
                  className="w-full rounded-lg border p-3 text-sm"
                  name="phone"
                  type="tel"
                  placeholder="Phone number"
                  minLength={7}
                  required
                />

                <select
                  className="w-full rounded-lg border p-3 text-sm"
                  name="blood_group"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Select blood group
                  </option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>

                <input
                  className="w-full rounded-lg border p-3 text-sm"
                  name="city"
                  placeholder="City"
                  minLength={2}
                  required
                />

                <input
                  className="w-full rounded-lg border p-3 text-sm"
                  name="age"
                  type="number"
                  placeholder="Age (18–65)"
                  min={18}
                  max={65}
                  required
                />

                <button
                  className="w-full rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"
                  type="button"
                  onClick={detectDonorLocation}
                  disabled={donorLocationLoading}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Icon name="pin" size={17} />
                    {donorLocationLoading
                      ? "Detecting location..."
                      : donorLocation
                        ? "Update my location"
                        : "Use my current location"}
                  </span>
                </button>

                {donorLocationMessage && (
                  <p className="text-xs text-stone-600">
                    {donorLocationMessage}
                  </p>
                )}

                {donorLocation && (
                  <p className="text-xs text-emerald-700">
                    Location captured. Your coordinates will be submitted
                    with your registration.
                  </p>
                )}

                {donorError && (
                  <p className="text-sm text-red-600">{donorError}</p>
                )}

                {donorMessage && (
                  <p className="text-sm text-green-700">{donorMessage}</p>
                )}

                <button
                  className="dialog-action"
                  type="submit"
                  disabled={donorSubmitting}
                >
                  {donorSubmitting ? "Registering..." : "Register as donor"}
                </button>
              </form>
            ) : dialog.title === "Find blood" ? (
              /* NEARBY DONOR SEARCH */
              <div className="mt-5 space-y-3 text-left">
                <p className="text-center">
                  Search for available donors near you.
                </p>

                <label className="block text-sm font-medium">
                  Blood group
                  <select
                    className="mt-1 w-full rounded-lg border p-3 text-sm"
                    value={searchBloodGroup}
                    onChange={(event) =>
                      setSearchBloodGroup(event.target.value)
                    }
                  >
                    <option value="">All blood groups</option>
                    {bloodGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium">
                  Search radius
                  <select
                    className="mt-1 w-full rounded-lg border p-3 text-sm"
                    value={searchRadius}
                    onChange={(event) => setSearchRadius(event.target.value)}
                  >
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="25">25 km</option>
                    <option value="50">50 km</option>
                    <option value="100">100 km</option>
                  </select>
                </label>

                <button
                  className="dialog-action"
                  type="button"
                  onClick={detectSearchLocation}
                  disabled={donorSearchLoading}
                >
                  {donorSearchLoading
                    ? "Searching nearby donors..."
                    : "Detect location and find donors"}
                </button>

                {searchLocation && (
                  <p className="text-xs text-stone-500">
                    Search location captured successfully.
                  </p>
                )}

                {donorSearchError && (
                  <p className="text-sm text-red-600">{donorSearchError}</p>
                )}

                {nearbyDonors.length > 0 && (
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    <h3 className="font-bold">
                      {nearbyDonors.length} nearby donor(s) found
                    </h3>

                    {nearbyDonors.map((donor) => (
                      <div
                        className="rounded-lg border border-stone-200 p-3"
                        key={donor.id}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong>{donor.full_name}</strong>
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                            {donor.blood_group}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-stone-500">
                          {donor.city} · {donor.distance_km.toFixed(1)} km away
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {searchLocation &&
                  !donorSearchLoading &&
                  !donorSearchError &&
                  nearbyDonors.length === 0 && (
                    <p className="text-sm text-stone-500">
                      No matching available donors were found in this radius.
                    </p>
                  )}
              </div>
            ) : dialog.title === "Donation history" ? (
              <div className="mt-5 space-y-3 text-left">
                {donationLoading ? (
                  <p className="text-sm text-stone-500">Loading donation history...</p>
                ) : donationError ? (
                  <p className="text-sm text-red-600">{donationError}</p>
                ) : donations.length === 0 ? (
                  <div className="rounded-xl border border-stone-200 p-5 text-center">
                    <p className="font-semibold">No donation records yet</p>
                    <p className="mt-1 text-sm text-stone-500">
                      Your recorded donations will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-80 space-y-3 overflow-y-auto">
                    {donations.map((donation) => {
                      const donor = donationDonors.find(
                        (item) => item.id === donation.donor_id
                      );
                      const center = centers.find(
                        (item) => item.id === donation.center_id
                      );

                      return (
                        <article
                          key={donation.id}
                          className="rounded-xl border border-stone-200 p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong>{donor?.full_name ?? `Donor #${donation.donor_id}`}</strong>
                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                              {donation.blood_group}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-stone-600">
                            Centre: {center?.name ?? `Centre #${donation.center_id}`}
                          </p>
                          <p className="text-sm text-stone-600">
                            Units: {donation.units} · Date: {donation.donated_on}
                          </p>
                          <p className="mt-2 text-xs font-semibold">
                            {donation.verified ? "Verified donation" : "Pending verification"}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : dialog.title === "Appointments" || dialog.title === "Schedule a donation" ? (
              <AppointmentsPanel centers={centers} />
            ) : dialog.title === "Emergency blood request" ? (
              /* EMERGENCY REQUEST */
              <form
                className="mt-5 space-y-3 text-left"
                onSubmit={handleEmergencySubmit}
              >
                <p className="text-center">
                  Tell us what blood is urgently required.
                </p>

                <input
                  className="w-full rounded-lg border p-3 text-sm"
                  name="patient_name"
                  placeholder="Patient name"
                  required
                />

                <select
                  className="w-full rounded-lg border p-3 text-sm"
                  name="blood_group"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Required blood group
                  </option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>

                <input
                  className="w-full rounded-lg border p-3 text-sm"
                  name="units"
                  type="number"
                  min={1}
                  max={20}
                  placeholder="Units required"
                  required
                />

                <input
                  className="w-full rounded-lg border p-3 text-sm"
                  name="hospital"
                  placeholder="Hospital name"
                  required
                />

                <input
                  className="w-full rounded-lg border p-3 text-sm"
                  name="city"
                  placeholder="City"
                  required
                />

                <input
                  className="w-full rounded-lg border p-3 text-sm"
                  name="contact_phone"
                  type="tel"
                  placeholder="Contact phone number"
                  required
                />

                <select
                  className="w-full rounded-lg border p-3 text-sm"
                  name="urgency"
                  defaultValue="urgent"
                  required
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>

                <textarea
                  className="w-full rounded-lg border p-3 text-sm"
                  name="notes"
                  placeholder="Additional details (optional)"
                  rows={3}
                />

                <button
                  className="w-full rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"
                  type="button"
                  onClick={detectRequestLocation}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Icon name="pin" size={17} />
                    {requestLocation
                      ? "Update emergency location"
                      : "Use current emergency location"}
                  </span>
                </button>

                {requestLocationMessage && (
                  <p className="text-xs text-stone-600">
                    {requestLocationMessage}
                  </p>
                )}

                {requestLocation && (
                  <p className="text-xs text-emerald-700">
                    Emergency coordinates captured.
                  </p>
                )}

                {requestError && (
                  <p className="text-sm text-red-600">{requestError}</p>
                )}

                {requestMessage && (
                  <p className="text-sm text-green-700">{requestMessage}</p>
                )}

                <button
                  className="dialog-action"
                  type="submit"
                  disabled={requestSubmitting}
                >
                  {requestSubmitting
                    ? "Submitting request..."
                    : "Submit emergency request"}
                </button>

                {requestDonors.length > 0 && (
                  <div className="space-y-2 rounded-lg border p-3">
                    <h3 className="font-bold">
                      Nearby matching donors
                    </h3>
                    {requestDonors.map((donor) => (
                      <div key={donor.id} className="text-sm">
                        <strong>{donor.full_name}</strong>
                        <span className="text-stone-500">
                          {" "}
                          · {donor.blood_group} ·{" "}
                          {donor.distance_km.toFixed(1)} km
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            ) : (
              <>
                <p>{dialog.detail}</p>
                <button
                  className="dialog-action"
                  onClick={() => setDialog(null)}
                >
                  Continue
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

