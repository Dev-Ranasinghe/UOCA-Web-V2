# Website forms: Google Apps Script backend (membership + newsletter)

```
Browser (custom forms: /join, and the newsletter boxes on /subscribe, the footer and the home page)
   ↓  Next.js server action (re-validates, honeypot, rate limit, attaches the secret)
Apps Script Web App  (Code.gs: checks secret, validates, de-duplicates, locks, appends one row)
   ↓
Private Google Sheet "Membership Form Responses"
   ├─ tab "Sheet1"  membership applications
   └─ tab "Sheet2"  newsletter subscribers (created automatically on the first sign-up)
```

The Google Form is only the reference for *which* questions exist. Nothing in the site embeds or links to it.
The sheet is never shared with the public. Only this script, running as the account that deploys it, writes to it.

Files here:

| File | Purpose |
|---|---|
| `Code.gs` | The whole backend. Paste it into the sheet's Apps Script editor. |
| `appsscript.json` | Optional manifest: narrows permissions to "this spreadsheet only" and sets the time zone. |

---

## 1. One-time setup (about 10 minutes)

### A. Add the script to the sheet
1. Open the Google Sheet **Membership Form Responses**.
2. **Extensions → Apps Script**. This creates a script *bound* to the sheet, so there is no spreadsheet ID or key anywhere in code.
3. Delete the placeholder `myFunction`, paste all of `Code.gs`, and press **Save** (Ctrl/Cmd+S).
4. Recommended: **Project Settings** (gear icon) → tick **Show "appsscript.json" manifest file in editor**, open `appsscript.json`, and replace its contents with the file in this folder. That limits the script to the one spreadsheet it is attached to.
5. Make sure the sheet tab is still called **Sheet1** (or change `SHEET_NAME` at the top of `Code.gs`).
6. Set the sheet's own time zone so timestamps read correctly: **File → Settings → Time zone → (GMT+05:30) Colombo**. The sheet, not the script, decides how the Timestamp column is displayed.

### B. Authorize and create the secret
1. In the editor's function dropdown pick **`setup`** and press **Run**.
2. Google shows **Authorization required → Review permissions**. Choose your account.
3. You will see **"Google hasn't verified this app"**. That is normal for a script you wrote yourself. Click **Advanced → Go to (project name) (unsafe) → Allow**. The permission is: *"See, edit, create, and delete only the spreadsheet that this script is bound to."*
4. `setup` writes the header row into the empty sheet and creates a random **SHARED_SECRET**. Open **Execution log** and **copy the secret it prints**. It is shown once. (It stays readable under Project Settings → Script properties.)

### C. Deploy as a Web app
1. **Deploy → New deployment**.
2. Click the gear beside "Select type" → **Web app**.
3. Fill in:

   | Option | Choose | Why |
   |---|---|---|
   | Description | `Membership v1` | Anything you like. |
   | **Execute as** | **Me** (your account) | The script writes to the sheet as you. Visitors never need access to it. |
   | **Who has access** | **Anyone** | The website's server is not signed in to Google, so it can only call the script if it is public. The sheet stays private, and every request still needs the secret. |

4. **Deploy**, then **copy the Web app URL** (ends in `/exec`).
   If Google asks for authorization again, repeat step B.3.

> **Updating the script later:** **Deploy → Manage deployments → ✎ (edit) → Version: New version → Deploy.**
> The URL stays the same. *New deployment* would create a **different** URL.
> **Saving the code is not enough.** The live URL keeps running the version you last deployed, so after pasting a new
> `Code.gs` you must deploy a new version. (When the newsletter tab was added, this is the step that switches it on.)

### D. Connect the website
Add two lines to `.env.local` (server-only, never `NEXT_PUBLIC_`):

```
APPS_SCRIPT_URL="https://script.google.com/macros/s/XXXXXXXX/exec"
APPS_SCRIPT_SECRET="the-secret-printed-by-setup"
```

Restart `npm run dev`. On your host (for example Vercel) add the same two variables under **Project → Settings → Environment Variables** and redeploy.
Both are read only in `app/join/actions.ts`, on the server. Neither is ever sent to the browser or committed.

---

## 2. Google Sheet permissions

