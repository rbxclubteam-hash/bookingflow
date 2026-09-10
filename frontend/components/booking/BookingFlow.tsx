"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ApiError, api } from "@/lib/api";
import { formatDateUTC } from "@/lib/format";
import type { AvailabilitySlot, Booking, Service } from "@/lib/types";
import { type CustomerDetails, DetailsStep } from "./DetailsStep";
import { DateStep } from "./DateStep";
import { ServiceStep } from "./ServiceStep";
import { StepIndicator } from "./StepIndicator";
import { SuccessCard } from "./SuccessCard";
import { TimeStep } from "./TimeStep";

type Step = "service" | "date" | "time" | "details" | "success";

const STEP_INDEX: Record<Step, number> = {
  service: 0,
  date: 1,
  time: 2,
  details: 3,
  success: 4,
};

function genericErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Something went wrong. Please try again.";
}

export function BookingFlow() {
  const [step, setStep] = useState<Step>("service");

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timeStepNotice, setTimeStepNotice] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  const loadServices = useCallback(() => {
    setServicesLoading(true);
    setServicesError(null);
    api
      .getServices()
      .then((data) => setServices(data))
      .catch((error: unknown) => setServicesError(genericErrorMessage(error)))
      .finally(() => setServicesLoading(false));
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const loadAvailability = useCallback((service: Service, date: string) => {
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    setSlots([]);
    api
      .getAvailability(service.id, date)
      .then((data) => setSlots(data.slots))
      .catch((error: unknown) => setAvailabilityError(genericErrorMessage(error)))
      .finally(() => setAvailabilityLoading(false));
  }, []);

  function handleSelectService(service: Service) {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedSlot(null);
    setTimeStepNotice(null);
    setStep("date");
  }

  function handleSelectDate(iso: string) {
    setSelectedDate(iso);
    setSelectedSlot(null);
    setTimeStepNotice(null);
    setStep("time");
    if (selectedService) loadAvailability(selectedService, iso);
  }

  function handleSelectSlot(slot: AvailabilitySlot) {
    setSelectedSlot(slot);
    setSubmitError(null);
    setTimeStepNotice(null);
    setStep("details");
  }

  function handleSubmit(details: CustomerDetails) {
    if (!selectedService || !selectedSlot) return;
    setIsSubmitting(true);
    setSubmitError(null);
    api
      .createBooking({
        service_id: selectedService.id,
        start_at: selectedSlot.start_at,
        ...details,
      })
      .then((result) => {
        setBooking(result);
        setStep("success");
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 409) {
          setTimeStepNotice(
            "That time was just booked. Please choose another available time.",
          );
          setSelectedSlot(null);
          setStep("time");
          if (selectedService && selectedDate) {
            loadAvailability(selectedService, selectedDate);
          }
          return;
        }
        setSubmitError(genericErrorMessage(error));
      })
      .finally(() => setIsSubmitting(false));
  }

  function handleBookAnother() {
    setStep("service");
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
    setSubmitError(null);
    setTimeStepNotice(null);
    setBooking(null);
  }

  function goBack() {
    if (step === "date") setStep("service");
    else if (step === "time") {
      setTimeStepNotice(null);
      setStep("date");
    } else if (step === "details") setStep("time");
  }

  if (step === "success" && booking) {
    return (
      <Card className="p-6 sm:p-8">
        <SuccessCard booking={booking} onBookAnother={handleBookAnother} />
      </Card>
    );
  }

  return (
    <div>
      <StepIndicator currentIndex={STEP_INDEX[step]} />

      <Card className="mt-6 p-6 sm:p-8">
        {step !== "service" ? (
          <div className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-500">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1 font-medium text-stone-700 hover:text-stone-900"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
                <path
                  d="M10 3 5 8l5 5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </button>
            {selectedService ? (
              <>
                <span aria-hidden>·</span>
                <span>{selectedService.name}</span>
              </>
            ) : null}
            {selectedDate && step !== "date" ? (
              <>
                <span aria-hidden>·</span>
                <span>{formatDateUTC(selectedDate)}</span>
              </>
            ) : null}
          </div>
        ) : null}

        <h2 className="font-display mb-5 text-xl font-medium text-stone-900">
          {step === "service" && "Choose a service"}
          {step === "date" && "Choose a date"}
          {step === "time" && "Choose a time"}
          {step === "details" && "Your details"}
        </h2>

        {step === "service" && (
          <ServiceStep
            services={services}
            isLoading={servicesLoading}
            error={servicesError}
            selectedServiceId={selectedService?.id ?? null}
            onSelect={handleSelectService}
            onRetry={loadServices}
          />
        )}

        {step === "date" && (
          <DateStep selectedDate={selectedDate} onSelect={handleSelectDate} />
        )}

        {step === "time" && selectedService && selectedDate && (
          <>
            {timeStepNotice ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {timeStepNotice}
              </div>
            ) : null}
            <TimeStep
              slots={slots}
              isLoading={availabilityLoading}
              error={availabilityError}
              selectedSlot={selectedSlot}
              onSelect={handleSelectSlot}
              onRetry={() => loadAvailability(selectedService, selectedDate)}
            />
          </>
        )}

        {step === "details" && selectedService && selectedSlot && (
          <DetailsStep
            service={selectedService}
            slot={selectedSlot}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onSubmit={handleSubmit}
            onChangeTime={() => setStep("time")}
          />
        )}
      </Card>
    </div>
  );
}
