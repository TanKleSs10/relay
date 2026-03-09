import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export function Spinner({ label = "Cargando...", className = "", ...props }: Props) {
  return (
    <div className={`spinner ${className}`.trim()} {...props}>
      <div className="spinner__bolt" aria-hidden="true">
        ⚡
      </div>
      <span className="spinner__label">{label}</span>
    </div>
  );
}
