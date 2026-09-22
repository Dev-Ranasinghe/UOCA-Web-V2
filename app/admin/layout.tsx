import { Figtree } from "next/font/google";
import "./admin-theme.css";

// The admin face. Set as --font-sans on <body> (not on this wrapper) so dialogs, menus and toasts that portal into
// <body> use it too; admin-theme.css holds the rest of the theme.
const fontAdmin = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Wraps every /admin/* route, including /admin/login — restores the native
// cursor here (globals.css hides it site-wide for the public site's custom
// heart-pointer effect; Pointer itself already skips rendering on /admin,
// but without this marker nothing re-enables the native cursor in its place).
// The same marker scopes the admin theme (admin-theme.css).
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-admin-root className="contents">
      <style>{`body:has([data-admin-root]){--font-sans:${fontAdmin.style.fontFamily};font-family:var(--font-sans),system-ui,sans-serif}`}</style>
      {children}
    </div>
  );
}
