'use client';

import { useEffect } from 'react';

export function World(props: { username: string }) {

  useEffect(() => {
    console.info('User connected:', props.username);
    return () => {
      console.log(`User ${props.username} disconnected`);
    };
  }, [props.username]);

  return <p className="p-3 text-green-500">Logged in as {props.username}</p>;
}
