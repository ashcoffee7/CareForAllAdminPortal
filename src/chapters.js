import { supabase } from './supabase.js';

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

// Assumed quarter label format ('Q1'..'Q4') -- chapter_checkins is currently
// empty in this database, so this is unverified against real values. Adjust
// this list if real check-in data turns out to use a different format.
var QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

async function fetchAllChapters() {
  var { data, error } = await supabase.from('chapters').select('id, name, created_at').order('name');
  if (error) { console.error('chapters fetch failed:', error.message, error.details, error.hint); return []; }
  return data;
}

async function fetchAllProfiles() {
  var { data, error } = await supabase.from('profiles').select('id, first_name, last_name, chapter_id, role');
  if (error) { console.error('profiles fetch failed:', error.message, error.details, error.hint); return []; }
  return data;
}

async function fetchAllCheckins() {
  var { data, error } = await supabase
    .from('chapter_checkins')
    .select('id, chapter_name, quarter, activities, member_count, challenges, submitted_at')
    .order('submitted_at', { ascending: false });
  if (error) { console.error('chapter_checkins fetch failed:', error.message, error.details, error.hint); return []; }
  return data;
}

async function fetchDeadlines(year) {
  var { data, error } = await supabase
    .from('checkin_deadlines')
    .select('year, q1, q2, q3, q4')
    .eq('year', year)
    .maybeSingle();
  if (error) { console.error('checkin_deadlines fetch failed:', error.message, error.details, error.hint); return {}; }
  return data || {};
}

// "Projects (2+/yr)" has no dedicated table. This derives a per-chapter
// project count from approved service_logs whose activity_type looks like
// a project, joined through profiles.chapter_id (service_logs has no
// direct link to chapters or profiles -- see the join notes in
// overview.js/approvals.js for why this has to happen in JS).
async function fetchProjectLogs() {
  var { data, error } = await supabase
    .from('service_logs')
    .select('user_id, activity_type')
    .eq('status', 'approved')
    .ilike('activity_type', '%project%');
  if (error) { console.error('service_logs (projects) fetch failed:', error.message, error.details, error.hint); return []; }
  return data;
}

function buildEnrichedChapters(chapters, profiles, checkins, projectLogs, deadlines, currentYear) {
  var memberCountByChapterId = {};
  var leadByChapterId = {};
  profiles.forEach(function (p) {
    if (!p.chapter_id) { return; }
    memberCountByChapterId[p.chapter_id] = (memberCountByChapterId[p.chapter_id] || 0) + 1;
    if (p.role === 'chapter_lead' && !leadByChapterId[p.chapter_id]) {
      leadByChapterId[p.chapter_id] = ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || '-';
    }
  });

  var profileById = {};
  profiles.forEach(function (p) { profileById[p.id] = p; });

  var projectCountByChapterId = {};
  projectLogs.forEach(function (log) {
    var p = log.user_id ? profileById[log.user_id] : null;
    if (p && p.chapter_id) {
      projectCountByChapterId[p.chapter_id] = (projectCountByChapterId[p.chapter_id] || 0) + 1;
    }
  });

  var dueDateByQuarter = { Q1: deadlines.q1, Q2: deadlines.q2, Q3: deadlines.q3, Q4: deadlines.q4 };

  // chapter_checkins.chapter_name is free text, not a foreign key to
  // chapters.id -- matched here by exact name. If real check-in data uses
  // slightly different naming than the chapters table, these won't match.
  // chapter_checkins also has no year column, so the year a check-in
  // "counts for" is derived from submitted_at -- a reasonable proxy, but
  // not exact (e.g. a late Q4 check-in submitted in January would be
  // attributed to the wrong year).
  var checkinsByChapterName = {};
  checkins.forEach(function (c) {
    var key = (c.chapter_name || '').trim();
    if (!checkinsByChapterName[key]) { checkinsByChapterName[key] = []; }
    checkinsByChapterName[key].push(c);
  });

  var today = new Date();

  return chapters.map(function (ch) {
    var chapterCheckins = checkinsByChapterName[ch.name] || [];

    var quarterStatuses = QUARTERS.map(function (q) {
      var submitted = chapterCheckins.find(function (c) {
        return c.quarter === q && new Date(c.submitted_at).getFullYear() === currentYear;
      });
      if (submitted) { return 'done'; }

      var dueDate = dueDateByQuarter[q];
      if (dueDate && new Date(dueDate) < today) { return 'overdue'; }
      return 'pending';
    });

    var allCheckinsIn = quarterStatuses.every(function (s) { return s === 'done'; });
    var projectCount = projectCountByChapterId[ch.id] || 0;

    return {
      id: ch.id,
      name: ch.name,
      createdAt: ch.created_at,
      lead: leadByChapterId[ch.id] || '-',
      memberCount: memberCountByChapterId[ch.id] || 0,
      projectCount: projectCount,
      quarterStatuses: quarterStatuses,
      checkins: chapterCheckins,
      compliant: projectCount >= 2 && allCheckinsIn
    };
  });
}

