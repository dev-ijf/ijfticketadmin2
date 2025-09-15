"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, checked: checkedProp, onCheckedChange, ...props }, ref) => {
  const [checked, setChecked] = React.useState(!!checkedProp);

  React.useEffect(() => {
    setChecked(!!checkedProp);
  }, [checkedProp]);

  return (
    <SwitchPrimitives.Root
      {...props}
      ref={ref}
      checked={checked}
      onCheckedChange={v => {
        setChecked(v);
        onCheckedChange?.(v);
      }}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors",
        checked
          ? "bg-green-500 border-green-500"
          : "bg-blue-500 border-blue-500",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch }
