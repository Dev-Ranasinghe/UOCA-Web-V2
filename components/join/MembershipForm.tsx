"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowRight, CircleAlert, LoaderCircle } from "lucide-react";
import SectionDivider from "@/components/SectionDivider";
import { submitMembershipApplication } from "@/app/join/actions";
import {
  DECLARATION_PARAGRAPHS,
  EMPTY_VALUES,
  FIELD_ORDER,
  GENDERS,
  HEARD_FROM,
  INTEREST_AREAS,
  SECTIONS,
  YES_NO,
  EARLIEST_BIRTH_YEAR,
  referenceFromSubmissionId,
  todayISO,
  validateApplication,
  type FieldKey,
  type FormValues,
} from "@/lib/membership/application";
import {
  CheckboxGroup,
  ChoiceTile,
  FieldError,
  RadioGroup,
  Reveal,
  TextAreaField,
  TextField,
} from "./fields";
import SectionRail, { ChairNote } from "./SectionRail";
import SuccessCard from "./SuccessCard";

type Status = "idle" | "submitting" | "success";

/** crypto.randomUUID only exists on HTTPS and localhost; this keeps the form working when tested over plain HTTP on a phone. */
function newSubmissionId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function focusField(key: FieldKey) {
  const el = document.getElementById(`field-${key}`);
  if (!el) return;
  const target = el instanceof HTMLFieldSetElement ? el.querySelector<HTMLElement>("input") : el;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target?.focus({ preventScroll: true });
  el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
}

const sectionHeading = "font-serif text-2xl font-bold text-[#121212] sm:text-3xl";

