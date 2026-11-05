export function summarize(records) {
  const buckets={all:{a:0,b:0,no_preference:0},a:{a:0,b:0,no_preference:0},b:{a:0,b:0,no_preference:0}};
  for(const r of records){if(!Object.hasOwn(buckets.all,r.preference)||!['a','b'].includes(r.firstVariant))continue;buckets.all[r.preference]++;buckets[r.firstVariant][r.preference]++;}
  return buckets;
}
function cell(value){let text=String(value??'');if(/^[\s]*[=+\-@]/.test(text)||/^[\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export function toCsv(records){
  const headings=['submitted_at','participant_id','first_layout','preference','comment','a_accept','a_undo','a_dismiss','a_accept_all','b_accept','b_undo','b_dismiss','b_accept_all'];
  const rows=records.map(r=>[r.submittedAt,r.participantId,r.firstVariant,r.preference,r.reason,...['a','b'].flatMap(v=>['accept','undo','dismiss','acceptAll'].map(k=>r.interactions[v][k]))]);
  return [headings,...rows].map(row=>row.map(cell).join(',')).join('\r\n');
}
