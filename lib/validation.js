export const STUDY_ID = 'pathway-layout-preference-v1';
export class RequestError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const variant = value => value === 'a' || value === 'b';
export function validateFeedback(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RequestError('Please send a valid response.');
  if (body.studyId !== STUDY_ID) throw new RequestError('This study has changed. Please reload and try again.');
  if (typeof body.participantId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.participantId)) throw new RequestError('Invalid participant identifier.');
  if (!variant(body.firstVariant) || !['a','b','no_preference'].includes(body.preference)) throw new RequestError('Choose Layout A, Layout B, or no preference.');
  if (body.explored?.a !== true || body.explored?.b !== true) throw new RequestError('Explore both layouts before sending your preference.');
  if (typeof body.reason !== 'string' || body.reason.length > 1500) throw new RequestError('Keep your comment under 1,500 characters.');
  const interactions = {};
  for (const v of ['a','b']) {
    interactions[v] = {};
    for (const event of ['accept','undo','dismiss','acceptAll']) {
      const value = body.interactions?.[v]?.[event];
      if (!Number.isInteger(value) || value < 0 || value > 10000) throw new RequestError('Invalid interaction count.');
      interactions[v][event] = value;
    }
  }
  return { studyId: STUDY_ID, participantId: body.participantId.toLowerCase(), firstVariant: body.firstVariant,
    explored: { a: true, b: true }, preference: body.preference, reason: body.reason.trim(), interactions };
}
export async function readJson(request, limit = 12000) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new RequestError('Send JSON content.', 415);
  if (Number(request.headers.get('content-length')) > limit) throw new RequestError('Response is too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError('A response is required.');
  const chunks=[]; let total=0;
  while(true) {const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>limit){await reader.cancel();throw new RequestError('Response is too large.',413);}chunks.push(value);}
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new RequestError('Invalid JSON.'); }
}
export function checkOrigin(request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new RequestError('This request must come from the study page.',403);
}
export function json(data, status=200) { return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}); }
