import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

interface ComingSoonProps {
  title: string;
  activePage?: string;
  description?: string;
}

export default function ComingSoon({
  title,
  activePage,
  description = "We're putting the finishing touches on this page. Check back soon.",
}: ComingSoonProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage={activePage} />

      <main className="page-container max-w-3xl flex-1 pt-[var(--section-gap-half)] flex items-center justify-center">
        <div className="w-full stamp-container p-10 sm:p-16 rounded-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-6 font-mono text-[11px] sm:text-xs text-[#555] tracking-[2px] uppercase">
            <span className="font-semibold">ooo</span>
            <span>Coming Soon</span>
            <span className="font-semibold">ooo</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#121212] mb-4">
            {title}
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#555] max-w-md mx-auto mb-8 leading-relaxed">
            {description} Will be updated ASAP.
          </p>

          <Link
            href="/"
            className="inline-block bg-[#121212] text-white text-xs font-mono font-bold px-8 py-3 rounded-sm hover:bg-[#333] transition-colors tracking-widest uppercase"
          >
            Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
