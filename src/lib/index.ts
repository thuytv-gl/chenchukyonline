import { fabric } from "fabric";
export const calcRatio = (srcWidth: number, srcHeight: number, maxWidth: number, maxHeight: number) => {
  return Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
}

export const createImage = (url: string) => new Promise<fabric.Image>((rs, rj) => {
  fabric.Image.fromURL(url, img => {
    if (!img.width || !img.height) {
      return rj(new Error("failed to load image"));
    }
    return rs(img);
  });
});

export const toDataUrl = async (file: File): Promise<string> => {
  const blobURL = URL.createObjectURL(file);
  let url = blobURL;
  if (file.name.endsWith(".heic")) {
    const heic2any = (await import("heic2any")).default;
    const blobRes = await fetch(blobURL)
    const blob = await blobRes.blob()
    const hblob = await heic2any({ blob });
    url = URL.createObjectURL(hblob as Blob);
  }
  return url;
}