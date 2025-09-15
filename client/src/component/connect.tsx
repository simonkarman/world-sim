import { useEffect, useRef, useState } from 'react';
import { Client, createClient } from '@krmx/client';
import { World } from '@/component/world';
import { Chunk } from '@/utils/chunk';
import { Point } from '@/utils/voronoi';
import { SerializableSite, VoronoiSerializer } from '@/utils/voronoi-serializer';

export function Connect(props: {
  username: string,
  failure: (reason: string) => void,
}) {
  const { username, failure } = props;
  const clientRef = useRef<Client>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [userLocations, setUserLocations] = useState<Record<string, Point>>({});

  useEffect(() => {
    setIsLinked(false);

    const serializer = new VoronoiSerializer();
    const client = createClient();
    clientRef.current = client;

    client.on('join', username => {
      setUserLocations(prev => ({ ...prev, [username]: { x: 0, y: 0 } }));
    });
    client.on('link', (username) => {
      if (username === username) {
        setIsLinked(true);
      }
    });
    client.on('unlink', (username) => {
      if (username === username) {
        setIsLinked(false);
        setChunks([]);
      }
    });
    client.on('leave', (username) => {
      setUserLocations(prev => {
        const copy = { ...prev };
        delete copy[username];
        return copy;
      });
    });

    client.on('message', (message) => {
      if (message.type === 'chunk/loaded') {
        const payload = message.payload as { x: number, y: number, sites: SerializableSite[] };
        const chunk = { x: payload.x, y: payload.y, sites: serializer.deserialize(payload.sites) };
        setChunks(prev => [...prev, chunk]);
      } else if (message.type === 'chunk/unloaded') {
        const payload = message.payload as Point;
        setChunks((prev) => prev.filter(c => !(c.x === payload.x && c.y === payload.y)));
      } else if (message.type === 'user/moved') {
        const payload = message.payload as { username: string, location: Point };
        setUserLocations(prev => ({
          ...prev,
          [payload.username]: payload.location,
        }));
      }
    });

    const _ = async () => {
      await client.connect('http://localhost:8000/krmx');
      try {
        await client.link(username);
      } catch (e) {
        failure(
          e && typeof e === 'object' && 'message' in e && typeof e.message === 'string'
            ? e.message
            : 'unknown error',
        );
      }
    };
    _().catch(() => {});

    return () => {
      clientRef.current?.disconnect(true);
    };
  }, [username, failure]);

  if (isLinked) {
    return <World
      username={username}
      userLocations={userLocations}
      chunks={chunks}
      move={(point) => clientRef.current?.send({ type: 'user/move', payload: point })}
    />;
  }

  return <p className="p-3 text-yellow-500">Linking...</p>;
}
