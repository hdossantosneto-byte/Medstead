#!/usr/bin/env python3
"""Build a static export of public storefront pages for a host that cannot run Node."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGE = Path("/tmp/medstead-stage")
DEMO_CODES = [
    "MS-20260820-FLL-NAS-0001",
    "MS-20260822-FLL-KIN-0001",
]


def replace(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    if old not in text:
        raise SystemExit(f"patch failed in {path}: pattern not found")
    path.write_text(text.replace(old, new, 1))


def main() -> None:
    if STAGE.exists():
        shutil.rmtree(STAGE)
    shutil.copytree(
        ROOT,
        STAGE,
        ignore=shutil.ignore_patterns(
            "node_modules",
            ".next",
            ".git",
            "out",
            "*.log",
        ),
    )

    (STAGE / "next.config.js").write_text(
        """/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

module.exports = nextConfig;
"""
    )

    replace(
        STAGE / "app/layout.tsx",
        'import { currentUser } from "@/lib/auth";\n',
        "",
    )
    replace(
        STAGE / "app/layout.tsx",
        'export const dynamic = "force-dynamic";\n',
        'export const dynamic = "force-static";\n',
    )
    replace(
        STAGE / "app/layout.tsx",
        """export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <Header signedIn={Boolean(user)} />
""",
        """export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <Header signedIn={false} />
""",
    )

    replace(
        STAGE / "app/book/page.tsx",
        'import { currentUser } from "@/lib/auth";\n',
        "",
    )
    replace(
        STAGE / "app/book/page.tsx",
        """export default async function BookPage() {
  const user = await currentUser();
  return (
""",
        """export default async function BookPage() {
  return (
""",
    )
    replace(
        STAGE / "app/book/page.tsx",
        """        <BookForm
          defaults={
            user
              ? { name: user.name, email: user.email, phone: user.phone }
              : undefined
          }
        />
""",
        """        <BookForm />
""",
    )

    replace(
        STAGE / "app/account/page.tsx",
        'import { currentUser } from "@/lib/auth";\nimport { SERVICE_LABEL, STATUS_LABEL, warehouseAddressFor } from "@/lib/constants";\nimport { prisma } from "@/lib/prisma";\n',
        'import { warehouseAddressFor } from "@/lib/constants";\n',
    )
    replace(
        STAGE / "app/account/page.tsx",
        'export const dynamic = "force-dynamic";\n',
        'export const dynamic = "force-static";\n',
    )
    account = STAGE / "app/account/page.tsx"
    text = account.read_text()
    start = text.index("export default async function AccountPage()")
    account.write_text(
        text[:start]
        + """export default async function AccountPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-700">Account</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy-950">Sign in</h1>
      <p className="mt-3 text-navy-800/70">
        Create a free account to keep bookings and your Fort Lauderdale warehouse address.
      </p>
      <Card className="mt-8 p-6">
        <Suspense fallback={<p className="text-sm text-navy-800/60">Loading…</p>}>
          <AuthTabs initial="login" />
        </Suspense>
      </Card>
      <p className="mt-4 text-xs text-navy-800/50">
        Staging preview is static. Account APIs need a Node host (Vercel / Netlify with auth).
      </p>
    </div>
  );
}
"""
    )

    replace(
        STAGE / "app/ops/page.tsx",
        'import { isOps } from "@/lib/auth";\nimport { prisma } from "@/lib/prisma";\n',
        "",
    )
    replace(
        STAGE / "app/ops/page.tsx",
        'export const dynamic = "force-dynamic";\n',
        'export const dynamic = "force-static";\n',
    )
    ops = STAGE / "app/ops/page.tsx"
    text = ops.read_text()
    start = text.index("export default async function OpsPage()")
    ops.write_text(
        text[:start]
        + """export default async function OpsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-700">Internal</p>
      <h1 className="mt-3 text-3xl font-semibold text-navy-950">Ops desk</h1>
      <p className="mt-3 text-sm text-navy-800/70">
        Update tracking and issue invoice / pay-later. This is not a customer page.
      </p>
      <div className="mt-6">
        <OpsLogin />
      </div>
    </div>
  );
}
"""
    )

    params = (
        "export function generateStaticParams() {\n"
        f"  return {json.dumps([{'code': c} for c in DEMO_CODES])};\n"
        "}\n"
        "export const dynamicParams = false;\n"
    )
    replace(
        STAGE / "app/track/[code]/page.tsx",
        'export const dynamic = "force-dynamic";\n',
        params,
    )
    replace(
        STAGE / "app/book/confirm/[code]/page.tsx",
        'export const dynamic = "force-dynamic";\n',
        params,
    )

    api = STAGE / "app/api"
    if api.exists():
        api.rename(STAGE / "app/_api_disabled")

    env = STAGE / ".env"
    if not env.exists():
        shutil.copy2(ROOT / ".env", env)

    db_src = ROOT / "prisma" / "dev.db"
    if db_src.exists():
        shutil.copy2(db_src, STAGE / "prisma" / "dev.db")

    node_modules = ROOT / "node_modules"
    if node_modules.exists():
        (STAGE / "node_modules").symlink_to(node_modules)
    else:
        subprocess.check_call(["npm", "install", "--ignore-scripts"], cwd=STAGE)
    subprocess.check_call(["npx", "prisma", "generate"], cwd=STAGE)
    subprocess.check_call(["npx", "next", "build"], cwd=STAGE)

    out = STAGE / "out"
    if not (out / "index.html").exists():
        raise SystemExit("static export missing out/index.html")
    print(f"STATIC_OUT={out}")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:
        sys.exit(exc.returncode)
