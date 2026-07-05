import { supabase } from './supabase.js';
import { MEMBER_ROLES } from './roles.js';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function formatDate(iso) {
  if (!iso) { return '—'; }
  var d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderDemoBars(containerId, entries) {
  var container = document.getElementById(containerId);
  if (!container) { return; }

  if (entries.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:16px 0;color:var(--muted);font-size:13px">No data yet.</div>';
    return;
  }

  var maxCount = Math.max.apply(null, entries.map(function (e) { return e.count; }));
  var html = '';
  entries.forEach(function (e, i) {
    var widthPct = maxCount > 0 ? Math.round((e.count / maxCount) * 100) : 0;
    var isLast = i === entries.length - 1;
    html += '<div class="demo-bar-row"' + (isLast ? ' style="margin-bottom:0"' : '') + '>';
    html += '<div class="demo-bar-label">' + escapeHtml(e.label) + '</div>';
    html += '<div class="demo-bar-track"><div class="demo-bar-fill" style="width:' + widthPct + '%"></div></div>';
    html += '<div class="demo-bar-pct">' + e.display + '</div>';
    html += '</div>';
  });
  container.innerHTML = html;
}

function ageFromDob(dobStr) {
  var dob = new Date(dobStr);
  var today = new Date();
  var age = today.getFullYear() - dob.getFullYear();
  var hasHadBirthdayThisYear = (today.getMonth() > dob.getMonth()) ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) { age--; }
  return age;
}

function ageBucket(age) {
  if (age <= 14) { return '13-14'; }
  if (age <= 16) { return '15-16'; }
  if (age <= 18) { return '17-18'; }
  return '19+';
}

var lastLoadedMembers = [];

export async function loadMembersPage() {
  var { count: chapterCount, error: chapterErr } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true });
  if (chapterErr) { console.error('chapters count failed:', chapterErr.message, chapterErr.details, chapterErr.hint); }

  var { data: members, error: membersErr } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, gender, education_level, date_of_birth, chapter_id, created_at, chapters:chapter_id ( name )')
    .in('role', MEMBER_ROLES);

  if (membersErr) {
    console.error('members fetch failed:', membersErr.message, membersErr.details, membersErr.hint);
    return;
  }

  lastLoadedMembers = members;

  var totalEl = document.getElementById('members-page-total');
  var totalChaptersEl = document.getElementById('members-page-total-chapters');
  if (totalEl) { totalEl.textContent = members.length; }
  if (totalChaptersEl && chapterCount != null) { totalChaptersEl.textContent = chapterCount; }

  renderGenderDistribution(members);
  renderEducationDistribution(members);
  renderAgeDistribution(members);
  renderMembersList(members);
}

function renderGenderDistribution(members) {
  var tally = { Male: 0, Female: 0, Nonbinary: 0, Undisclosed: 0 };
  members.forEach(function (m) {
    var key = m.gender && tally.hasOwnProperty(m.gender) ? m.gender : 'Undisclosed';
    tally[key]++;
  });

  var total = members.length;
  var entries = Object.keys(tally).map(function (label) {
    var count = tally[label];
    var pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return { label: label, count: count, display: pct + '% (' + count + ')' };
  }).sort(function (a, b) { return b.count - a.count; });

  renderDemoBars('gender-distribution-bars', entries);
}

function renderEducationDistribution(members) {
  var tally = {};
  members.forEach(function (m) {
    var key = m.education_level || 'Not specified';
    tally[key] = (tally[key] || 0) + 1;
  });

  var total = members.length;
  var entries = Object.keys(tally).map(function (label) {
    var count = tally[label];
    var pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return { label: label, count: count, display: pct + '% (' + count + ')' };
  }).sort(function (a, b) { return b.count - a.count; });

  renderDemoBars('education-distribution-bars', entries);
}

function renderAgeDistribution(members) {
  var withDob = members.filter(function (m) { return !!m.date_of_birth; });
  var buckets = { '13-14': 0, '15-16': 0, '17-18': 0, '19+': 0 };

  withDob.forEach(function (m) {
    var age = ageFromDob(m.date_of_birth);
    var bucket = ageBucket(age);
    buckets[bucket]++;
  });

  var entries = ['13-14', '15-16', '17-18', '19+'].map(function (label) {
    var count = buckets[label];
    var pct = withDob.length > 0 ? Math.round((count / withDob.length) * 100) : 0;
    return { label: label, count: count, display: pct + '% (' + count + ')' };
  });

  renderDemoBars('age-distribution-bars', entries);

  var container = document.getElementById('age-distribution-bars');
  if (container) {
    var note = document.createElement('div');
    note.style.cssText = 'font-size:11px;color:var(--muted);margin-top:8px';
    note.textContent = 'Based on ' + withDob.length + ' of ' + members.length + ' members with a birthdate on file.';
    container.appendChild(note);
  }
}

function renderMembersList(members) {
  var container = document.getElementById('members-list-rows');
  if (!container) { return; }

  var sorted = members.slice().sort(function (a, b) {
    var nameA = ((a.first_name || '') + ' ' + (a.last_name || '')).trim().toLowerCase();
    var nameB = ((b.first_name || '') + ' ' + (b.last_name || '')).trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  var html = '';
  sorted.forEach(function (m) {
    var name = ((m.first_name || '') + ' ' + (m.last_name || '')).trim() || 'Unknown';
    var chapter = (m.chapters && m.chapters.name) || '-';
    html += '<div class="approval-row clickable-row" style="grid-template-columns:2fr 1.5fr 1.5fr" data-member-name="' + escapeHtml(name.toLowerCase()) + '">';
    html += '<div class="leader-name">' + escapeHtml(name) + '</div>';
    html += '<div class="leader-meta">' + escapeHtml(chapter) + '</div>';
    html += '<div class="leader-meta">' + formatDate(m.created_at) + '</div>';
    html += '</div>';
  });

  container.innerHTML = html;
  filterMembersList();
}

export function filterMembersList() {
  var input = document.getElementById('members-list-search-input');
  if (!input) { return; }
  var query = input.value.trim().toLowerCase();
  var rows = document.querySelectorAll('#members-list-rows [data-member-name]');
  var visibleCount = 0;
  rows.forEach(function (row) {
    var matches = row.getAttribute('data-member-name').indexOf(query) !== -1;
    row.style.display = matches ? '' : 'none';
    if (matches) { visibleCount++; }
  });
  var noResultsEl = document.getElementById('members-list-no-results');
  if (noResultsEl) { noResultsEl.style.display = visibleCount === 0 ? 'block' : 'none'; }
}