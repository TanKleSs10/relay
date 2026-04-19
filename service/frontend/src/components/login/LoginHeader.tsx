type Props = {
  title: string;
  subtitle: string;
};

export function LoginHeader({ title, subtitle }: Props) {
  return (
    <header className="auth-header">
      <p className="auth-kicker">Relay Engine</p>
      <h1 className="auth-title">{title}</h1>
      <p className="auth-subtitle">{subtitle}</p>
    </header>
  );
}
