import { error } from '@sveltejs/kit';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import { RateLimiter } from 'sveltekit-rate-limiter/server';
import { v4 as uuid  } from 'uuid';

const staticDir = process.env.DEV === "true" ? "./static" : "/tmp";
console.log("[DEBUG] ", { staticDir });

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
export async function POST(event) {
  if (await limiter.isLimited(event)) throw error(429);

  const data = await event.request.formData();
  const image = data.get("image") as File;
  const fileName = uuid().split("-").pop() + ".jpeg";
  await writeFile(getFilePath(fileName), image.stream());
  scheduleDelete(fileName, 60 * 3);

  return Response.redirect(`${event.request.url}/${fileName}`)
}
