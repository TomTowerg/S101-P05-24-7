"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ResidentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              My Parcels
            </h1>
            <p className="text-slate-600 mt-2">
              Track and manage your deliveries
            </p>
          </div>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Welcome, {session?.user?.name}!
              </h2>
              <p className="text-slate-600">
                Email: {session?.user?.email}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Role: <span className="font-semibold text-indigo-600">RESIDENT</span>
              </p>
            </div>
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt="Profile"
                className="w-16 h-16 rounded-full"
              />
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">My Parcels</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">--</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Waiting for Pickup</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">--</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Already Picked Up</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">--</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-slate-600"
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
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No parcels yet
          </h3>
          <p className="text-slate-600 mb-6">
            You don't have any parcels. They will appear here once you receive them.
          </p>
        </div>

        {/* Coming Soon */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-indigo-900 mb-2">
            Features Coming Soon
          </h3>
          <ul className="text-indigo-800 space-y-1 text-sm">
            <li>✓ View all your parcels</li>
            <li>✓ Real-time notifications</li>
            <li>✓ QR code scanning for pickup</li>
            <li>✓ Delivery history</li>
            <li>✓ Track parcel status</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
