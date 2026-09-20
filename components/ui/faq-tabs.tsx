"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type FAQItemData = {
  question: string;
  answer: string;
  /** Optional pointer to the page the answer talks about. */
  link?: { href: string; label: string };
};

/** category key → tab label */
export type FAQCategories = Record<string, string>;
/** category key → its questions */
export type FAQData = Record<string, FAQItemData[]>;

// Exponential ease-out: quick to react, settles softly.
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const pad = (n: number) => String(n).padStart(2, "0");

export interface FAQProps extends Omit<ComponentProps<"div">, "children"> {
  categories: FAQCategories;
  faqData: FAQData;
}

/**
 * Tabbed FAQ for dark sections: category tabs on the left (a table of contents with dotted
 * leaders), one boxed panel of accordion questions on the right. Styled with the site's
 * `ooo ---- [LABEL]` header rows and dashed rules. Below lg the tabs sit centred above the panel.
 */
export const FAQ = ({ categories, faqData, className, ...props }: FAQProps) => {
  const keys = Object.keys(categories);
  const [selected, setSelected] = useState(keys[0]);
  const id = useId();

  return (
    <div className={cn("grid gap-10 lg:grid-cols-12 lg:gap-12", className)} {...props}>
      <FAQTabs
        id={id}
        keys={keys}
        categories={categories}
        faqData={faqData}
        selected={selected}
        setSelected={setSelected}
        className="lg:col-span-4 lg:self-start lg:sticky lg:top-24"
      />
      <FAQPanel
        id={id}
        category={selected}
        label={categories[selected]}
        items={faqData[selected] ?? []}
        className="lg:col-span-8"
      />
    </div>
  );
};

type TabsProps = {
  id: string;
  keys: string[];
  categories: FAQCategories;
  faqData: FAQData;
  selected: string;
  setSelected: (key: string) => void;
  className?: string;
};

const FAQTabs = ({ id, keys, categories, faqData, selected, setSelected, className }: TabsProps) => {
  const reduced = useReducedMotion();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Arrow keys / Home / End move between tabs (roving tabindex), per the WAI-ARIA tabs pattern.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = keys.indexOf(selected);
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % keys.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + keys.length) % keys.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = keys.length - 1;
    else return;
    e.preventDefault();
    setSelected(keys[next]);
    refs.current[keys[next]]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="FAQ categories"
      aria-orientation="vertical"
      onKeyDown={onKeyDown}
      className={cn("flex flex-wrap justify-center gap-4 lg:flex-col lg:justify-start lg:gap-2", className)}
    >
      {keys.map((key, index) => {
        const active = selected === key;
        return (
          <button
            key={key}
            ref={(el) => {
              refs.current[key] = el;
            }}
            id={`${id}-tab-${key}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`${id}-panel`}
            tabIndex={active ? 0 : -1}
            onClick={() => setSelected(key)}
            className={cn(
              "relative flex min-h-11 items-center gap-3 overflow-hidden border px-4 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-[0.14em] transition-colors duration-300 lg:w-full",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              active
                ? "border-white text-[#121212]"
                : "border-[#eae7e1]/35 text-[#d8d3ca] hover:border-[#eae7e1] hover:text-white",
            )}
          >
            <span className="relative z-10 tabular-nums opacity-70">{pad(index + 1)}</span>
            <span className="relative z-10">{categories[key]}</span>
            {/* Dotted leader + question count, like a printed table of contents. */}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 hidden h-0 flex-1 border-b border-dashed lg:block",
                active ? "border-[#121212]/40" : "border-[#eae7e1]/30",
              )}
            />
            <span className="relative z-10 hidden tabular-nums opacity-70 lg:block">
              {pad(faqData[key]?.length ?? 0)}
            </span>
            <AnimatePresence>
              {active && (
                <motion.span
                  aria-hidden="true"
                  initial={{ y: "100%" }}
                  animate={{ y: "0%" }}
                  exit={{ y: "100%" }}
                  transition={{ duration: reduced ? 0 : 0.35, ease: EASE }}
                  className="absolute inset-0 z-0 bg-white"
                />
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
};

type PanelProps = {
  id: string;
  category: string;
  label: string;
  items: FAQItemData[];
  className?: string;
};

const FAQPanel = ({ id, category, label, items, className }: PanelProps) => {
  const reduced = useReducedMotion();

  return (
    <div
      role="tabpanel"
      id={`${id}-panel`}
      aria-labelledby={`${id}-tab-${category}`}
      className={cn("rounded-sm border border-[#eae7e1] bg-black/60 p-4 sm:p-5", className)}
    >
      <div className="mb-1 flex items-center gap-2 font-mono text-xs text-[#c9c4bb]">
        <span className="font-semibold tracking-[2px]">ooo</span>
        <div className="flex-1 border-b border-dashed border-[#eae7e1]/40" />
        <span>[{label.toUpperCase()}]</span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={category}
          initial={{ opacity: 0, y: reduced ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -8 }}
          transition={{ duration: reduced ? 0 : 0.28, ease: EASE }}
        >
          <FAQList id={`${id}-${category}`} items={items} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const FAQList = ({ id, items }: { id: string; items: FAQItemData[] }) => {
  // One answer open at a time; the first starts open so the panel never looks empty.
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div>
      {items.map((item, index) => (
        <FAQItem
          key={item.question}
          id={`${id}-${index}`}
          index={index}
          open={open === index}
          onToggle={() => setOpen(open === index ? null : index)}
          {...item}
        />
      ))}
    </div>
  );
};

type ItemProps = FAQItemData & {
  id: string;
  index: number;
  open: boolean;
  onToggle: () => void;
};

const FAQItem = ({ id, index, open, onToggle, question, answer, link }: ItemProps) => {
  const reduced = useReducedMotion();

  return (
    <div className="border-b border-dashed border-[#eae7e1]/30 last:border-b-0">
      <h3>
        <button
          type="button"
          id={`${id}-button`}
          aria-expanded={open}
          aria-controls={`${id}-answer`}
          onClick={onToggle}
          className="group flex w-full items-start gap-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span className="mt-1.5 w-6 shrink-0 font-mono text-[11px] font-semibold tabular-nums tracking-[2px] text-[#c9c4bb]">
            {pad(index + 1)}
          </span>
          <span
            className={cn(
              "flex-1 font-serif text-lg font-bold leading-snug transition-colors sm:text-xl",
              open ? "text-white" : "text-[#e6e1d8] group-hover:text-white",
            )}
          >
            {question}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 grid size-7 shrink-0 place-items-center border transition-colors duration-200",
              open ? "border-white bg-white text-[#121212]" : "border-[#eae7e1]/45 text-[#eae7e1] group-hover:border-white",
            )}
          >
            <Plus className={cn("size-3.5 transition-transform duration-300", open && "rotate-45")} />
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-answer`}
            role="region"
            aria-labelledby={`${id}-button`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.32, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pb-5 pl-10 sm:pr-11">
              <p className="max-w-[65ch] font-sans text-sm leading-relaxed text-[#e0dbd2] sm:text-base">{answer}</p>
              {link ? (
                <Link
                  href={link.href}
                  className="mt-3 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-white underline decoration-dashed underline-offset-4 hover:decoration-solid focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {link.label} <span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FAQ;
