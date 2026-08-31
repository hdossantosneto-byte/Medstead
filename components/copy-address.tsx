"use client";

import { useState } from "react";
import { Button } from "./ui";

export function CopyAddress({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="green" onClick={copy}>
      {copied ? "Copied" : "Copy Address"}
    </Button>
  );
}
