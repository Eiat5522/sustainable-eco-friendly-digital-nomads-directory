const fs = require('fs');
const path = require('path');
const root = 'app-next-directory';
const hits = [];
function walk(d){
  for(const f of fs.readdirSync(d,{withFileTypes:true})){
    const p = path.join(d,f.name);
    if(f.isDirectory()){
      if(['node_modules','.next','dist'].includes(f.name)) continue;
      walk(p);
    } else if(/\.(ts|tsx|js|jsx)$/.test(f.name)){
      const s = fs.readFileSync(p,'utf8');
      if(s.includes("/api/test-listings")){
        hits.push(p);
      }
    }
  }
}
walk(root);
console.log(hits.join('\n'));
