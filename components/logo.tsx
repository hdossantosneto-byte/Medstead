import Link from "next/link";

export function Logo({
  href = "/",
  size = "header",
}: {
  href?: string | null;
  size?: "header" | "hero" | "footer";
}) {
  const src = size === "hero" ? "/medstead-logo.png" : "/medstead-compact.png";
  const height =
    size === "hero" ? "h-52 sm:h-60" : size === "footer" ? "h-10" : "h-9 sm:h-10";
  const img = (
    // Official lockup — white artwork, keep on a light chip when the chrome is navy.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="MedStead Transport Group" className={`w-auto ${height}`} />
  );

  if (!href) return img;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="MedStead home">
      {img}
    </Link>
  );
}
