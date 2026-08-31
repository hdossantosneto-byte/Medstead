import { redirect } from "next/navigation";

export default function OpsShippingRedirect() {
  redirect("/app/ops/packages");
}
