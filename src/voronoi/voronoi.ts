import { Delaunay } from 'd3-delaunay';

export type Point = { x: number, y: number };
export type HalfEdge = { id: number, site: Site, from: Point, next: HalfEdge, opposite?: HalfEdge };
export type Site = { location: Point, edges: HalfEdge[] };

// Helper function to create a key for half-edge pairing
function createEdgeKey(from: Point, to: Point): string {
  // Round to avoid floating point precision issues
  const fx = Math.round(from.x * 10000) / 10000;
  const fy = Math.round(from.y * 10000) / 10000;
  const tx = Math.round(to.x * 10000) / 10000;
  const ty = Math.round(to.y * 10000) / 10000;
  return `${fx},${fy}->${tx},${ty}`;
}

// Compute Voronoi diagram with half-edges
export function voronoi(points: Point[], bounds?: [number, number, number, number]): Site[] {
  if (points.length < 3) {
    throw new Error('Need at least 3 points to compute Voronoi diagram');
  }

  // Create Delaunay triangulation
  const delaunay = Delaunay.from(points.map(p => [p.x, p.y]));

  // Create Voronoi diagram with optional bounds
  let voronoi;
  if (bounds) {
    voronoi = delaunay.voronoi(bounds);
  } else {
    // If no bounds provided, use a reasonable default based on point spread
    const xCoords = points.map(p => p.x);
    const yCoords = points.map(p => p.y);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);
    const padding = Math.max(maxX - minX, maxY - minY) * 0.1;
    voronoi = delaunay.voronoi([minX - padding, minY - padding, maxX + padding, maxY + padding]);
  }

  // Create sites array - map original points to sites
  const sites: Site[] = points.map((location) => ({
    location: { x: location.x, y: location.y }, // Create new point objects
    edges: [],
  }));

  // Map to store half-edges for pairing by edge coordinates
  const halfEdgeMap = new Map<string, HalfEdge>();

  // Process each Voronoi cell to extract edges
  let numberOfEdges = 0;
  for (let i = 0; i < points.length; i++) {
    const cell = voronoi.cellPolygon(i);
    if (!cell || cell.length === 0) continue;

    const site = sites[i];

    // Process each edge of the cell (don't include the last point as it connects to the first)
    // This ensures we create half-edges for each edge in the polygon
    for (let j = 0; j < cell.length - 1; j++) {
      const from = { x: cell[j][0], y: cell[j][1] };
      const to = { x: cell[(j + 1) % cell.length][0], y: cell[(j + 1) % cell.length][1] };

      // Check if the opposite half-edge already exists
      const reverseKey = createEdgeKey(to, from);
      const oppositeHalfEdge = halfEdgeMap.get(reverseKey);

      // Create half-edge
      const halfEdge: HalfEdge = {
        id: numberOfEdges,
        site: site,
        from: from,
        next: null as unknown as HalfEdge, // Will be set later
        opposite: oppositeHalfEdge,
      };

      // Link opposite half-edges, or save it for linking later
      if (oppositeHalfEdge) {
        oppositeHalfEdge.opposite = halfEdge;
        halfEdgeMap.delete(reverseKey);
      } else {
        const edgeKey = createEdgeKey(from, to);
        halfEdgeMap.set(edgeKey, halfEdge);
      }

      // Store this half-edge
      site.edges.push(halfEdge);
      numberOfEdges += 1;
    }
  }

  // Verify opposite half-edges are correctly linked
  if (halfEdgeMap.size !== 0) {
    // TODO: only make this a warning in case of the other half is lying in the bounds
    console.warn(`Warning: ${halfEdgeMap.size} half-edges without opposites remain unlinked.`);
  }

  // For each site, link the half-edges in a circular manner
  sites.forEach(site => {
    const edges = site.edges;
    for (let i = 0; i < edges.length; i++) {
      edges[i].next = edges[(i + 1) % edges.length];
    }
  });

  return sites;
}
