// Run after editing notes.json or page copy: node scripts/build-site.mjs
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFile(path.join(root,p),'utf8');
const write = (p,s) => writeFile(path.join(root,p),s);
const origin = 'https://agamalx0.github.io';
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode = s => s.replace(/&(amp|lt|gt|quot|#39|#x27);/g,(_,c)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'",'#x27':"'"}[c]));
const notes = JSON.parse(await read('notes.json'));
if(new Set(notes.map(n=>n.url)).size !== notes.length) throw Error('Duplicate note URLs');
for(const n of notes){
  if(!/^\/articles\/[a-z0-9-]+\.html$/.test(n.url) || !/^\d{4}-\d{2}-\d{2}$/.test(n.dateISO)) throw Error('Invalid note URL/date: '+n.title);
  await read(n.url.slice(1));
}
const cards = notes.map(n=>'<a class="card note-card" href="'+esc(n.url)+'" data-topic="'+esc(n.topicKey)+'" aria-label="Open technical note: '+esc(n.title)+'"><span class="note-topic topic-'+esc(n.topicKey)+'">'+esc(n.topic)+'</span><h3>'+esc(n.title)+'</h3><p>'+esc(n.summary)+'</p><div class="note-meta"><time datetime="'+esc(n.dateISO)+'">'+esc(n.date)+'</time><span>'+esc(n.readingTime)+'</span></div></a>').join('\n');
for(const [p,id] of [['index.html','notes-grid'],['articles.html','library-grid']]){
  let html = await read(p);
  const start = new RegExp('(<div id="'+id+'"[^>]*>)[\\s\\S]*?(?=\\n</section>|\\n</main>)');
  if(!start.test(html)) throw Error('Cannot locate grid: '+p);
  html = html.replace(start,(_,opening)=>opening+'\n'+cards+'\n</div>\n<p class="note-empty" data-no-results hidden>No notes match your search. Try another term or topic.</p>');
  html = html.replace(/(<span data-(?:count-label|visible-count)>)[^<]*/g,'$1'+notes.length+' notes').replace(/(<span data-total-count>)[^<]*/g,'$1'+notes.length);
  await write(p,html);
}
const pages = ['index.html','articles.html',...notes.map(n=>n.url.slice(1)),'404.html'];
const versions = new Map();
for(const asset of ['assets/css/site.css','assets/js/site.js','assets/js/article.v4.js','assets/js/terminal-design.v2.js']){
  versions.set('/'+asset,createHash('sha256').update(await read(asset)).digest('hex').slice(0,12));
}
for(const p of [...pages,'templates/article-template.html']){
  let html = await read(p);
  html = html.replace(/(href|src)="(\/assets\/(?:css\/site\.css|js\/(?:site\.js|article\.v4\.js|terminal-design\.v2\.js)))(?:\?[^"]*)?"/g,(_,attr,url)=>attr+'="'+url+'?v='+versions.get(url)+'"');
  if(p.startsWith('templates/')){await write(p,html);continue;}
  html = html.replace(/<!-- BEGIN GENERATED METADATA -->[\s\S]*?<!-- END GENERATED METADATA -->\s*/g,'');
  const title = decode(html.match(/<title>(.*?)<\/title>/s)?.[1] || 'Ashraf Gamal');
  const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || 'SOC engineering and technical notes by Ashraf Gamal.');
  const url = origin+(p==='index.html'?'/':'/'+p), image = origin+'/ashraf-avatar.jpg';
  const note = notes.find(n=>n.url==='/'+p);
  const meta = [
    '<!-- BEGIN GENERATED METADATA -->',
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
    '<meta property="og:type" content="'+(note?'article':'website')+'">',
    '<meta property="og:site_name" content="Ashraf Gamal | SOC Engineering">',
    '<meta property="og:locale" content="en_US">',
    '<meta property="og:title" content="'+esc(title)+'">',
    '<meta property="og:description" content="'+esc(description)+'">',
    '<meta property="og:url" content="'+esc(url)+'">',
    '<meta property="og:image" content="'+image+'">',
    '<meta property="og:image:alt" content="Ashraf Gamal">',
    '<meta name="twitter:card" content="summary">',
    '<meta name="twitter:title" content="'+esc(title)+'">',
    '<meta name="twitter:description" content="'+esc(description)+'">',
    '<meta name="twitter:image" content="'+image+'">',
    '<meta name="twitter:image:alt" content="Ashraf Gamal">'
  ];
  if(note){
    meta.push('<meta property="article:modified_time" content="'+note.dateISO+'">');
    const schema = {'@context':'https://schema.org','@type':'TechArticle',headline:note.title,description,dateModified:note.dateISO,author:{'@type':'Person',name:'Ashraf Gamal',url:origin+'/'},mainEntityOfPage:{'@type':'WebPage','@id':url},image,inLanguage:'en'};
    meta.push('<script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>');
  }
  meta.push('<!-- END GENERATED METADATA -->');
  html = html.replace('</head>',meta.join('\n')+'\n</head>');
  await write(p,html);
}
const urls = [['/',null],['/articles.html',null],...notes.map(n=>[n.url,n.dateISO])];
await write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(([url,date])=>'  <url><loc>'+esc(origin+url)+'</loc>'+(date?'<lastmod>'+date+'</lastmod>':'')+'</url>').join('\n')+'\n</urlset>\n');
console.log('Generated static cards and metadata for '+pages.length+' pages; '+urls.length+' sitemap URLs.');
