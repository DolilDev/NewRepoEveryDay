"use client";

import { SessionProvider } from "next-auth/react";

// Exposes the NextAuth session to client components (e.g. the navbar via useSession).
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
