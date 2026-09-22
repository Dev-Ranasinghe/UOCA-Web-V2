// The dashboard's one entrance: its blocks drop into place with a small overshoot, one after another, like cards
// being stacked on a desk. Plain CSS (`.nb-rise` in app/admin/admin-theme.css) rather than a JS animation, so the
// server HTML is never hidden while it waits for hydration; reduced-motion users get no movement.
export function RevealGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

export function RevealItem({
  order = 0,
  className,
  children,
}: {
  order?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className ? `nb-rise ${className}` : "nb-rise"} style={{ animationDelay: `${order * 60}ms` }}>
      {children}
    </div>
  );
}
