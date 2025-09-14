import { Random } from '../utils/random';
import { Point, Site, voronoi } from '../voronoi/voronoi';
import { World } from './world';

export class Chunk {
  public readonly world: World;
  public readonly x: number;
  public readonly y: number;

  private _cache: {
    rawPoints?: Point[];
    lloydRelaxedPoints?: Point[];
    sites?: Site[];
  } = {};
  private asCache = <K extends keyof Chunk['_cache'], T extends Chunk['_cache'][K]>(key: K, fn: () => T): T => {
    if (this._cache[key] === undefined) {
      this._cache[key] = fn();
    }
    return this._cache[key] as T;
  };

  constructor(world: World, x: number, y: number) {
    this.world = world;
    this.x = x;
    this.y = y;
  }

  private flatMapSurroundings<T>(fn: (chunk: Chunk) => T[]): T[] {
    const results: T[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const _chunk = this.world.getChunk(this.x + dx, this.y + dy);
        results.push(...fn(_chunk));
      }
    }
    return results;
  }

  private isInside(p: Point): boolean {
    return p.x >= this.x && p.x < this.x + 1 && p.y >= this.y && p.y < this.y + 1;
  }

  private getRawPoints(): Point[] {
    return this.asCache('rawPoints', () => {
      const r = Random.fromSeed(`${this.world.seed}/chunk_${this.x}_${this.y}`);
      const points: Point[] = [];
      for (let i = 0; i < 100; i++) {
        points.push({
          x: this.x + r.next(),
          y: this.y + r.next(),
        });
      }
      return points;
    });
  }

  public static computeSiteCenter(site: Site): Point {
    const n = site.edges.length;
    if (n === 0) {
      return site.location;
    }

    let cx = 0;
    let cy = 0;
    for (const edge of site.edges) {
      cx += edge.from.x;
      cy += edge.from.y;
    }
    return { x: cx / n, y: cy / n };
  }

  private getLloydRelaxedPoints(): Point[] {
    return this.asCache('lloydRelaxedPoints', () => {
      let points = this.flatMapSurroundings(c => c.getRawPoints());

      const iterations = 2;
      for (let i = 0; i < iterations; i++) {
        const diagram = voronoi(points, [this.x - 1, this.y - 1, 3, 3]);
        points = diagram.map(s => Chunk.computeSiteCenter(s));
      }

      return points.filter(p => this.isInside(p));
    });
  }

  getSites(): Site[] {
    return this.asCache('sites', () => {
      const points = this.flatMapSurroundings(c => c.getLloydRelaxedPoints());
      return voronoi(points, [this.x - 1, this.y - 1, 3, 3]).filter(site => {
        // TODO: once chunks are rendered client side, we should no longer render sites in neighboring chunks
        return true; //this.isInside(site.location);
      });
    });
  }

  getColor(): string {
    const r = Random.fromSeed(`${this.world.seed}/color_${this.x}_${this.y}`);
    const colors = [ '#33FF57', '#FF5733', '#3357FF', '#F1C40F', '#9B59B6', '#E67E22', '#E74C3C', '#2ECC71', '#3498DB' ];
    return colors[Math.floor(r.next() * colors.length)];
  }
}
