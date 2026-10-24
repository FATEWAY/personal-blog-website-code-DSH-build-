"use client";

import { createContext, useContext } from "react";
import type { AdminAccount } from "@/lib/types";

export type AdminSessionValue = {
  admin: AdminAccount;
  csrfToken: string;
  adminPath: string;
  sessionExpiresAt: string;
};

const AdminSessionContext = createContext<AdminSessionValue | null>(null);

export function AdminSessionProvider({
  value,
  children,
}: {
  value: AdminSessionValue;
  children: React.ReactNode;
}) {
  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession(): AdminSessionValue {
  const value = useContext(AdminSessionContext);
  if (!value) {
    throw new Error("useAdminSession must be used inside AdminSessionProvider");
  }
  return value;
}
