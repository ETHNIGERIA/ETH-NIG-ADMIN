import type { ReactNode } from 'react';
import { Info } from 'lucide-react';

/** Short, collapsible explanation of how a page's records behave. */
export function HowItWorks({ items, defaultOpen = true }: { items: ReactNode[]; defaultOpen?: boolean }) {
  return (
    <details
      open={defaultOpen}
      className="group max-w-3xl rounded-lg border border-stone-200 bg-stone-50/60 px-4 py-3 text-[13px] text-stone-600"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-stone-800">
        <Info className="h-4 w-4 text-stone-400" />
        How this works
        <span className="ml-auto text-[12px] font-normal text-stone-400 group-open:hidden">Show</span>
        <span className="ml-auto hidden text-[12px] font-normal text-stone-400 group-open:inline">Hide</span>
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-6 leading-relaxed">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </details>
  );
}
