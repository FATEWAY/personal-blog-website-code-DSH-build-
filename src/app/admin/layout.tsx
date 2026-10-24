import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "管理后台",
    template: "%s · 管理后台",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
