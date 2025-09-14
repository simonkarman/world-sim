import { expect, test } from 'vitest';
import { krmxServer } from '../src/server';

test('server starts and responds to GET request on the health endpoint with OK', async () => {
  const port = await krmxServer.listen();
  const response = await fetch(`http://localhost:${port}/health`);
  expect(response.status).toBe(200);
  expect(await response.text()).toBe('OK');
  await krmxServer.close();
});
