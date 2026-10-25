/** صفحة الترحيب بدون هيدر/فوتر مزدوج — الـ Root لسه فيه RoleGate */
export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return <div className="welcome-shell">{children}</div>;
}
