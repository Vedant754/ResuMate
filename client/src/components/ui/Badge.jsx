import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-tight tabular",
  {
    variants: {
      tone: {
        neutral: "bg-[var(--surface-2)] text-[var(--ink-muted)] border border-[var(--border)]",
        accent: "bg-[var(--primary-soft)] text-[var(--primary)]",
        success: "bg-[rgba(63,143,114,0.10)] text-[var(--success)]",
        warning: "bg-[rgba(194,138,61,0.10)] text-[var(--warning)]",
        danger: "bg-[rgba(196,97,97,0.10)] text-[var(--danger)]",
        ink: "bg-[var(--primary)] text-white",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export function Badge({ className, tone, ...props }) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
