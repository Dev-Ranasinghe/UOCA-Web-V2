"use client";

import type { HTMLInputTypeAttribute, InputHTMLAttributes, ReactNode } from "react";
import { Check, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form primitives for the membership application. They reuse the site's own vocabulary: black #121212 ink,
 * the #f3c276 highlight for hover, sans labels, rounded-lg fields as on the contact form. Two deliberate upgrades
 * over the contact form: field borders are dark enough to read as controls (3:1 against the page), and text is
 * 16px so iOS Safari doesn't zoom the page when a field is focused.
 */

const controlBase =
  "w-full rounded-lg border bg-white px-4 py-3.5 font-sans text-base text-[#121212] placeholder:text-[#767676] " +
  "transition-colors duration-150 outline-none " +
  "border-[#767676] hover:border-[#121212] focus:border-[#121212] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212] " +
  "aria-[invalid=true]:border-[#b3261e] aria-[invalid=true]:focus-visible:outline-[#b3261e]";

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-[#b3261e]">
      *
    </span>
  );
}

function OptionalTag() {
  return <span className="ml-1.5 font-mono text-[11px] font-medium uppercase tracking-[1.5px] text-[#555]">Optional</span>;
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 font-sans text-sm font-medium leading-snug text-[#b3261e]">
      <CircleAlert aria-hidden="true" className="mt-[1px] size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

function Hint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1 font-sans text-[13px] leading-snug text-[#555]">
      {children}
    </p>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

type TextFieldProps = {
  /** Field key. The input gets id `field-<name>` so the form can focus it on error. */
  name: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  maxLength?: number;
  min?: string;
  max?: string;
  autoCapitalize?: string;
  spellCheck?: boolean;
  className?: string;
};

export function TextField({
  name,
  label,
  hint,
  error,
  optional,
  value,
  onChange,
  onBlur,
  type = "text",
  className,
  ...inputProps
}: TextFieldProps) {
  const id = `field-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block font-sans text-sm font-semibold leading-snug text-[#121212]">
        {label}
        {optional ? <OptionalTag /> : <RequiredMark />}
      </label>
      {hint ? <Hint id={`${id}-hint`}>{hint}</Hint> : null}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(controlBase, "mt-2", type === "date" && "min-h-[3.375rem] text-left")}
        {...inputProps}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  error,
  value,
  onChange,
  onBlur,
  rows = 3,
  className,
  ...rest
}: {
  name: string;
  label: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rows?: number;
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  const id = `field-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block font-sans text-sm font-semibold leading-snug text-[#121212]">
        {label}
        <RequiredMark />
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-required
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, undefined, error)}
        className={cn(controlBase, "mt-2 resize-y")}
        {...rest}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

/**
 * One selectable tile. A real radio/checkbox sits inside (visually hidden), so keyboard, focus, arrow keys and
 * screen readers work natively; the tile is styled from its `:checked` and `:focus-visible` state.
 */
export function ChoiceTile({
  type,
  name,
  value,
  label,
  checked,
  onChange,
  id,
  invalid,
  className,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  id?: string;
  invalid?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "group flex min-h-[3.25rem] cursor-pointer select-none items-center gap-3 rounded-lg border bg-white px-4 py-3",
        "font-sans text-base leading-snug text-[#121212] transition-colors duration-150",
        invalid ? "border-[#b3261e]" : "border-[#767676]",
        "hover:border-[#121212] hover:bg-[#f3c276]/45",
        "has-[:checked]:border-[#121212] has-[:checked]:bg-[#121212] has-[:checked]:text-white has-[:checked]:hover:bg-[#121212]",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#121212]",
        className,
      )}
    >
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "relative grid size-5 shrink-0 place-items-center border border-current",
          type === "radio" ? "rounded-full" : "rounded-[5px]",
        )}
      >
        {type === "radio" ? (
          <span className="size-2.5 scale-0 rounded-full bg-current transition-transform duration-150 group-has-[:checked]:scale-100" />
        ) : (
          <Check
            strokeWidth={3}
            className="size-3.5 scale-50 opacity-0 transition-[transform,opacity] duration-150 group-has-[:checked]:scale-100 group-has-[:checked]:opacity-100"
          />
        )}
      </span>
      <span className="min-w-0">{label}</span>
    </label>
  );
}

type GroupShellProps = {
  name: string;
  legend: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

function GroupShell({ name, legend, hint, error, optional, className, children }: GroupShellProps) {
  const id = `field-${name}`;
  return (
    <fieldset id={id} aria-describedby={describedBy(id, hint, error)} className={cn("min-w-0", className)}>
      <legend className="p-0 font-sans text-sm font-semibold leading-snug text-[#121212]">
        {legend}
        {optional ? <OptionalTag /> : <RequiredMark />}
      </legend>
      {hint ? <Hint id={`${id}-hint`}>{hint}</Hint> : null}
      <div className="mt-2">{children}</div>
      <FieldError id={`${id}-error`} message={error} />
    </fieldset>
  );
}

/** Single-choice group. `layout` picks how the tiles sit on the row. */
export function RadioGroup<T extends string>({
  name,
  legend,
  hint,
  error,
  options,
  value,
  onChange,
  layout = "pair",
  className,
}: {
  name: string;
  legend: string;
  hint?: string;
  error?: string;
  options: readonly T[];
  value: "" | T;
  onChange: (value: T) => void;
  /** "pair": two tiles side by side. "list": one column on phones, two from `sm`. */
  layout?: "pair" | "list";
  className?: string;
}) {
  return (
    <GroupShell name={name} legend={legend} hint={hint} error={error} className={className}>
      <div
        className={cn(
          "grid gap-3",
          layout === "pair" ? "grid-cols-2 md:max-w-sm" : "grid-cols-1 sm:grid-cols-2",
        )}
      >
        {options.map((option) => (
          <ChoiceTile
            key={option}
            type="radio"
            name={name}
            value={option}
            label={option}
            checked={value === option}
            onChange={() => onChange(option)}
          />
        ))}
      </div>
    </GroupShell>
  );
}

export function CheckboxGroup({
  name,
  legend,
  hint,
  error,
  options,
  values,
  onToggle,
  className,
}: {
  name: string;
  legend: string;
  hint?: string;
  error?: string;
  options: readonly string[];
  values: readonly string[];
  onToggle: (option: string) => void;
  className?: string;
}) {
  return (
    <GroupShell name={name} legend={legend} hint={hint} error={error} className={className}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {options.map((option) => (
          <ChoiceTile
            key={option}
            type="checkbox"
            name={name}
            value={option}
            label={option}
            checked={values.includes(option)}
            onChange={() => onToggle(option)}
          />
        ))}
      </div>
    </GroupShell>
  );
}

/**
 * Opens and closes a follow-up field smoothly. Closed content is inert, so it can't be tabbed into,
 * and the height animation is skipped for reduced-motion users. Use it as a direct child of a `gap-y-6` grid:
 * while closed it pulls up by one gap so the collapsed row leaves no blank space behind.
 */
export function Reveal({ open, children, className }: { open: boolean; children: ReactNode; className?: string }) {
  return (
    <div
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "-mt-6 grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      {/* Padding + negative margin leave room for the focus outline, which overflow-hidden would otherwise clip. */}
      <div className="-m-1.5 overflow-hidden p-1.5">{children}</div>
    </div>
  );
}