export default function MembershipForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  /** `retry` is set when the failure is worth another attempt as-is; the button then reads "Try again". */
  const [notice, setNotice] = useState<{ title: string; message: string; retry?: boolean } | null>(null);
  const [reference, setReference] = useState("");
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [honeypot, setHoneypot] = useState("");

  // Today's date differs between server and browser (time zone), so it is undefined during hydration and set right after.
  const maxDate = useSyncExternalStore(
    () => () => {},
    todayISO,
    () => undefined,
  );
  const submissionId = useRef("");
  const shownAt = useRef(0);
  useEffect(() => {
    submissionId.current = newSubmissionId();
    shownAt.current = Date.now();
  }, []);

  const errors = useMemo(() => validateApplication(values), [values]);

  const completeIds = useMemo(
    () => new Set(SECTIONS.filter((s) => s.fields.every((key) => !errors[key])).map((s) => s.id)),
    [errors],
  );

  // Which section is being read, for the side index: the last one whose top has passed a line 30% down the screen.
  // Above the first section (or before any scrolling) it stays on the first.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current = SECTIONS[0].id;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= line) current = section.id;
      }
      setActiveSection(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [status]);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
    if (notice) setNotice(null);
  };
  const touch = (key: FieldKey) => setTouched((prev) => ({ ...prev, [key]: true }));
  /** An error appears once you've left the field or tried to submit; never while you're still typing the first time. */
  const errorFor = (key: FieldKey) => (attempted || touched[key] ? errors[key] : undefined);

  const toggleInterest = (area: string) =>
    set("interests", values.interests.includes(area) ? values.interests.filter((a) => a !== area) : [...values.interests, area]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    setAttempted(true);
    const firstInvalid = FIELD_ORDER.find((key) => errors[key]);
    if (firstInvalid) {
      const count = FIELD_ORDER.filter((key) => errors[key]).length;
      setNotice({
        title: "Almost there",
        message: count === 1 ? "One answer needs your attention." : `${count} answers need your attention.`,
      });
      focusField(firstInvalid);
      return;
    }

    setStatus("submitting");
    setNotice(null);
    try {
      const result = await submitMembershipApplication({
        ...values,
        submissionId: submissionId.current,
        website: honeypot,
        elapsedMs: Date.now() - shownAt.current,
      });
      if (result.ok) {
        setReference(result.reference || referenceFromSubmissionId(submissionId.current));
        setStatus("success");
        return;
      }
      if (result.code === "DUPLICATE") {
        setNotice({ title: "Already applied?", message: result.message });
      } else if (result.code === "RATE_LIMITED" || result.code === "VALIDATION") {
        setNotice({ title: "Please check", message: result.message });
      } else {
        setNotice({ title: "Something went wrong", message: result.message, retry: true });
      }
    } catch (error) {
      console.error("[membership] submit failed", error);
      setNotice({
        title: "Something went wrong",
        message: "We couldn't submit your application right now. Please try again in a moment.",
        retry: true,
      });
    }
    setStatus("idle");
  }

  if (status === "success") return <SuccessCard reference={reference} />;

  const submitting = status === "submitting";

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-y-12 lg:max-w-none lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-x-16">
      <SectionRail sections={SECTIONS} completeIds={completeIds} activeId={activeSection} />

      <form noValidate onSubmit={handleSubmit} aria-label="Membership application" className="relative min-w-0 caret-[#121212] selection:bg-[#f3c276] selection:text-[#121212]">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[2px] text-[#555]">
          <span aria-hidden="true" className="text-[#b3261e]">
            *
          </span>{" "}
          Required
        </p>

        <div className="mt-8 flex flex-col gap-12 md:gap-16">
          {/* About you */}
          <section id="about" aria-labelledby="about-title" className="scroll-mt-28">
            <h2 id="about-title" className={sectionHeading}>
              About you
            </h2>
            <SectionDivider spaced />
            <div className="grid gap-x-5 gap-y-6 md:grid-cols-2">
              <TextField
                name="fullName"
                label="Full Name"
                value={values.fullName}
                onChange={(v) => set("fullName", v)}
                onBlur={() => touch("fullName")}
                error={errorFor("fullName")}
                autoComplete="name"
                placeholder="As it appears on your NIC"
                maxLength={120}
                className="md:col-span-2"
              />
              <TextField
                name="callingName"
                label="Preferred Calling Name"
                value={values.callingName}
                onChange={(v) => set("callingName", v)}
                onBlur={() => touch("callingName")}
                error={errorFor("callingName")}
                autoComplete="nickname"
                placeholder="What your friends call you"
                maxLength={60}
              />
              <TextField
                name="dateOfBirth"
                label="Date of Birth"
                type="date"
                value={values.dateOfBirth}
                onChange={(v) => set("dateOfBirth", v)}
                onBlur={() => touch("dateOfBirth")}
                error={errorFor("dateOfBirth")}
                autoComplete="bday"
                min={`${EARLIEST_BIRTH_YEAR}-01-01`}
                max={maxDate}
              />
              <RadioGroup
                name="gender"
                legend="Gender"
                options={GENDERS}
                value={values.gender}
                onChange={(v) => set("gender", v)}
                error={errorFor("gender")}
              />
              <TextField
                name="nic"
                label="National Identity Card No."
                value={values.nic}
                onChange={(v) => set("nic", v)}
                onBlur={() => touch("nic")}
                error={errorFor("nic")}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="200012345678 or 901234567V"
                maxLength={20}
              />
            </div>
          </section>

          {/* Contact details */}
          <section id="contact" aria-labelledby="contact-title" className="scroll-mt-28">
            <h2 id="contact-title" className={sectionHeading}>
              Contact details
            </h2>
            <SectionDivider spaced />
            <div className="grid gap-x-5 gap-y-6 md:grid-cols-2">
              <TextField
                name="email"
                label="Email Address"
                type="email"
                value={values.email}
                onChange={(v) => set("email", v)}
                onBlur={() => touch("email")}
                error={errorFor("email")}
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="name@example.com"
                maxLength={254}
              />
              <TextField
                name="whatsapp"
                label="WhatsApp Contact No."
                type="tel"
                value={values.whatsapp}
                onChange={(v) => set("whatsapp", v)}
                onBlur={() => touch("whatsapp")}
                error={errorFor("whatsapp")}
                autoComplete="tel"
                inputMode="tel"
                placeholder="+94 77 123 4567"
                maxLength={30}
              />
              <TextAreaField
                name="address"
                label="Residential Address"
                value={values.address}
                onChange={(v) => set("address", v)}
                onBlur={() => touch("address")}
                error={errorFor("address")}
                autoComplete="street-address"
                placeholder="House number, street, city"
                maxLength={300}
                className="md:col-span-2"
              />
            </div>
          </section>

          {/* Studies & work */}
          <section id="study-work" aria-labelledby="study-work-title" className="scroll-mt-28">
            <h2 id="study-work-title" className={sectionHeading}>
              Studies &amp; work
            </h2>
            <SectionDivider spaced />
            <div className="grid gap-x-5 gap-y-6 md:grid-cols-2">
              <TextField
                name="institution"
                label="University / Educational Institute / School"
                hint="If you are currently studying, mention the name of your university or institute. If you are a school student, mention your school. If you are not currently studying, enter “N/A”."
                value={values.institution}
                onChange={(v) => set("institution", v)}
                onBlur={() => touch("institution")}
                error={errorFor("institution")}
                autoComplete="organization"
                maxLength={150}
                className="md:col-span-2"
              />
              <TextField
                name="course"
                label="Course / Degree / Programme"
                hint="If you are a university or institute student, mention your degree or programme. If you are a school student, mention your current grade. If you are not currently studying, enter “N/A”."
                value={values.course}
                onChange={(v) => set("course", v)}
                onBlur={() => touch("course")}
                error={errorFor("course")}
                autoComplete="off"
                maxLength={150}
                className="md:col-span-2"
              />
              <TextField
                name="occupation"
                label="Current Occupation / Workplace"
                hint="If you are employed, mention your job title and workplace. If you are self-employed, mention your occupation or business. If you are a student, enter “Student”."
                value={values.occupation}
                onChange={(v) => set("occupation", v)}
                onBlur={() => touch("occupation")}
                error={errorFor("occupation")}
                autoComplete="organization-title"
                maxLength={150}
                className="md:col-span-2"
              />
            </div>
          </section>

          {/* Your Leo journey */}
          <section id="leo-journey" aria-labelledby="leo-journey-title" className="scroll-mt-28">
            <h2 id="leo-journey-title" className={sectionHeading}>
              Your Leo journey
            </h2>
            <SectionDivider spaced />
            <div className="grid gap-x-5 gap-y-6 md:grid-cols-2">
              <RadioGroup
                name="previousLeo"
                legend="Have you previously been a member of a Leo Club?"
                options={YES_NO}
                value={values.previousLeo}
                onChange={(v) => set("previousLeo", v)}
                error={errorFor("previousLeo")}
                className="md:col-span-2"
              />
              <Reveal open={values.previousLeo === "Yes"} className="md:col-span-2">
                <TextField
                  name="previousLeoDetails"
                  label="If yes, please mention the Leo Club and your previous role, if any."
                  optional
                  value={values.previousLeoDetails}
                  onChange={(v) => set("previousLeoDetails", v)}
                  onBlur={() => touch("previousLeoDetails")}
                  error={errorFor("previousLeoDetails")}
                  autoComplete="off"
                  maxLength={200}
                />
              </Reveal>
              <CheckboxGroup
                name="interests"
                legend="What areas of community service are you interested in?"
                hint="Select all that apply."
                options={INTEREST_AREAS}
                values={values.interests}
                onToggle={toggleInterest}
                error={errorFor("interests")}
                className="md:col-span-2"
              />
              <RadioGroup
                name="heardFrom"
                legend="How did you hear about the Leo Club of UOC Alumni?"
                options={HEARD_FROM}
                value={values.heardFrom}
                onChange={(v) => set("heardFrom", v)}
                error={errorFor("heardFrom")}
                layout="list"
                className="md:col-span-2"
              />
              <Reveal open={values.heardFrom === "Other"} className="md:col-span-2">
                <TextField
                  name="heardFromOther"
                  label="Where did you hear about us?"
                  value={values.heardFromOther}
                  onChange={(v) => set("heardFromOther", v)}
                  onBlur={() => touch("heardFromOther")}
                  error={errorFor("heardFromOther")}
                  autoComplete="off"
                  maxLength={100}
                />
              </Reveal>
              <RadioGroup
                name="willing"
                legend="Are you willing to actively participate in club meetings, projects and activities?"
                options={YES_NO}
                value={values.willing}
                onChange={(v) => set("willing", v)}
                error={errorFor("willing")}
                className="md:col-span-2"
              />
            </div>
          </section>

          {/* Declaration */}
          <section id="declaration" aria-labelledby="declaration-title" className="scroll-mt-28">
            <h2 id="declaration-title" className={sectionHeading}>
              Membership declaration
            </h2>
            <SectionDivider spaced />
            <div className="stamp-container rounded-sm p-5 sm:p-8">
              <div className="flex flex-col gap-3 font-sans text-[15px] leading-relaxed text-[#333] sm:text-base">
                {DECLARATION_PARAGRAPHS.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <ChoiceTile
                type="checkbox"
                id="field-declaration"
                name="declaration"
                value="Yes, I agree"
                label="Yes, I agree to the Membership Declaration"
                checked={values.declaration}
                onChange={() => set("declaration", !values.declaration)}
                invalid={!!errorFor("declaration")}
              />
              <FieldError id="field-declaration-error" message={errorFor("declaration")} />
            </div>
          </section>
        </div>

        {/* Honeypot. People never see or reach this; bots that fill every input give themselves away. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-10 md:mt-12">
          {notice ? (
            <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-[#b3261e] bg-white p-4">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#b3261e]" />
              <div>
                <p className="font-serif text-lg font-bold leading-snug text-[#121212]">{notice.title}</p>
                <p className="mt-0.5 font-sans text-sm leading-relaxed text-[#333]">{notice.message}</p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
            <p className="max-w-sm font-sans text-sm leading-relaxed text-[#555]">
              The information provided will be used for membership registration and club-related communication.
            </p>
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#121212] px-8 py-4 font-mono text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212] disabled:cursor-not-allowed disabled:bg-[#555]"
            >
              {submitting ? (
                <>
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
                  Submitting…
                </>
              ) : notice?.retry ? (
                <>
                  Try again <ArrowRight aria-hidden="true" className="size-4" />
                </>
              ) : (
                <>
                  Submit application <ArrowRight aria-hidden="true" className="size-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <ChairNote className="mt-12 md:mt-16 lg:hidden" />
      </form>
    </div>
  );
}
