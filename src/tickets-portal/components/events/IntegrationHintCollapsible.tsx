import { ChevronDown } from 'lucide-react';

const shell =
  'integration-hint-details rounded-lg border border-stone-200/90 bg-stone-50/50 text-stone-600 open:bg-stone-50/80 open:shadow-[0_1px_2px_rgba(0,0,0,0.04)]';

const summaryClass =
  'flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-left text-[13px] font-medium text-stone-800 hover:bg-stone-100/50 [&::-webkit-details-marker]:hidden';

export function CreateIntegrationHint() {
  return (
    <details className={shell}>
      <summary className={summaryClass}>
        <span>What customer-facing apps use</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-stone-500 transition-transform duration-200" strokeWidth={2} />
      </summary>
      <div className="border-t border-stone-200/80 px-4 pb-3 pt-2 text-[13px] leading-relaxed">
        <ul className="list-inside list-disc space-y-1.5 marker:text-stone-400">
          <li>
            <span className="font-medium text-stone-700">Slug</span> — Stable public ID for this event.
            Your websites and apps pass it to the ticketing API (for example public{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-[12px] text-stone-800">
              /events/[slug]
            </code>{' '}
            routes, registration, and deep links you build).
          </li>
          <li>
            <span className="font-medium text-stone-700">Allowed origins</span> — Optional list of web origins
            allowed for browser flows tied to this event (embeds, checkout, or CORS-related checks, depending on
            your setup). Add staging and production site URLs as needed.
          </li>
        </ul>
      </div>
    </details>
  );
}

export function DetailIntegrationHint() {
  return (
    <details className={`${shell} mt-3 max-w-lg`}>
      <summary className={summaryClass}>
        <span>About this slug & integrations</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-stone-500 transition-transform duration-200" strokeWidth={2} />
      </summary>
      <div className="border-t border-stone-200/80 px-4 pb-3 pt-2 text-[12px] leading-relaxed">
        Apps and sites integrate using this{' '}
        <span className="font-medium text-stone-700">slug</span> on public ticketing routes (event fetch,
        registration, checkout links). Changing it later would break existing integrations — it is fixed after
        creation. Allowed origins below apply to browser-based flows where origin checks matter.
      </div>
    </details>
  );
}
