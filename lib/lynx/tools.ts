import { z } from "zod";
import { getClubInfo } from "@/lib/lynx/site-info";
import {
  findMember,
  getArticle,
  getProject,
  getTeam,
  listArticleCategories,
  listEvents,
  searchArticles,
  searchProjects,
} from "@/lib/lynx/data";

/**
 * The only things the model is allowed to do. Gemini decides which of these to call for a question; the server runs
 * them against the live database and hands back the rows. There is no way to run an arbitrary query.
 */

/** Thrown when the database can't be read. The chat then says so instead of letting the model guess. */
export class LynxDataError extends Error {}

const text = (max = 100) => z.string().trim().min(1).max(max);
const limit = z.number().int().min(1).max(12).optional();

const schemas = {
  search_projects: z.object({
    query: text().optional(),
    phase: z.enum(["upcoming", "ongoing", "completed", "all"]).optional(),
    limit,
  }),
  get_project: z.object({ name: text() }),
  list_events: z.object({ when: z.enum(["upcoming", "past", "all"]).optional(), category: text().optional(), limit }),
  list_article_categories: z.object({}),
  search_articles: z.object({ query: text().optional(), category: text().optional(), limit }),
  get_article: z.object({ title: text(160) }),
  get_team: z.object({ category: z.enum(["EXCO", "HEAD", "DIRECTOR"]).optional() }),
  find_member: z.object({ name: text() }),
  get_club_info: z.object({ topic: z.enum(["about", "join", "contact", "pages", "service_areas"]) }),
} as const;

type ToolName = keyof typeof schemas;

/** In the shape Gemini expects for `functionDeclarations`. */
export const TOOL_DECLARATIONS = [
  {
    name: "search_projects",
    description:
      "Find UOCA projects from the live database. Use for 'what projects...', current/active/upcoming/completed projects, or projects about a theme (for example environment, health, children). Each project has a computed phase: upcoming, ongoing or completed.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional keywords, for example 'environment' or 'blood'. Omit to list all projects." },
        phase: { type: "string", enum: ["upcoming", "ongoing", "completed", "all"], description: "Filter by phase. 'Currently happening' means ongoing." },
        limit: { type: "integer", description: "Maximum projects to return (default 8)." },
      },
    },
  },
  {
    name: "get_project",
    description:
      "Get one UOCA project in detail by name: summary, phase, dates, chairperson, secretary, treasurer, tags and its published articles (with event details and text). Use for 'tell me about X', 'who is the chairperson of X', or 'when is X'.",
    parameters: {
      type: "object",
      properties: { name: { type: "string", description: "Project name or part of it, for example 'Guardian'." } },
      required: ["name"],
    },
  },
  {
    name: "list_events",
    description:
      "List UOCA events and meetings that have a date. Meetings are events whose category is a meeting type (for example 'UOCA General Meeting', 'UOCA Board Meeting'). Use for upcoming events, the next GM or board meeting, or past events.",
    parameters: {
      type: "object",
      properties: {
        when: { type: "string", enum: ["upcoming", "past", "all"], description: "Default upcoming." },
        category: { type: "string", description: "Optional category, for example 'General Meeting' or 'Board Meeting'." },
        limit: { type: "integer", description: "Maximum events (default 8)." },
      },
    },
  },
  {
    name: "list_article_categories",
    description: "List the article/event categories used on the UOCA website (meeting and event types).",
  },
  {
    name: "search_articles",
    description:
      "Search published UOCA articles and news, including meeting write-ups. Omit the query to get the most recent articles. Use for 'recent articles', 'what happened at...', or any topic that may be covered in an article.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional keywords." },
        category: { type: "string", description: "Optional category name." },
        limit: { type: "integer", description: "Maximum articles (default 6)." },
      },
    },
  },
  {
    name: "get_article",
    description: "Read one published UOCA article in full by its title.",
    parameters: {
      type: "object",
      properties: { title: { type: "string", description: "Article title or part of it." } },
      required: ["title"],
    },
  },
  {
    name: "get_team",
    description: "List the current UOCA team (EXCO, Heads, Directors) with their roles. Use for leadership, president, secretary, and 'who is on the team'.",
    parameters: {
      type: "object",
      properties: { category: { type: "string", enum: ["EXCO", "HEAD", "DIRECTOR"], description: "Optional team group." } },
    },
  },
  {
    name: "find_member",
    description:
      "Look up a UOCA member by name or role for their public profile: role, team, short bio, Leo experience and the projects they lead. Public information only.",
    parameters: {
      type: "object",
      properties: { name: { type: "string", description: "Member name, or a role such as 'President'." } },
      required: ["name"],
    },
  },
  {
    name: "get_club_info",
    description:
      "General club information from the website: 'about' (what UOCA is), 'join' (how to become a member), 'contact', 'pages' (what is on each page of the website) or 'service_areas'.",
    parameters: {
      type: "object",
      properties: { topic: { type: "string", enum: ["about", "join", "contact", "pages", "service_areas"] } },
      required: ["topic"],
    },
  },
] as const;

/** Friendly progress line shown while a tool runs. */
export const TOOL_STATUS: Record<ToolName, string> = {
  search_projects: "Checking UOCA projects…",
  get_project: "Looking up that project…",
  list_events: "Checking events and meetings…",
  list_article_categories: "Checking article categories…",
  search_articles: "Searching UOCA articles…",
  get_article: "Reading the article…",
  get_team: "Looking up the team…",
  find_member: "Looking up that member…",
  get_club_info: "Checking club information…",
};

export function isToolName(name: string): name is ToolName {
  return name in schemas;
}

/** Collects every website path the tool handed back, so only those (plus fixed pages) can become links in the chat. */
function collectUrls(value: unknown, into: Set<string>) {
  if (Array.isArray(value)) {
    for (const v of value) collectUrls(v, into);
  } else if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      if ((key === "url" || key === "teamPage" || key === "path") && typeof v === "string" && v.startsWith("/")) into.add(v);
      else collectUrls(v, into);
    }
  }
}

export async function runTool(name: string, rawArgs: unknown, knownUrls: Set<string>): Promise<unknown> {
  if (!isToolName(name)) return { error: "Unknown tool." };

  const parsed = schemas[name].safeParse(rawArgs ?? {});
  if (!parsed.success) return { error: "Those arguments were not valid. Try again with simpler values." };
  const args = parsed.data as never;

  let result: unknown;
  try {
    switch (name) {
      case "search_projects":
        result = await searchProjects(args);
        break;
      case "get_project":
        result = await getProject(args);
        break;
      case "list_events":
        result = await listEvents(args);
        break;
      case "list_article_categories":
        result = await listArticleCategories();
        break;
      case "search_articles":
        result = await searchArticles(args);
        break;
      case "get_article":
        result = await getArticle(args);
        break;
      case "get_team":
        result = await getTeam(args);
        break;
      case "find_member":
        result = await findMember(args);
        break;
      case "get_club_info":
        result = getClubInfo((args as { topic: Parameters<typeof getClubInfo>[0] }).topic);
        break;
    }
  } catch (error) {
    console.error(`[lynx] tool ${name} failed:`, error);
    throw new LynxDataError(`Tool ${name} failed`);
  }

  collectUrls(result, knownUrls);
  return result;
}
