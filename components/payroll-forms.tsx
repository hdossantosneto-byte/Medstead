"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markScheduledPaySent } from "@/lib/actions";

export function MarkPaySentButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          const res = await markScheduledPaySent(id);
          setBusy(false);
          if (res && "error" in res && res.error) {
            setError(res.error);
            return;
          }
          router.refresh();
        }}
        className="text-xs font-medium text-navy-800/45 underline-offset-2 hover:underline"
      >
        {busy ? "Saving…" : "Mark sent (books only — does not Zelle)"}
      </button>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
