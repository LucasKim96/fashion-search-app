// shared/core/utils/image.utils.ts
export const buildImageUrl = (path?: string) => {
    if (!path) return undefined;

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    const baseUrl =
        process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";

    return `${baseUrl}${path}`;
};

