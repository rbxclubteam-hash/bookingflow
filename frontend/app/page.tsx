import { BookingFlow } from "@/components/booking/BookingFlow";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 px-4 py-10 text-center sm:py-14">
          <p className="text-xs font-medium tracking-[0.2em] text-amber-700 uppercase">
            Alder Studio
          </p>
          <h1 className="font-display text-3xl font-medium text-stone-900 sm:text-4xl">
            Book your session
          </h1>
          <p className="mt-1 text-sm text-stone-500">Private coaching &amp; consultation</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <BookingFlow />
      </main>

      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-400">
        Alder Studio · Built with BookingFlow
      </footer>
    </div>
  );
}
