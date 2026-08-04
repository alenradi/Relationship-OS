import { MobileHeader, Sidebar } from "@/components/app-nav";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { SignOutButton } from "@/components/sign-out-button";
import { requireCouple } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, partner, couple } = await requireCouple();

  const footer = <SignOutButton className="w-full justify-start" />;

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Sidebar profile={profile} partner={partner} footer={footer} />
      <MobileHeader profile={profile} partner={partner} footer={footer} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        {children}
      </main>

      {/* Keeps both screens in step when either of you changes something. */}
      <RealtimeRefresher coupleId={couple.id} />
    </div>
  );
}
