import { HalfEdge, Point, Site } from './voronoi';

export type SerializableHalfEdge = [/*id*/number, /*from.x*/number, /*from.y*/number] | [number, number, number, /*oppositeId*/number];
export type SerializableSite = {
  center: Point;
  edges: SerializableHalfEdge[];
};

export class VoronoiSerializer {

  serialize(sites: Site[]): SerializableSite[] {
    return sites.map(site => ({
      center: site.center,
      edges: site.edges.map(edge => {
        const s = [edge.id, edge.from.x, edge.from.y] as SerializableHalfEdge;
        if (edge.opposite !== undefined) {
          s.push(edge.opposite.id);
        }
        return s;
      }),
    }));
  }

  deserialize(serializedSites: SerializableSite[]): Site[] {
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
}
