import { useState } from "react";
import type { ReactNode } from "react";
import AppShell, { type AppPage } from "./AppShell";

type LayoutProps = {
  children: (activePage: AppPage) => ReactNode;
};

export default function Layout({
  children,
}: LayoutProps) {
  const [activePage, setActivePage] =
    useState<AppPage>("dashboard");

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
    >
      {children(activePage)}
    </AppShell>
  );
}