import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <header>
        <div>
          <h1>CredShield</h1>
          <p>Private Creditworthiness Verification</p>
        </div>
      </header>

      <main>{children}</main>

      <footer>
        <p>
          Powered by Midnight zero-knowledge privacy.
        </p>
      </footer>
    </div>
  );
}
