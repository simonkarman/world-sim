import express, { json } from 'express';
import { example } from './example';
import { AddressInfo } from 'node:net';
import { z } from 'zod';
import { Random } from './random';
import { Point, voronoi } from './voronoi';
import { generateCustomVoronoiPNG } from './voronoi-image';

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

  const getChunkPoints = (x: number, y: number) => {
    const r = Random.fromSeed(`chunk_${x}_${y}`);
    const points: Point[] = [];
    for (let i = 0; i < 5; i++) {
      points.push({
        x: x + r.next(),
        y: y + r.next(),
      });
    }
    return points;
  };

  const { x, y } = parseResult.data;
  const points = getChunkPoints(x, y);
  // Add points for surrounding chunks to avoid edge artifacts
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      points.push(...getChunkPoints(x + dx, y + dy));
    }
  }
  const sites = voronoi(points, [x - 1, y - 1, 3, 3]);
  const buffer = await generateCustomVoronoiPNG(sites, {
    width: 512,
    height: 512,
    showSites: false,
    showEdges: true,
    fillCells: false,
    edgeWidth: 1,
    // worldToImageSpace: (p) => [(p.x - (x - 1)) / 3 * 512, (p.y - (y - 1)) / 3 * 512],
    worldToImageSpace: (p) => [(p.x - x) * 512, (p.y - y) * 512],
  });
  res.header('Chunk', `${x},${y}`);
  res.header('Content-Type', 'image/png');
  res.send(buffer);

  // Send image base64
  // const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII=';
  // res.header('Content-Type', 'image/png');
  // res.send(Buffer.from(base64Image, 'base64'));
});

// Voronoi Generation Endpoint
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
