import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/Navbar";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import Providers from "@/components/Providers";

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

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${syne.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#0f0820] text-[#f5f0ff] antialiased overscroll-none">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Navbar />
            <main className="flex flex-col flex-1">{children}</main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
