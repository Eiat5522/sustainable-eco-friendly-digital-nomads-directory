const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2] || 'app-next-directory');
if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(`Root not found or not a directory: ${root}`);
  process.exit(1);
}
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
