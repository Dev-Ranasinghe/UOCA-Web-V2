import SubscribeForm from "@/components/subscribe/SubscribeForm";

export default function NewsletterStamp({ className = "" }: { className?: string }) {
  return (
    <div className={`stamp-container p-5 pt-4 sm:p-8 rounded-sm mt-7 mb-0 md:my-4 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="w-full max-w-xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-serif text-2xl leading-[1.1] sm:text-3xl sm:leading-9 font-semibold text-[#121212] mb-1">
                Don&apos;t miss a thing
              </h3>
              <p className="font-sans text-sm text-[#444] leading-tight sm:leading-relaxed">
                Subscribe to get updates straight to your inbox.
              </p>
            </div>

            {/* Vintage Postmark Stamp Icon */}
            <div className="hidden sm:flex flex-col items-center justify-center border-2 border-dashed border-[#555] rounded-full w-20 h-20 p-1 text-center font-mono text-[9px] text-[#444] leading-tight select-none opacity-85 rotate-[-6deg]">
              <span className="font-bold tracking-tighter">CAIRO</span>
              <span className="border-t border-b border-[#555] px-1 py-0.5 my-0.5 font-bold">
                22 APR 1950
              </span>
              <span>EGYPT</span>
            </div>
          </div>

          <SubscribeForm variant="stamp" source="home" className="mt-5" />
        </div>
      </div>
    </div>
  );
}
