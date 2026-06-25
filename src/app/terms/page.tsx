import type { Metadata } from "next";
import { LegalPageShell } from "@/components/marketing/legal-page-shell";
import { TermsOfServiceContent } from "@/components/marketing/terms-of-service";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for TDA (TikTok Dropship Automator) — account use, third-party integrations, compliance, and liability.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      description="Please read these terms carefully before using TDA."
    >
      <TermsOfServiceContent />
    </LegalPageShell>
  );
}
