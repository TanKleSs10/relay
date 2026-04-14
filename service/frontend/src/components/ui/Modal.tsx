import type { ReactNode } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function Modal({ isOpen, onClose, children, className = "" }: Props) {
  const classes = ["modal", isOpen ? "modal--open" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
}
