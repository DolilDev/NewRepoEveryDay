"use client";

import { SessionProvider } from "next-auth/react";

// Udostępnia sesję NextAuth komponentom klienckim (np. navbarowi przez useSession).
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
