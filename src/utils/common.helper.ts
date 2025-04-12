const removeExtraSpaces = (str: any) => {
  return str.trim().replace(/\s+/g, " ");
};

const removeExtraSpacesAndLowerCase = (str: any) => {
  return str.trim().toLowerCase().replace(/\s+/g, " ");
};

export { removeExtraSpaces, removeExtraSpacesAndLowerCase };
