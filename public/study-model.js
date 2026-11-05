export const STUDY_ID = 'pathway-layout-preference-v1';
export const STORAGE_KEY = `classfindr:${STUDY_ID}`;
const variants = ['a', 'b'];
export function createParticipant(random = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) {
  const firstVariant = random < 0.5 ? 'a' : 'b';
  return { studyId: STUDY_ID, participantId: crypto.randomUUID(), firstVariant, currentVariant: firstVariant,
    explored: { a: false, b: false }, submitted: false,
    interactions: { a: { accept: 0, undo: 0, dismiss: 0, acceptAll: 0 }, b: { accept: 0, undo: 0, dismiss: 0, acceptAll: 0 } } };
}
export function validParticipant(p) {
  return p?.studyId === STUDY_ID && /^[a-f0-9-]{36}$/.test(p.participantId) &&
    variants.includes(p.firstVariant) && variants.includes(p.currentVariant) &&
    variants.every(v => typeof p.explored?.[v] === 'boolean' && ['accept','undo','dismiss','acceptAll'].every(k => Number.isInteger(p.interactions?.[v]?.[k]) && p.interactions[v][k] >= 0 && p.interactions[v][k] <= 10000)) && typeof p.submitted === 'boolean' && (!p.submitted || (['a','b','no_preference'].includes(p.preference) && typeof p.reason === 'string' && p.reason.length <= 1500));
}
export function readyForFeedback(p) { return p.explored.a && p.explored.b; }
