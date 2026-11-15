import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from './command';
import { cn } from '@/lib/utils';

export type SearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type Props = {
  id: string;
  value: string;
  options: SearchableSelectOption[];
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
};

const normalize = (text: string) => text.toLocaleLowerCase().trim().replace(/\s+/g, ' ');

/** Controlled lookup: identifiers stay internal; labels and contact details wrap in full. */
export function SearchableSelect({
  id, value, options, onValueChange, placeholder, disabled,
  searchPlaceholder = 'Search options…', emptyMessage = 'No matching options.',
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find(option => option.value === value);
  const tokens = normalize(search).split(' ').filter(Boolean);
  const filtered = options.filter(option => {
    const text = normalize(`${option.label} ${option.description ?? ''}`);
    return tokens.every(token => text.includes(token));
  });
  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch('');
  };

  return <Popover open={open} onOpenChange={changeOpen}>
    <PopoverTrigger asChild>
      <Button id={id} type="button" variant="outline" role="combobox"
        aria-expanded={open} disabled={disabled}
        className="h-auto min-h-10 w-full justify-between gap-3 px-3 py-2 text-left font-normal">
        <span className={cn('min-w-0 flex-1 whitespace-normal break-words', !selected && 'text-muted-foreground')}>
          <span className="block">{selected?.label ?? placeholder}</span>
          {selected?.description && <span className="mt-0.5 block break-all text-xs text-muted-foreground">{selected.description}</span>}
        </span>
        <ChevronsUpDown aria-hidden="true" className="h-4 w-4 shrink-0 opacity-60" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" side="bottom" collisionPadding={12}
      className="z-[260] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw_-_1.5rem)] overflow-hidden bg-white p-0 text-slate-900 shadow-xl dark:bg-slate-950 dark:text-slate-50">
      <Command shouldFilter={false} className="h-auto bg-white dark:bg-slate-950">
        <CommandInput value={search} onValueChange={setSearch}
          placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
        <CommandList
          className="max-h-[min(18rem,calc(var(--radix-popover-content-available-height)_-_5rem))] overscroll-contain p-1"
          style={{ scrollbarGutter: 'stable' }}>
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          {filtered.map(option => <CommandItem key={option.value} value={`option:${option.value}`}
            disabled={option.disabled}
            className="items-start gap-3 px-3 py-2.5"
            onSelect={() => {
              if (option.disabled) return;
              onValueChange(option.value);
              changeOpen(false);
            }}>
            <span className="min-w-0 flex-1">
              <span className="block whitespace-normal break-words">{option.label}</span>
              {option.description && <span className="mt-0.5 block whitespace-normal break-all text-xs text-muted-foreground">{option.description}</span>}
            </span>
            <Check aria-hidden="true" className={cn('mt-0.5 h-4 w-4 shrink-0', option.value !== value && 'invisible')} />
          </CommandItem>)}
        </CommandList>
        <p aria-live="polite" className="border-t px-3 py-2 text-xs text-muted-foreground">
          {filtered.length} of {options.length} options
        </p>
      </Command>
    </PopoverContent>
  </Popover>;
}
