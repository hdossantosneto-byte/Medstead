import type { Role } from "@prisma/client";
import { CLINIC_ROLES, OS_ARMS } from "./constants";

export function osArmsFor(role: Role) {
  return OS_ARMS.map((arm) => {
    if (arm.title === "MTG Airlines") {
      if (role === "FINANCE") {
        return {
          ...arm,
          href: "/app",
          body: "Finance cannot fly. Del owns MTG Airlines dispatch.",
        };
      }
      if (CLINIC_ROLES.includes(role)) {
        return {
          ...arm,
          href: "/app/clinic/charter",
          body: "Request a doctor charter or a rescue organ trip. No finance totals.",
        };
      }
      if (role === "CUSTOMER" || role === "PUBLIC") {
        return {
          ...arm,
          href: "/app/travel",
          body: "Personal goods on an MTG Airlines trip. Public freight IDs stay MS-.",
        };
      }
      if (role === "PILOT") {
        return {
          ...arm,
          href: "/app/flights",
          body: "Trip briefs land here. Acknowledge in-app. No WhatsApp.",
        };
      }
      return arm;
    }
    if (arm.title === "Accounting") {
      if (role === "FINANCE" || role === "MEDSTEAD_ADMIN") {
        return { ...arm, href: "/app/finance/invoices" };
      }
      return {
        ...arm,
        href: "/app/orders",
        body: "Clinic shop and packages. Invoice totals stay with finance.",
      };
    }
    if (arm.title === "Company management") {
      if (role === "MEDSTEAD_ADMIN") {
        return { ...arm, href: "/app/admin/crm" };
      }
      return {
        ...arm,
        href: "/app",
        body: "Your next-action queue. One login. No WhatsApp.",
      };
    }
    return arm;
  });
}
