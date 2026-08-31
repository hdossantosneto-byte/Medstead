"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "./ui";

export function TrackForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initial);

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) return;
        router.push(`/track/${encodeURIComponent(trimmed)}`);
      }}
    >
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="MS-YYYYMMDD-FLL-NAS-0001"
        aria-label="Tracking ID"
      />
      <Button type="submit" variant="blue" className="sm:w-40">
        Track
      </Button>
    </form>
  );
}
