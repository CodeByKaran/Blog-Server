const removeExtraSpaces = (str: any) => {
  return str.trim().replace(/\s+/g, " ");
};

const removeExtraSpacesAndLowerCase = (str: any) => {
  return str.trim().toLowerCase().replace(/\s+/g, " ");
};

const isValidUUID = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
};

export { removeExtraSpaces, removeExtraSpacesAndLowerCase, isValidUUID };
