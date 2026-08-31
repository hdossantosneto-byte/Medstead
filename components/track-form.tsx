import { Button, Field, inputClass } from "@/components/ui";

export function TrackForm({
  compact = false,
  demo = "MS-20260820-FLL-NAS-0001",
}: {
  compact?: boolean;
  demo?: string;
}) {
  return (
    <form action="/track/lookup" method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Field label={compact ? "Package ID" : "Shipment ID"}>
          <input
            className={`${inputClass} min-h-tap`}
            name="code"
            placeholder="MS-YYYYMMDD-ORIGIN-DEST-####"
            required
            autoComplete="off"
          />
        </Field>
      </div>
      <Button type="submit" className="min-h-tap w-full sm:w-auto">
        Track package
      </Button>
      {!compact && (
        <p className="text-xs text-navy-800/50 sm:hidden">Demo: {demo}</p>
      )}
    </form>
  );
}
