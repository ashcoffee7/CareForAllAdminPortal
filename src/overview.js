import { supabase } from './supabase.js';
import { buildSimpleLineChartSVG, buildPieChartSVG, monthNames, availableYears } from './charts.js';
import { MEMBER_ROLES } from './roles.js';

var overviewChartRange = "month";
var overviewSelectedMonthIndex = null; // resolved on first render from actual data
var overviewSelectedYear = new Date().getFullYear();
var activityTypeColors = { Projects: '#245ec2', Mapping: '#ff5961', Mapathons: '#10b981', Mentorship: '#f59e0b', 'Impact Hours': '#7db9ff' };

// Partners aren't in the schema yet (no `partners` table) — kept as a static
// stand-in for the "Chapters & Partners" leaderboard until that table exists.
var staticPartners = [
  { name: 'Healara Inc.', type: 'Partner', hours: 210 }
];

/* ---------- Stats cards ---------- */
export async function loadOverviewStats() {
  var { count: chapterCount, error: chapterErr } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true });

  var { count: memberCount, error: memberErr } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', MEMBER_ROLES);

  if (chapterErr) { console.error('chapters count failed:', chapterErr.message, chapterErr.details, chapterErr.hint); }
  if (memberErr) { console.error('profiles count failed:', memberErr.message, memberErr.details, memberErr.hint); }

  var chapterEl = document.getElementById('stat-total-chapters');
  var memberEl = document.getElementById('stat-total-members');
  if (chapterEl) { chapterEl.textContent = chapterCount != null ? chapterCount : '—'; }
  if (memberEl) { memberEl.textContent = memberCount != null ? memberCount : '—'; }

  // New members in the last 30 days, for the stat-sub line
  var thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  var { count: newMemberCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', MEMBER_ROLES)
    .gte('created_at', thirtyDaysAgo);

  var newMembersEl = document.getElementById('stat-new-members');
  if (newMembersEl && newMemberCount != null) {
    newMembersEl.textContent = '+' + newMemberCount + ' new members in last 30 days';
  }
}

/* ---------- Completed Activity Trend ---------- */
async function fetchApprovedLogsForYear(year) {
  var start = year + '-01-01';
  var end = (year + 1) + '-01-01';
  var { data, error } = await supabase
    .from('service_logs')
    .select('submitted_at, activity_type')
    .eq('status', 'approved')
    .gte('submitted_at', start)
    .lt('submitted_at', end);

  if (error) { console.error(error); return []; }
  return data;
}

function monthlyCountsFromLogs(logs) {
  var counts = new Array(12).fill(0);
  logs.forEach(function (row) {
    var m = new Date(row.submitted_at).getMonth();
    counts[m]++;
  });
  return counts;
}

function weeklyBreakdownForMonth(logs, monthIdx) {
  var weekly = [0, 0, 0, 0];
  logs.forEach(function (row) {
    var d = new Date(row.submitted_at);
    if (d.getMonth() !== monthIdx) { return; }
    var week = Math.min(3, Math.floor((d.getDate() - 1) / 7));
    weekly[week]++;
  });
  // running total across weeks, to match the original chart's cumulative-in-month feel
  var running = 0;
  return weekly.map(function (v) { running += v; return running; });
}

function populateOverviewPeriodSelector() {
  var sel = document.getElementById("overview-period-selector");
  if (!sel) { return; }
  var html = "";
  if (overviewChartRange === "month") {
    for (var i = 0; i < monthNames.length; i++) {
      var selectedAttr = i === overviewSelectedMonthIndex ? " selected" : "";
      html += "<option value=\"" + i + "\"" + selectedAttr + ">" + monthNames[i] + " " + overviewSelectedYear + "</option>";
    }
  } else {
    for (var y = 0; y < availableYears.length; y++) {
      var yr = availableYears[y];
      var selectedAttr2 = yr === overviewSelectedYear ? " selected" : "";
      html += "<option value=\"" + yr + "\"" + selectedAttr2 + ">" + yr + "</option>";
    }
  }
  sel.innerHTML = html;
}

