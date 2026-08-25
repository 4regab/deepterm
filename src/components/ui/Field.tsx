"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { fieldIds, type FieldIds } from "./tokens";

export type ControlSize = "sm" | "md" | "lg";

/** 34 / 40 / 46 — the three control heights the product is allowed to use. */
const CONTROL_HEIGHT: Record<ControlSize, string> = {
  sm: "h-[34px]",
  md: "h-10",
  lg: "h-[46px]",
};

const CONTROL_TEXT: Record<ControlSize, string> = {
  sm: "text-[13px]",
  md: "text-[15px]",
  lg: "text-[15px]",
};

/**
 * Filled controls get a ring (box-shadow), not an outline. An outline sits
 * outside the border and reads as a second, misaligned edge on a white box.
 */
const CONTROL_BASE =
  "w-full rounded-sm border border-input bg-surface text-ink placeholder:text-disabled " +
  "transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)] " +
  "hover:border-[#6E7789] " +
  "focus:border-brand focus:shadow-[0_0_0_3px_rgb(79_70_229/.15)] focus:outline-none " +
  "focus-visible:outline-none " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:border-danger " +
  "aria-[invalid=true]:focus:shadow-[0_0_0_3px_rgb(185_28_28/.15)]";

interface FieldContextValue extends FieldIds {
  size: ControlSize;
}

const FieldContext = React.createContext<FieldContextValue | null>(null);

/** Controls read their id, size and error wiring from here when nested. */
function useFieldContext(): FieldContextValue | null {
  return React.useContext(FieldContext);
}

export interface FieldProps {
  label: string;
  children: React.ReactNode;
  description?: string;
  error?: string;
  /**
   * Marks the field as skippable with a caption pill. Required fields are
   * never asterisked — in a form where most inputs are required, the asterisk
   * is noise and the exception is what deserves the label.
   */
  optional?: boolean;
  size?: ControlSize;
  /** Override the generated control id (e.g. to match an existing input). */
  id?: string;
  className?: string;
  /** Hide the label visually but keep it for assistive tech. */
  hideLabel?: boolean;
}

export function Field({
  label,
  children,
  description,
  error,
  optional = false,
  size = "md",
  id,
  className,
  hideLabel = false,
}: FieldProps) {
  const generatedId = React.useId();
  const ids = fieldIds(id ?? generatedId, {
    hasDescription: Boolean(description),
    hasError: Boolean(error),
  });

  return (
    <FieldContext.Provider value={{ ...ids, size }}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        <div className="flex items-center gap-2">
          <Label htmlFor={ids.controlId} className={cn(hideLabel && "sr-only")}>
            {label}
          </Label>
          {optional ? (
            <span className="caption rounded-xs bg-surface-sunken px-1.5 py-0.5 text-muted">
              Optional
            </span>
          ) : null}
        </div>
        {children}
        {description ? (
          <p id={ids.descriptionId} className="body-sm text-muted">
            {description}
          </p>
        ) : null}
        {error ? (
          <p id={ids.errorId} className="body-sm text-danger-text">
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("label text-ink", className)} {...props}>
      {children}
    </label>
  );
}

interface OwnControlProps extends React.AriaAttributes {
  id?: string;
}

/** Applies the surrounding Field's wiring unless the caller overrode it. */
function useControlProps(own: OwnControlProps, size?: ControlSize) {
  const field = useFieldContext();
  return {
    id: own.id ?? field?.controlId,
    describedBy: own["aria-describedby"] ?? field?.describedBy,
    invalid: own["aria-invalid"] ?? (field?.invalid ? true : undefined),
    size: size ?? field?.size ?? ("md" as ControlSize),
  };
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: ControlSize;
  leadingIcon?: React.ReactNode;
  /** Trailing affordance — a unit, a clear button, a visibility toggle. */
  trailingSlot?: React.ReactNode;
}

export function Input({
  className,
  size,
  leadingIcon,
  trailingSlot,
  ...props
}: InputProps) {
  const resolved = useControlProps(props, size);
  const input = (
    <input
      {...props}
      id={resolved.id}
      aria-describedby={resolved.describedBy}
      aria-invalid={resolved.invalid}
      className={cn(
        CONTROL_BASE,
        CONTROL_HEIGHT[resolved.size],
        CONTROL_TEXT[resolved.size],
        "px-3",
        Boolean(leadingIcon) && "pl-9",
        Boolean(trailingSlot) && "pr-9",
        className
      )}
    />
  );

  if (!leadingIcon && !trailingSlot) return input;

  return (
    <div className="relative">
      {leadingIcon ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted"
        >
          {leadingIcon}
        </span>
      ) : null}
      {input}
      {trailingSlot ? (
        <span className="absolute inset-y-0 right-2 flex items-center text-muted">
          {trailingSlot}
        </span>
      ) : null}
    </div>
  );
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Shows a live "n / max" counter under the control. */
  showCount?: boolean;
}

export function Textarea({
  className,
  showCount = true,
  maxLength,
  value,
  defaultValue,
  onChange,
  ...props
}: TextareaProps) {
  const resolved = useControlProps(props);
  const [count, setCount] = React.useState(
    String(value ?? defaultValue ?? "").length
  );

  const withCounter = showCount && typeof maxLength === "number";
  const length = typeof value === "string" ? value.length : count;

  return (
    <div className="flex flex-col gap-1">
      <textarea
        {...props}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChange={(event) => {
          setCount(event.target.value.length);
          onChange?.(event);
        }}
        id={resolved.id}
        aria-describedby={resolved.describedBy}
        aria-invalid={resolved.invalid}
        className={cn(
          CONTROL_BASE,
          CONTROL_TEXT[resolved.size],
          "min-h-24 max-h-100 resize-y px-3 py-2 leading-6",
          className
        )}
      />
      {withCounter ? (
        <span className="caption tabular self-end text-muted">
          {length} / {maxLength}
        </span>
      ) : null}
    </div>
  );
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: ControlSize;
}

export function Select({ className, size, children, ...props }: SelectProps) {
  const resolved = useControlProps(props, size);
  return (
    <div className="relative">
      <select
        {...props}
        id={resolved.id}
        aria-describedby={resolved.describedBy}
        aria-invalid={resolved.invalid}
        className={cn(
          CONTROL_BASE,
          CONTROL_HEIGHT[resolved.size],
          CONTROL_TEXT[resolved.size],
          "cursor-pointer appearance-none pl-3 pr-9",
          className
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
