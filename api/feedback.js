import { createStore } from '../lib/store.js';
import { validateFeedback, readJson, checkOrigin, json, RequestError } from '../lib/validation.js';
export function createFeedbackHandler(store=createStore()) {
  return async request => {
    if(request.method!=='POST')return json({error:'Use POST.'},405);
    try {
      checkOrigin(request);
      const response=validateFeedback(await readJson(request));
      if(!store.configured)return json({error:'Feedback collection is not connected yet. Your answers are still here; please try again later.'},503);
      const record={...response,submittedAt:new Date().toISOString()};
      const saved=await store.save(record);
      return json({ok:true,duplicate:saved.duplicate,preference:saved.record.preference,reason:saved.record.reason},saved.duplicate?200:201);
    }catch(error){if(error instanceof RequestError)return json({error:error.message},error.status);console.error('Feedback storage failed:',error.name);return json({error:'Could not save your feedback. Please try again; it will not be counted twice.'},503);}
  };
}
export default { fetch(request) { return createFeedbackHandler()(request); } };
