# Adding a technical note

The portfolio is static GitHub Pages HTML. There is no build step.

1. Copy `templates/article-template.html` to `articles/your-note-slug.html`.
2. Update the title, description, canonical URL, topic eyebrow, article title, summary, date and reading time. Keep the shared stylesheet and scripts in the document head.
3. Write the full note inside `article.content`. Add `h2` and `h3` headings; the shared article script generates the table of contents automatically. Code blocks inside `pre`, tables, figures and captions are styled by `assets/css/site.css`.
4. Add one object to the `notes.json` array. Required fields:
   - `title`: card title and navigation title
   - `topic`: visible category label
   - `topicKey`: one of `wazuh`, `dfir-iris`, `qradar-siem`, `qradar-soar`, `splunk`, `automation`, `malware-analysis`
   - `summary`: concise card summary
   - `url`: root-relative article URL, e.g. `/articles/your-note-slug.html`
   - `date`: human-readable publication/update date
   - `dateISO`: ISO date (`YYYY-MM-DD`)
   - `readingTime`: e.g. `6 min read`
5. Keep the canonical `notes.json` order intentional; it drives the homepage/library cards, counts, previous/next links and related-topic strip.
6. Check the new article and `/articles.html` at mobile and desktop widths, then verify all internal links and screenshot paths before merging.

Topic filters and topic colours are in `assets/css/site.css`. The `notes.json` data is shared by the homepage, library and article navigation.
