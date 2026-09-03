"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import type { CustomerView, TicketStatus, TicketView } from "@/lib/types";
import {
  Field,
  FormActions,
  FormPanel,
  PrimaryButton,
  SecondaryLink,
  Select,
  inputClass,
} from "@/components/ui/form";

const statuses: TicketStatus[] = ["open", "pending", "resolved"];

export function TicketForm({ initial }: { initial?: TicketView }) {
  const router = useRouter();
  const { data: customers } = useResource<CustomerView[]>("/api/customers");
  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [status, setStatus] = useState<TicketStatus>(initial?.status ?? "open");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { customerId, subject, status };
      const saved = initial
        ? await sendJson<TicketView>(`/api/tickets/${initial.id}`, "PATCH", body)
        : await sendJson<TicketView>("/api/tickets", "POST", body);
      router.push(`/support/${saved.id}`);
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
        <Field label="Subject">
          <input
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Status">
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as TicketStatus)}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </Field>
      </FormPanel>
      <FormActions error={error}>
        <PrimaryButton type="submit" disabled={saving || !customerId}>
          {saving ? "Saving…" : initial ? "Save changes" : "Create ticket"}
        </PrimaryButton>
        <SecondaryLink href={initial ? `/support/${initial.id}` : "/support"}>
          Cancel
        </SecondaryLink>
      </FormActions>
    </form>
  );
}
