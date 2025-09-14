import { expect, test } from 'vitest';
import { voronoi } from '../src/voronoi/voronoi';

test('voronoi generates sites with connected half edges and boundaries', async () => {
  const points = [{ x: 100, y: 100 }, { x: 200, y: 150 }, { x: 150, y: 250 }];
  const sites = voronoi(points, [0, 0, 300, 300]);
  expect(sites.length).toBe(3);
  expect(sites.flatMap(s => s.edges.filter(e => e.opposite)).length).toBe(6);
  expect(sites.flatMap(s => s.edges.filter(e => !e.opposite)).length).toBe(7);
  expect(sites[0].edges.length).toBe(4);
  expect(sites[1].edges.length).toBe(4);
  expect(sites[2].edges.length).toBe(5);
  expect(sites.every(site => site.edges.every(edge => edge.next && edge.next.site === site))).toBe(true);
});
