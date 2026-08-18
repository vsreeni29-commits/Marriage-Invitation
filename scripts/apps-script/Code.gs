/**
 * Rinsha & Sreeni — invitation backend, in a Google Sheet.
 *
 * Paste this into Extensions → Apps Script on the spreadsheet that should hold
 * the responses, then deploy it as a Web App. Setup instructions are in the
 * project README under "Connecting the Google Sheet".
 *
 * It appends RSVPs and blessings to two tabs, and serves the blessings back to
 * the site so guests can read each other's messages.
 */

/** Must match `sharedSecret` in src/config/backend.ts. */
const SHARED_SECRET = 'rs-xygVTeslDX9AfNDBvVKs8FKjn1ZpjmDV';

const RSVP_SHEET = 'RSVPs';
const BLESSING_SHEET = 'Blessings';

const RSVP_HEADERS = [
  'Timestamp (IST)',
  'Name',
  'Attending',
  'Guests',
  'Note',
];

const BLESSING_HEADERS = ['Timestamp (IST)', 'Name', 'Message'];

/* ------------------------------------------------------------------ */

function sheetFor_(name, headers) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(name);

  if (!sheet) {
    sheet = book.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function timestamp_() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * The same payload, wrapped for a <script> tag.
 *
 * A Web App answers GET with a redirect, and the CORS header does not reliably
 * survive it — when it doesn't, the site's fetch fails and every guest sees only
 * their own blessing. Served this way there is no CORS to survive. Only used
 * when the site asks for it with `?callback=`.
 */
function jsonp_(callback, payload) {
  // The site generates this name; allow nothing that could break out of the call.
  var safe = String(callback).replace(/[^A-Za-z0-9_$]/g, '').slice(0, 60);
  if (!safe) return json_(payload);

  return ContentService.createTextOutput(
    safe + '(' + JSON.stringify(payload) + ');',
  ).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function clean_(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/* ------------------------------------------------------------------ *
 * Reads — the blessing garden
 * ------------------------------------------------------------------ */

function doGet(e) {
  const params = (e && e.parameter) || {};
  const reply = function (payload) {
    return params.callback ? jsonp_(params.callback, payload) : json_(payload);
  };

  try {
    if (params.secret !== SHARED_SECRET) {
      return reply({ ok: false, error: 'unauthorised' });
    }

    const sheet = sheetFor_(BLESSING_SHEET, BLESSING_HEADERS);
    const rows = sheet.getDataRange().getValues().slice(1);

    // Newest last; the site sorts for display. Cap the payload size.
    const blessings = rows
      .filter(function (row) {
        return row[2];
      })
      .slice(-200)
      .map(function (row, index) {
        return {
          id: 'sheet-' + index + '-' + String(row[0]),
          createdAt: String(row[0]),
          name: String(row[1] || 'A well-wisher'),
          message: String(row[2]),
        };
      });

    return reply({ ok: true, blessings: blessings });
  } catch (error) {
    return reply({ ok: false, error: String(error) });
  }
}

/* ------------------------------------------------------------------ *
 * Writes — RSVPs and blessings
 * ------------------------------------------------------------------ */

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (body.secret !== SHARED_SECRET) {
      return json_({ ok: false, error: 'unauthorised' });
    }

    // Honeypot: a hidden field no real guest ever fills in.
    if (clean_(body.website, 40)) {
      return json_({ ok: true, ignored: true });
    }

    // One writer at a time, so two guests submitting together can't collide.
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);

    try {
      if (body.type === 'rsvp') {
        const name = clean_(body.name, 80);
        if (!name) return json_({ ok: false, error: 'name required' });

        const attending = body.attending === true;
        let guests = parseInt(body.guests, 10);
        if (isNaN(guests)) guests = 0;
        guests = attending ? Math.max(1, Math.min(20, guests)) : 0;

        sheetFor_(RSVP_SHEET, RSVP_HEADERS).appendRow([
          timestamp_(),
          name,
          attending ? 'Yes' : 'No',
          guests,
          clean_(body.note, 500),
        ]);

        return json_({ ok: true });
      }

      if (body.type === 'blessing') {
        const message = clean_(body.message, 600);
        if (!message) return json_({ ok: false, error: 'message required' });

        sheetFor_(BLESSING_SHEET, BLESSING_HEADERS).appendRow([
          timestamp_(),
          clean_(body.name, 80) || 'A well-wisher',
          message,
        ]);

        return json_({ ok: true });
      }

      return json_({ ok: false, error: 'unknown type' });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}
