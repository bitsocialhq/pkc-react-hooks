const NEWER_THAN_LIMITS = [
  [60 * 60 * 24, "Day"],
  [60 * 60 * 24 * 7, "Week"],
  [60 * 60 * 24 * 31, "Month"],
  [60 * 60 * 24 * 365, "Year"],
] as const;

export const deriveFeedSortType = (sortType?: string, newerThan?: number): string => {
  const base = sortType || "hot";
  if (!newerThan || (base !== "topAll" && base !== "controversialAll")) return base;
  let time: string | undefined;
  for (const [limit, name] of NEWER_THAN_LIMITS) {
    if (newerThan <= limit) {
      time = name;
      break;
    }
  }
  if (!time) return base;
  return base === "topAll" ? `top${time}` : `controversial${time}`;
};
