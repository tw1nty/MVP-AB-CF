import { STUDY_ID, STORAGE_KEY, createParticipant, validParticipant, readyForFeedback } from './study-model.js';
const params = new URLSearchParams(location.search);
let saved;
try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { /* A blocked store still permits this visit. */ }
export const study = validParticipant(saved) ? saved : createParticipant();
study.preview = params.get('preview') === '1';
if (study.preview) study.currentVariant = params.get('version') === 'b' ? 'b' : 'a';
function persist() { if (!study.preview) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(study)); } catch { /* Session remains usable. */ } } }
export function recordInteraction(version, action) {
  if (!study.preview && !study.submitted && Object.hasOwn(study.interactions[version], action)) {
    study.interactions[version][action] = Math.min(10000, study.interactions[version][action] + 1); persist();
  }
}
export function attachStudy({switchVersion, explore}) {
  if (study.preview) return;
  persist();
  const $ = s => document.querySelector(s);
  $('#preview-toolbar').hidden = true; $('#study-intro').hidden = false; $('#study-dock').hidden = false;
  document.body.classList.add('in-study');
  $('#study-order').textContent = `YOUR ORDER: ${study.firstVariant.toUpperCase()} → ${study.firstVariant === 'a' ? 'B' : 'A'}`;
  const status = $('#feedback-status');
  function renderProgress() {
    const v = study.currentVariant;
    $('#study-current').textContent = `You’re exploring Layout ${v.toUpperCase()}`;
    const count = Number(study.explored.a) + Number(study.explored.b);
    $('#study-progress').textContent = study.submitted ? 'Feedback received. Thank you.' : `${count} of 2 layouts explored`;
    $('#feedback-section').hidden = !readyForFeedback(study);
    $('#revisit-layout').hidden = count < 2;
    $('#revisit-layout').textContent = `Revisit Layout ${v === 'a' ? 'B' : 'A'}`;
    $('#study-next').textContent = !study.explored[v] ? `Explore Layout ${v.toUpperCase()}` : !readyForFeedback(study) ? `Compare Layout ${v === 'a' ? 'B' : 'A'}` : study.submitted ? 'View your response' : 'Share your preference';
    if (study.submitted) {
      $('#feedback-form').querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
      if(study.preference) $(`input[value="${study.preference}"]`).checked = true;
      $('#feedback-reason').value = study.reason || '';
      status.textContent = 'Thanks! Your preference has been recorded.';
    }
  }
  function changeLayout() {
    study.currentVariant = study.currentVariant === 'a' ? 'b' : 'a';
    persist(); switchVersion(study.currentVariant); renderProgress(); explore();
    observer.unobserve($('#course-swaps-title')); observer.observe($('#course-swaps-title'));
  }
  const observer = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { study.explored[study.currentVariant] = true; persist(); renderProgress(); }
  }, { threshold: 0.5 });
  observer.observe($('#course-swaps-title'));
  $('#study-next').onclick = () => {
    if (!study.explored[study.currentVariant]) explore();
    else if (!readyForFeedback(study)) changeLayout();
    else { $('#feedback-heading').focus({preventScroll:true}); $('#feedback-section').scrollIntoView({block:'start',behavior:'instant'}); }
  };
  $('#revisit-layout').onclick = changeLayout;
  $('#feedback-form').onsubmit = async event => {
    event.preventDefault();
    if (!readyForFeedback(study) || study.submitted) return;
    const form = new FormData(event.currentTarget);
    const preference = form.get('preference');
    const reason = String(form.get('reason') || '').trim();
    const payload = { studyId: STUDY_ID, participantId: study.participantId, firstVariant: study.firstVariant,
      explored: study.explored, preference, reason, interactions: study.interactions };
    $('#submit-feedback').disabled = true; status.textContent = 'Sending your feedback…';
    try {
      const response = await fetch('/api/feedback', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not send feedback. Please try again.');
      study.submitted = true; study.preference = result.preference || preference; study.reason = result.reason ?? reason; persist(); renderProgress();
    } catch (error) {
      status.textContent = error.name === 'TimeoutError' ? 'The request timed out. Please try again; your response will not be counted twice.' : error.message;
      $('#submit-feedback').disabled = false;
    }
  };
  renderProgress();
}
