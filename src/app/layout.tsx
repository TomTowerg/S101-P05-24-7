import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parcel Management System",
  description:
    "Efficient parcel and correspondence management for residential buildings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#080810] text-[#f1f0ff] antialiased">
        <Navbar />
        <main className="flex flex-col flex-1 pt-24">{children}</main>
      </body>
    </html>
  );
}
