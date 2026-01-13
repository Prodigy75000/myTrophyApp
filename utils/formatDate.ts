// src/utils/formatDate.ts
export const formatDate = (iso?: string) => {
  if (!iso) return "N/A";

  const date = new Date(iso);

  const formatDate = date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatDate} ${formattedTime}`;
};
