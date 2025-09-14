'use client';

export function World(props: { username: string }) {
  return <p className="p-3 text-green-500">Linked to server as {props.username}</p>;
}
