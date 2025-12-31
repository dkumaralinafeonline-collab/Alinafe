import { QUERY_CATEGORY_MAP } from "../Constant/queryCategoryMap.js";

export const resolveQueryCategory = (query) => {
  const q = query.toLowerCase().trim();

  // exact match first
  if (QUERY_CATEGORY_MAP[q]) return QUERY_CATEGORY_MAP[q];

  // prefix match (ca → car)
  for (const key of Object.keys(QUERY_CATEGORY_MAP)) {
    if (key.startsWith(q)) {
      return QUERY_CATEGORY_MAP[key];
    }
  }

  return null;
};
