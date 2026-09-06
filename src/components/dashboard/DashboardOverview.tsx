type DashboardOverviewProps = {
  verified: boolean;
  connected: boolean;
  verificationCount: number;
};

export default function DashboardOverview({
  verified,
  connected,
  verificationCount,
}: DashboardOverviewProps) {
  return (
    <section className="dashboard-overview">
      <div className="dashboard-card">
        <span className="dashboard-card-label">
          PRIVACY STATUS
        </span>

        <strong className="dashboard-card-value">
          Protected
        </strong>

        <span className="dashboard-card-description">
          Financial inputs remain private
        </span>
      </div>

      <div className="dashboard-card">
        <span className="dashboard-card-label">
          VERIFICATION
        </span>

        <strong className="dashboard-card-value">
          {verified ? "Verified" : "Pending"}
        </strong>

        <span className="dashboard-card-description">
          {verified
            ? "Eligibility confirmed"
            : "No completed verification"}
        </span>
      </div>

      <div className="dashboard-card">
        <span className="dashboard-card-label">
          WALLET
        </span>

        <strong className="dashboard-card-value">
          {connected ? "Connected" : "Not connected"}
        </strong>

        <span className="dashboard-card-description">
          1AM Wallet · Midnight Preprod
        </span>
      </div>

      <div className="dashboard-card">
        <span className="dashboard-card-label">
          VERIFICATIONS
        </span>

        <strong className="dashboard-card-value">
          {verificationCount}
        </strong>

        <span className="dashboard-card-description">
          Completed on this session
        </span>
      </div>
    </section>
  );
}