| Setting | Value |
|---|---|
| **Share → General access** | **Restricted** |
| Never use | "Anyone with the link" (viewer, commenter or editor) and never "Public on the web" or **File → Share → Publish to web** |
| People with access | Only the few club officers who must read applications, as **Viewer**. Give **Editor** to as few people as possible. |

The sheet was opened with a `?usp=sharing` link. Open **Share** and confirm General access says **Restricted**. If it says "Anyone with the link", change it.

Notes:
- The script needs **no** sharing setting: it runs as *you*, the owner.
- Anyone with **Editor** access to the sheet can open Extensions → Apps Script and read the secret. Viewers cannot. Keep editors to people you trust.
- The sheet holds personal data (NIC, date of birth, address, phone). Turn on 2-step verification for the owning Google account.

---

## 3. What is stored (column mapping)

| Sheet column | Header | Notes |
|---|---|---|
| A | Timestamp | Added by the script (server time, `yyyy-mm-dd hh:mm:ss`, Asia/Colombo) |
| B | Reference | e.g. `UOCA-1A2B3C4D`. The applicant sees the same code. Also used to spot retries. |
| C | Full Name | |
| D | Preferred Calling Name | |
| E | Date of Birth | `YYYY-MM-DD` |
| F | Email Address | lower-cased |
| G | WhatsApp Contact No. | spaces/dashes removed, e.g. `+94771234567` |
| H | Residential Address | |
| I | National Identity Card No. | upper-cased |
| J | Gender | Male / Female |
| K | University / Institute / School | |
| L | Course / Degree / Programme | |
| M | Current Occupation / Workplace | |
| N | Previously a Leo Club Member? | Yes / No |
| O | Previous Leo Club and Role | blank unless N is Yes |
| P | Areas of Community Service | comma-separated, in the form's own order |
| Q | How Did You Hear About Us? | option, or `Other: …` |
| R | Willing to Participate? | Yes / No |
| S | Membership Declaration | `Yes, I agree` |
| T | Status | starts as `New`. Change it by hand as you process applications. |

### Newsletter tab (`Sheet2`)

| Column | Header | Notes |
|---|---|---|
| A | Timestamp | added by the script |
| B | Email Address | lower-cased. Each address is stored once. |
| C | Source | `subscribe-page`, `footer` or `home`: which box they used |
| D | Status | `Subscribed`. Change it by hand (for example to `Unsubscribed`) as you manage the list. |

Signing up twice is **not** an error and shows the same "You're on the list" message, so nobody can use the form to check whether an address is already subscribed. Change `SUBSCRIBERS_SHEET_NAME` at the top of `Code.gs` if you want a different tab name.

Rules the script follows:
- Row 1 is written **only if the sheet is completely empty**. If headers already exist they must match exactly, otherwise **nothing is written** and the error is logged. Existing data is never overwritten: every application goes on a fresh row below the last.
- The Google Form's own "Email" (collected from the respondent's Google sign-in) cannot exist on a website form, so the **Email Address** question is the applicant's email.
- Every cell except the timestamp is stored as plain text, and values that start with `=`, `+`, `-` or `@` get a leading apostrophe. That stops spreadsheet formula injection when the sheet is exported to Excel.

---

## 4. Testing

1. **Is the deployment live?** Open the `/exec` URL in a browser tab. You should see `{"ok":true,"service":"UOCA membership application"}`.
   A Google sign-in page instead means **Who has access** is not *Anyone*. Fix it and redeploy a new version.
2. **Submit a test application** at `http://localhost:3000/join` with a real-looking email and NIC (for example `200012345678`). Fill the form like a person would; a submission made within about 3 seconds of the page opening is treated as a bot and silently ignored.
3. You should see the **Application Received** card with a reference such as `UOCA-1A2B3C4D`.
4. Open the sheet: a new row appears in `Sheet1`, with that reference in column B and `New` in column T.
5. **Check duplicates:** submit again with the same email or NIC. The form should say an application already exists, and no second row appears.
6. **Check errors:** stop the dev server, change `APPS_SCRIPT_SECRET` to something wrong, restart, submit. The form shows *Something went wrong* with **Try again**, and the terminal logs the real reason on a `[membership]` line.
7. **Newsletter:** type an address into the box in the site footer and press Subscribe. You should see "You're on the list", and a tab called `Sheet2` appears with the address, its source (`footer`) and `Subscribed`. Submitting the same address again shows the same message and adds no second row.
8. **Delete your test rows** in the sheet (right-click row → Delete row) before going live.

