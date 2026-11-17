import { useEffect, useState, type FormEvent } from "react";
import {
  getDonors,
  getAppointments,
  createAppointment,
  cancelAppointment,
  type Donor,
  type Appointment,
  type Center,
} from "../api";

interface Props {
  centers: Center[];
}

function localDateTimeMinimum() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export default function AppointmentsPanel({ centers }: Props) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [donorId, setDonorId] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    getDonors()
      .then((data) => {
        setDonors(data);
        if (data.length > 0) setDonorId(String(data[0].id));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load donors."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!donorId) {
      setAppointments([]);
      return;
    }

    getAppointments(Number(donorId))
      .then(setAppointments)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load appointments."));
  }, [donorId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const centerId = Number(form.get("center_id"));
    const scheduledAt = String(form.get("scheduled_at") || "");
    const notes = String(form.get("notes") || "");

    if (!donorId || !centerId || !scheduledAt) {
      setError("Select a donor, centre and appointment date.");
      return;
    }

    if (new Date(scheduledAt).getTime() <= Date.now()) {
      setError("Choose a future date and time.");
      return;
    }

    setSubmitting(true);
    try {
      await createAppointment({
        donor_id: Number(donorId),
        center_id: centerId,
        scheduled_at: scheduledAt,
        notes,
      });

      setMessage("Appointment booked successfully.");
      formElement.reset();
      setAppointments(await getAppointments(Number(donorId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not book appointment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: number) {
    setError("");
    setMessage("");
    setCancellingId(id);
    try {
      await cancelAppointment(id);
      setMessage("Appointment cancelled.");
      setAppointments(await getAppointments(Number(donorId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel appointment.");
    } finally {
      setCancellingId(null);
    }
  }

  const selectedDonor = donors.find((donor) => donor.id === Number(donorId));

  return (
    <div className="mt-5 space-y-5 text-left">
      <p className="text-sm text-stone-600">
        Book a donation appointment at a registered centre. Select the donor
        who will attend.
      </p>

      {loading ? (
        <p className="text-sm text-stone-500">Loading registered donors...</p>
      ) : donors.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No registered donors found. Register as a donor before booking an appointment.
        </div>
      ) : (
        <>
          <label className="block text-sm font-medium">
            Registered donor
            <select
              className="mt-1 w-full rounded-lg border p-3 text-sm"
              value={donorId}
              onChange={(event) => {
                setDonorId(event.target.value);
                setMessage("");
                setError("");
              }}
              required
            >
              {donors.map((donor) => (
                <option key={donor.id} value={donor.id}>
                  {donor.full_name} · {donor.blood_group} · {donor.city}
                </option>
              ))}
            </select>
          </label>

          {selectedDonor && (
            <p className="text-xs text-stone-500">
              Booking for {selectedDonor.full_name} ({selectedDonor.blood_group})
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-sm font-medium">
              Donation centre
              <select
                className="mt-1 w-full rounded-lg border p-3 text-sm"
                name="center_id"
                defaultValue=""
                required
              >
                <option value="" disabled>Select a centre</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name} · {center.city}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Appointment date and time
              <input
                className="mt-1 w-full rounded-lg border p-3 text-sm"
                type="datetime-local"
                name="scheduled_at"
                min={localDateTimeMinimum()}
                required
              />
            </label>

            <label className="block text-sm font-medium">
              Notes (optional)
              <textarea
                className="mt-1 w-full rounded-lg border p-3 text-sm"
                name="notes"
                rows={2}
                placeholder="Any additional information"
              />
            </label>

            <button className="dialog-action" type="submit" disabled={submitting || centers.length === 0}>
              {submitting ? "Booking..." : "Book appointment"}
            </button>
          </form>

          {centers.length === 0 && (
            <p className="text-sm text-amber-700">No active centres are currently available.</p>
          )}

          <div className="border-t border-stone-200 pt-4">
            <h3 className="mb-3 font-bold">Appointment history</h3>

            {appointments.length === 0 ? (
              <p className="text-sm text-stone-500">No appointments found for this donor.</p>
            ) : (
              <div className="max-h-64 space-y-3 overflow-y-auto">
                {appointments.map((appointment) => {
                  const center = centers.find((item) => item.id === appointment.center_id);
                  return (
                    <div key={appointment.id} className="rounded-lg border border-stone-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <strong className="text-sm">{center?.name || `Centre #${appointment.center_id}`}</strong>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          appointment.status === "booked"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-600"
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        {new Date(appointment.scheduled_at).toLocaleString()}
                      </p>
                      {appointment.notes && (
                        <p className="mt-1 text-xs text-stone-600">{appointment.notes}</p>
                      )}
                      {appointment.status === "booked" && (
                        <button
                          type="button"
                          className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                          onClick={() => handleCancel(appointment.id)}
                          disabled={cancellingId === appointment.id}
                        >
                          {cancellingId === appointment.id ? "Cancelling..." : "Cancel appointment"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      <p className="text-xs text-stone-400">
        Demo workflow: appointments are associated with the selected registered donor. This application does not currently have user login.
      </p>
    </div>
  );
}
