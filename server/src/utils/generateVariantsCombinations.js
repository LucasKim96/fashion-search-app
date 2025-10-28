export const generateVariantsCombinations = (attributes = []) => {
  // Giới hạn tối đa 3 attribute
  const attrs = attributes.slice(0, 3);

  if (attrs.length === 0) return [];

  // Chuẩn hóa dữ liệu values, thêm index cho mỗi value
  const valueLists = attrs.map(attr =>
    attr.values.map((v, idx) => ({
      attributeId: attr.attributeId,
      valueId: v.valueId,
      index: idx + 1, // 1-based index
    }))
  );

  // Hàm đệ quy sinh tổ hợp (Cartesian Product)
  const cartesianProduct = (arrays) => {
    return arrays.reduce((acc, curr) => {
      const result = [];
      for (const a of acc) {
        for (const b of curr) {
          result.push([...a, b]);
        }
      }
      return result;
    }, [[]]);
  };

  const rawCombinations = cartesianProduct(valueLists);

  // Tạo variantKey theo index của value
  const uniqueMap = new Map();

  for (const combo of rawCombinations) {
    // Sắp xếp theo attributeId để tránh trùng lặp do thứ tự khác nhau
    const sorted = combo
      .slice()
      .sort((a, b) => a.attributeId.toString().localeCompare(b.attributeId.toString()))
      .map(item => item.index)
      .join("|");

    if (!uniqueMap.has(sorted)) {
      uniqueMap.set(sorted, combo);
    }
  }

  // Tạo output hoàn chỉnh
  const combinations = Array.from(uniqueMap.entries()).map(([variantKey, attrs]) => ({
    attributes: attrs.map(a => ({ attributeId: a.attributeId, valueId: a.valueId })),
    variantKey, // bây giờ là "1|1|2" dạng index
  }));

  return combinations;
}
