import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import Link from "next/link";

export const inputClass =
  "h-9 w-full rounded border border-line bg-card px-3 text-[13px] outline-none placeholder:text-muted focus:border-accent";

export const textareaClass =
  "min-h-32 w-full rounded border border-line bg-card px-3 py-2 text-[13px] outline-none placeholder:text-muted focus:border-accent";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[12px] text-muted">{label}</div>
      {children}
    </label>
  );
}

export function Select({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={inputClass} {...props}>
      {children}
    </select>
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={textareaClass} {...props} />;
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`h-9 rounded bg-navy px-3 text-[13px] font-medium text-white hover:bg-navy-hover disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center rounded border border-line bg-card px-3 text-[13px] font-medium text-ink hover:bg-page"
    >
      {children}
    </Link>
  );
}

export function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center rounded bg-navy px-3 text-[13px] font-medium text-white hover:bg-navy-hover"
    >
      {children}
    </Link>
  );
}

export function FormActions({
  children,
  error,
}: {
  children: ReactNode;
  error?: string | null;
}) {
  return (
    <div className="mt-6 flex items-center gap-3">
      {children}
      {error ? <p className="text-[13px] text-failed">{error}</p> : null}
    </div>
  );
}

export function FormPanel({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-xl space-y-4 rounded border border-line bg-card p-5">
      {children}
    </div>
  );
}
