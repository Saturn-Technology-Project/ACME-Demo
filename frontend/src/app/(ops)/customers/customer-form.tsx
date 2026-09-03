"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/api";
import type { CustomerView, Plan, SubscriptionStatus } from "@/lib/types";
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

const plans: Plan[] = ["Starter", "Business", "Enterprise"];
const statuses: SubscriptionStatus[] = ["active", "past_due", "canceled"];

export function CustomerForm({ initial }: { initial?: CustomerView }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [plan, setPlan] = useState<Plan>(initial?.plan ?? "Business");
  const [mrr, setMrr] = useState(String(initial?.mrr ?? 0));
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(
    initial?.subscriptionStatus ?? "active"
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        name,
        plan,
        mrr: Number(mrr),
        subscriptionStatus,
      };
      const saved = initial
        ? await sendJson<CustomerView>(`/api/customers/${initial.id}`, "PATCH", body)
        : await sendJson<CustomerView>("/api/customers", "POST", body);
      router.push(paths.customer(saved.id));
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
        <Field label="Name">
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Plan">
          <Select
            value={plan}
            onChange={(event) => setPlan(event.target.value as Plan)}
          >
            {plans.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="MRR">
          <input
            required
            type="number"
            min={0}
            step={1}
            value={mrr}
            onChange={(event) => setMrr(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Subscription">
          <Select
            value={subscriptionStatus}
            onChange={(event) =>
              setSubscriptionStatus(event.target.value as SubscriptionStatus)
            }
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item.replace("_", " ")}
              </option>
            ))}
          </Select>
        </Field>
      </FormPanel>
      <FormActions error={error}>
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Saving…" : initial ? "Save changes" : "Create customer"}
        </PrimaryButton>
        <SecondaryLink href={initial ? paths.customer(initial.id) : "/customers"}>
          Cancel
        </SecondaryLink>
      </FormActions>
    </form>
  );
}
