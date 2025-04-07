import path from 'path';
import { error, HttpError_1, type RequestHandler } from '@sveltejs/kit';
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
  event.setHeaders({ "Content-Type": "application/json" });

  const [err, formData] = await resolve<FormData>(event.request.formData());
  if (err) {
    throw new HttpError_1(400, "missing form data");
  }
  const file = formData.get('image') as File | undefined;
  if (!file) {
    throw new HttpError_1(400, "No file uploaded");
  }
  const fileName = uuid().split("-")[0] + ".jpeg";
  const [err1, buffer] = await resolve(file.arrayBuffer());
  if (err1) {
    throw new HttpError_1(500, "cannot get file buffer");
  }
  const [err2] = await resolve(writeFile(getFilePath(fileName), new Uint8Array(buffer)));
  if (err2) {
    throw new HttpError_1(500, "cannot writw file");
  }

  scheduleDelete(fileName, 60 * 3);
  return new Response(JSON.stringify({ fileName }), {
    headers: {
      "Content-Type": "application/json",
    }
  });
}
