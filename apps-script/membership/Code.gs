/**
 * UOCA website forms: Google Apps Script backend.
 *
 *   Website (Next.js server action)  --POST JSON-->  this Web App  -->  private Google Sheet
 *
 * One Web App serves two forms, each stored on its own tab:
 *   - membership applications  -> "Sheet1"
 *   - newsletter subscribers   -> "Sheet2" (created automatically if it does not exist)
 *
 * Install: open the Google Sheet -> Extensions -> Apps Script, paste this file, then follow README.md.
 * The script is *bound* to the sheet, so no spreadsheet ID or credentials appear in the code. The sheet itself is
 * never shared with the public: only this script (running as the account that deployed it) can write to it.
 *
 * Every request must carry SHARED_SECRET (a Script Property). Requests without it are refused.
 */

// ── Configuration ───────────────────────────────────────────────────────────────────────────────

var SHEET_NAME = 'Sheet1'; // membership applications
var SUBSCRIBERS_SHEET_NAME = 'Sheet2'; // newsletter subscribers
var TIMESTAMP_FORMAT = 'yyyy-mm-dd hh:mm:ss';
var MAX_BODY_CHARS = 20000;

/** Only real, new submissions count. The website adds its own (per-visitor) limit in front of this one. */
var RATE_LIMITS = {
  membership: {
    perClient: { max: 5, windowSec: 60 * 60 }, // one visitor: 5 applications per hour
    global: { max: 60, windowSec: 10 * 60 }, // everyone together: 60 applications per 10 minutes
  },
  subscribe: {
    perClient: { max: 10, windowSec: 60 * 60 },
    global: { max: 300, windowSec: 10 * 60 },
  },
};

var SUBSCRIBE_SOURCES = ['subscribe-page', 'footer', 'home'];

var INTEREST_AREAS = [
  'Children & Education',
  'Sports and Wellbeing',
  'Fundraising and Finance',
  'IT, Education and Youth Empowerment',
  'Community Services',
  'International Partnerships',
  'Fellowship and Member Relations',
  'Environmental and Social Responsibilities',
  'Club Operations and Service Strategy',
  'Public Relations and Outreach',
];
var HEARD_FROM = [
  'Friend / Existing Member',
  'Social Media',
  'Leo Event / Project',
  'University / Alumni Network',
  'Other',
];

/**
 * The sheet's columns, in order. `header` is the text in row 1; `value` picks the cell from the validated record.
 * To add or reorder a column, change it here (and add a matching header if the sheet already has data).
 */
var COLUMNS = [
  { header: 'Timestamp', value: function (r) { return r.timestamp; } },
  { header: 'Reference', value: function (r) { return r.reference; } },
  { header: 'Full Name', value: function (r) { return r.fullName; } },
  { header: 'Preferred Calling Name', value: function (r) { return r.callingName; } },
  { header: 'Date of Birth', value: function (r) { return r.dateOfBirth; } },
  { header: 'Email Address', value: function (r) { return r.email; } },
  { header: 'WhatsApp Contact No.', value: function (r) { return r.whatsapp; }, phone: true },
  { header: 'Residential Address', value: function (r) { return r.address; } },
  { header: 'National Identity Card No.', value: function (r) { return r.nic; } },
  { header: 'Gender', value: function (r) { return r.gender; } },
  { header: 'University / Institute / School', value: function (r) { return r.institution; } },
  { header: 'Course / Degree / Programme', value: function (r) { return r.course; } },
  { header: 'Current Occupation / Workplace', value: function (r) { return r.occupation; } },
  { header: 'Previously a Leo Club Member?', value: function (r) { return r.previousLeo; } },
  { header: 'Previous Leo Club and Role', value: function (r) { return r.previousLeoDetails; } },
  { header: 'Areas of Community Service', value: function (r) { return r.interests.join(', '); } },
  {
    header: 'How Did You Hear About Us?',
    value: function (r) { return r.heardFrom === 'Other' ? 'Other: ' + r.heardFromOther : r.heardFrom; },
  },
  { header: 'Willing to Participate?', value: function (r) { return r.willing; } },
  { header: 'Membership Declaration', value: function (r) { return r.declaration; } },
  { header: 'Status', value: function () { return 'New'; } },
];

var COL = { REFERENCE: 2, EMAIL: 6, NIC: 9 }; // 1-based positions used for duplicate checks

/** Newsletter tab: one row per subscriber. */
var SUBSCRIBER_COLUMNS = [
  { header: 'Timestamp', value: function (r) { return r.timestamp; } },
  { header: 'Email Address', value: function (r) { return r.email; } },
  { header: 'Source', value: function (r) { return r.source; } },
  { header: 'Status', value: function () { return 'Subscribed'; } },
];
var SUBSCRIBER_EMAIL_COL = 2;