function renderDeadlinesForm(deadlines, year) {
  var container = document.getElementById('checkin-deadlines-form');
  if (!container) { return; }

  var dueDateByQuarter = { Q1: deadlines.q1, Q2: deadlines.q2, Q3: deadlines.q3, Q4: deadlines.q4 };

  var html = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">';
  QUARTERS.forEach(function (q) {
    html += '<div>';
    html += '<label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px">' + q + ' ' + year + '</label>';
    html += '<input type="date" class="form-input" data-deadline-quarter="' + q + '" value="' + (dueDateByQuarter[q] || '') + '">';
    html += '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
}

async function saveDeadlines(year) {
  var inputs = document.querySelectorAll('#checkin-deadlines-form [data-deadline-quarter]');
  var row = { year: year, updated_at: new Date().toISOString() };
  inputs.forEach(function (input) {
    var quarterKey = input.getAttribute('data-deadline-quarter').toLowerCase();
    row[quarterKey] = input.value || null;
  });

  var { error } = await supabase
    .from('checkin_deadlines')
    .upsert([row], { onConflict: 'year' });

  var statusEl = document.getElementById('checkin-deadlines-save-status');
  if (error) {
    console.error('checkin_deadlines save failed:', error.message, error.details, error.hint);
    if (statusEl) { statusEl.style.color = 'var(--accent)'; statusEl.textContent = 'Could not save: ' + error.message; }
    return;
  }

  if (statusEl) {
    statusEl.style.color = 'var(--success)';
    statusEl.textContent = 'Saved.';
    setTimeout(function () { statusEl.textContent = ''; }, 3000);
  }

  loadChaptersPage();
}

function renderStats(enriched) {
  var totalEl = document.getElementById('chapters-page-total');
  var compliantEl = document.getElementById('chapters-page-compliant');
  var noncompliantEl = document.getElementById('chapters-page-noncompliant');

  var compliantCount = enriched.filter(function (c) { return c.compliant; }).length;

  if (totalEl) { totalEl.textContent = enriched.length; }
  if (compliantEl) { compliantEl.textContent = compliantCount; }
  if (noncompliantEl) { noncompliantEl.textContent = enriched.length - compliantCount; }
}

function renderComplianceList(enriched) {
  var container = document.getElementById('chapter-compliance-list');
  if (!container) { return; }

  var sorted = enriched.slice().sort(function (a, b) {
    return (a.compliant ? 1 : 0) - (b.compliant ? 1 : 0);
  });

  var html = '';
  sorted.forEach(function (ch) {
    var projectDotClass = ch.projectCount >= 2 ? 'met' : 'unmet';
    var statusPillClass = ch.compliant ? 'pill-compliant' : 'pill-noncompliant';
    var statusText = ch.compliant ? 'Compliant' : 'Non-Compliant';

    var dots = '';
    ch.quarterStatuses.forEach(function (status, i) {
      var stateClass = status === 'done' ? ' done' : (status === 'overdue' ? ' overdue' : '');
      var title = status === 'done' ? 'Submitted' : (status === 'overdue' ? 'Overdue' : 'Not yet due');
      dots += '<div class="checkin-dot' + stateClass + '" title="' + title + '">Q' + (i + 1) + '</div>';
    });

    html += '<div class="chapter-status-row">';
    html += '<div class="leader-name">' + escapeHtml(ch.name) + '</div>';
    html += '<div class="leader-meta">' + escapeHtml(ch.lead) + '</div>';
    html += '<div><span class="project-status-dot ' + projectDotClass + '">' + ch.projectCount + ' / 2</span></div>';
    html += '<div class="checkin-dots clickable" data-view-responses="' + ch.id + '">' + dots + '</div>';
    html += '<div><span class="status-pill ' + statusPillClass + '">' + statusText + '</span></div>';
    html += '</div>';
  });

  container.innerHTML = html;

  container.querySelectorAll('[data-view-responses]').forEach(function (el) {
    el.addEventListener('click', function () {
      var chapter = enriched.find(function (c) { return c.id === el.getAttribute('data-view-responses'); });
      if (chapter) { openResponsesModal(chapter); }
    });
  });
}

function openResponsesModal(chapter) {
  var titleEl = document.getElementById('modal-title');
  var subtitleEl = document.getElementById('modal-subtitle');
  var bodyEl = document.getElementById('modal-body-content');
  var overlay = document.getElementById('detail-modal-overlay');
  if (!titleEl || !subtitleEl || !bodyEl || !overlay) { return; }

  titleEl.textContent = 'Quarterly Check-In Responses';
  subtitleEl.textContent = chapter.name;

  var body = '';
  if (chapter.checkins.length === 0) {
    body = '<div style="text-align:center;padding:20px 0;color:var(--muted);font-size:13px">No check-ins submitted yet.</div>';
  } else {
    chapter.checkins.forEach(function (c) {
      body += '<div class="modal-field-row">';
      body += '<div class="modal-field-label">' + escapeHtml(c.quarter || '-') + ' &mdash; Submitted ' + formatDate(c.submitted_at) + '</div>';
      body += '<div class="modal-field-value" style="font-weight:400;margin-top:6px">';
      body += '<strong>Member Count:</strong> ' + (c.member_count != null ? c.member_count : '-') + '<br>';
      body += '<strong>Activities:</strong> ' + escapeHtml(c.activities || '-') + '<br>';
      body += '<strong>Challenges:</strong> ' + escapeHtml(c.challenges || '-');
      body += '</div>';
      body += '</div>';
    });
  }

  bodyEl.innerHTML = body;
  overlay.classList.add('open');
}

function renderDirectoryList(enriched) {
  var container = document.getElementById('chapter-directory-list');
  if (!container) { return; }

  var sorted = enriched.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });

  var html = '';
  sorted.forEach(function (ch) {
    html += '<div class="chapter-status-row" style="grid-template-columns:1.7fr 1fr 0.9fr 0.7fr 1.6fr 1.2fr" data-chapter-name="' + escapeHtml(ch.name.toLowerCase()) + '">';
    html += '<div class="leader-name">' + escapeHtml(ch.name) + '</div>';
    html += '<div class="leader-meta">&mdash;</div>';
    html += '<div class="leader-meta">' + escapeHtml(ch.lead) + '</div>';
    html += '<div class="leader-meta">' + ch.memberCount + '</div>';
    html += '<div class="leader-meta">&mdash;</div>';
    html += '<div class="leader-meta">' + formatDate(ch.createdAt) + '</div>';
    html += '</div>';
  });

  container.innerHTML = html;
}

