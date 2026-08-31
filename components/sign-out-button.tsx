"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full border border-navy-900/15 px-3 py-1.5 text-xs font-semibold text-navy-800 hover:bg-sand"
    >
      Sign out
    </button>
  );
}
