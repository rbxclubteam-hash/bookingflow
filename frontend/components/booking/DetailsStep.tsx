import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AvailabilitySlot, Service } from "@/lib/types";
import { BookingSummary } from "./BookingSummary";

export interface CustomerDetails {
  customer_name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
}

interface FieldErrors {
  name?: string;
  contact?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function DetailsStep({
  service,
  slot,
  isSubmitting,
  submitError,
  onSubmit,
  onChangeTime,
}: {
  service: Service;
  slot: AvailabilitySlot;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (details: CustomerDetails) => void;
  onChangeTime: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    const nextErrors: FieldErrors = {};
    if (!trimmedName) {
      nextErrors.name = "Please enter your full name.";
    }
    if (!trimmedEmail && !trimmedPhone) {
      nextErrors.contact = "Please provide an email or a phone number.";
    } else if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.contact = "Please enter a valid email address.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit({
      customer_name: trimmedName,
      email: trimmedEmail || null,
      phone: trimmedPhone || null,
      note: note.trim() || null,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="customer_name" className="mb-1.5 block text-sm font-medium text-stone-800">
            Full name
          </label>
          <input
            id="customer_name"
            name="customer_name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(errors.name)}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-700 ${
              errors.name ? "border-red-300" : "border-stone-300"
            }`}
            placeholder="Jordan Rivers"
          />
          {errors.name ? <p className="mt-1.5 text-xs text-red-600">{errors.name}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-800">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.contact)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-700"
              placeholder="jordan@example.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-stone-800">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              aria-invalid={Boolean(errors.contact)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-700"
              placeholder="+1 555 010 2020"
            />
          </div>
        </div>
        {errors.contact ? <p className="-mt-2 text-xs text-red-600">{errors.contact}</p> : null}
        <p className="-mt-2 text-xs text-stone-500">Provide at least one way to reach you.</p>

        <div>
          <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-stone-800">
            Note <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="w-full resize-none rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-700"
            placeholder="Anything you'd like us to know before the session?"
          />
        </div>

        {submitError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {submitError}
          </div>
        ) : null}

        <div className="mt-2 flex items-center gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "Booking…" : "Confirm booking"}
          </Button>
          <Button type="button" variant="ghost" onClick={onChangeTime} disabled={isSubmitting}>
            Change time
          </Button>
        </div>
      </form>

      <Card className="h-fit p-5">
        <h3 className="mb-4 text-sm font-semibold text-stone-500 uppercase tracking-wide">
          Your booking
        </h3>
        <BookingSummary service={service} slot={slot} />
      </Card>
    </div>
  );
}
