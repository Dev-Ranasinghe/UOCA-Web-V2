import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeForm from "@/components/subscribe/SubscribeForm";

export const metadata = {
  title: "Subscribe — Leo Club of Universities of Ceylon Alumni",
  description: "Get the latest stories, insights, and updates from the Leo Club of UOC Alumni delivered to your inbox.",
};

export default function SubscribePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="SUBSCRIBE" />

      <main className="page-container max-w-4xl flex-1 pt-[var(--section-gap-half)] flex flex-col items-center justify-center">
        {/* Large Dashed Stamp Card */}
        <div className="w-full stamp-container p-8 sm:p-14 rounded-sm text-center">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-[#121212] mb-4">
            Stay in the loop
          </h1>
          <p className="font-sans text-base sm:text-lg text-[#555] max-w-xl mx-auto mb-8 leading-relaxed">
            Get the latest stories, insights, and updates delivered straight to your inbox.
          </p>

          <div className="max-w-lg mx-auto text-left">
            <SubscribeForm variant="page" source="subscribe-page" placeholder="Add your email to subscribe" />
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-3 font-sans text-xs text-[#555] mt-6">
          <span>Stay connected:</span>
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="w-7 h-7 border border-[#121212] rounded flex items-center justify-center font-mono font-bold text-xs hover:bg-[#121212] hover:text-white transition-colors"
            >
              in
            </a>
            <a
              href="#"
              className="w-7 h-7 border border-[#121212] rounded flex items-center justify-center font-mono font-bold text-xs hover:bg-[#121212] hover:text-white transition-colors"
            >
              f
            </a>
            <a
              href="#"
              className="w-7 h-7 border border-[#121212] rounded flex items-center justify-center font-mono font-bold text-xs hover:bg-[#121212] hover:text-white transition-colors"
            >
              X
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