// ── Entry points ────────────────────────────────────────────────────────────────────────────────

/** POST from the website. Always answers with JSON: {ok:true,...} or {ok:false,code,message}. */
function doPost(e) {
  try {
    var body = parseBody_(e);
    authorize_(body.secret);
    var clientKey = String(body.clientKey || 'unknown');
    if (body.type === 'subscribe') return json_(subscribe_(validateSubscriber_(body), clientKey));
    return json_(save_(validate_(body), clientKey)); // anything else is a membership application
  } catch (err) {
    if (err && err.isHandled) {
      return json_({ ok: false, code: err.code, message: err.message, fields: err.fields });
    }
    console.error('Unexpected error: ' + (err && err.stack ? err.stack : err));
    return json_({ ok: false, code: 'SERVER_ERROR', message: 'Unexpected error.' });
  }
}

/** Opening the /exec URL in a browser shows this. It proves the deployment is live and reveals no data. */
function doGet() {
  return json_({ ok: true, service: 'UOCA website forms' });
}

/**
 * Run this ONCE from the editor (choose "setup" in the toolbar, then Run). It:
 *   1. triggers Google's authorization prompt for this script,
 *   2. writes the header row on each tab (and creates the subscribers tab) if it is empty,
 *   3. creates SHARED_SECRET if you haven't set one, and prints it so you can copy it into .env.local.
 */
function setup() {
  ensureHeaders_(getSheet_(SHEET_NAME, false), COLUMNS);
  ensureHeaders_(getSheet_(SUBSCRIBERS_SHEET_NAME, true), SUBSCRIBER_COLUMNS);

  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('SHARED_SECRET');
  if (!secret) {
    secret = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('SHARED_SECRET', secret);
    console.log('Created SHARED_SECRET. Copy it into .env.local as APPS_SCRIPT_SECRET:\n' + secret);
  } else {
    console.log('SHARED_SECRET already exists (not shown again). Both tabs have their headers.');
  }
}

// ── Request handling ────────────────────────────────────────────────────────────────────────────

function parseBody_(e) {
  var raw = e && e.postData && e.postData.contents;
  if (!raw) fail_('BAD_REQUEST', 'Empty request.');
  if (raw.length > MAX_BODY_CHARS) fail_('BAD_REQUEST', 'Request too large.');
  try {
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    return parsed;
  } catch (err) {
    fail_('BAD_REQUEST', 'Request was not valid JSON.');
  }
}

function authorize_(provided) {
  var expected = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if (!expected) fail_('SERVER_ERROR', 'SHARED_SECRET is not configured. Run setup() once.');
  if (!provided || !constantTimeEquals_(String(provided), expected)) fail_('UNAUTHORIZED', 'Unauthorized.');
}

function constantTimeEquals_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── Validation (mirrors lib/membership/application.ts on the website) ───────────────────────────

