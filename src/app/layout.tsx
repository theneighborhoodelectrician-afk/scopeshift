import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "ScopeShift",
  description: "Turn service calls into solutions."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto min-h-screen max-w-7xl px-6 py-8">{children}</div>
      </body>
    </html>
  );
}
