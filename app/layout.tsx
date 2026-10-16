import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CaseMe – 3D Phone Case Simulator",
  description: "Design your own phone case and preview it live in 3D.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
