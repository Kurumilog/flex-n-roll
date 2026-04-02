export function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatDateTime(input: Date | string) {
  const date = input instanceof Date ? input : new Date(input);

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
