import { FACT_STATUS_LABEL, type FactStatus } from "@/lib/types";

/** 数值状态徽标：已核验 / 估算 / 待核验（方案 §4：数值文案要有状态） */
export default function StatusBadge({
  status,
  className = "",
}: {
  status: FactStatus;
  className?: string;
}) {
  return (
    <span className={`badge badge-${status} ${className}`} role="status">
      {FACT_STATUS_LABEL[status]}
    </span>
  );
}
