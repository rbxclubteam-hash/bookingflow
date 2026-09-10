import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 sm:py-8">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-medium text-stone-900 sm:text-2xl">
              Alder Studio bookings
            </h1>
            <span className="inline-flex items-center rounded-full bg-stone-900 px-2.5 py-1 text-xs font-medium text-white">
              Demo admin
            </span>
          </div>
          <p className="text-sm text-stone-500">
            No login required — this is an open demo of the BookingFlow admin experience.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
        <AdminDashboard />
      </main>
    </div>
  );
}
