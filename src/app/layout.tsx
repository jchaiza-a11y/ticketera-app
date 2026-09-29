import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SearchTopbar } from "@/components/layout/SearchTopbar";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ticketera | Entradas para tus eventos favoritos",
  description:
    "Compra entradas para conciertos, deportes, teatro y festivales en un solo lugar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${poppins.variable} h-full antialiased`}>
      <body
        suppressHydrationWarning
        className="relative min-h-full flex flex-col"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-screen bg-gradient-to-b from-primary/25 via-primary/10 to-transparent print:hidden"
        />
        <div className="contents print:hidden">
          <Navbar />
          <SearchTopbar />
        </div>
        <main className="flex-1">{children}</main>
        <div className="contents print:hidden">
          <Footer />
        </div>
      </body>
    </html>
  );
}
