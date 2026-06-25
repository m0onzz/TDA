import type { Metadata } from "next";
import { LegalPageShell } from "@/components/marketing/legal-page-shell";
import { PrivacyPolicyContent } from "@/components/marketing/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for TDA (TikTok Dropship Automator) — what we collect, how we use data, third parties, security, and your rights.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      description="How TDA collects, uses, and protects your information."
    >
      <PrivacyPolicyContent />
    </LegalPageShell>
  );
}
