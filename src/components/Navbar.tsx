import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-sm font-bold text-indigo-600 tracking-tight"
        >
          ParcelMS
        </Link>

        <Link
          href="/login"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Login
        </Link>
      </div>
    </nav>
  );
}
