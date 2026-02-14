import { Infinity } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:justify-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Infinity className="h-5 w-5" />
      </div>
      <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">
        Logic Loop
      </span>
    </div>
  );
}
