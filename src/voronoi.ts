import { Delaunay } from 'd3-delaunay';

export type Point = { x: number, y: number };
export type HalfEdge = { id: number, site: Site, from: Point, next: HalfEdge, opposite?: HalfEdge };
export type Site = { center: Point, edges: HalfEdge[] };

// Helper function to create a key for half-edge pairing
function createEdgeKey(from: Point, to: Point): string {
  // Round to avoid floating point precision issues
  const fx = Math.round(from.x * 1000) / 1000;
  const fy = Math.round(from.y * 1000) / 1000;
  const tx = Math.round(to.x * 1000) / 1000;
  const ty = Math.round(to.y * 1000) / 1000;
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
  const sites: Site[] = points.map((center) => ({
    center: { x: center.x, y: center.y }, // Create new point objects
    edges: [],
  }));

  // Map to store half-edges for pairing by edge coordinates
  const halfEdgeMap = new Map<string, HalfEdge>();

  // Process each Voronoi cell to extract edges
  for (let i = 0; i < points.length; i++) {
    const cell = voronoi.cellPolygon(i);
    if (!cell || cell.length === 0) continue;

    const site = sites[i];

    // Process each edge of the cell (don't include the last point as it connects to the first)
    // This ensures we create half-edges for each edge in the polygon
    for (let j = 0; j < cell.length - 1; j++) {
      const from = { x: cell[j][0], y: cell[j][1] };
      const to = { x: cell[(j + 1) % cell.length][0], y: cell[(j + 1) % cell.length][1] };

      const edgeKey = createEdgeKey(from, to);
      const reverseKey = createEdgeKey(to, from);

      // Check if the opposite half-edge already exists
      const oppositeHalfEdge = halfEdgeMap.get(reverseKey);

      // Create half-edge
      const halfEdge: HalfEdge = {
        id: halfEdgeMap.size,
        site: site,
        from: from,
        next: null as unknown as HalfEdge, // Will be set later
        opposite: oppositeHalfEdge,
      };

      // Store this half-edge
      halfEdgeMap.set(edgeKey, halfEdge);
      site.edges.push(halfEdge);
    }
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

export type SerializableHalfEdge = [/*id*/number, /*from.x*/number, /*from.y*/number, /*oppositeId*/number | undefined];
export type SerializableSite = {
  center: Point;
  edges: SerializableHalfEdge[];
};

export function serializeVoronoi(sites: Site[]): SerializableSite[] {
  return sites.map(site => ({
    center: site.center,
    edges: site.edges.map(edge => [edge.id, edge.from.x, edge.from.y, edge.opposite?.id]),
  }));
}

export function deserializeVoronoi(serializedSites: SerializableSite[]): Site[] {
  const edgeMap = new Map<number, HalfEdge>();

  const sites = serializedSites.map(serializedSite => {
    // Create the site
    const site: Site = {
      center: serializedSite.center,
      edges: [],
    };

    // Create the edges of the site
    site.edges = serializedSite.edges.map(serializedEdge => {
      const [id, fromX, fromY, oppositeId] = serializedEdge;
      const edge: HalfEdge = {
        id: id,
        site,
        from: { x: fromX, y: fromY },
        next: null as unknown as HalfEdge,
        opposite: oppositeId ? edgeMap.get(oppositeId) : undefined,
      };
      edgeMap.set(edge.id, edge);

      if (edge.opposite) {
        edge.opposite.opposite = edge;
      }

      return edge;
    });

    return site;
  });

  // Link half-edges in a circular manner
  sites.forEach(site => {
    const edges = site.edges;
    for (let i = 0; i < edges.length; i++) {
      edges[i].next = edges[(i + 1) % edges.length];
    }
  });

  return sites;
}
