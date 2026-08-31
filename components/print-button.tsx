"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-sm font-semibold text-navy-900"
    >
      Print
    </button>
  );
}
