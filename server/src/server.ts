import { AddressInfo } from 'node:net';
import { createServer as createHttpServer } from 'node:http';
import express, { json } from 'express';
import { z } from 'zod';
import { example } from './voronoi/example';
import { generateCustomVoronoiPNG } from './voronoi/voronoi-image';
import { World } from './world/world';
import { createServer } from '@krmx/server';
import { Point } from './voronoi/voronoi';
import { VoronoiSerializer } from './voronoi/voronoi-serializer';

const world = new World(process.env.WORLD_SEED ?? 'abc');
const voronoiSerializer = new VoronoiSerializer();

// Create http server
const httpServer = createHttpServer();

// Create krmx server
export const krmxServer = createServer({
  http: {
    server: httpServer,
    path: '/krmx',
  },
});

krmxServer.on('listen', () => {
  const address = httpServer.address() as AddressInfo;
  console.info(`Server is running on port ${address.port}`);
});

// Track users and stream their location and loaded chunks
interface UserData {
  username: string;
  location: Point;
  loadedChunkKeys: `${number}/${number}`[];
}
const users: { [username: string]: UserData } = {};
const reloadChunks = (username: string) => {
  const user = users[username];

  // Determine which chunks should be loaded (3x3 grid around user)
  const baseX = Math.floor(user.location.x);
  const baseY = Math.floor(user.location.y);
  const expectedChunks: `${number}/${number}`[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      expectedChunks.push(`${baseX + dx}/${baseY + dy}`);
    }
  }

  // Unload chunks that are no longer expected
  for (let i = user.loadedChunkKeys.length - 1; i >= 0; i--) {
    const chunkKey = user.loadedChunkKeys[i];
    if (!expectedChunks.includes(chunkKey)) {
      user.loadedChunkKeys.splice(i, 1);
      const [chunkX, chunkY] = chunkKey.split('/').map(Number);
      const payload = { x: chunkX, y: chunkY };
      krmxServer.send(username, { type: 'chunk/unloaded', payload });
    }
  }

  // Load each expected chunk
  for (const chunkKey of expectedChunks) {
    if (!user.loadedChunkKeys.includes(chunkKey)) {
      const [chunkX, chunkY] = chunkKey.split('/').map(Number);
      const chunk = world.getChunk(chunkX, chunkY);
      user.loadedChunkKeys.push(chunkKey);
      const payload = { x: chunkX, y: chunkY, sites: voronoiSerializer.serialize(chunk.getSites()) };
      krmxServer.send(username, { type: 'chunk/loaded', payload });
    }
  }
};

krmxServer.on('join', (username) => {
  users[username] = {
    username,
    location: { x: 0, y: 0 },
    loadedChunkKeys: [],
  };
});
krmxServer.on('link', (username) => {
  reloadChunks(username);
});
krmxServer.on('unlink', (username) => {
  users[username].loadedChunkKeys = [];
});
krmxServer.on('message', (username, message) => {
  if (message.type === 'user/move') {
    const parse = z.object({ x: z.number(), y: z.number() }).safeParse(message.payload);
    if (parse.success) {
      users[username].location = parse.data;
      krmxServer.broadcast({ type: 'user/moved', payload: { username, location: parse.data } });
      reloadChunks(username);
    }
  }
});
krmxServer.on('leave', (username) => {
  delete users[username];
});

// Create express server
const app = express();
app.use(json());
httpServer.on('request', app);

// Add /health endpoint
app.get('/health', (_, res) => {
  res.send('OK');
});

// Add /chunk endpoint
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

// Add /voronoi/generate endpoint
app.post('/voronoi/generate', async (_, res) => {
  await example();
  res.send('Voronoi diagram generated successfully');
});

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  let port = 8000;
  try {
    const portAsNumber = Number(process.env.PORT);
    if (!isNaN(portAsNumber) && portAsNumber > 0 && portAsNumber < 65536) {
      port = portAsNumber;
    }
  } catch {
    // ignore invalid port
  }
  krmxServer.listen(port);
}
