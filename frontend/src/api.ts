const API_BASE = "/api";

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || `Request failed: ${response.status}`);
  }
  return response.json();
}

export interface GPSLocation { latitude: number; longitude: number; accuracy?: number; }

export const getCurrentLocation = (): Promise<GPSLocation> => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error("GPS location is not supported by this browser."));
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("Detected:", position.coords.latitude, position.coords.longitude, "accuracy (m):", position.coords.accuracy);
      resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED: reject(new Error("Location permission denied. Please allow location access.")); break;
        case error.POSITION_UNAVAILABLE: reject(new Error("Your current location is unavailable.")); break;
        case error.TIMEOUT: reject(new Error("Location request timed out. Please try again.")); break;
        default: reject(new Error("Unable to detect your location."));
      }
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
});

export interface DashboardData {
  available_donors: number;
  active_centers: number;
  pending_requests: number;
  total_inventory_units: number;
  inventory_by_blood_group: Record<string, number>;
}

export interface InventoryItem {
  id: number; center_id: number; center_name: string; city: string;
  blood_group: string; units: number; status: string; updated_at: string;
}

export interface Center {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  opening_hours: string;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  location_verified: boolean;
  location_source: string | null;
}

export interface NearbyCenter extends Center { distance_km: number; }

export interface Donor {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  blood_group: string;
  city: string;
  age: number;
  available: boolean;
  created_at: string;
}

export const getDonors = () => apiRequest<Donor[]>("/donors");

export interface DonorInput {
  full_name: string; email: string; phone: string; blood_group: string;
  city: string; age: number; latitude?: number | null; longitude?: number | null;
}

export interface NearbyDonor {
  id: number; full_name: string; blood_group: string; city: string; distance_km: number;
}

export interface BloodRequestInput {
  patient_name: string; blood_group: string; units: number; hospital: string;
  city: string; contact_phone: string;
  urgency: "normal" | "urgent" | "critical";
  notes?: string; latitude?: number | null; longitude?: number | null;
}

export const getDashboard = (city?: string) => apiRequest<DashboardData>(`/dashboard${city ? `?city=${encodeURIComponent(city)}` : ""}`);
export const getInventory = (city?: string) => apiRequest<InventoryItem[]>(`/inventory${city ? `?city=${encodeURIComponent(city)}` : ""}`);

export const updateInventory = (centerId: number, bloodGroup: string, units: number) => apiRequest<{ id: number; center_id: number; blood_group: string; units: number; updated_at: string }>(`/centers/${centerId}/inventory/${encodeURIComponent(bloodGroup)}`, { method: "PUT", body: JSON.stringify({ units }) });
export const getCenters = (city?: string) => apiRequest<Center[]>(`/centers${city ? `?city=${encodeURIComponent(city)}` : ""}`);
export const registerDonor = (data: DonorInput) => apiRequest("/donors", { method: "POST", body: JSON.stringify(data) });
export const submitBloodRequest = (data: BloodRequestInput) => apiRequest("/requests", { method: "POST", body: JSON.stringify(data) });

export const getNearbyDonors = (location: GPSLocation, radiusKm = 10, bloodGroup?: string) => {
  const params = new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude), radius_km: String(radiusKm) });
  if (bloodGroup) params.set("blood_group", bloodGroup);
  return apiRequest<NearbyDonor[]>(`/donors/nearby?${params.toString()}`);
};

// Retained for compatibility with any other existing screen using the backend endpoint.
export const getNearbyCenters = (location: GPSLocation, radiusKm = 10) => {
  const params = new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude), radius_km: String(radiusKm) });
  return apiRequest<NearbyCenter[]>(`/centers/nearby?${params.toString()}`);
};

export const getNearbyDonorsForRequest = (requestId: number, radiusKm = 10) => {
  const params = new URLSearchParams({ radius_km: String(radiusKm) });
  return apiRequest<NearbyDonor[]>(`/requests/${requestId}/nearby-donors?${params.toString()}`);
};
export interface Appointment {
  id: number;
  donor_id: number;
  center_id: number;
  scheduled_at: string;
  status: string;
  notes: string;
  created_at: string;
}

export interface AppointmentInput {
  donor_id: number;
  center_id: number;
  scheduled_at: string;
  notes?: string;
}

export const getAppointments = (donorId: number) =>
  apiRequest<Appointment[]>(`/appointments?donor_id=${donorId}`);

export const createAppointment = (data: AppointmentInput) =>
  apiRequest<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const cancelAppointment = (appointmentId: number) =>
  apiRequest<Appointment>(`/appointments/${appointmentId}/cancel`, {
    method: "PATCH",
  });

export interface Donation {
  id: number;
  donor_id: number;
  center_id: number;
  blood_group: string;
  units: number;
  donated_on: string;
  verified: boolean;
}

export interface DonationInput {
  donor_id: number;
  center_id: number;
  blood_group: string;
  units?: number;
  donated_on?: string;
}

export const getDonations = (donorId?: number) =>
  apiRequest<Donation[]>(`/donations${donorId ? `?donor_id=${donorId}` : ""}`);

export const createDonation = (data: DonationInput) =>
  apiRequest<Donation>("/donations", {
    method: "POST",
    body: JSON.stringify(data),
  });
