import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { error } from '@sveltejs/kit';
import { RateLimiter } from 'sveltekit-rate-limiter/server';
import { uuid } from 'uuidv4';

const limiter = new RateLimiter({
  rates: {
    IP: [3, 'm'], // IP address limiter
    IPUA: [3, 'm'], // IP + User Agent limiter
  }
});

function scheduleDelete(fileName: string, sec: number) {
  // remove file after x seconds
  setTimeout(() => {
    unlink(getFilePath(fileName));
  }, sec * 1000);
}

function getFilePath(fileName: string) {
  const baseName = path.basename(fileName);
  return path.resolve("./static/" + baseName);
}

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
  if (await limiter.isLimited(event)) throw error(429);
  const data = await event.request.formData();
  const image = data.get("image") as File;
  const fileName = uuid().split("-").pop() + ".png";
  await writeFile(getFilePath(fileName), image.stream());
  scheduleDelete(fileName, 60 * 3);

  return new Response(fileName);
}
