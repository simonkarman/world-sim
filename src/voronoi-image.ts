import { createCanvas } from 'canvas';
import fs from 'fs';
import { Site } from './voronoi';

// Utility function to find neighboring sites
export function getNeighboringSites(site: Site): Site[] {
  const neighbors = new Set<Site>();

  site.edges.forEach(edge => {
    if (edge.opposite) {
      neighbors.add(edge.opposite.site);
    }
  });

  return Array.from(neighbors);
}

// Configuration for PNG generation
interface VoronoiImageConfig {
  width: number;
  height: number;
  backgroundColor?: string;
  cellColors?: string[];
  edgeColor?: string;
  edgeWidth?: number;
  siteColor?: string;
  siteRadius?: number;
  showSites?: boolean;
  showEdges?: boolean;
  fillCells?: boolean;
}

// Utility function to generate PNG image of Voronoi diagram
export async function generateVoronoiPNG(
  sites: Site[],
  filename: string,
  config: VoronoiImageConfig,
): Promise<void> {
  const {
    width,
    height,
    backgroundColor = '#ffffff',
    cellColors = [
      '#ffcccb', '#add8e6', '#90ee90', '#f0e68c', '#dda0dd',
      '#ffa07a', '#87ceeb', '#98fb98', '#f5deb3', '#da70d6',
    ],
    edgeColor = '#000000',
    edgeWidth = 1,
    siteColor = '#ff0000',
    siteRadius = 3,
    showSites = true,
    showEdges = true,
    fillCells = true,
  } = config;

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Draw filled cells if requested
  if (fillCells) {
    sites.forEach((site, index) => {
      if (site.edges.length === 0) return;

      // Create path for the cell
      ctx.beginPath();

      // Start from the first edge's from point
      const firstEdge = site.edges[0];
      ctx.moveTo(firstEdge.from.x, firstEdge.from.y);

      // Draw edges in order
      site.edges.slice(1).forEach(edge => {
        ctx.lineTo(edge.from.x, edge.from.y);
      });

      ctx.closePath();

      // Fill with color
      ctx.fillStyle = cellColors[index % cellColors.length];
      ctx.fill();
    });
  }

  // Draw edges if requested
  if (showEdges) {
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = edgeWidth;

    sites.forEach(site => {
      site.edges.forEach((edge, i) => {
        if (edge.opposite) {
          const fromX = edge.from.x;
          const fromY = edge.from.y;

          const toX = edge.next.from.x;
          const toY = edge.next.from.y;

          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.stroke();
        }
      });
    });
  }

  // Draw sites if requested
  if (showSites) {
    ctx.fillStyle = siteColor;
    sites.forEach(site => {
      ctx.beginPath();
      ctx.arc(site.center.x, site.center.y, siteRadius, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Voronoi diagram saved to ${filename}`);
}

// Convenience function with default settings
export async function saveVoronoiDiagram(
  sites: Site[],
  filename: string,
  width: number = 800,
  height: number = 600,
): Promise<void> {
  await generateVoronoiPNG(sites, filename, {
    width,
    height,
    showSites: true,
    showEdges: true,
    fillCells: true,
  });
}
