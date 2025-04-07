import path from 'path';
import { error, type RequestHandler } from '@sveltejs/kit';
import { writeFile, unlink } from 'fs/promises';
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

const NameList: string[] = [];
export const POST: RequestHandler = async (event) => {
  if (await limiter.isLimited(event)) throw error(429);
  if (NameList.length === 0) {
    NameList.push(...uuid().split("-"));
  }

  const formData = await event.request.formData();
  const file = formData.get('image') as File | undefined;
  const fileName = file?.name ?? NameList.pop()!;
  if (!file) {
    return new Response(JSON.stringify({ message: 'No file uploaded' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const buffer = await file.arrayBuffer();
  await writeFile(getFilePath(fileName), new Uint8Array(buffer));
  scheduleDelete(fileName, 60 * 3);
  return new Response(JSON.stringify({ fileName }), {
    headers: {
      "Content-Type": "application/json",
    }
  });
}
