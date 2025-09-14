export type Point = { x: number, y: number };
export type HalfEdge = { id: number, site: Site, from: Point, next: HalfEdge, opposite?: HalfEdge };
export type Site = { location: Point, edges: HalfEdge[] };
