type Props = {
  title: string;
};

export function MessageFormHeader({ title }: Props) {
  return <h2>{title}</h2>;
}
