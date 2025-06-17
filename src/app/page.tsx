import UploadVideo from "@/lib/UploadVideo"

export default function Home() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">My-PT</h1>
        <p className="text-gray-400 text-sm">Your AI powered personal trainer</p>
      </header>
      <main className="w-full max-w-2xl mx-auto">
        <UploadVideo/>
      </main>
      <footer className="flex gap-4 sm:gap-8 flex-wrap items-center justify-center py-4 border-t text-xs sm:text-base">
        Mehmet Akif Taşçı
      </footer>
    </div>
  );
}
