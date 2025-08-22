import { Server } from 'node:http';
import { expect, test } from 'vitest';
import { app } from '../src/server';
import { AddressInfo } from 'node:net';

test('server starts and responds to GET request on the health endpoint with OK', async () => {
  const server = await new Promise<Server>((res) => {
    const srv = app.listen(0, () => res(srv));
  });
  const address = server.address() as AddressInfo;
  const response = await fetch(`http://localhost:${address.port}/health`);
  expect(response.status).toBe(200);
  expect(await response.text()).toBe('OK');
  server.close();
});
