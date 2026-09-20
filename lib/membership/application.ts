import { z } from "zod";

/**
 * Single source of truth for the UOCA membership application.
 * The fields, options and rules mirror the club's Google Form ("UOCA Membership Application - 2026/2027").
 * The browser validates with this module for instant feedback, and the server action validates again with the
 * same rules before anything is sent on to Google Apps Script (which validates a third time).
 */

export const GENDERS = ["Male", "Female"] as const;
export const YES_NO = ["Yes", "No"] as const;

export const INTEREST_AREAS = [
  "Children & Education",
  "Sports and Wellbeing",
  "Fundraising and Finance",
  "IT, Education and Youth Empowerment",
  "Community Services",
  "International Partnerships",
  "Fellowship and Member Relations",
  "Environmental and Social Responsibilities",
  "Club Operations and Service Strategy",
  "Public Relations and Outreach",
] as const;

export const HEARD_FROM = [
  "Friend / Existing Member",
  "Social Media",
  "Leo Event / Project",
  "University / Alumni Network",
  "Other",
] as const;

export type Gender = (typeof GENDERS)[number];
export type YesNo = (typeof YES_NO)[number];
export type HeardFrom = (typeof HEARD_FROM)[number];

/** The text the applicant agrees to. Word for word from the Google Form. */
export const DECLARATION_PARAGRAPHS = [
  "I understand that membership in the Leo Club of UOC Alumni carries responsibilities towards the club, its members, and the community we serve.",
  "I agree to abide by the constitution, bylaws, rules and decisions of the club, and to actively support its projects, activities and objectives to the best of my ability.",
  "I further declare that the information provided in this application is true and accurate to the best of my knowledge.",
] as const;

export type FieldKey =
  | "fullName"
  | "callingName"
  | "dateOfBirth"
  | "gender"
  | "nic"
  | "email"
  | "whatsapp"
  | "address"
  | "institution"
  | "course"
  | "occupation"
  | "previousLeo"
  | "previousLeoDetails"
  | "interests"
  | "heardFrom"
  | "heardFromOther"
  | "willing"
  | "declaration";

/** Form sections, in reading order. The rail, the headings and focus-on-error all follow this list. */
export const SECTIONS: { id: string; title: string; fields: FieldKey[] }[] = [
  { id: "about", title: "About you", fields: ["fullName", "callingName", "dateOfBirth", "gender", "nic"] },
  { id: "contact", title: "Contact details", fields: ["email", "whatsapp", "address"] },
  { id: "study-work", title: "Studies & work", fields: ["institution", "course", "occupation"] },
  {
    id: "leo-journey",
    title: "Your Leo journey",
    fields: ["previousLeo", "previousLeoDetails", "interests", "heardFrom", "heardFromOther", "willing"],
  },
  { id: "declaration", title: "Declaration", fields: ["declaration"] },
];

export const FIELD_ORDER: FieldKey[] = SECTIONS.flatMap((s) => s.fields);

/** What the form holds while it is being filled in. Choices start empty, so they allow "". */
export type FormValues = {
  fullName: string;
  callingName: string;
  dateOfBirth: string;
  gender: "" | Gender;
  nic: string;
  email: string;
  whatsapp: string;
  address: string;
  institution: string;
  course: string;
  occupation: string;
  previousLeo: "" | YesNo;
  previousLeoDetails: string;
  interests: string[];
  heardFrom: "" | HeardFrom;
  heardFromOther: string;
  willing: "" | YesNo;
  declaration: boolean;
};

export const EMPTY_VALUES: FormValues = {
  fullName: "",
  callingName: "",
  dateOfBirth: "",
  gender: "",
  nic: "",
  email: "",
  whatsapp: "",
  address: "",
  institution: "",
  course: "",
  occupation: "",
  previousLeo: "",
  previousLeoDetails: "",
  interests: [],
  heardFrom: "",
  heardFromOther: "",
  willing: "",
  declaration: false,
};

export const EARLIEST_BIRTH_YEAR = 1940;

/** Local calendar day as YYYY-MM-DD, for the date input's `max`. */
export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function isRealPastDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return false;
  if (Number(value.slice(0, 4)) < EARLIEST_BIRTH_YEAR) return false;
  return value < todayISO();
}

/** No whitespace, exactly one @, a dotted domain, and no leading = + - (spreadsheet formula characters; real addresses never start with them). */
export const EMAIL_PATTERN = /^[^\s@=+\-][^\s@]*@[^\s@]+\.[^\s@]{2,}$/;
/** 9 digits + V/X (old card) or 12 digits (new card). */
const NIC_PATTERN = /^(\d{9}[VvXx]|\d{12})$/;
const PHONE_PATTERN = /^\+?\d{9,15}$/;

/** Strips the separators people type into a phone number ("+94 (77) 123-4567" becomes "+94771234567"). */
export function compactPhone(value: string): string {
  return value.replace(/[\s\-().]/g, "");
}