export async function renderOverviewHoursChart() {
  var container = document.getElementById("overview-hours-chart-container");
  if (!container) { return; }

  var logs = await fetchApprovedLogsForYear(overviewSelectedYear);

  if (overviewSelectedMonthIndex === null) {
    overviewSelectedMonthIndex = logs.length > 0
      ? Math.max.apply(null, logs.map(function (r) { return new Date(r.submitted_at).getMonth(); }))
      : new Date().getMonth();
  }

  var data, labels;

  if (overviewChartRange === "month") {
    data = weeklyBreakdownForMonth(logs, overviewSelectedMonthIndex);
    labels = ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];
  } else {
    data = monthlyCountsFromLogs(logs);
    labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  }

  container.innerHTML = buildSimpleLineChartSVG(data, labels, "#245ec2", 600, 230);
  populateOverviewPeriodSelector();
}

export function switchOverviewChartPeriod(value) {
  if (overviewChartRange === "month") {
    overviewSelectedMonthIndex = parseInt(value, 10);
  } else {
    overviewSelectedYear = parseInt(value, 10);
  }
  renderOverviewHoursChart();
}

export function switchOverviewChartRange(range) {
  overviewChartRange = range;
  var monthBtn = document.getElementById("overview-range-month");
  var yearBtn = document.getElementById("overview-range-year");
  if (monthBtn) { monthBtn.classList.toggle("active", range === "month"); }
  if (yearBtn) { yearBtn.classList.toggle("active", range === "year"); }
  renderOverviewHoursChart();
}

/* ---------- Completed Activities by Type (pie) ---------- */
export async function renderHoursPieChart() {
  var container = document.getElementById("hours-pie-chart-container");
  if (!container) { return; }

  var { data, error } = await supabase
    .from('service_logs')
    .select('activity_type')
    .eq('status', 'approved');

  if (error) { console.error(error); container.innerHTML = ''; return; }

  var tally = {};
  data.forEach(function (row) {
    var key = row.activity_type || 'Other';
    tally[key] = (tally[key] || 0) + 1;
  });

  var total = 0;
  var slices = Object.keys(tally).map(function (label) {
    total += tally[label];
    return { label: label, value: tally[label], color: activityTypeColors[label] || '#6b7280' };
  });

  var html = buildPieChartSVG(slices, 200);
  if (total > 0) {
    html += "<div class=\"pie-legend\">";
    slices.forEach(function (slice) {
      var pct = Math.round((slice.value / total) * 100);
      html += "<div class=\"pie-legend-item\">";
      html += "<div class=\"pie-legend-swatch\" style=\"background:" + slice.color + "\"></div>";
      html += "<span>" + slice.label + "</span>";
      html += "<span class=\"pie-legend-pct\">" + pct + "% (" + slice.value + " submissions)</span>";
      html += "</div>";
    });
    html += "</div>";
  }

  container.innerHTML = html;
}

