import UploadVideo from "@/lib/UploadVideo"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-8 pb-20 gap-8 sm:gap-16 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 sm:gap-12 flex-1 items-center sm:items-start w-full max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold text-center sm:text-left leading-tight">
          My-PT
          <p className="text-gray-500 text-xs sm:text-sm mt-2 text-center">
              your AI powered personal trainer 
          </p>
        </h1>
        <UploadVideo/>
      </main>
      <footer className="flex gap-4 sm:gap-8 flex-wrap items-center justify-center py-4 border-t text-xs sm:text-base">
        Mehmet Akif Taşçı
      </footer>
    </div>
  );
}
