import { Chunk } from './chunk';

export class World {
  private chunks: Map<string, Chunk> = new Map<string, Chunk>();
  public readonly seed: string;

  constructor(seed: string) {
    this.seed = seed;
  }

  getChunk(x: number, y: number): Chunk {
    const key = `${x},${y}`;
    if (!this.chunks.has(key)) {
      this.chunks.set(key, new Chunk(this, x, y));
    }
    return this.chunks.get(key)!;
  }
}
