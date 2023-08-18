import { browser } from "$app/environment";
export const calcRatio = (srcWidth: number, srcHeight: number, maxWidth: number, maxHeight: number) => {
  return Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
}

export const createImage = (url: string) => new Promise<fabric.Image>(async (rs, rj) => {
  if (!browser) { return; }
  const { fabric } = await import("fabric");
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
    const hblob = await heic2any({ blob, toType: "image/jpeg", quality: 0.92 });
    url = URL.createObjectURL(hblob as Blob);
  }
  return url;
}
