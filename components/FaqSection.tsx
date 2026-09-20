import Link from "next/link";
import Auralis from "@/components/ui/auralis";
import { FAQ, type FAQCategories, type FAQData } from "@/components/ui/faq-tabs";
import SectionDivider from "@/components/SectionDivider";

// Ember glow on black: the UOCA ID's orange, kept dark so white text stays high-contrast.
const AURALIS_COLORS = ["#c2470f", "#ef671c", "#7c2d12"];

const categories: FAQCategories = {
  about: "About UOCA",
  joining: "Joining",
  projects: "Projects",
  "uoca-id": "UOCA ID",
};

// NOTE: written from what the site shows plus general Leo-club facts. Eligibility and the
// joining process should be confirmed by the club before this goes to a wide audience.
const faqData: FAQData = {
  about: [
    {
      question: "What is the Leo Club of UOC Alumni?",
      answer:
        "UOCA is a Leo club for alumni of the Universities of Ceylon. We come together to serve our communities, grow as leaders, and keep the friendships that began on campus alive. The club has been active since 2016.",
    },
    {
      question: "What does “Leo” stand for?",
      answer:
        "Leo stands for Leadership, Experience and Opportunity. Leo clubs are the youth programme of Lions Clubs International, built around service, leadership development and fellowship.",
    },
    {
      question: "How is UOCA connected to Lions Clubs International?",
      answer:
        "Like every Leo club, UOCA is part of the worldwide Lions Clubs International family. Each Leo has a MyLCI ID, the member number Lions Clubs International uses to identify them, and it appears on their UOCA ID.",
    },
    {
      question: "Who runs the club?",
      answer:
        "An executive committee leads UOCA: the President, Vice-Presidents, Secretary, Treasurer and their assistants. Club heads and directors look after each area of the club’s work, and you can meet all of them on the Team page.",
      link: { href: "/team", label: "Meet the team" },
    },
  ],
  joining: [
    {
      question: "Who can join UOCA?",
      answer:
        "UOCA is the Leo club for alumni of the Universities of Ceylon. If you are an alumnus who wants to serve alongside a motivated, friendly group, we would love to hear from you. Not sure whether you qualify? Ask, and the team will confirm.",
      link: { href: "/contact", label: "Ask the team" },
    },
    {
      question: "How do I join?",
      answer:
        "The Join UOCA page is opening soon. Until then, send us a message through the Contact page and the team will guide you through the next steps.",
      link: { href: "/contact", label: "Contact us" },
    },
    {
      question: "Do I need Leo experience?",
      answer:
        "No. UOCA has new Leos as well as Leos who have served in other clubs before, and everyone is welcome. A member’s profile on the UOCA ID page shows whether they are new or experienced.",
    },
    {
      question: "What will I do as a member?",
      answer:
        "You will take part in service projects, help organise them, and join the club’s fellowship. Members can chair a project or serve as its secretary or treasurer, while directors lead each area of the club’s work.",
      link: { href: "/projects", label: "See our projects" },
    },
  ],
  projects: [
    {
      question: "What kind of projects does UOCA run?",
      answer:
        "Our work is organised into portfolios: Community Development, Sports & Wellbeing, IT, Education & Youth Empowerment, Public Relations & Outreach, Partnership & International Relations, Fellowship & Member Relations, and Club Operations & Service Strategy.",
      link: { href: "/projects", label: "Browse projects" },
    },
    {
      question: "Where can I see what UOCA is working on?",
      answer:
        "The Projects page lists our recent projects with their chairpersons, and the home page shows what is happening right now. The Calendar and Newsletter pages are coming soon.",
      link: { href: "/projects", label: "Recent projects" },
    },
    {
      question: "Who leads a project?",
      answer:
        "Every project has a chairperson, and often a secretary and a treasurer, who plan it and see it through. Their names appear on the project page and on their own UOCA ID.",
    },
    {
      question: "Can I suggest a project or partner with UOCA?",
      answer:
        "Yes. Send your idea through the Contact page. Partnerships are handled by our Partnership & International Relations directors, so tell us what you have in mind and we will connect you with the right person.",
      link: { href: "/contact", label: "Share your idea" },
    },
  ],
  "uoca-id": [
    {
      question: "What is the UOCA ID?",
      answer:
        "It is the club’s official digital ID for each Leo: a card with their name, position, MyLCI ID number and photo, plus a QR code, in the club’s colours.",
      link: { href: "/leo-id", label: "Open UOCA ID" },
    },
    {
      question: "How do I get mine?",
      answer:
        "Open the UOCA ID page and find your name in the list. Choose Download image to save your card, or Share to send it. Remix style changes the background if you want a different look.",
      link: { href: "/leo-id", label: "Find my ID" },
    },
    {
      question: "What does the QR code do?",
      answer:
        "Scanning it opens that member’s ID page on this website, where anyone can check who they are, their position and the projects they have led.",
    },
    {
      question: "My MyLCI ID number or position is wrong or missing. What do I do?",
      answer:
        "Those details are added by the club’s admin team. Send your correct MyLCI ID number or position through the Contact page and we will update your card.",
      link: { href: "/contact", label: "Send a correction" },
    },
  ],
};

export default function FaqSection() {
  return (
    <section
      aria-labelledby="faq-heading"
      className="section-dark relative w-full overflow-hidden border-t border-b border-[#222] bg-black text-white"
    >
      <Auralis
        height="100%"
        colors={AURALIS_COLORS}
        speed={0.25}
        grain={0.5}
        className="pointer-events-none absolute inset-0"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center lg:flex-row lg:justify-between lg:gap-4">
          {/* Mobile: lead-in line centred above the heading. */}
          <p className="mb-5 text-center font-sans text-base text-[#d6d1c8] lg:hidden">
            Let&apos;s answer some questions
          </p>
          <h2
            id="faq-heading"
            className="w-full text-center font-serif text-4xl font-bold tracking-tight text-white lg:w-auto lg:text-left"
          >
            Frequently Asked Questions
          </h2>
          <Link
            href="/contact"
            className="hidden shrink-0 rounded-full bg-white px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#121212] transition-colors hover:bg-[#eae7e1] lg:inline-block"
          >
            Ask us
          </Link>
        </div>

        <SectionDivider dark spaced />

        <FAQ categories={categories} faqData={faqData} />
      </div>
    </section>
  );
}
