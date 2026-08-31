"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CART_EVENT, cartCount, readCart } from "@/lib/clinic-cart";

export function CartBadge() {
  const [n, setN] = useState(0);

  useEffect(() => {
    function sync() {
      setN(cartCount(readCart()));
    }
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <Link
      href="/cart"
      className="inline-flex min-h-tap items-center rounded-full px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-forest-50 hover:text-forest-800"
    >
      Cart{n > 0 ? ` (${n})` : ""}
    </Link>
  );
}
