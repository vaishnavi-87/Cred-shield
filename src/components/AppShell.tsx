import type { ReactNode } from "react";

export type AppPage =
  | "dashboard"
  | "verify"
  | "history"
  | "settings";

type AppShellProps = {
  children: ReactNode;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
};

export default function AppShell({
  children,
  activePage,
  onNavigate,
}: AppShellProps) {
  const navigation = [
    {
      id: "dashboard" as AppPage,
      icon: "⌂",
      label: "Dashboard",
    },
    {
      id: "verify" as AppPage,
      icon: "✓",
      label: "Verify",
    },
    {
      id: "history" as AppPage,
      icon: "◷",
      label: "History",
    },
    {
      id: "settings" as AppPage,
      icon: "⚙",
      label: "Settings",
    },
  ];

  return (
    <div className="app-shell">
      <aside className="app-sidebar">

        {/* BRAND */}

        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            C
          </div>

          <div>
            <strong>CredShield</strong>

            <span>
              Private Credit Verification
            </span>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav
          className="sidebar-nav"
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${
                activePage === item.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                onNavigate(item.id)
              }
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* NETWORK */}

        <div className="sidebar-bottom">
          <div className="network-status">
            <span className="status-dot" />

            <div>
              <strong>
                Midnight Preprod
              </strong>

              <span>
                Network connected
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN APPLICATION */}

      <div className="app-main">

        <header className="app-topbar">
          <div>
            <span className="topbar-label">
              SECURITY DASHBOARD
            </span>

            <h1>CredShield</h1>
          </div>

          <div className="topbar-actions">

            <span className="privacy-pill">
              <span>🔒</span>
              Privacy Protected
            </span>

            <div className="wallet-pill">
              <span className="wallet-dot" />
              1AM Wallet
            </div>

          </div>
        </header>

        <main
          className="app-content"
          key={activePage}
        >
          {children}
        </main>

      </div>
    </div>
  );
}