/** Strips control characters, collapses whitespace, trims and caps the length. Always returns a string. */
function clean_(value, max) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function validate_(b) {
  var errors = {};
  var r = {};

  function required(key, max, minLen, message) {
    r[key] = clean_(b[key], max);
    if (r[key].length < (minLen || 1)) errors[key] = message;
  }
  function oneOf(key, options, message) {
    r[key] = clean_(b[key], 100);
    if (options.indexOf(r[key]) === -1) errors[key] = message;
  }

  required('fullName', 120, 2, 'Enter your full name.');
  required('callingName', 60, 1, "Enter the name you'd like us to call you.");

  r.dateOfBirth = clean_(b.dateOfBirth, 10);
  if (!isRealPastDate_(r.dateOfBirth)) errors.dateOfBirth = 'Enter a real date of birth.';

  oneOf('gender', ['Male', 'Female'], 'Choose one option.');

  r.nic = clean_(b.nic, 20).toUpperCase();
  if (!/^(\d{9}[VX]|\d{12})$/.test(r.nic)) errors.nic = 'Enter a valid NIC number.';

  r.email = clean_(b.email, 254).toLowerCase();
  if (!/^[^\s@=+\-][^\s@]*@[^\s@]+\.[^\s@]{2,}$/.test(r.email)) errors.email = 'Enter a valid email address.';

  r.whatsapp = clean_(b.whatsapp, 30).replace(/[\s\-().]/g, '');
  if (!/^\+?\d{9,15}$/.test(r.whatsapp)) errors.whatsapp = 'Enter a valid WhatsApp number.';

  required('address', 300, 5, 'Enter your residential address.');
  required('institution', 150, 1, 'Enter your university, institute or school, or "N/A".');
  required('course', 150, 1, 'Enter your course, degree or grade, or "N/A".');
  required('occupation', 150, 1, 'Enter your occupation and workplace, or "Student".');

  oneOf('previousLeo', ['Yes', 'No'], 'Choose one option.');
  r.previousLeoDetails = r.previousLeo === 'Yes' ? clean_(b.previousLeoDetails, 200) : '';

  var chosen = Array.isArray(b.interests) ? b.interests : [];
  r.interests = INTEREST_AREAS.filter(function (area) { return chosen.indexOf(area) !== -1; });
  if (r.interests.length === 0) errors.interests = 'Choose at least one area of service.';

  oneOf('heardFrom', HEARD_FROM, 'Choose one option.');
  r.heardFromOther = r.heardFrom === 'Other' ? clean_(b.heardFromOther, 100) : '';
  if (r.heardFrom === 'Other' && !r.heardFromOther) errors.heardFromOther = 'Tell us where you heard about us.';

  oneOf('willing', ['Yes', 'No'], 'Choose one option.');

  if (b.declaration !== 'Yes, I agree') errors.declaration = 'Please agree to the Membership Declaration.';
  r.declaration = 'Yes, I agree';

  // The website sends these; anything malformed is replaced rather than trusted.
  r.submissionId = clean_(b.submissionId, 64);
  if (!/^[0-9a-fA-F-]{16,64}$/.test(r.submissionId)) errors.submissionId = 'Missing submission id.';
  r.reference = /^UOCA-[0-9A-F]{8}$/.test(String(b.reference)) ? String(b.reference) : '';
  if (!r.reference) errors.reference = 'Missing reference.';

  if (Object.keys(errors).length) fail_('VALIDATION', 'Some answers are invalid.', errors);

  r.timestamp = new Date();
  return r;
}

function isRealPastDate_(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  var y = +s.slice(0, 4), m = +s.slice(5, 7), d = +s.slice(8, 10);
  var date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return false;
  return y >= 1940 && date.getTime() < Date.now();
}

// ── Saving ──────────────────────────────────────────────────────────────────────────────────────

function save_(record, clientKey) {
  // One submission at a time, so two people applying at the same second can never write to the same row.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) fail_('BUSY', 'Busy, please try again.');
  try {
    var sheet = getSheet_(SHEET_NAME, false);
    ensureHeaders_(sheet, COLUMNS);

    var duplicate = findDuplicate_(sheet, record);
    if (duplicate === 'same-submission') {
      // The visitor retried after a slow network. It already saved, so just confirm.
      return { ok: true, reference: record.reference, duplicate: true };
    }
    if (duplicate) fail_('DUPLICATE_APPLICATION', 'An application with this ' + duplicate + ' already exists.');

    if (!takeRateLimitSlot_('membership', clientKey)) fail_('RATE_LIMITED', 'Too many submissions.');

    appendRow_(sheet, COLUMNS, record);
    return { ok: true, reference: record.reference };
  } finally {
    lock.releaseLock();
  }
}

/** Adds one row below the existing data (never overwrites). Everything but the timestamp is stored as plain text. */
function appendRow_(sheet, columns, record) {
  var row = sheet.getLastRow() + 1;
  var range = sheet.getRange(row, 1, 1, columns.length);
  // Text format keeps "+94..." intact and stops any cell from being read as a formula.
  range.setNumberFormats([
    columns.map(function (_, i) { return i === 0 ? TIMESTAMP_FORMAT : '@'; }),
  ]);
  range.setValues([
    columns.map(function (col, i) {
      var v = col.value(record);
      return i === 0 ? v : guardFormula_(String(v), !!col.phone);
    }),
  ]);
  SpreadsheetApp.flush();
}

// ── Newsletter subscribers ──────────────────────────────────────────────────────────────────────

function validateSubscriber_(b) {
  var email = clean_(b.email, 254).toLowerCase();
  if (!/^[^\s@=+\-][^\s@]*@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    fail_('VALIDATION', 'Enter a valid email address.', { email: 'Enter a valid email address.' });
  }
  var source = clean_(b.source, 30);
  return { email: email, source: SUBSCRIBE_SOURCES.indexOf(source) === -1 ? 'other' : source, timestamp: new Date() };
}

