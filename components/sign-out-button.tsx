"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="min-h-tap rounded-full border border-navy-900/15 px-4 text-sm font-semibold text-navy-800 hover:bg-sand"
    >
      Sign out
    </button>
  );
}
