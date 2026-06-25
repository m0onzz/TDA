import { LandingPage } from "@/components/marketing/landing-page";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
