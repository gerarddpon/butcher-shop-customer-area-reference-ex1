import { Badge } from "@/components/ui";
import { claimStatusMeta } from "@/lib/domain";
import type { Claim } from "@/db/schema";

export function ClaimStatusBadge({ claim }: { claim: Claim }) {
  if (claim.status === "clos") {
    const label = claim.creditCents > 0 ? "Résolu - Avoir émis" : "Résolu - Remplacé";
    return <Badge className="bg-[#4f7a4a] text-white ring-1 ring-[#355a32]">{label}</Badge>;
  }
  const meta = claimStatusMeta[claim.status];
  return <Badge className={meta.className}>{meta.label}</Badge>;
}
