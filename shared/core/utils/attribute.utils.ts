import { CreateAttributeValueItem } from "@shared/features/attribute/attribute.types";

/**
 * Sinh fileKey duy nhất cho 1 value
 */
export const generateFileKey = (): string => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return `file-${crypto.randomUUID()}`;
    }
    return `file-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

/**
 * Thêm fileKey cho các value chưa có
 */
export const assignFileKeys = (values: CreateAttributeValueItem[]): CreateAttributeValueItem[] => {
    return values.map(v => ({
        ...v,
        fileKey: v.fileKey || generateFileKey(),
    }));
};

/**
 * Tổng quát:
 * - Tạo FormData cho Attribute hoặc AttributeValue
 * - formValues = [{ value, file? }]
 *
 * opts:
 *  - label?: string → nếu có, sẽ append("label")
 *  - onlyValues?: boolean → nếu true, chỉ gửi { values: [...] }
 */
export const buildFormDataForAttributeValues = (
    formValues: { value: string; file?: File | null }[],
    opts?: { label?: string }
): FormData => {
    // Chỉ giữ row có value
    const filteredValues = formValues.filter(v => v.value.trim() !== "");
    const payloadValues: CreateAttributeValueItem[] = filteredValues.map(v => ({ value: v.value }));
    const valuesWithKeys = assignFileKeys(payloadValues);

    const formData = new FormData();

    if (opts?.label) formData.append("label", opts.label);

    formData.append("values", JSON.stringify(valuesWithKeys));

    // Append file tương ứng
    filteredValues.forEach((v, idx) => {
        if (v.file) {
            const key = valuesWithKeys[idx].fileKey;
            if (key) formData.append(key, v.file);
        }
    });

    return formData;
};
