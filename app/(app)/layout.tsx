import { AppShell } from "@/components/layout/app-shell";
import { verifySession } from "@/lib/session";

/**
 * Guarded shell for every authenticated route.
 *
 * `(app)` is a route group: it does not appear in the URL, so the pages inside
 * keep clean paths (`/dashboard`, `/rooms`, …) while sharing one guard, one
 * sidebar and one topbar.
 *
 * The session is verified here (close to the data) rather than relying on the
 * proxy's cheap cookie check alone. Props are typed explicitly instead of using
 * the `LayoutProps<'/route'>` helper, because this layout serves several routes.
 */
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();

  return (
    <AppShell user={session.user} alertCount={0}>
      {children}
    </AppShell>
  );
}