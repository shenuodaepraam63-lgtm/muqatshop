import { redirect } from "next/navigation";

export default function SupplierPendingPage() {
  redirect("/account/pending?type=supplier");
}
