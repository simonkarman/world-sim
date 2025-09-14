import express, { json } from 'express';
import { example } from './example';
import { AddressInfo } from 'node:net';
import { z } from 'zod';
import { generateCustomVoronoiPNG } from './voronoi-image';
import { World } from './world/world';

const world = new World('abc');
export const app = express();
app.use(json());

// Health Endpoint
app.get('/health', (_, res) => {
  res.send('OK');
});

const chunkCoordinateSchema = z.object({
  x: z.string().regex(/^-?\d+$/).transform(Number),
  y: z.string().regex(/^-?\d+$/).transform(Number),
});

app.get('/chunk/:x/:y', async (req, res) => {
  // Validate parameters
  const parseResult = chunkCoordinateSchema.safeParse({
    x: req.params.x,
    y: req.params.y,
  });
  if (!parseResult.success) {
    return res.status(400).send('Invalid coordinates');
  }

  const { x, y } = parseResult.data;
  const chunk = world.getChunk(x, y);
  const buffer = await generateCustomVoronoiPNG(chunk.getSites(), {
    width: 512,
    height: 512,
    showSites: true,
    showEdges: true,
    showCenter: false,
    fillCells: false,
    edgeWidth: 1,
    siteColor: chunk.getColor(),
    worldToImageSpace: (p) => [(p.x - x) * 512, (p.y - y) * 512],
  });
  res.header('Chunk', `${x},${y}`);
  res.header('Content-Type', 'image/png');
  res.send(buffer);
});

// Voronoi Generation Endpoint
app.post('/voronoi/generate', async (_, res) => {
  await example();
  res.send('Voronoi diagram generated successfully');
});

if (process.env.NODE_ENV !== 'test') {
  // Start listening
  const server = app.listen(process.env.PORT || 8000, () => {
    const address = server.address() as AddressInfo;
    console.info(`Server is running on port ${address.port}`);
  });
}
