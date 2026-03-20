export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 bg-slate-50">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Welcome to{" "}
          <span className="text-indigo-600">Parcel Management System</span>
        </h1>

        <p className="text-lg text-slate-500 max-w-lg mx-auto">
          Efficiently track, manage, and notify residents about their parcels
          and correspondence in residential buildings.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            Get Started
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>

      <section
        id="features"
        className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full"
      >
        {[
          {
            title: "Parcel Registration",
            description:
              "Log incoming parcels with department number and automatic resident notifications.",
          },
          {
            title: "Pickup Control",
            description:
              "Secure QR-based pickup verification with full audit trail of who collected each parcel.",
          },
          {
            title: "Concierge Dashboard",
            description:
              "Real-time overview of pending deliveries, history, and resident management.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-slate-500">{feature.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
