import { INTEREST_AREAS } from "@/lib/membership/application";

/**
 * The few facts about UOCA that are page copy on the website rather than database rows (the About text, how joining
 * works, where to find things). They mirror what the site itself says, in `app/contact/page.tsx`, `/join` and the
 * navigation, and nothing else. Anything that changes through the admin dashboard (projects, articles, events, people)
 * is NOT here: LYNX reads that from the database every time.
 * If the About copy on the site changes, update it here too.
 */

const ABOUT =
  "The Leo Club of Universities of Ceylon Alumni (UOCA) is a community-based Leo club under the Lions Club of Galkissa, " +
  "Leo District 306 D1, and Leo Multiple District 306 Sri Lanka & Maldives. It is a community of passionate individuals " +
  "committed to creating meaningful change through service, leadership, and collaboration. " +
  "For the Leoistic Year 2026/27 the club's vision is \"Passion Meets Purpose\", bringing together dedicated members to serve " +
  "communities, inspire positive action, and create a lasting impact. The website describes the club as \"Since 2016\".";

const JOIN =
  "To join, apply through the membership application form at /join (the \"Join UOCA\" button in the site header). " +
  "The form asks for: full name and preferred calling name, date of birth, email address, WhatsApp number, residential address, " +
  "National Identity Card number, gender, university/institute/school, course/degree/programme, current occupation/workplace, " +
  "whether you were previously a Leo Club member (and your previous role), the areas of community service you are interested in, " +
  "how you heard about the club, whether you are willing to actively take part in meetings, projects and activities, and a " +
  "membership declaration (to abide by the club's constitution, bylaws, rules and decisions, and that the information is true). " +
  "After you submit it, a member of the team gets in touch. The application form for 2026/2027 is run by the Membership Chairperson, " +
  "Leo Imasha Kumarasiri. The website does not publish membership fees, age limits or other eligibility rules.";

const CONTACT =
  "The website's contact page is /contact. It has a message form (name, email, message) and an About section. " +
  "The website does not publish a club phone number or email address. Social links (Facebook, Instagram, Twitter/X, LinkedIn, " +
  "Pinterest) are in the site footer.";

const PAGES: { path: string; what: string }[] = [
  { path: "/projects", what: "All published UOCA projects." },
  { path: "/blog", what: "Articles and news, including meeting and event write-ups, filtered by category." },
  { path: "/team", what: "The current team: EXCO, Heads and Directors." },
  { path: "/join", what: "The membership application form." },
  { path: "/contact", what: "About UOCA and a contact form." },
  { path: "/subscribe", what: "Sign up for the newsletter." },
  { path: "/leo-id", what: "Look up a UOCA Leo and get their UOCA ID card." },
  { path: "/calendar", what: "Calendar (coming soon: no calendar data is published yet)." },
  { path: "/newsletter", what: "Newsletter archive (coming soon)." },
  { path: "/lynx", what: "This assistant." },
];

export type ClubInfoTopic = "about" | "join" | "contact" | "pages" | "service_areas";

export function getClubInfo(topic: ClubInfoTopic) {
  switch (topic) {
    case "about":
      return { topic, text: ABOUT, url: "/contact" };
    case "join":
      return { topic, text: JOIN, url: "/join" };
    case "contact":
      return { topic, text: CONTACT, url: "/contact" };
    case "service_areas":
      return {
        topic,
        text: "The service areas listed on the membership application form.",
        areas: [...INTEREST_AREAS],
        url: "/join",
      };
    case "pages":
      return { topic, pages: PAGES };
  }
}
