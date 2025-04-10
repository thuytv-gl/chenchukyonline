import { browser } from "$app/environment";
export const calcRatio = (
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number,
) => {
  return Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
}

export const createImage = async (url: string) => {
  const fabric = await import("fabric");
  const img = await fabric.FabricImage.fromURL(url);
  if (!img.width || !img.height) {
    throw new Error("failed to load image");
  }
  return img;
};

export const toDataUrl = async (file: File): Promise<string> => {
  const blobURL = URL.createObjectURL(file);
  let url = blobURL;
  if (file.name.endsWith(".heic")) {
    const heic2any = (await import("heic2any")).default;
    const blobRes = await fetch(blobURL)
    const blob = await blobRes.blob()
    const hblob = await heic2any({ blob, toType: "image/jpeg", quality: 0.92 });
    url = URL.createObjectURL(hblob as Blob);
  }
  return url;
}

export const iOS = () => {
  if (!browser) {
    return false;
  }

  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].find((a) => navigator.userAgent.includes(a));
}
