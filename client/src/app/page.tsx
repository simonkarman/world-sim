import { World } from '@/component/world';

export default function Home() {
  return <>
    <div className="p-3">
      <h1 className="font-bold text-xl">World Sim</h1>
      <p className="text-gray-500">Welcome, to the world sim app!</p>
    </div>
    <World />
  </>;
}
