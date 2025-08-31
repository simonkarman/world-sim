import { Point, voronoi } from './voronoi';
import { generateCustomVoronoiPNG, generateVoronoiPNG, getNeighboringSites } from './voronoi-image';
import fs from 'fs';
import { VoronoiSerializer } from './voronoi-serializer';

export async function example() {
  const points: Point[] = [
    { x: 100, y: 100 },
    { x: 200, y: 150 },
    { x: 150, y: 250 },
    { x: 50, y: 200 },
    { x: 300, y: 100 },
    { x: 250, y: 300 },
    { x: 350, y: 200 },
    { x: 400, y: 350 },
    { x: 450, y: 150 },
  ];

  try {
    // Compute Voronoi diagram with custom bounds
    const sites = voronoi(points, [0, 0, 500, 400]);

    console.log(`Generated ${sites.length} sites`);

    // Print information about each site
    sites.forEach((site, index) => {
      console.log(`Site ${index}:`);
      console.log(`  Center: (${site.center.x}, ${site.center.y})`);
      console.log(`  Number of edges: ${site.edges.length}`);

      // Print neighbors
      const neighbors = getNeighboringSites(site);
      console.log(`  Neighbors: ${neighbors.length}`);

      // Print edge details (only first few to avoid clutter)
      site.edges.slice(0, 2).forEach((edge, edgeIndex) => {
        const connInfo = edge.opposite ? 'to site' : 'to boundary';
        console.log(`    Edge ${edgeIndex}: from (${edge.from.x.toFixed(2)}, ${edge.from.y.toFixed(2)}) ${connInfo}`);
      });
      if (site.edges.length > 2) {
        console.log(`    ... and ${site.edges.length - 2} more edges`);
      }
      console.log('');
    });

    // Generate PNG images with different styles
    console.log('Generating PNG images...');

    // Create output directory if it doesn't exist
    fs.mkdirSync('output', { recursive: true });

    // Save buffer to file
    const saveAs = (filename: string, buffer: Buffer) => {
      fs.writeFileSync(filename, buffer);
      console.log(`Voronoi diagram saved to ${filename}`);
    };

    // Basic diagram
    saveAs('output/voronoi_basic.png', await generateVoronoiPNG(sites, 500, 400));

    // Custom styled diagram
    saveAs('output/voronoi_custom.png', await generateCustomVoronoiPNG(sites, {
      width: 500,
      height: 400,
      backgroundColor: '#1a1a1a',
      cellColors: [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
        '#dda0dd', '#98d8c8', '#fdcb6e', '#6c5ce7', '#a29bfe',
      ],
      edgeColor: '#ffffff',
      edgeWidth: 2,
      siteColor: '#ffffff',
      siteRadius: 4,
      showSites: true,
      showEdges: true,
      fillCells: true,
    }));

    // Edge-only diagram
    saveAs('output/voronoi_edges_only.png', await generateCustomVoronoiPNG(sites, {
      width: 500,
      height: 400,
      backgroundColor: '#ffffff',
      edgeColor: '#333333',
      edgeWidth: 1.5,
      siteColor: '#ff0000',
      siteRadius: 5,
      showSites: true,
      showEdges: true,
      fillCells: false,
    }));

    console.log('PNG generation complete!');

    console.info('Serializing Voronoi diagram...');
    const voronoiSerializer = new VoronoiSerializer();
    const serializedVoronoi = JSON.stringify(voronoiSerializer.serialize(sites), undefined, 2);
    fs.writeFileSync('output/voronoi_serialized.json', serializedVoronoi);
    const deserializedVoronoi = voronoiSerializer.deserialize(JSON.parse(serializedVoronoi));
    saveAs('output/voronoi_basic_after_serialization.png', await generateVoronoiPNG(deserializedVoronoi, 500, 400));
    console.info('Deserialized Voronoi diagram successfully');

    return sites;
  } catch (error) {
    console.error('Error computing Voronoi diagram:', error);
    return [];
  }
}
