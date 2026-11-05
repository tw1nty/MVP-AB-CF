import { timingSafeEqual, createHash } from 'node:crypto';
import { createStore } from '../lib/store.js';
import { json, checkOrigin, RequestError } from '../lib/validation.js';
const digest = input => createHash('sha256').update(input).digest();
export function createResultsHandler(store=createStore(),password=process.env.RESULTS_PASSWORD) {
  return async request=>{
    if(request.method!=='GET')return json({error:'Use GET.'},405);
    if(!password||password.length<24)return json({error:'Set a results password of at least 24 characters before opening results.'},503);
    const provided=request.headers.get('authorization')||'';
    if(!timingSafeEqual(digest(provided),digest(`Bearer ${password}`)))return json({error:'The results password is incorrect.'},401);
    try {
      checkOrigin(request);
      if(!store.configured)return json({error:'Connect a private Blob store to view responses.'},503);
      const cursor=new URL(request.url).searchParams.get('cursor');
      if(cursor&&cursor.length>2048)return json({error:'Invalid cursor.'},400);
      return json(await store.page(cursor));
    }catch(error){if(error instanceof RequestError)return json({error:error.message},error.status);console.error('Results read failed:',error.name);return json({error:'Could not load all requested responses. Please try again.'},503);}
  };
}
export default { fetch(request) { return createResultsHandler()(request); } };
