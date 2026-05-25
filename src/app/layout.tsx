import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Hello, Gambling — SA Gambling Complaints",
  description: "South Africa's independent gambling complaints and dispute resolution platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-screen" style={{ background: "#f5f5f5" }}>{children}</main>

          <footer style={{ background: "#111111", color: "#ffffff" }}>
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
                <div>
                  <p className="text-sm font-700 tracking-tight mb-1" style={{ fontWeight: 700, color: "#c5623a" }}>
                    Hello, Gambling
                  </p>
                  <p style={{ color: "#999999", fontSize: "0.8125rem", lineHeight: "1.6" }}>
                    South Africa's independent platform for gambling complaints and dispute
                    resolution. Operates under the National Gambling Act 7 of 2004.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#c4821a" }}>
                    Platform
                  </p>
                  <ul style={{ color: "#999999", fontSize: "0.8125rem" }} className="space-y-2">
                    {[
                      ["/complaints", "Browse Complaints"],
                      ["/disputes", "Dispute Resolution"],
                      ["/operators", "Operators Directory"],
                      ["/complaints/new", "File a Complaint"],
                    ].map(([href, label]) => (
                      <li key={href}>
                        <Link href={href} className="hover:text-white transition-colors">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#c4821a" }}>
                    Regulatory Bodies
                  </p>
                  <ul style={{ color: "#999999", fontSize: "0.8125rem" }} className="space-y-2">
                    <li>National Gambling Board (NGB)</li>
                    <li>National Lotteries Commission (NLC)</li>
                    <li>Western Cape Gambling & Racing Board</li>
                    <li>Gauteng Gambling Board</li>
                    <li>KwaZulu-Natal Gambling Board</li>
                  </ul>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #222222", paddingTop: "1.5rem" }}>
                <p style={{ color: "#555555", fontSize: "0.75rem" }} className="mb-1 text-center font-medium">
                  Responsible Gambling — National Problem Gambling Helpline: 0800 006 008 (Free, 24/7)
                </p>
                <p style={{ color: "#444444", fontSize: "0.75rem" }} className="text-center">
                  {new Date().getFullYear()} Hello, Gambling. All rights reserved. This platform complies with POPIA.
                </p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
