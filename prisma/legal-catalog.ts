import { readFileSync } from "fs";
import { join } from "path";

const FORBIDDEN = [
  "testosterone",
  "ivermectin",
  "oxytocin",
  "ketamine",
  "clomiphene",
  "tesofensine",
  "fenbendazole",
  "fenbenzadol",
  "metformin",
  "estrogen",
  "estriol",
  "estradiol",
  "bi-est",
  "biest",
  "progesterone",
  "dhea",
  "hormone",
  "beah blend",
  "aprepitant",
  "dexamethasone",
  "5-amino",
  "cho/ino",
  "semaglutide",
  "tirzepatide",
  "retatrutide",
  "lilly",
  "incretin",
  "glp",
  "peptide",
];

const ALLOWED_HINTS = [
  "nad",
  "b-nad",
  "methylcobalamin",
  "amino acid",
  "b-complex",
  "biotin",
  "l-carnitine",
  "chromium",
  "cyanocobalamin",
  "glutathione",
  "hydroxocobalamin",
  "lipo-b",
  "lipo-c",
  "lipo-mino",
  "magnesium",
  "pantothenic",
  "pyridoxine",
  "sodium ascorbate",
  "taurine",
  "coq10",
  "l-arginine",
  "l-glutamine",
  "l-isoleucine",
  "l-leucine",
  "l-lysine",
  "l-methionine",
  "l-ornithine",
  "l-phenylalanine",
  "l-proline",
  "l-valine",
  "m.i.c.",
  "triple m.i.c.",
  "vitamin d3",
  "supplies",
];

export type LegalRow = {
  name: string;
  strength: string;
  form: string;
  intlPrice: number;
  kind: "IV" | "SUPPLIES";
};

function blocked(name: string) {
  const n = name.toLowerCase();
  return FORBIDDEN.some((t) => n.includes(t));
}

function allowed(name: string) {
  const n = name.toLowerCase();
  if (n.startsWith("supplies")) return true;
  return ALLOWED_HINTS.some((t) => n.includes(t));
}

export function loadLegalIntlRows(workspaceRoot = process.cwd()): LegalRow[] {
  const path = join(workspaceRoot, "docs", "LEGAL_INTL_RX_ROWS.txt");
  const text = readFileSync(path, "utf8");
  const rows: LegalRow[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const body = line.replace(/^\[merged\]\s*/i, "").trim();
    const priceMatch = body.match(/\$([0-9]+(?:\.[0-9]{2})?)\s*$/);
    if (!priceMatch) continue;
    const intlPrice = Number(priceMatch[1]);
    const left = body.slice(0, priceMatch.index).replace(/\s+/g, " ").trim();

    if (blocked(left)) continue;
    if (!allowed(left)) continue;

    const isSupply = /^supplies\b/i.test(left);
    const parts = left.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);

    let name = "";
    let strength = "";
    let form = "";

    if (isSupply) {
      name = parts.slice(1).join(" ") || left;
      form = "each";
    } else if (parts.length >= 3) {
      name = parts[0];
      strength = parts[1];
      form = parts.slice(2).join(" ");
    } else if (parts.length === 2) {
      name = parts[0];
      form = parts[1];
    } else {
      name = left;
    }

    name = name.replace(/^\*NEW\*\s*/i, "").trim();
    rows.push({
      name,
      strength,
      form,
      intlPrice,
      kind: isSupply ? "SUPPLIES" : "IV",
    });
  }

  return rows;
}
