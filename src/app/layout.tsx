import type { Metadata } from "next";
import { Geist, Geist_Mono, Anton } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import AuthGate from "@/components/AuthGate";
import FirebaseSetupNotice from "@/components/FirebaseSetupNotice";
import { isFirebaseConfigured } from "@/lib/firebase";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-brand",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Texx Social",
  description: "A place to share what's happening.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        {isFirebaseConfigured ? (
          <ThemeProvider>
            <AuthProvider>
              <Navbar />
              <main className="flex-1 w-full max-w-2xl mx-auto border-x border-neutral-800 min-h-screen pb-16">
                <AuthGate>{children}</AuthGate>
              </main>
              <BottomNav />
              <Toaster position="bottom-center" toastOptions={{ style: { marginBottom: "3.5rem" } }} />
            </AuthProvider>
          </ThemeProvider>
        ) : (
          <FirebaseSetupNotice />
        )}
      </body>
    </html>
  );
}
