import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium tabular-nums",
  {
    variants: {
      variant: {
        neutral: "bg-secondary text-muted-foreground",
        outline: "border border-border bg-card text-muted-foreground",
        accent: "bg-accent/10 text-accent-foreground",
        success: "bg-success/12 text-success-foreground",
        warning: "bg-warning/14 text-warning-foreground"
      }
    },
    defaultVariants: {
      variant: "neutral"
    }
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
);

Badge.displayName = "Badge";
