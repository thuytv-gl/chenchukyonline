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

  const formData = await event.request.formData();
  const file = formData.get('image') as Blob;
  const fileName = formData.get('file')?.name ?? uuid().split("-").pop() + ".jpeg";
  if (!file) {
    return new Response(JSON.stringify({ message: 'No file uploaded' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  await writeFile(getFilePath(fileName), file.stream());
  scheduleDelete(fileName, 60 * 3);
  return new Response(JSON.stringify({ fileName }), {
    headers: {
      "Content-Type": "application/json",
    }
  });
}
