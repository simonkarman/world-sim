import { Chunk } from '@/utils/chunk';
import { Point } from '@/utils/voronoi';
import { ViewBoxAnimatedSvg } from '@/component/svg/viewbox-animated-svg';
import { TransformAnimatedSvgGroup } from '@/component/svg/transform-animated-svg-group';

export function World(props: {
  username: string,
  userLocations: Record<string, Point>,
  chunks: Chunk[],
  move: (p: Point) => void,
}) {
  const selfLocation = props.userLocations[props.username] || { x: 0, y: 0 };

  const moveDelta = (delta: Point) => {
    const newLocation = {
      x: selfLocation.x + delta.x,
      y: selfLocation.y + delta.y,
    };
    props.move(newLocation);
  };

  const moveSpeed = 5;
  return <div className="px-3 w-[800px]">
    <div className="flex gap-2 justify-around">
      <button
        className="px-2 bg-blue-500 text-white rounded"
        onClick={() => moveDelta({ x: -0.01 * moveSpeed, y: 0 })}
      >
        Move Left
      </button>
      <button
        className="px-2 bg-blue-500 text-white rounded"
        onClick={() => moveDelta({ x: 0, y: -0.01 * moveSpeed })}
      >
        Move Up
      </button>
      <button
        className="px-2 bg-blue-500 text-white rounded"
        onClick={() => moveDelta({ x: 0, y: 0.01 * moveSpeed })}
      >
        Move Down
      </button>
      <button
        className="px-2 bg-blue-500 text-white rounded"
        onClick={() => moveDelta({ x: 0.01 * moveSpeed, y: 0 })}
      >
        Move Right
      </button>
    </div>
    <ViewBoxAnimatedSvg
      viewBox={`${-150 + selfLocation.x * 100} ${-150 + selfLocation.y * 100} 300 300`} width={800} height={800}
      className="border mt-2 bg-white rounded-3xl"
    >
      {props.chunks.map((chunk) => (
        <g key={`${chunk.x}/${chunk.y}`}>
          {chunk.sites.map((site) => (
            <g key={`${site.location.x}/${site.location.y}`}>
              <polygon
                points={site.edges.map(e => `${e.from.x * 100},${e.from.y * 100}`).join(' ')}
                fill={'#22D30533'} stroke="black" strokeWidth={0.1}
                className="hover:fill-green-500"
                onClick={() => props.move(site.location)}
              />
              {site.edges.map((edge) => (
                <line
                  key={`${edge.from.x}/${edge.from.y}`}
                  x1={edge.from.x * 100} y1={edge.from.y * 100}
                  x2={edge.next.from.x * 100} y2={edge.next.from.y * 100}
                  stroke="#00000055" strokeWidth={0.25}
                />
              ))}
              {/*<circle*/}
              {/*  cx={site.location.x * 100} cy={site.location.y * 100}*/}
              {/*  r={0.2} fill="black"*/}
              {/*/>*/}
            </g>
          ))}
          {/*<rect*/}
          {/*  x={chunk.x * 100} y={chunk.y * 100}*/}
          {/*  width={100} height={100}*/}
          {/*  fill="none" stroke="#00000033" strokeWidth={0.1}*/}
          {/*/>*/}
        </g>
      ))}
      {Object.entries(props.userLocations).map(([name, loc]) => (
        <TransformAnimatedSvgGroup
          transform={`translate(${loc.x * 100}, ${loc.y * 100})`}
          key={name}
        >
          <circle
            cx={0} cy={0}
            r={2} fill="green"
          />
          <text
            x={2} y={-2}
            fontSize={5} fill="black"
          >
            {name}
          </text>
        </TransformAnimatedSvgGroup>
      ))}
    </ViewBoxAnimatedSvg>
    <p className="text-green-500">Linked to server as {props.username[0].toUpperCase() + props.username.slice(1)}</p>
  </div>;
}
