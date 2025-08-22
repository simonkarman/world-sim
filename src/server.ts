import express, { json } from 'express';
import { example } from './example';

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

// eslint-disable-next-line no-process-env
if (process.env.NODE_ENV !== 'test') {
  // Start listening
  // eslint-disable-next-line no-process-env
  app.listen(process.env.PORT || 8000);
}
