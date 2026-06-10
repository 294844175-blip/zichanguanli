export function buildSearchQuery<T>(keyword: string | undefined, fields: Array<keyof T>) {
  if (!keyword || keyword.trim() === '') {
    return {};
  }

  const trimmedKeyword = keyword.trim();
  
  return {
    OR: fields.map(field => ({
      [field]: {
        contains: trimmedKeyword
      }
    }))
  };
}
