import express, { json } from 'express';
import { example } from './example';
import { AddressInfo } from 'node:net';

export const app = express();
app.use(json());

// Health Endpoint
app.get('/health', (_, res) => {
  res.send('OK');
});

app.post('/voronoi/generate', async (_, res) => {
  await example();
  res.send('Voronoi diagram generated successfully');
});

// Start listening
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(process.env.PORT || 8000, () => {
    const address = server.address() as AddressInfo;
    console.info(`Server is running on port ${address.port}`);
  });
}
