import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary: "btn--primary",
  secondary: "btn--secondary",
  success: "btn--success",
  danger: "btn--danger",
  tertiary: "btn--tertiary",
  ghost: "btn--ghost",
};

type Variant = keyof typeof variants;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "default" | "small";
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "default",
  className = "",
  type = "button",
  children,
  ...props
}: Props) {
  const sizeClass = size === "small" ? "btn--small" : "";
  const variantClass = variants[variant] ?? variants.primary;
  const classes = ["btn", variantClass, sizeClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
