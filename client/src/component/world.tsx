import { Chunk } from '@/utils/chunk';
import { Point } from '@/utils/voronoi';
import { ViewBoxAnimatedSvg } from '@/component/svg/viewbox-animated-svg';
import { TransformAnimatedSvgGroup } from '@/component/svg/transform-animated-svg-group';
import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowLeft, faArrowRight, faArrowUp, faUser } from '@fortawesome/free-solid-svg-icons';

export function World(props: {
  username: string,
  userLocations: Record<string, Point>,
  chunks: Chunk[],
  move: (p: Point) => void,
}) {
  const { move, username, userLocations } = props;
  const selfLocation = useMemo(() => userLocations[username] || { x: 0, y: 0 }, [userLocations, username]);
  const moveSpeed = 0.075;

  const moveDelta = useMemo(() => (delta: Point) => {
    const newLocation = {
      x: selfLocation.x + delta.x,
      y: selfLocation.y + delta.y,
    };
    move(newLocation);
  }, [move, selfLocation]);

  // Allow movement by wasd and arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Ignore held-down keys
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          moveDelta({ x: -moveSpeed, y: 0 });
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          moveDelta({ x: 0, y: -moveSpeed });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          moveDelta({ x: 0, y: moveSpeed });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          moveDelta({ x: moveSpeed, y: 0 });
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selfLocation, moveDelta]);

  // Get Screen size
  const getSize = (): { width: number, height: number } => {
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Cap the width and height to 800x600, but keep aspect ratio
    const aspectRatio = width / height;
    const maxWidth = 300;
    if (width > maxWidth) {
      width = maxWidth;
      height = maxWidth / aspectRatio;
    }
    const maxHeight = 360;
    if (height > maxHeight) {
      width = maxHeight * aspectRatio;
      height = maxHeight;
    }
    return { width, height };
  };
  const [svgSize, setSvgSize] = useState(getSize());
  useEffect(() => {
    const handleResize = () => setSvgSize(getSize());
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div className="px-3">
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col gap-1 items-center text-2xl">
      <div className="flex gap-1 justify-center items-center">
        <button
          className="p-2 bg-white/80 border-white text-green-500 rounded-xl text-4xl"
          onClick={() => moveDelta({ x: 0, y: -moveSpeed })}
        >
          <FontAwesomeIcon icon={faArrowUp} />
        </button>
      </div>
      <div className="flex gap-1">
        <button
          className="p-2 bg-white/80 border-white text-green-500 rounded-xl text-4xl"
          onClick={() => moveDelta({ x: -moveSpeed, y: 0 })}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <button
          className="p-2 bg-white/80 border-white text-green-500 rounded-xl text-4xl"
          onClick={() => moveDelta({ x: 0, y: moveSpeed })}
        >
          <FontAwesomeIcon icon={faArrowDown} />
        </button>
        <button
          className="p-2 bg-white/80 border-white text-green-500 rounded-xl text-4xl"
          onClick={() => moveDelta({ x: moveSpeed, y: 0 })}
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
    <ViewBoxAnimatedSvg
      viewBox={`${-(svgSize.width / 2) + selfLocation.x * 100} ${-(svgSize.height / 2) + selfLocation.y * 100} ${svgSize.width} ${svgSize.height}`}
      width={svgSize.width}
      height={svgSize.height}
      className="absolute top-0 bottom-0 right-0 left-0 w-full h-full -z-1"
    >
      {props.chunks.map((chunk) => (
        <g key={`${chunk.x}/${chunk.y}`}>
          {chunk.sites.map((site) => (
            <g key={`${site.location.x}/${site.location.y}`}>
              <polygon
                points={site.edges.map(e => `${e.from.x * 100},${e.from.y * 100}`).join(' ')}
                stroke="black" strokeWidth={0.1}
                className="fill-green-100 hover:fill-green-200"
                onClick={() => move(site.location)}
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
            {name[0].toUpperCase() + name.slice(1)}
          </text>
        </TransformAnimatedSvgGroup>
      ))}
    </ViewBoxAnimatedSvg>
    <p className="absolute right-2 top-2 text-green-800 bg-white/80 rounded-full p-2">
      <FontAwesomeIcon icon={faUser} className="mr-1" />
      {props.username[0].toUpperCase() + props.username.slice(1)}
    </p>
  </div>;
}
