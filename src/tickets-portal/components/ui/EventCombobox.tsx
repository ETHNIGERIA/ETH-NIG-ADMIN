'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronsUpDown, Loader2 } from 'lucide-react';
import { searchEventsAction, type EventOption } from '@/tickets-portal/actions/events';
import { formFieldClass } from '@/tickets-portal/components/ui/FormModal';

const ALL_EVENTS: EventOption = { id: '', name: 'All events' };

/**
 * Searchable event picker backed by the API (20 results per search), so it
 * scales past any fixed page of events. Posts the chosen id as `name`
 * ('' = all events).
 */
export function EventCombobox({
  name,
  inputId,
  initial,
}: {
  name: string;
  inputId?: string;
  /** Current selection; null = all events */
  initial: EventOption | null;
}) {
  const listId = useId();
  const [selected, setSelected] = useState<EventOption>(initial ?? ALL_EVENTS);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<EventOption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const requestSeq = useRef(0);
  // Results per query for this picker's lifetime, so refocusing doesn't refetch.
  const cache = useRef(new Map<string, { options: EventOption[]; total: number }>());

  // Debounced search; responses from older requests are ignored.
  useEffect(() => {
    if (!open) return;
    const seq = ++requestSeq.current;
    const key = query.trim().toLowerCase();
    const cached = cache.current.get(key);
    if (cached) {
      setLoading(false);
      setError(null);
      setOptions(cached.options);
      setTotal(cached.total);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await searchEventsAction(query).catch(() => ({ error: 'Could not search events.' }));
      if (seq !== requestSeq.current) return;
      setLoading(false);
      if ('error' in res) {
        setError(res.error);
        setOptions([]);
        setTotal(0);
        return;
      }
      cache.current.set(key, res);
      setError(null);
      setOptions(res.options);
      setTotal(res.total);
      setActive(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open]);

  const choices = query.trim() ? options : [ALL_EVENTS, ...options];

  const choose = (opt: EventOption) => {
    setSelected(opt);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(choices.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault(); // don't submit the surrounding form
      // While a search is pending, `choices` still holds the previous results.
      if (!loading && choices[active]) choose(choices[active]);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation(); // close the list, not the surrounding modal
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected.id} />
      <div className="relative">
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && choices[active] ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          value={open ? query : selected.name}
          placeholder={open ? 'Search events by name or slug…' : undefined}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setQuery('');
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={`${formFieldClass} pr-9`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-stone-400">
          {loading && open ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronsUpDown className="h-4 w-4" />}
        </span>
      </div>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          // Keep focus in the input when using the scrollbar, so blur doesn't close the list.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-stone-200 bg-white py-1 text-sm shadow-lg"
        >
          {error ? <li className="px-3 py-2 text-red-700">{error}</li> : null}
          {!error && !loading && choices.length === 0 ? (
            <li className="px-3 py-2 text-stone-500">No events match “{query.trim()}”.</li>
          ) : null}
          {choices.map((opt, i) => (
            <li
              key={opt.id || 'all'}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={opt.id === selected.id}
              // mousedown (not click) so the input's blur doesn't close the list first
              onMouseDown={(e) => {
                e.preventDefault();
                choose(opt);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 ${i === active ? 'bg-stone-100' : ''} ${
                opt.id === selected.id ? 'font-semibold text-stone-900' : 'text-stone-700'
              }`}
            >
              {opt.id ? `${opt.name} only` : opt.name}
            </li>
          ))}
          {!error && total > options.length ? (
            <li className="border-t border-stone-100 px-3 py-2 text-xs text-stone-500">
              Showing {options.length} of {total}. Keep typing to narrow down.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
