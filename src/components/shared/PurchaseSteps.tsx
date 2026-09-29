import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Entradas", "Datos y pago", "Confirmación"] as const;

interface PurchaseStepsProps {
  current: 1 | 2 | 3;
  className?: string;
}

export function PurchaseSteps({ current, className }: PurchaseStepsProps) {
  return (
    <div className={className}>
      <p className="text-sm font-medium text-muted-foreground md:hidden">
        Paso {current} de {STEPS.length}
      </p>
      <ol aria-label="Pasos de la compra" className="hidden items-center gap-3 text-sm md:flex">
        {STEPS.map((step, index) => {
          const number = index + 1;
          const done = number < current;
          const active = number === current;

          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-2",
                active ? "font-semibold" : !done && "text-muted-foreground",
              )}
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={cn("mr-1 h-px w-8", number <= current ? "bg-primary" : "bg-border")}
                />
              )}
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-foreground text-background",
                  !done && !active && "border-2",
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} aria-label="Completado" /> : number}
              </span>
              {step}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