const text = (message: string, max: number, min = 1) =>
  z
    .string({ error: message })
    .trim()
    .min(min, message)
    .max(max, `Please keep this under ${max} characters.`);

const shape = {
  fullName: text("Enter your full name.", 120, 2),
  callingName: text("Enter the name you'd like us to call you.", 60),
  dateOfBirth: z
    .string({ error: "Choose your date of birth." })
    .min(1, "Choose your date of birth.")
    .refine(isRealPastDate, "Enter a valid date of birth."),
  gender: z.enum(GENDERS, { error: "Choose one option." }),
  nic: z
    .string({ error: "Enter your NIC number." })
    .trim()
    .refine(
      (v) => NIC_PATTERN.test(v),
      "Enter a 12-digit NIC number, or the older 9-digit number ending in V or X.",
    ),
  email: z
    .string({ error: "Enter your email address." })
    .trim()
    .max(254, "That email address is too long.")
    .refine((v) => EMAIL_PATTERN.test(v), "Enter a valid email address, like name@example.com."),
  whatsapp: z
    .string({ error: "Enter your WhatsApp number." })
    .refine(
      (v) => PHONE_PATTERN.test(compactPhone(v.trim())),
      "Enter a valid WhatsApp number, like +94 77 123 4567.",
    ),
  address: text("Enter your residential address.", 300, 5),
  institution: text('Enter your university, institute or school, or "N/A".', 150),
  course: text('Enter your course, degree or grade, or "N/A".', 150),
  occupation: text('Enter your occupation and workplace, or "Student".', 150),
  previousLeo: z.enum(YES_NO, { error: "Choose one option." }),
  previousLeoDetails: z.string().trim().max(200, "Please keep this under 200 characters.").default(""),
  interests: z
    .array(z.enum(INTEREST_AREAS))
    .min(1, "Choose at least one area of service."),
  heardFrom: z.enum(HEARD_FROM, { error: "Choose one option." }),
  heardFromOther: z.string().trim().max(100, "Please keep this under 100 characters.").default(""),
  willing: z.enum(YES_NO, { error: "Choose one option." }),
  declaration: z.literal(true, { error: "Please agree to the Membership Declaration to continue." }),
};

/** Rules that depend on more than one field. */
function crossFieldRules(
  value: { heardFrom?: string; heardFromOther?: string },
  ctx: z.RefinementCtx,
) {
  if (value.heardFrom === "Other" && !value.heardFromOther?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["heardFromOther"],
      message: "Tell us where you heard about us.",
    });
  }
}

export const applicationSchema = z.object(shape).superRefine(crossFieldRules);

/** What the browser sends to the server action: the application plus anti-abuse metadata. */
export const submissionSchema = z
  .object({
    ...shape,
    /** Generated once per form load. Lets Apps Script recognise a retry of the same submission. */
    submissionId: z.string().regex(/^[0-9a-f-]{16,64}$/i),
    /** Honeypot: hidden from people, so only a bot fills it in. */
    website: z.string().max(500).optional(),
    /** Milliseconds between the form appearing and Submit. Instant submissions are bots. */
    elapsedMs: z.number().finite().optional(),
  })
  .superRefine(crossFieldRules);

export type Application = z.infer<typeof applicationSchema>;
export type Submission = z.infer<typeof submissionSchema>;

/** First error message for each invalid field. Empty object means valid. */
export function collectErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0] as FieldKey | undefined;
    if (key && !(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

export function validateApplication(values: FormValues): Partial<Record<FieldKey, string>> {
  const result = applicationSchema.safeParse(values);
  return result.success ? {} : collectErrors(result.error.issues);
}

/** Tidies validated input into exactly what is stored: no stray whitespace, consistent casing. */
export function normalizeApplication(app: Application) {
  const collapse = (s: string) => s.replace(/\s+/g, " ").trim();
  return {
    fullName: collapse(app.fullName),
    callingName: collapse(app.callingName),
    dateOfBirth: app.dateOfBirth,
    gender: app.gender,
    nic: app.nic.trim().toUpperCase(),
    email: app.email.trim().toLowerCase(),
    whatsapp: compactPhone(app.whatsapp.trim()),
    address: collapse(app.address),
    institution: collapse(app.institution),
    course: collapse(app.course),
    occupation: collapse(app.occupation),
    previousLeo: app.previousLeo,
    // Details only make sense when the answer is Yes.
    previousLeoDetails: app.previousLeo === "Yes" ? collapse(app.previousLeoDetails) : "",
    // Keep the form's own option order, whatever order they were clicked in.
    interests: INTEREST_AREAS.filter((area) => app.interests.includes(area)),
    heardFrom: app.heardFrom,
    heardFromOther: app.heardFrom === "Other" ? collapse(app.heardFromOther) : "",
    willing: app.willing,
    declaration: "Yes, I agree" as const,
  };
}

export type NormalizedApplication = ReturnType<typeof normalizeApplication>;

/** Short, human-friendly reference shown to the applicant and stored in the sheet. */
export function referenceFromSubmissionId(submissionId: string): string {
  return `UOCA-${submissionId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
