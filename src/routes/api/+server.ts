import path from 'path';
import { error, type RequestHandler, json } from '@sveltejs/kit';
import { writeFile, unlink } from 'fs/promises';
import { RateLimiter } from 'sveltekit-rate-limiter/server';
import { v4 as uuid  } from 'uuid';

const staticDir = process.env.DEV === "true" ? "./static" : "/tmp";
console.log("[DEBUG] ", { staticDir });

async function resolve<T>(promise: Promise<T>): Promise<[null, T] | [Error, null]> {
    try {
        const res = await promise
        return [null, res];
    } catch (err: any) {
        return [err, null];
    }
}

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

export const POST: RequestHandler = async (event) => {
  if (await limiter.isLimited(event)) throw error(429);

  const [err, formData] = await resolve<FormData>(event.request.formData());
  if (err) {
    throw error(400, "missing form data");
  }
  const file = formData.get('image') as File | undefined;
  if (!file) {
    throw error(400, "No file uploaded");
  }
  const fileName = uuid().split("-")[0] + ".jpeg";
  const [err1, buffer] = await resolve(file.arrayBuffer());
  if (err1) {
    throw error(500, "cannot get file buffer");
  }
  const [err2] = await resolve(writeFile(getFilePath(fileName), new Uint8Array(buffer)));
  if (err2) {
    throw error(500, "cannot write file");
  }

  Promise.resolve(() => scheduleDelete(fileName, 60 * 3));
  return json({ fileName });
}
