type Props = {
  label: string;
  className?: string;
};

export function StatusBadge({ label, className = "" }: Props) {
  return <span className={className}>{label}</span>;
}
