import { error } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
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
export async function GET(event) {
  const file = event.url.searchParams.get("image");
  const content = await readFile(getFilePath(file));
  return new Response(content, {
    headers: {
      'Content-type': 'image/jpeg'
    },
  });
}

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
  if (await limiter.isLimited(event)) throw error(429);
  const data = await event.request.formData();
  const image = data.get("image") as File;
  const fileName = uuid().split("-").pop() + ".jpeg";
  await writeFile(getFilePath(fileName), image.stream());
  scheduleDelete(fileName, 60 * 3);

  return new Response(fileName);
}


export const handle: Handle = async ({ resolve, event }) => {

  // Apply CORS header for API routes
  if (event.url.pathname.startsWith('/api')) {
    // Required for CORS to work
    if(event.request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        }
      });
    }
  }

  const response = await resolve(event);
  if (event.url.pathname.startsWith('/api')) {
        response.headers.append('Access-Control-Allow-Origin', `*`);
  }
  return response;
};
