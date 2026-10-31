# Site visit counter

The visible site-wide visitor count is fetched directly from the Cloudflare Worker:
`https://rough-limit-0133.a-gamal-31b.workers.dev/`

- The footer uses a native text element with id `site-visits-counter`.
- `assets/js/site-visits.v4.js` fetches the Worker response as plain text and writes the returned number into that element.
- The Worker must return a plain numeric text response (for example, `126`) and include an `Access-Control-Allow-Origin` response header allowing `https://agamalx0.github.io` (or `*` if intentionally public).
- The GoatCounter tracking script remains self-hosted at `assets/js/goatcounter-count.js`; it continues to submit pageviews to the GoatCounter `/count` endpoint. The Cloudflare Worker is used for displaying the total, not as a replacement tracker unless its own code is separately configured to receive tracking events.
- The count text and `SITE VISITS` label share the same 10px typography in `assets/css/site.css`.

To test the display endpoint, open the Worker URL directly. It should return only a number. To test browser access, inspect the Console on `https://agamalx0.github.io/`; a CORS error means the Worker needs the CORS response header described above.