---

## 5. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Form says *Something went wrong* | Look at the terminal (or host logs) for a line starting `[membership]`. It names the cause. |
| `[membership] APPS_SCRIPT_URL or APPS_SCRIPT_SECRET is not set` | Add both to `.env.local` and **restart** the dev server. |
| `Apps Script returned non-JSON` | Google returned a sign-in or error page. Set **Execute as: Me** and **Who has access: Anyone**, redeploy as a **new version**, and check the URL ends in `/exec`. |
| Logs show `UNAUTHORIZED` | `APPS_SCRIPT_SECRET` does not match the Script property `SHARED_SECRET`. Copy it again (Project Settings → Script properties). |
| `SHARED_SECRET is not configured` | You never ran `setup()`. Run it. |
| `No tab named "Sheet1"` | The tab was renamed. Rename it back or edit `SHEET_NAME` in `Code.gs`. |
| `Row 1 … does not match the expected headers` | Someone edited the header row. Restore the headers from section 3 (or clear the sheet if it has no real data), then submit again. |
| `This script must be created from inside the Google Sheet` | The script was made at script.google.com instead of Extensions → Apps Script. Recreate it from the sheet. |
| Code changes have no effect | Apps Script serves the *deployed version*. Deploy → Manage deployments → edit → **New version**. |
| A real applicant is told they already applied | Their email or NIC matches an earlier row. Find and fix or delete that row. |
| *Authorization required* after editing the manifest | Run `setup()` again from the editor and accept the permissions. |
| Membership works but newsletter sign-ups say *Something went wrong* | The deployed script is the old version. Paste the latest `Code.gs` and deploy a **New version** (see the note under section 1C). |
| Slow first submission (2 to 5 s) | Normal Apps Script cold start. The form shows a loading state and the button is disabled meanwhile. |
| Submissions succeed but the sheet stays empty | You are looking at another spreadsheet copy. The script writes to the sheet it is *bound to*. |
| To rotate a leaked secret | Change the `SHARED_SECRET` Script property, update `APPS_SCRIPT_SECRET`, redeploy the site. |

---

## 6. Honest limits of a public Apps Script endpoint

- **Anyone who learns the `/exec` URL can call it.** The shared secret is what stops them. Anyone with Editor access to the sheet can read that secret. If it leaks, rotate it (last row above).
- **Apps Script cannot see visitors' IP addresses.** Per-visitor rate limiting therefore relies on a salted hash the website supplies. It is best-effort (`CacheService` can evict entries), so treat it as a speed bump, not a wall.
- **The global cap can be used against you.** Sixty applications in ten minutes is far above real demand, but someone who got past the website could exhaust it and temporarily block real applicants. Raise or lower `RATE_LIMITS` in `Code.gs`.
- **Honeypot and timing checks only stop simple bots.** They do not stop a determined human or a bot that behaves like one. If spam appears, add a CAPTCHA such as Cloudflare Turnstile in front of the server action.
- **Newsletter addresses are not verified.** There is no confirmation email (double opt-in), so someone can sign up an address that is not theirs. Send a confirmation message from whatever tool you use to mail the list if that matters to you.
- **Duplicate detection is by email and NIC**, so it stops accidents and double clicks, not someone using a second email and a made-up NIC.
- **Apps Script cannot return HTTP error codes**; it always answers 200 with `{ok:false, code}`. The server action translates that.
- **Google quotas apply** (concurrent executions, daily runtime). They are far above what a club's applications need.
- **The deployment is tied to one Google account.** If that account is deleted or loses access to the sheet, submissions stop. Deploy from a club-owned account, not a personal one that might leave.

## 7. Changing the questions

The questions live in **two** places that must stay in step:
1. `lib/membership/application.ts` (website: fields, options, rules) and `components/join/MembershipForm.tsx` (layout).
2. `Code.gs` (`COLUMNS`, `validate_`, and the option lists at the top).

For a new membership year, start a fresh sheet tab or spreadsheet with its own script and deployment. That keeps each year's applications separate and the header check safe.
