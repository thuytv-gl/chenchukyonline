import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import { error } from '@sveltejs/kit';
import { RateLimiter } from 'sveltekit-rate-limiter/server';
import { uuid } from 'uuidv4';

const staticDir = import.meta.env.DEV ? "./static" : "/tmp";

const limiter = new RateLimiter({
  rates: {
    IP: [3, 'm'], // IP address limiter
    IPUA: [3, 'm'], // IP + User Agent limiter
  }
});

function scheduleDelete(fileName: string, sec: number) {
  setTimeout(() => {
    unlink(getFilePath(fileName));
  }, sec * 1000);
}

function getFilePath(fileName: string) {
  const baseName = path.basename(fileName);
  return path.resolve(staticDir, baseName);
}

/** @type {import('./$types').RequestHandler} */
export async function GET(event) {
  const file = event.url.searchParams.get("image");
  const content = await fetch(file).then(r => r.arrayBuffer());
  // const content = await readFile(getFilePath(file));
  return new Response(content, {
    headers: {
      'Content-type': 'image/png'
    },
  });
}

function uploadFile(file: File) {
  const form = new FormData();
  form.append("image", file);
  return fetch("https://api.imgbb.com/1/upload?expiration=600&key=3072d91b05e8a8bdfc2953f2a78f102e", {
    method: "POST",
    body: form,
  }).then(r => r.json());
}

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
  if (await limiter.isLimited(event)) throw error(429);
  const data = await event.request.formData();
  const image = data.get("image") as File;
  const res = await uploadFile(image);
  // const fileName = uuid().split("-").pop() + ".png";
  // await writeFile(getFilePath(fileName), image.stream());
  // scheduleDelete(fileName, 60 * 3);

  return new Response(res.data.url);
}
