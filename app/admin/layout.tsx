// Wraps every /admin/* route, including /admin/login — restores the native
// cursor here (globals.css hides it site-wide for the public site's custom
// heart-pointer effect; Pointer itself already skips rendering on /admin,
// but without this marker nothing re-enables the native cursor in its place).
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-admin-root className="contents">
      {children}
    </div>
  );
}
