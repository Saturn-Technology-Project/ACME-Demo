"use client";

import { useSearchParams } from "next/navigation";

export function useIdParam() {
  return useSearchParams().get("id") ?? "";
}
