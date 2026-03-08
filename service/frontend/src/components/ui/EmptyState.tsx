import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      {description ? <p className="empty-state__text">{description}</p> : null}
      {action ? action : null}
    </div>
  );
}
