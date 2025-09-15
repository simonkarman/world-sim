import { Login } from '@/component/login';

export default function Home() {
  return <>
    <div className="inline-block m-1.5 px-2 py-2 border rounded-xl border-white bg-white/80">
      <h1 className="font-bold text-xl">World Simulator</h1>
      <p className="text-gray-500">Welcome to the World Simulator app!</p>
    </div>
    <Login />
  </>;
}
