/**
 * Where RSVPs and blessings are stored.
 *
 * Leave `sheetsEndpoint` as `null` and everything stays in the guest's own
 * browser — useful for local development and for sharing a preview.
 *
 * To send responses to a Google Sheet, follow "Connecting the Google Sheet"
 * in the README, then paste the deployed Web App URL below.
 *
 * A note on the secret: this value ships to the browser, so anyone who views
 * source can read it. It is a spam deterrent — it stops a bot that stumbles on
 * the endpoint — not a security control. The real protection is that the
 * endpoint can only ever append rows to two tabs of one spreadsheet, and the
 * Apps Script clamps and truncates everything it is given.
 */
export const backend = {
  /** e.g. 'https://script.google.com/macros/s/AKfy…/exec' */
  sheetsEndpoint:
    'https://script.google.com/macros/s/AKfycby0MWyrjsodha7fklb1oD6V5cjxrvs3eBifr6AYC_2j0Dm_NnbE3CltnCKsy4X1m6J5/exec' as string | null,

  /** Must match SHARED_SECRET in scripts/apps-script/Code.gs. */
  sharedSecret: 'rs-xygVTeslDX9AfNDBvVKs8FKjn1ZpjmDV',

  /** Give up on a slow network rather than leaving a guest watching a spinner. */
  timeoutMs: 12000,
};
