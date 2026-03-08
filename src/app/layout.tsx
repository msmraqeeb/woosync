import type { Metadata } from "next";
import { Inter } from "next/font/google"; // or geist
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WooSync Inventory",
  description: "An inventory management app connected to WooCommerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background`}>
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <div className="flex flex-col flex-1 w-full overflow-hidden">
            <Topbar />
            <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
