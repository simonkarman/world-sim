'use client';

import { useState } from 'react';
import { Connect } from '@/component/connect';

export function Login() {
  const [confirmed, setConfirmed] = useState(false);
  const [username, setUsername] = useState('');
  const [failureReason, setFailureReason] = useState<string | undefined>(undefined);

  if (confirmed) {
    return <Connect username={username} failure={(reason) => {
      setConfirmed(false);
      setFailureReason(reason);
    }} />;
  }

  return <form
    className="p-3"
    onSubmit={(e) => {
      setFailureReason(undefined);
      setConfirmed(true);
      e.preventDefault();
    }}
  >
    {failureReason && <p className="mb-2 text-red-500">Error: {failureReason}</p>}
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
