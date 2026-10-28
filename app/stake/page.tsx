import { Suspense } from "react"
import { PageShell } from "@/components/ui/page-shell"
import { StakeUnstake } from "@/components/stake-unstake"

export default function StakePage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="h-64 rounded-xl bg-[var(--surface)] animate-pulse" />}>
        <StakeUnstake />
      </Suspense>
    </PageShell>
  )
}