export async function loadChaptersPage() {
  var currentYear = new Date().getFullYear();

  var results = await Promise.all([
    fetchAllChapters(),
    fetchAllProfiles(),
    fetchAllCheckins(),
    fetchProjectLogs(),
    fetchDeadlines(currentYear)
  ]);

  var deadlines = results[4];
  var enriched = buildEnrichedChapters(results[0], results[1], results[2], results[3], deadlines, currentYear);

  renderStats(enriched);
  renderDeadlinesForm(deadlines, currentYear);
  renderComplianceList(enriched);
  renderDirectoryList(enriched);

  var saveBtn = document.getElementById('save-checkin-deadlines-btn');
  if (saveBtn) {
    saveBtn.onclick = function () { saveDeadlines(currentYear); };
  }
}

export function filterChapterDirectory() {
  var input = document.getElementById('chapter-directory-search-input');
  if (!input) { return; }
  var query = input.value.trim().toLowerCase();
  var rows = document.querySelectorAll('#chapter-directory-list [data-chapter-name]');
  var visibleCount = 0;
  rows.forEach(function (row) {
    var matches = row.getAttribute('data-chapter-name').indexOf(query) !== -1;
    row.style.display = matches ? '' : 'none';
    if (matches) { visibleCount++; }
  });
  var noResultsEl = document.getElementById('chapter-directory-no-results');
  if (noResultsEl) { noResultsEl.style.display = visibleCount === 0 ? 'block' : 'none'; }
}