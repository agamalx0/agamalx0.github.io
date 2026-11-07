// Dependency-free checks for generated content and metadata consistency.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFile(path.join(root,p),'utf8');
const notes=JSON.parse(await read('notes.json'));
for(const p of ['index.html','articles.html']){
  const html=await read(p);
  assert.equal((html.match(/class="card note-card"/g)||[]).length,notes.length,p+' static cards');
  for(const note of notes) assert(html.includes('href="'+note.url+'"'),p+' missing note '+note.url);
  assert(!html.includes('Loading technical notes'),p+' loading placeholder');
}
const sitemap=await read('sitemap.xml');
assert.equal((sitemap.match(/<url>/g)||[]).length,notes.length+2);
for(const note of notes){
  const html=await read(note.url.slice(1));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema.headline,note.title);
  assert.equal(schema.dateModified,note.dateISO);
  assert.equal(schema.mainEntityOfPage['@id'],'https://agamalx0.github.io'+note.url);
  assert.match(html,/<meta property="og:type" content="article">/);
  assert.match(html,/<meta name="twitter:card" content="summary">/);
  assert.match(html,/<link rel="icon"/);
  assert(!/wa\.me|WhatsApp/.test(html),'WhatsApp in '+note.url);
  assert(sitemap.includes('<loc>https://agamalx0.github.io'+note.url+'</loc>'));
}
assert(!(sitemap.includes('/404.html')||sitemap.includes('/templates/')));
assert.match(await read('404.html'),/name="robots" content="noindex,follow"/);
assert.match(await read('robots.txt'),/Sitemap: https:\/\/agamalx0.github.io\/sitemap.xml/);
console.log('Static cards, 25 article schemas/social tags, sitemap, favicon links, robots and 404 passed.');
