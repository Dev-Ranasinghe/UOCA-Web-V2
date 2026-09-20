"use client";

import * as React from "react";
import { Link2, Check } from "lucide-react";
import { FaFacebookF, FaXTwitter, FaLinkedinIn, FaWhatsapp } from "react-icons/fa6";

export function ShareButtons({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = React.useState(false);

  const getUrl = () => (typeof window !== "undefined" ? `${window.location.origin}${path}` : path);
  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard permission denied — nothing to fall back to here
    }
  };

  return (
    <div className="flex items-center gap-3 text-[#121212]">
      <button type="button" onClick={handleCopy} aria-label="Copy link" className="hover:opacity-70">
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </button>
      <button
        type="button"
        onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrl())}`)}
        aria-label="Share on Facebook"
        className="hover:opacity-70"
      >
        <FaFacebookF className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() =>
          open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(getUrl())}&text=${encodeURIComponent(title)}`,
          )
        }
        aria-label="Share on X"
        className="hover:opacity-70"
      >
        <FaXTwitter className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getUrl())}`)}
        aria-label="Share on LinkedIn"
        className="hover:opacity-70"
      >
        <FaLinkedinIn className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${title} ${getUrl()}`)}`)}
        aria-label="Share on WhatsApp"
        className="hover:opacity-70"
      >
        <FaWhatsapp className="w-4 h-4" />
      </button>
    </div>
  );
}
