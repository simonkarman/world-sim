import { Chunk } from './chunk';

export class World {
  private chunks: Map<string, Chunk> = new Map<string, Chunk>();
  public readonly seed: string;
  public readonly pointsPerChunk: number;
  public readonly lloydRelaxationIterations: number;

  constructor(
    seed: string,
    pointsPerChunk: number,
    lloydRelaxationIterations: number,
  ) {
    this.seed = seed;
    this.pointsPerChunk = pointsPerChunk;
    this.lloydRelaxationIterations = lloydRelaxationIterations;
  }

  getChunk(x: number, y: number): Chunk {
    const key = `${x},${y}`;
    if (!this.chunks.has(key)) {
      this.chunks.set(key, new Chunk(this, x, y));
    }
    return this.chunks.get(key)!;
  }
}
