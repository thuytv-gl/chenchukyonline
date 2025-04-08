import type { Handle } from '@sveltejs/kit';
import { createRequestLogger } from '$lib/server/logging';
import { sequence } from '@sveltejs/kit/hooks';

const requestLogger: Handle = createRequestLogger({
  logBody: true,
  logHeaders: false,
  logParams: true,
  logCookies: false
});

export const handle = sequence(requestLogger, async ({ event, resolve }) => {
	const response = await resolve(event);

	response.headers.set('Access-Control-Allow-Origin', '*'); // Or specify your allowed origin(s)
	response.headers.set('Access-Control-Allow-Credentials', 'true'); // If you need to send cookies

	return response;
});
