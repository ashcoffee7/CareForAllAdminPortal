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
  var { data, error } = await supabase.from('chapter_checkins').select('chapter_name, quarter');
  if (error) { console.error('chapter_checkins fetch failed:', error.message, error.details, error.hint); return []; }
  return data;
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

function buildEnrichedChapters(chapters, profiles, checkins, projectLogs) {
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

  // chapter_checkins.chapter_name is free text, not a foreign key to
  // chapters.id -- matched here by exact name. If real check-in data uses
  // slightly different naming than the chapters table, these won't match.
  var checkinQuartersByChapterName = {};
  checkins.forEach(function (c) {
    var key = (c.chapter_name || '').trim();
    if (!checkinQuartersByChapterName[key]) { checkinQuartersByChapterName[key] = new Set(); }
    checkinQuartersByChapterName[key].add(c.quarter);
  });

  return chapters.map(function (ch) {
    var quartersSubmitted = checkinQuartersByChapterName[ch.name] || new Set();
    var checkinFlags = QUARTERS.map(function (q) { return quartersSubmitted.has(q); });
    var allCheckinsIn = checkinFlags.every(function (v) { return v; });
    var projectCount = projectCountByChapterId[ch.id] || 0;

    return {
      id: ch.id,
      name: ch.name,
      createdAt: ch.created_at,
      lead: leadByChapterId[ch.id] || '-',
      memberCount: memberCountByChapterId[ch.id] || 0,
      projectCount: projectCount,
      checkinFlags: checkinFlags,
      compliant: projectCount >= 2 && allCheckinsIn
    };
  });
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
    ch.checkinFlags.forEach(function (done, i) {
      dots += '<div class="checkin-dot' + (done ? ' done' : '') + '">Q' + (i + 1) + '</div>';
    });

    html += '<div class="chapter-status-row">';
    html += '<div class="leader-name">' + escapeHtml(ch.name) + '</div>';
    html += '<div class="leader-meta">' + escapeHtml(ch.lead) + '</div>';
    html += '<div><span class="project-status-dot ' + projectDotClass + '">' + ch.projectCount + ' / 2</span></div>';
    html += '<div class="checkin-dots">' + dots + '</div>';
    html += '<div><span class="status-pill ' + statusPillClass + '">' + statusText + '</span></div>';
    html += '</div>';
  });

  container.innerHTML = html;
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
  var results = await Promise.all([
    fetchAllChapters(),
    fetchAllProfiles(),
    fetchAllCheckins(),
    fetchProjectLogs()
  ]);

  var enriched = buildEnrichedChapters(results[0], results[1], results[2], results[3]);

  renderStats(enriched);
  renderComplianceList(enriched);
  renderDirectoryList(enriched);
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