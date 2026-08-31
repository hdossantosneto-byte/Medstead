"use client";

import { useState } from "react";
import { WAREHOUSE } from "@/lib/constants";
import { Button } from "@/components/ui";

export function CopyAddress({
  name,
  suite,
}: {
  name?: string | null;
  suite?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const block = [
    name || "Your name",
    WAREHOUSE.name,
    WAREHOUSE.street,
    `${WAREHOUSE.city}, ${WAREHOUSE.state} ${WAREHOUSE.zip}`,
    suite ? `Suite ${suite}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Button
      type="button"
      variant="ghost"
      className="mt-4 min-h-tap"
      onClick={async () => {
        await navigator.clipboard.writeText(block);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copied" : "Copy Address"}
    </Button>
  );
}