/** Adds the address once. Subscribing twice is not an error and is not revealed, so nobody can probe who is on the list. */
function subscribe_(record, clientKey) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) fail_('BUSY', 'Busy, please try again.');
  try {
    var sheet = getSheet_(SUBSCRIBERS_SHEET_NAME, true);
    ensureHeaders_(sheet, SUBSCRIBER_COLUMNS);

    var last = sheet.getLastRow();
    if (last >= 2) {
      var emails = sheet.getRange(2, SUBSCRIBER_EMAIL_COL, last - 1, 1).getValues();
      for (var i = 0; i < emails.length; i++) {
        if (String(emails[i][0]).trim().toLowerCase() === record.email) return { ok: true, duplicate: true };
      }
    }

    if (!takeRateLimitSlot_('subscribe', clientKey)) fail_('RATE_LIMITED', 'Too many submissions.');

    appendRow_(sheet, SUBSCRIBER_COLUMNS, record);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/** Returns 'same-submission', 'email address', 'NIC number', or '' when this is a new applicant. */
function findDuplicate_(sheet, record) {
  var last = sheet.getLastRow();
  if (last < 2) return '';
  var width = COL.NIC - COL.REFERENCE + 1;
  var rows = sheet.getRange(2, COL.REFERENCE, last - 1, width).getValues();
  var refIdx = 0, emailIdx = COL.EMAIL - COL.REFERENCE, nicIdx = COL.NIC - COL.REFERENCE;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][refIdx]) === record.reference) return 'same-submission';
  }
  for (var j = 0; j < rows.length; j++) {
    if (String(rows[j][emailIdx]).trim().toLowerCase() === record.email) return 'email address';
    if (String(rows[j][nicIdx]).trim().toUpperCase() === record.nic) return 'NIC number';
  }
  return '';
}

/** Best-effort throttle using the script cache. Returns false when the visitor or the site as a whole is over the limit. */
function takeRateLimitSlot_(scope, clientKey) {
  var limits = RATE_LIMITS[scope];
  var cache = CacheService.getScriptCache();
  var now = Date.now();

  function counter(key, limit) {
    var entry = null;
    try { entry = JSON.parse(cache.get(key) || 'null'); } catch (e) { entry = null; }
    if (!entry || now - entry.start > limit.windowSec * 1000) entry = { count: 0, start: now };
    return entry;
  }

  var clientKeyName = 'rl:' + scope + ':client:' + clientKey;
  var globalKeyName = 'rl:' + scope + ':global';
  var client = counter(clientKeyName, limits.perClient);
  var globalEntry = counter(globalKeyName, limits.global);
  if (client.count >= limits.perClient.max || globalEntry.count >= limits.global.max) return false;

  client.count++;
  globalEntry.count++;
  cache.put(clientKeyName, JSON.stringify(client), limits.perClient.windowSec);
  cache.put(globalKeyName, JSON.stringify(globalEntry), limits.global.windowSec);
  return true;
}

// ── Sheet helpers ───────────────────────────────────────────────────────────────────────────────

/** Finds a tab by name. With createIfMissing it adds the tab (at the end); otherwise a missing tab is an error. */
function getSheet_(name, createIfMissing) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) fail_('SERVER_ERROR', 'This script must be created from inside the Google Sheet (Extensions -> Apps Script).');
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet && createIfMissing) sheet = spreadsheet.insertSheet(name);
  if (!sheet) fail_('SERVER_ERROR', 'No tab named "' + name + '". Rename the tab or change the name at the top of Code.gs.');
  return sheet;
}

/**
 * Writes the header row only when the sheet is completely empty. If it already has headers, they must match
 * the expected columns exactly; otherwise nothing is written, so a mismatched sheet is never silently corrupted.
 */
function ensureHeaders_(sheet, columns) {
  var headers = columns.map(function (c) { return c.header; });
  if (sheet.getLastRow() === 0) {
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);
    range.setFontWeight('bold');
    sheet.setFrozenRows(1);
    return;
  }
  var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(existing[i]).trim() !== headers[i]) {
      fail_('SERVER_ERROR', 'Row 1 of "' + sheet.getName() + '" does not match the expected headers (first difference: column ' + (i + 1) + ').');
    }
  }
}

/**
 * Spreadsheet formula injection: a cell that begins with = + - or @ can run as a formula when the sheet is
 * exported to Excel. A leading apostrophe makes it plain text. Phone numbers may legitimately start with "+".
 */
function guardFormula_(text, allowPhone) {
  if (/^[=@]/.test(text)) return "'" + text;
  if (/^[+-]/.test(text) && !(allowPhone && /^\+\d+$/.test(text))) return "'" + text;
  return text;
}

// ── Utilities ───────────────────────────────────────────────────────────────────────────────────

/** Throws an error the caller can turn into a JSON response. */
function fail_(code, message, fields) {
  throw { isHandled: true, code: code, message: message, fields: fields };
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
