import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 p-8 text-center">
      <h1 className="text-5xl font-black text-forest">Kiddoki 🌱</h1>
      <p className="text-lg text-slate-600">
        Juegos y aprendizaje para niños de 1 a 11 años. 100% seguro, 100% anónimo, 100% controlado por ti.
      </p>
      <div className="flex gap-4">
        <Link href="/parent" className="rounded-xl bg-forest px-6 py-3 font-bold text-white">Soy padre/madre</Link>
        <Link href="/kid" className="rounded-blob bg-sun px-6 py-3 text-xl font-black text-slate-800">¡A jugar! 🎮</Link>
      </div>
    </main>
  );
}
