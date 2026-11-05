import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
process.env.LOCAL_FEEDBACK ||= 'true';
process.env.RESULTS_PASSWORD ||= 'local-study-results-password';
const {default:feedback}=await import('../api/feedback.js');
const {default:results}=await import('../api/results.js');
const root=resolve('public'), port=Number(process.env.PORT||4174);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
createServer(async(req,res)=>{
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  if(url.pathname==='/api/feedback'||url.pathname==='/api/results'){
    try{const request=new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:req,duplex:'half'})});const result=await (url.pathname==='/api/feedback'?feedback:results).fetch(request);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));}catch{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Local request failed.'}));}return;
  }
  try{const pathname=decodeURIComponent(url.pathname);const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+'/'))throw new Error('Invalid path');const contents=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(contents);}catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Study preview: http://127.0.0.1:${port}\nResults: /results.html (local-only password documented in README)`));
