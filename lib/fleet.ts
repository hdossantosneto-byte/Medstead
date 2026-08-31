import { CURRENT_FLEET_ASSIGN } from "./constants";

export type FleetRow = {
  name: string;
  type?: string | null;
  tailNumber?: string | null;
  homeBase?: string | null;
  status?: string | null;
  corridors?: string | null;
};

export function fleetLine(ac: FleetRow) {
  const name = ac.name.trim();
  const type = ac.type?.trim() || "";
  const tail = ac.tailNumber?.trim() || "";
  const bits = [name];
  if (type && type.toLowerCase() !== name.toLowerCase()) bits.push(type);
  if (tail) bits.push(tail);
  return bits.filter(Boolean).join(" · ");
}

export function flightAircraftLine(
  aircraft: FleetRow | null | undefined,
  fallback?: string | null,
) {
  if (aircraft) return fleetLine(aircraft);
  const note = fallback?.trim();
  if (note && !/tbd|hairson fills|placeholder|future 135/i.test(note)) return note;
  return CURRENT_FLEET_ASSIGN;
}

export function corridorLine(corridors?: string | null) {
  const raw = corridors?.trim() || "FLL_NAS,FLL_FPO";
  return raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      if (c === "FLL_NAS") return "FLL–NAS";
      if (c === "FLL_FPO") return "FLL–FPO";
      if (c === "FLL_MSY") return "FLL–MSY (not live)";
      return c;
    })
    .join(" / ");
}

export const AIRCRAFT_STATUS_LABEL: Record<string, string> = {
  CURRENT: "Current",
  MX: "MX",
  DOWN: "Down",
};
