import { PageShell } from "@/components/ui/page-shell"
import { StakingDashboard } from "@/components/staking-dashboard"

export default function Home() {
  return (
    <PageShell>
      <StakingDashboard />
    </PageShell>
  )
}