/* ---------- Leaderboards ---------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function rankBadgeClass(rank) {
  if (rank === 1) { return "rank-badge gold"; }
  if (rank === 2) { return "rank-badge silver"; }
  if (rank === 3) { return "rank-badge bronze"; }
  return "rank-badge";
}

var individualsRanked = [];
var individualsExpanded = false;
var chaptersRanked = [];
var chaptersExpanded = false;
var LEADERBOARD_PREVIEW_SIZE = 6;

function updateViewFullButton(buttonId, totalCount, expanded) {
  var btn = document.getElementById(buttonId);
  if (!btn) { return; }
  btn.disabled = totalCount <= LEADERBOARD_PREVIEW_SIZE;
  btn.textContent = expanded ? "Show Top " + LEADERBOARD_PREVIEW_SIZE : "View Full Leaderboard";
}

function paintIndividualsRows() {
  var container = document.getElementById("leaderboard-individuals-rows");
  if (!container) { return; }

  var visible = individualsExpanded ? individualsRanked : individualsRanked.slice(0, LEADERBOARD_PREVIEW_SIZE);

  var html = "";
  visible.forEach(function (m, idx) {
    var rank = idx + 1;
    html += "<div class=\"leaderboard-row clickable-row\" data-name=\"" + escapeHtml(m.name.toLowerCase()) + "\">";
    html += "<div class=\"" + rankBadgeClass(rank) + "\">" + rank + "</div>";
    html += "<div><div class=\"leader-name\">" + escapeHtml(m.name) + "</div></div>";
    html += "<div class=\"leader-meta\">" + escapeHtml(m.chapter) + "</div>";
    html += "<div style=\"font-weight:700;color:var(--text)\">" + Math.round(m.hours) + " hrs</div>";
    html += "</div>";
  });

  container.innerHTML = html;
  updateViewFullButton("leaderboard-individuals-viewfull", individualsRanked.length, individualsExpanded);
  filterLeaderboard();
}

function paintChaptersRows() {
  var container = document.getElementById("leaderboard-groups-rows");
  if (!container) { return; }

  var visible = chaptersExpanded ? chaptersRanked : chaptersRanked.slice(0, LEADERBOARD_PREVIEW_SIZE);

  var html = "";
  visible.forEach(function (row, idx) {
    var rank = idx + 1;
    html += "<div class=\"leaderboard-row clickable-row\" data-name=\"" + escapeHtml(row.name.toLowerCase()) + "\">";
    html += "<div class=\"" + rankBadgeClass(rank) + "\">" + rank + "</div>";
    html += "<div><div class=\"leader-name\">" + escapeHtml(row.name) + "</div></div>";
    html += "<div class=\"leader-meta\">" + row.type + "</div>";
    html += "<div style=\"font-weight:700;color:var(--text)\">" + Math.round(row.hours) + " hrs</div>";
    html += "</div>";
  });

  container.innerHTML = html;
  updateViewFullButton("leaderboard-groups-viewfull", chaptersRanked.length, chaptersExpanded);
  filterLeaderboard();
}

export function toggleIndividualsLeaderboard() {
  individualsExpanded = !individualsExpanded;
  paintIndividualsRows();
}

export function toggleChapterLeaderboard() {
  chaptersExpanded = !chaptersExpanded;
  paintChaptersRows();
}

export async function renderIndividualLeaderboard() {
  var container = document.getElementById("leaderboard-individuals-rows");
  if (!container) { return; }

  var { data: logs, error: logsErr } = await supabase
    .from('service_logs')
    .select('hours, user_id, name')
    .eq('status', 'approved');

  if (logsErr) { console.error('service_logs fetch failed:', logsErr.message, logsErr.details, logsErr.hint); container.innerHTML = ''; return; }

  var userIds = Array.from(new Set(logs.map(function (r) { return r.user_id; }).filter(Boolean)));

  var profileById = {};
  if (userIds.length > 0) {
    // service_logs.user_id has no direct foreign key to profiles (only to
    // users, per the NextAuth-style schema), so profiles has to be fetched
    // separately and joined here in JS rather than via PostgREST embedding.
    var { data: profilesData, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, chapters:chapter_id ( name )')
      .in('id', userIds);

    if (profilesErr) { console.error('profiles fetch failed:', profilesErr.message, profilesErr.details, profilesErr.hint); container.innerHTML = ''; return; }
    profilesData.forEach(function (p) { profileById[p.id] = p; });
  }

  var totals = {};
  logs.forEach(function (row) {
    var key, displayName, chapter;

    if (row.user_id && profileById[row.user_id]) {
      // Attributed to a real member profile.
      var p = profileById[row.user_id];
      key = row.user_id;
      displayName = (p.first_name || '') + ' ' + (p.last_name || '');
      chapter = (p.chapters && p.chapters.name) || (p.role === 'mentor' ? 'Mentor' : '-');
    } else if (row.name) {
      // No user_id -- e.g. mentor office-hours entries logged by plain
      // name/email instead of a linked profile. Still counts toward the
      // leaderboard, just with no chapter to show.
      key = 'name:' + row.name.toLowerCase();
      displayName = row.name;
      chapter = '-';
    } else {
      return; // no name and no resolvable profile -- nothing to attribute this row to
    }

    if (!totals[key]) {
      totals[key] = { name: displayName, chapter: chapter, hours: 0 };
    }
    totals[key].hours += Number(row.hours) || 0;
  });

  individualsRanked = Object.values(totals).sort(function (a, b) { return b.hours - a.hours; });
  paintIndividualsRows();
}

export async function renderChapterLeaderboard() {
  var container = document.getElementById("leaderboard-groups-rows");
  if (!container) { return; }

  var { data: logs, error: logsErr } = await supabase
    .from('service_logs')
    .select('hours, user_id')
    .eq('status', 'approved');

  if (logsErr) { console.error('service_logs fetch failed:', logsErr.message, logsErr.details, logsErr.hint); container.innerHTML = ''; return; }

  var userIds = Array.from(new Set(logs.map(function (r) { return r.user_id; }).filter(Boolean)));
  if (userIds.length === 0) { container.innerHTML = ''; return; }

  var { data: profilesData, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, chapters:chapter_id ( name )')
    .in('id', userIds);

  if (profilesErr) { console.error('profiles fetch failed:', profilesErr.message, profilesErr.details, profilesErr.hint); container.innerHTML = ''; return; }

  var chapterNameByUserId = {};
  profilesData.forEach(function (p) { chapterNameByUserId[p.id] = p.chapters && p.chapters.name; });

  var totals = {};
  logs.forEach(function (row) {
    var name = chapterNameByUserId[row.user_id];
    if (!name) { return; }
    totals[name] = (totals[name] || 0) + (Number(row.hours) || 0);
  });

  var chapterRows = Object.keys(totals).map(function (name) {
    return { name: name, type: 'Chapter', hours: totals[name] };
  });

  chaptersRanked = chapterRows.concat(staticPartners).sort(function (a, b) { return b.hours - a.hours; });
  paintChaptersRows();
}

export function switchLeaderboardView(name, el) {
  var opts = el.parentElement.querySelectorAll(".segmented-option");
  for (var i = 0; i < opts.length; i++) { opts[i].classList.remove("active"); }
  el.classList.add("active");
  var indiv = document.getElementById("leaderboard-individuals");
  var groups = document.getElementById("leaderboard-groups");
  if (indiv) { indiv.style.display = (name === "individuals") ? "block" : "none"; }
  if (groups) { groups.style.display = (name === "groups") ? "block" : "none"; }
  filterLeaderboard();
}

export function filterLeaderboard() {
  var input = document.getElementById("leaderboard-search-input");
  if (!input) { return; }
  var query = input.value.trim().toLowerCase();

  var panels = [
    { id: "leaderboard-individuals", noResultsId: "leaderboard-individuals-no-results" },
    { id: "leaderboard-groups", noResultsId: "leaderboard-groups-no-results" }
  ];

  for (var p = 0; p < panels.length; p++) {
    var panel = document.getElementById(panels[p].id);
    if (!panel) { continue; }
    var rows = panel.querySelectorAll(".leaderboard-row[data-name]");
    var visibleCount = 0;
    for (var i = 0; i < rows.length; i++) {
      var name = rows[i].getAttribute("data-name");
      var matches = name.indexOf(query) !== -1;
      rows[i].style.display = matches ? "" : "none";
      if (matches) { visibleCount++; }
    }
    var noResultsEl = document.getElementById(panels[p].noResultsId);
    if (noResultsEl) { noResultsEl.style.display = visibleCount === 0 ? "block" : "none"; }
  }
}