import type { Handle } from '@sveltejs/kit';
import { createRequestLogger } from '$lib/server/logging';
import { sequence } from '@sveltejs/kit/hooks';

const requestLogger: Handle = createRequestLogger({
  logBody: true,
  logHeaders: false,
  logParams: true,
  logCookies: false
});

export const handle = sequence(requestLogger);
