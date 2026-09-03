"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import type { CustomerView, InvoiceStatus, InvoiceView } from "@/lib/types";
import { paths } from "@/lib/paths";
import {
  Field,
  FormActions,
  FormPanel,
  PrimaryButton,
  SecondaryLink,
  Select,
  inputClass,
} from "@/components/ui/form";

const statuses: InvoiceStatus[] = ["open", "paid", "failed", "refunded"];

export function InvoiceForm({ initial }: { initial?: InvoiceView }) {
  const router = useRouter();
  const { data: customers } = useResource<CustomerView[]>("/api/customers");
  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [status, setStatus] = useState<InvoiceStatus>(initial?.status ?? "open");
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        customerId,
        amount: Number(amount),
        status,
        reason: reason.trim() || null,
      };
      const saved = initial
        ? await sendJson<InvoiceView>(`/api/invoices/${initial.id}`, "PATCH", body)
        : await sendJson<InvoiceView>("/api/invoices", "POST", body);
      router.push(paths.invoice(saved.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <FormPanel>
        <Field label="Customer">
          <Select
            required
            disabled={Boolean(initial)}
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          >
            <option value="">Select a customer</option>
            {customerId && !(customers ?? []).some((customer) => customer.id === customerId) ? (
              <option value={customerId}>{initial?.customerName ?? customerId}</option>
            ) : null}
            {(customers ?? []).map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Amount">
          <input
            required
            type="number"
            min={0}
            step={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Status">
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as InvoiceStatus)}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reason">
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </Field>
      </FormPanel>
      <FormActions error={error}>
        <PrimaryButton type="submit" disabled={saving || !customerId}>
          {saving ? "Saving…" : initial ? "Save changes" : "Create invoice"}
        </PrimaryButton>
        <SecondaryLink href={initial ? paths.invoice(initial.id) : "/billing"}>
          Cancel
        </SecondaryLink>
      </FormActions>
    </form>
  );
}
