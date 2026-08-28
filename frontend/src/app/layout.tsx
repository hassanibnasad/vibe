import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "VibeAgent — Enterprise Social Agent & Lead Orchestration",
  description: "Enterprise multi-agent autonomous marketing and BANT qualification console.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
