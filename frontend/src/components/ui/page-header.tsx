import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[20px] font-medium tracking-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-1 text-[13px] text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Kv({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 border-b border-line py-3 text-[13px]">
      <div className="text-muted">{label}</div>
      <div className="font-medium text-ink">{children}</div>
    </div>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded border border-line bg-card">{children}</div>;
}
