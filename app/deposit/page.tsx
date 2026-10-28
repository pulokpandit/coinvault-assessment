import { Suspense } from "react"
import { PageShell } from "@/components/ui/page-shell"
import { DepositWithdraw } from "@/components/deposit-withdraw"

export default function DepositPage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="h-64 rounded-xl bg-[var(--surface)] animate-pulse" />}>
        <DepositWithdraw />
      </Suspense>
    </PageShell>
  )
}
