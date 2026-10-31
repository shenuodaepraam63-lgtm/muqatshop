import { redirect } from "next/navigation";

export default function AffiliatePendingPage() {
  redirect("/account/pending?type=affiliate");
}
