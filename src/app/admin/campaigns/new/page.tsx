import Link from "next/link";
import { CampaignForm } from "@/components/admin/campaigns/CampaignForm";

export default function NewCampaignPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/campaigns" className="text-xs text-muted hover:text-ink">
          ← العودة للحملات
        </Link>
        <h1 className="text-2xl font-bold mt-2">حملة إعلانية جديدة</h1>
      </div>
      <CampaignForm />
    </div>
  );
}
