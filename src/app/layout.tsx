import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Online Hall Meal Management",
  description:
    "Manage your university hall meals efficiently. Select meals, view history, track billing — all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${playfairDisplay.variable} antialiased`}
      >
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              classNames: {
                toast: 'bg-white dark:bg-slate-900 border-l-4 rounded-xl shadow-lg font-sans',
                success: 'border-l-primary',
                error: 'border-l-red-500',
                warning: 'border-l-amber-500',
                info: 'border-l-blue-500',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
