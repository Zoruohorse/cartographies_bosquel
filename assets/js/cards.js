import { loadRepository, esc, norm, actorClaim, evidenceHtml } from './data-loader.js';
const d = await loadRepository();
let cat = 'all', stance = 'all', q = '';
const $ = id => document.getElementById(id);
const title = $('title'), subtitle = $('subtitle'), notice =$('notice'), categories = $('categories'), stances =$('stances'), count = $('count'), grid =$('grid'), detail = $('detail'), dialog =$('dialog'), search = $('search'), reset =$('reset');
title.textContent = d.meta.title; subtitle.textContent = d.meta.subtitle; notice.textContent = d.meta.data_notice;
const stanceColor = s => d.taxonomy.stances[s]?.color || '#64748b';
const hiddenCats = ['project', 'context', 'griefs', 'sources'];
function filters() {
  categories.innerHTML = Object.entries(d.taxonomy.categories).filter(([k]) => !hiddenCats.includes(k)).map(([k, v]) => `<button class="filter ${cat === k ? 'active' : ''}" data-cat="${k}"><span>${esc(v.label)}</span><b>${k === 'all' ? d.actors.filter(a => a.categories && !hiddenCats.includes(a.categories[0])).length : d.actors.filter(a => a.categories && a.categories.includes(k)).length}</b></button>`).join('');
  stances.innerHTML = Object.entries(d.taxonomy.stances).map(([k, v]) => `<button class="filter ${stance === k ? 'active' : ''}" data-stance="${k}"><span>${esc(v.label)}</span><b>${k === 'all' ? d.claims.length : d.claims.filter(c => c.value === k).length}</b></button>`).join('');
}
function render() {
  const list = d.actors.filter(a => a.id !== 'project_bosquel' && a.categories && !hiddenCats.includes(a.categories[0])).filter(a => {
    const c = actorClaim(d, a.id);
    const text = norm([a.name, a.description, c?.summary, ...(c?.evidence_ids || []).map(id => d.evidenceById.get(id)?.text)].join(' '));
    return (cat === 'all' || a.categories.includes(cat)) && (stance === 'all' || c?.value === stance) && (!q || text.includes(q));
  });
  count.textContent = `${list.length} acteurs affichés sur ${d.actors.filter(a => a.categories && !hiddenCats.includes(a.categories[0])).length}`;
  grid.innerHTML = list.map(a => {
    const c = actorClaim(d, a.id);
    return `<article class="card" data-id="${a.id}" style="--stance:${stanceColor(c?.value)}"><h3>${esc(a.name)}</h3><div class="role">${esc(a.description)}</div><p class="position">${esc(c?.summary || 'Position non renseignée')}</p><div class="footer"><span class="badge">${esc(d.taxonomy.stances[c?.value]?.label || 'Non qualifié')}</span><span>Certitude : ${esc(d.taxonomy.certainty_levels[c?.certainty]?.label || 'Non qualifiée')}</span></div></article>`;
  }).join('');
}
function open(id) {
  const a = d.actorById.get(id), c = actorClaim(d, id), rel = d.relations.filter(r => r.source_id === id || r.target_id === id);
  detail.innerHTML = `<h2>${esc(a.name)}</h2><p class="role">${esc(a.description)}</p><h3>Position</h3><p>${esc(c?.summary || 'Non renseignée')}</p><p><b>Certitude :</b> ${esc(d.taxonomy.certainty_levels[c?.certainty]?.label || 'Non qualifiée')}</p><h3>Preuves et sources</h3>${evidenceHtml(d, c?.evidence_ids)}<h3>Relations documentables</h3>${rel.length ? rel.map(r => {
    const other = d.actorById.get(r.source_id === id ? r.target_id : r.source_id);
    return `<div class="relation"><button data-open="${other?.id}">${esc(other?.name || 'Acteur inconnu')}</button><div><b>${esc(d.taxonomy.relation_types[r.type]?.label \vert{}\vert{} r.type)}</b></div><p>${esc(r.summary)}</p><small>Certitude : ${esc(d.taxonomy.certainty_levels[r.certainty]?.label \vert{}\vert{} r.certainty)} ·${(r.evidence_ids || []).length} preuve(s)</small></div>`;
  }).join('') : '<p class="muted">Aucune relation.</p>'}`;
  dialog.showModal();
}
document.addEventListener('click', e => {
  const c = e.target.closest('[data-cat]'), s = e.target.closest('[data-stance]'), card = e.target.closest('.card'), op = e.target.closest('[data-open]'), closeBtn = e.target.closest('.close');
  if (c) { cat = c.dataset.cat; filters(); render(); }
  if (s) { stance = s.dataset.stance; filters(); render(); }
  if (card && !e.target.closest('button')) open(card.dataset.id);
  if (op) open(op.dataset.open);
  if (closeBtn) dialog.close();
});
search.addEventListener('input', e => { q = norm(e.target.value); render(); });
reset.onclick = () => { cat = 'all'; stance = 'all'; q = ''; search.value = ''; filters(); render(); };
filters(); render();
