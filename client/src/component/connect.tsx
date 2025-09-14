'use client';

import { useEffect, useRef, useState } from 'react';
import { Client, createClient } from '@krmx/client';
import { World } from '@/component/world';

export function Connect(props: { username: string }) {
  const clientRef = useRef<Client>(null);
  const [isLinked, setIsLinked] = useState(false);

  useEffect(() => {
    setIsLinked(false);

    const client = createClient();
    clientRef.current = client;

    const _ = async () => {
      await client.connect('http://localhost:8000/krmx');
      await client.link(props.username);
      setIsLinked(true);
    };
    _();

    return () => {
      clientRef.current?.disconnect(true);
    };
  }, [props.username]);

  if (!isLinked) {
    return <p className="p-3 text-yellow-500">Linking...</p>;
  }

  return <World username={props.username} />;
}
