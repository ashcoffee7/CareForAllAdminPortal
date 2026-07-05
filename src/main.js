import './style.css';

import { supabase } from './supabase.js';
import { loadCurrentAdmin } from './auth.js';
import {
  loadOverviewStats,
  renderOverviewHoursChart,
  renderHoursPieChart,
  renderIndividualLeaderboard,
  renderChapterLeaderboard,
  switchOverviewChartPeriod,
  switchOverviewChartRange,
  switchLeaderboardView,
  filterLeaderboard
} from './overview.js';
import {
  loadApprovalStats,
  renderSubmissions,
  renderVerificationList,
  switchVerificationFilter,
  filterVerifications,
  switchApprovalTab
} from './approvals.js';
import { loadChaptersPage, filterChapterDirectory } from './chapters.js';
import { loadMembersPage, filterMembersList } from './members.js';
import { loadImpactPage, switchChartPeriod, switchChartRange } from './impact.js';
import { loadMentorshipPage, filterMentorTable } from './mentorship.js';

/* ---------- Page navigation ---------- */
function showPage(id, el) {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
  var target = document.getElementById('page-' + id);
  if (target) { target.classList.add('active'); }
  if (el) { el.classList.add('active'); }
  var scroller = document.getElementById('main-scroll');
  if (scroller) { scroller.scrollTop = 0; }
}

document.querySelectorAll('.nav-item[data-page]').forEach(function (item) {
  item.addEventListener('click', function () {
    showPage(item.getAttribute('data-page'), item);
  });
});

/* ---------- Generic modal plumbing ---------- */
function closeDetailModal() {
  document.getElementById('detail-modal-overlay').classList.remove('open');
}
function closeConfirmModal() {
  document.getElementById('confirm-modal-overlay').classList.remove('open');
}

var detailOverlay = document.getElementById('detail-modal-overlay');
if (detailOverlay) {
  detailOverlay.addEventListener('click', function (e) {
    if (e.target === detailOverlay) { closeDetailModal(); }
  });
}
var confirmOverlay = document.getElementById('confirm-modal-overlay');
if (confirmOverlay) {
  confirmOverlay.addEventListener('click', function (e) {
    if (e.target === confirmOverlay) { closeConfirmModal(); }
  });
}

var detailCloseBtn = document.getElementById('detail-modal-close-btn');
if (detailCloseBtn) { detailCloseBtn.addEventListener('click', closeDetailModal); }

var confirmCloseBtn = document.getElementById('confirm-modal-close-btn');
if (confirmCloseBtn) { confirmCloseBtn.addEventListener('click', closeConfirmModal); }

var confirmCancelBtn = document.getElementById('confirm-modal-cancel-btn');
if (confirmCancelBtn) { confirmCancelBtn.addEventListener('click', closeConfirmModal); }

/* ---------- Overview page interactions ---------- */
var overviewMonthBtn = document.getElementById('overview-range-month');
var overviewYearBtn = document.getElementById('overview-range-year');
if (overviewMonthBtn) { overviewMonthBtn.addEventListener('click', function () { switchOverviewChartRange('month'); }); }
if (overviewYearBtn) { overviewYearBtn.addEventListener('click', function () { switchOverviewChartRange('year'); }); }

var overviewPeriodSelect = document.getElementById('overview-period-selector');
if (overviewPeriodSelect) {
  overviewPeriodSelect.addEventListener('change', function () { switchOverviewChartPeriod(this.value); });
}

document.querySelectorAll('.segmented-option[data-leaderboard]').forEach(function (opt) {
  opt.addEventListener('click', function () {
    switchLeaderboardView(opt.getAttribute('data-leaderboard'), opt);
  });
});

var leaderboardSearch = document.getElementById('leaderboard-search-input');
if (leaderboardSearch) { leaderboardSearch.addEventListener('input', filterLeaderboard); }

/* ---------- Approvals page interactions ---------- */
document.querySelectorAll('.tab-bar .tab[data-approval-tab]').forEach(function (tab) {
  tab.addEventListener('click', function () {
    switchApprovalTab(tab.getAttribute('data-approval-tab'), tab);
  });
});

document.querySelectorAll('#verif-filter-chips .filter-chip[data-filter]').forEach(function (chip) {
  chip.addEventListener('click', function () {
    switchVerificationFilter(chip.getAttribute('data-filter'), chip);
  });
});

var verifSearch = document.getElementById('verif-search-input');
if (verifSearch) { verifSearch.addEventListener('input', filterVerifications); }

/* ---------- Chapters page interactions ---------- */
var chapterDirectorySearch = document.getElementById('chapter-directory-search-input');
if (chapterDirectorySearch) { chapterDirectorySearch.addEventListener('input', filterChapterDirectory); }

/* ---------- Members page interactions ---------- */
var membersListSearch = document.getElementById('members-list-search-input');
if (membersListSearch) { membersListSearch.addEventListener('input', filterMembersList); }

/* ---------- Impact page interactions ---------- */
var impactMonthBtn = document.getElementById('range-month');
var impactYearBtn = document.getElementById('range-year');
if (impactMonthBtn) { impactMonthBtn.addEventListener('click', function () { switchChartRange('month'); }); }
if (impactYearBtn) { impactYearBtn.addEventListener('click', function () { switchChartRange('year'); }); }

var impactPeriodSelect = document.getElementById('period-selector');
if (impactPeriodSelect) {
  impactPeriodSelect.addEventListener('change', function () { switchChartPeriod(this.value); });
}

/* ---------- Mentorship page interactions ---------- */
var mentorSearch = document.getElementById('mentor-search-input');
if (mentorSearch) { mentorSearch.addEventListener('input', filterMentorTable); }

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', async function () {
  // Supabase restores a persisted session from localStorage asynchronously.
  // Firing queries before this resolves sends them out unauthenticated,
  // which RLS silently treats as "no rows" -- not an error, just empty data.
  // Waiting here once, up front, avoids every downstream query racing it.
  var { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    window.location.href = '/login.html';
    return;
  }

  var signOutBtn = document.querySelector('.sidebar-signout');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async function () {
      await supabase.auth.signOut();
      window.location.href = '/login.html';
    });
  }

  loadCurrentAdmin();
  loadOverviewStats();
  renderOverviewHoursChart();
  renderHoursPieChart();
  renderIndividualLeaderboard();
  renderChapterLeaderboard();

  loadApprovalStats();
  renderSubmissions();
  renderVerificationList();

  loadChaptersPage();
  loadMembersPage();
  loadImpactPage();
  loadMentorshipPage();

  // TODO: Resources Manager still has its original static markup only (no
  // Supabase wiring). There's no `resources` table in the schema at all --
  // unlike Mentorship, this needs a new table designed from scratch before
  // any of it can be wired, not just RLS policies on something that
  // already exists. Mapping/Mapathon submissions and the
  // deadline/portal-link/directions fields on Verification also need new
  // columns before they can be wired -- see the notes at the top of
  // approvals.js.
});