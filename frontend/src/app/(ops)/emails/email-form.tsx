"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import type { CustomerView, EmailMessage } from "@/lib/types";
import { paths } from "@/lib/paths";
import {
  Field,
  FormActions,
  FormPanel,
  PrimaryButton,
  SecondaryLink,
  Select,
  Textarea,
  inputClass,
} from "@/components/ui/form";

export function EmailForm({ initial }: { initial?: EmailMessage }) {
  const router = useRouter();
  const { data: customers } = useResource<CustomerView[]>("/api/customers");
  const [customerId, setCustomerId] = useState("");
  const [to, setTo] = useState(initial?.to ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        to,
        subject,
        body,
        customerId: customerId || undefined,
      };
      const saved = initial
        ? await sendJson<EmailMessage>(`/api/emails/${initial.id}`, "PATCH", payload)
        : await sendJson<EmailMessage>("/api/emails", "POST", payload);
      router.push(paths.email(saved.id));
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
        {!initial ? (
          <Field label="Customer">
            <Select
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
              <option value="">None</option>
              {(customers ?? []).map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label="To">
          <input
            required
            type="email"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Subject">
          <input
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Body">
          <Textarea
            required
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </Field>
      </FormPanel>
      <FormActions error={error}>
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Saving…" : initial ? "Save changes" : "Send email"}
        </PrimaryButton>
        <SecondaryLink href={initial ? paths.email(initial.id) : "/emails"}>
          Cancel
        </SecondaryLink>
      </FormActions>
    </form>
  );
}
