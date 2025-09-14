'use client';

import { useState } from 'react';
import { Connect } from '@/component/connect';

export function Login() {
  const [confirmed, setConfirmed] = useState(false);
  const [username, setUsername] = useState('');

  if (confirmed) {
    return <Connect username={username} />;
  }

  return <form
    className="p-3"
    onSubmit={(e) => {
      setConfirmed(true);
      e.preventDefault();
    }}
  >
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
  </form>;
}
