import { Login } from '@/component/login';

export default function Home() {
  return <>
    <div className="p-3">
      <h1 className="font-bold text-xl">World Simulator</h1>
      <p className="text-gray-500">Welcome to the World Simulator app!</p>
    </div>
    <Login />
  </>;
}
