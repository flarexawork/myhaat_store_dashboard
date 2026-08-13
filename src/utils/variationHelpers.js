export const makeVariantKey = (attributes = []) => {
  return [...attributes]
    .map((item) => ({
      name: String(item.name || "").trim(),
      value: String(item.value || "").trim(),
    }))
    .filter((item) => item.name && item.value)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => `${item.name}:${item.value}`)
    .join("|");
};

export const buildSelectedProductVariations = (configVariations = [], selectedOptions = {}) => {
  return configVariations
    .filter((variation) => variation.isActive !== false)
    .map((variation, index) => {
      const selectedValues = selectedOptions[variation.name] || [];
      const options = (variation.options || [])
        .filter((option) => option.isActive !== false && selectedValues.includes(option.value))
        .map((option, optionIndex) => ({
          label: option.label,
          value: option.value,
          group: option.group || "",
          sortOrder: option.sortOrder ?? optionIndex,
        }));

      return {
        name: variation.name,
        label: variation.label || variation.name,
        required: variation.isRequired !== false,
        sortOrder: variation.sortOrder ?? index,
        selectedOptions: options,
      };
    })
    .filter((variation) => variation.selectedOptions.length);
};

export const buildVariantCombinations = (productVariations = [], existingCombinations = []) => {
  const activeGroups = productVariations.filter((variation) => variation.selectedOptions?.length);
  if (!activeGroups.length) return [];

  const existingByKey = new Map(existingCombinations.map((item) => [item.variantKey, item]));

  const walk = (index, attributes) => {
    if (index === activeGroups.length) {
      const variantKey = makeVariantKey(attributes);
      const existing = existingByKey.get(variantKey);
      return [{
        variantKey,
        sku: existing?.sku || "",
        stock: existing?.stock ?? "",
        price: existing?.price ?? "",
        isActive: existing?.isActive !== false,
        attributes,
      }];
    }

    const group = activeGroups[index];
    return group.selectedOptions.flatMap((option) =>
      walk(index + 1, [
        ...attributes,
        {
          name: group.name,
          label: group.label || group.name,
          value: option.value,
          optionLabel: option.label || option.value,
        },
      ]),
    );
  };

  return walk(0, []);
};

export const parsePincodes = (value = "") => {
  return [...new Set(String(value).split(/[,\n\r\t ]+/).map((item) => item.trim()).filter(Boolean))];
};
