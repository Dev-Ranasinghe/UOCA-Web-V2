import { ArrowUpRight, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionDivider from "@/components/SectionDivider";
import AskLynxButton from "@/components/lynx/AskLynxButton";

export const metadata = {
  title: "LYNX — UOCA AI Assistant",
  description:
    "Ask LYNX about UOCA's projects, events, team and how to join. Answers come from the club's live website data.",
};

/** Deliberately generic: LYNX looks up the real answers, so nothing here goes out of date when projects or events change. */
const TOPICS: { title: string; questions: string[] }[] = [
  {
    title: "Projects",
    questions: [
      "What projects is UOCA running right now?",
      "Which projects are coming up?",
      "Which projects have been completed?",
      "Who leads each project?",
    ],
  },
  {
    title: "Events & meetings",
    questions: [
      "What events are coming up?",
      "When is the next General Meeting?",
      "What happened at our latest general meeting?",
      "Show me recent UOCA articles.",
    ],
  },
  {
    title: "People",
    questions: ["Who is the president of UOCA?", "Who is on the EXCO?", "Who is the Membership Chairperson?"],
  },
  {
    title: "Joining",
    questions: [
      "How can I join UOCA?",
      "What does the membership form ask for?",
      "Which areas of community service can I choose?",
      "How do I get in touch with the club?",
    ],
  },
];

const HOW_IT_WORKS = [
  "Answers come from what UOCA has published on this website (projects, events, articles and the team), read at the moment you ask.",
  "LYNX only talks about UOCA. Ask it anything else and it will point you back here.",
  "Conversations aren't saved. Close the tab and they're gone.",
  "LYNX can make mistakes, so check the linked pages for the details.",
];

export default function LynxPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="LYNX" />

      <main className="section-stack page-container max-w-6xl flex-1 pt-[var(--section-gap-half)]">
        <div className="page-header text-center w-full max-w-2xl mx-auto">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#121212] mb-4">LYNX</h1>
          <p className="font-sans text-sm sm:text-base leading-relaxed text-[#555]">
            The UOCA AI Assistant. Ask about our projects, events, team and how to join, and get answers straight from
            the club&apos;s own website.
          </p>
          <AskLynxButton className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#121212] px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]">
            Ask LYNX <MessageCircle aria-hidden="true" className="size-3.5" />
          </AskLynxButton>
        </div>

        <section aria-label="Things you can ask">
          <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 md:gap-y-16 lg:gap-x-16">
            {TOPICS.map((topic) => (
              <div key={topic.title}>
                <h2 className="font-serif text-2xl font-bold text-[#121212] sm:text-3xl">{topic.title}</h2>
                <SectionDivider spaced />
                <ul>
                  {topic.questions.map((question) => (
                    <li key={question} className="border-b border-dashed border-[#121212]/40 first:border-t">
                      <AskLynxButton
                        prompt={question}
                        className="group flex w-full items-center justify-between gap-4 py-3.5 text-left font-sans text-base leading-snug text-[#121212] transition-colors hover:bg-[#f3c276]/45 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#121212] sm:px-2"
                      >
                        <span>{question}</span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      </AskLynxButton>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="how-lynx-works" className="mx-auto w-full max-w-3xl">
          <div className="stamp-container rounded-sm p-6 sm:p-10">
            <div className="mb-6 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[2px] text-[#121212] sm:text-xs">
              <span aria-hidden="true">ooo</span>
              <span aria-hidden="true" className="flex-1 border-b border-dashed border-[#121212]" />
              <h2 id="how-lynx-works">[HOW LYNX WORKS]</h2>
            </div>
            <ul className="flex flex-col gap-3 font-sans text-sm leading-relaxed text-[#333] sm:text-base">
              {HOW_IT_WORKS.map((line) => (
                <li key={line} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[#121212]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
