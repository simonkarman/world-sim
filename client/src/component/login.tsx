'use client';

import { useState } from 'react';
import { World } from '@/component/world';

export function Login() {
  const [confirmed, setConfirmed] = useState(false);
  const [username, setUsername] = useState('');

  if (confirmed) {
    return <World username={username} />;
  }

  return <>
    <form onSubmit={(e) => {
      setConfirmed(true);
      e.preventDefault();
    }}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        className="border p-2 rounded"
      />
      <button
        type="submit"
        className="ml-2 bg-blue-500 text-white p-2 rounded"
      >
        Login
      </button>
    </form>
  </>;
}
