import { supabase } from './supabase.js';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function formatDate(iso) {
  if (!iso) { return ''; }
  var d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatHours(h) {
  var n = Number(h) || 0;
  return (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)) + (n === 1 ? ' hr' : ' hrs');
}

// service_logs.user_id has no direct foreign key to profiles (only to
// public.users, per the NextAuth-style schema), so profiles have to be
// fetched separately and joined here in JS rather than via PostgREST
// embedding. Rows with no user_id fall back to the plain-text name/email
// columns on service_logs itself (e.g. mentor office-hours entries).
async function fetchProfilesForUserIds(userIds) {
  if (userIds.length === 0) { return {}; }
  var { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, chapters:chapter_id ( name )')
    .in('id', userIds);
  if (error) {
    console.error('profiles fetch failed:', error.message, error.details, error.hint);
    return {};
  }
  var map = {};
  data.forEach(function (p) { map[p.id] = p; });
  return map;
}

function resolveDisplay(row, profileById) {
  var p = row.user_id ? profileById[row.user_id] : null;
  if (p) {
    return {
      name: ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || (row.name || 'Unknown'),
      chapter: (p.chapters && p.chapters.name) || '-'
    };
  }
  return {
    name: row.name || 'Unknown',
    chapter: row.org_name || '-'
  };
}

/* ---------- Stats ---------- */
export async function loadApprovalStats() {
  var { data: approvedRows, error: approvedErr } = await supabase
    .from('service_logs')
    .select('hours')
    .eq('status', 'approved');

  var totalHours = 0;
  if (approvedErr) {
    console.error('approved hours fetch failed:', approvedErr.message, approvedErr.details, approvedErr.hint);
  } else {
    totalHours = approvedRows.reduce(function (sum, r) { return sum + (Number(r.hours) || 0); }, 0);
  }

  var { count: pendingCount, error: pendingErr } = await supabase
    .from('service_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (pendingErr) { console.error('pending count failed:', pendingErr.message, pendingErr.details, pendingErr.hint); }

  var { count: verifTotal, error: verifTotalErr } = await supabase
    .from('service_logs')
    .select('*', { count: 'exact', head: true })
    .not('verify_method', 'is', null);
  if (verifTotalErr) { console.error('verification total count failed:', verifTotalErr.message, verifTotalErr.details, verifTotalErr.hint); }

  var { count: verifIncomplete, error: verifIncompleteErr } = await supabase
    .from('service_logs')
    .select('*', { count: 'exact', head: true })
    .not('verify_method', 'is', null)
    .eq('verification_completed', false);
  if (verifIncompleteErr) { console.error('verification incomplete count failed:', verifIncompleteErr.message, verifIncompleteErr.details, verifIncompleteErr.hint); }

  var totalHoursEl = document.getElementById('stat-total-service-hours');
  var pendingEl = document.getElementById('stat-pending-approvals');
  var verifTotalEl = document.getElementById('stat-verification-requests');
  var verifIncompleteEl = document.getElementById('stat-verification-incomplete');

  if (totalHoursEl) { totalHoursEl.textContent = Math.round(totalHours).toLocaleString(); }
  if (pendingEl) { pendingEl.textContent = pendingCount != null ? pendingCount : '—'; }
  if (verifTotalEl) { verifTotalEl.textContent = verifTotal != null ? verifTotal : '—'; }
  if (verifIncompleteEl && verifIncomplete != null) {
    verifIncompleteEl.textContent = verifIncomplete + ' incomplete';
  }
}

/* ---------- Pending Submissions ---------- */
var lastLoadedSubmissions = [];

export async function renderSubmissions() {
  var container = document.getElementById('submissions-list');
  if (!container) { return; }

  var { data: logs, error } = await supabase
    .from('service_logs')
    .select('id, user_id, name, org_name, activity_type, hours, submitted_at, description')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('submissions fetch failed:', error.message, error.details, error.hint);
    container.innerHTML = '';
    return;
  }

  lastLoadedSubmissions = logs;

  if (logs.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:24px 0;color:var(--muted);font-size:13px">No pending submissions.</div>';
    return;
  }

  var userIds = Array.from(new Set(logs.map(function (r) { return r.user_id; }).filter(Boolean)));
  var profileById = await fetchProfilesForUserIds(userIds);

  var html = '';
  logs.forEach(function (row) {
    var display = resolveDisplay(row, profileById);

    html += '<div class="approval-row">';
    html += '<div><div class="leader-name">' + escapeHtml(display.name) + '</div><div class="leader-meta">' + escapeHtml(display.chapter) + '</div></div>';
    html += '<div class="leader-meta">' + escapeHtml(row.activity_type || '-') + '</div>';
    html += '<div class="leader-meta">' + formatDate(row.submitted_at) + '</div>';
    html += '<div style="font-weight:600">' + formatHours(row.hours) + '</div>';
    html += '<div class="row-actions">';
    html += '<div class="icon-btn-sm approve" data-approve="' + row.id + '"><i class="ti ti-check"></i></div>';
    html += '<div class="icon-btn-sm reject" data-reject="' + row.id + '"><i class="ti ti-x"></i></div>';
    html += '<div class="icon-btn-sm neutral" data-preview="' + row.id + '"><i class="ti ti-eye"></i></div>';
    html += '</div>';
    html += '</div>';
  });

  container.innerHTML = html;

  container.querySelectorAll('[data-approve]').forEach(function (btn) {
    btn.addEventListener('click', function () { updateSubmissionStatus(btn.getAttribute('data-approve'), 'approved'); });
  });
  container.querySelectorAll('[data-reject]').forEach(function (btn) {
    btn.addEventListener('click', function () { updateSubmissionStatus(btn.getAttribute('data-reject'), 'rejected'); });
  });
  container.querySelectorAll('[data-preview]').forEach(function (btn) {
    btn.addEventListener('click', function () { previewSubmission(btn.getAttribute('data-preview')); });
  });
}

async function updateSubmissionStatus(logId, newStatus) {
  var { data: userData } = await supabase.auth.getUser();
  var reviewerId = userData && userData.user ? userData.user.id : null;

  var { error } = await supabase
    .from('service_logs')
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId
    })
    .eq('id', logId);

  if (error) {
    console.error('status update failed:', error.message, error.details, error.hint);
    alert('Could not update this submission:\n' + error.message);
    return;
  }

  renderSubmissions();
  loadApprovalStats();
}

function previewSubmission(logId) {
  var row = lastLoadedSubmissions.find(function (r) { return r.id === logId; });
  if (!row) { return; }

  var body = '';
  body += '<div class="modal-field-row"><div class="modal-field-label">Activity Type</div><div class="modal-field-value">' + escapeHtml(row.activity_type || '-') + '</div></div>';
  body += '<div class="modal-field-row"><div class="modal-field-label">Hours</div><div class="modal-field-value">' + formatHours(row.hours) + '</div></div>';
  body += '<div class="modal-field-row"><div class="modal-field-label">Submitted</div><div class="modal-field-value">' + formatDate(row.submitted_at) + '</div></div>';
  body += '<div class="modal-field-row"><div class="modal-field-label">Description</div><div class="modal-field-value" style="font-weight:400">' + escapeHtml(row.description || '-') + '</div></div>';

  document.getElementById('modal-title').textContent = 'Submission Preview';
  document.getElementById('modal-subtitle').textContent = row.name || '';
  document.getElementById('modal-body-content').innerHTML = body;
  document.getElementById('detail-modal-overlay').classList.add('open');
}

/* ---------- Verification ----------
   Only the completion-tracking half is real right now (verify_method,
   verification_completed, verification_completed_at). "Overdue" state,
   submission portal link, deadline, and directions all depend on columns
   that don't exist in the schema yet -- once added, extend the query
   below and the card markup to surface them. */
export async function renderVerificationList() {
  var container = document.getElementById('verification-list');
  if (!container) { return; }

  var { data: logs, error } = await supabase
    .from('service_logs')
    .select('id, user_id, name, org_name, hours, verify_method, verification_completed, verification_completed_at')
    .not('verify_method', 'is', null)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('verification fetch failed:', error.message, error.details, error.hint);
    container.innerHTML = '';
    return;
  }

  var userIds = Array.from(new Set(logs.map(function (r) { return r.user_id; }).filter(Boolean)));
  var profileById = await fetchProfilesForUserIds(userIds);

  var html = '';
  logs.forEach(function (row) {
    var display = resolveDisplay(row, profileById);
    var state = row.verification_completed ? 'complete' : 'incomplete';

    html += '<div class="verif-card" data-verif-log-id="' + row.id + '" data-verif-state="' + state + '" data-name="' + escapeHtml(display.name.toLowerCase()) + '">';
    html += '<div class="verif-card-top">';
    html += '<div><div class="leader-name" style="font-size:14px">' + escapeHtml(display.name) + '</div>';
    html += '<div class="leader-meta">' + escapeHtml(display.chapter) + ' - ' + formatHours(row.hours) + ' total</div></div>';
    html += '<span class="verif-status-badge ' + state + '">' + (row.verification_completed ? 'Complete' : 'Incomplete') + '</span>';
    html += '</div>';
    html += '<div class="verif-detail-grid">';
    html += '<div><div class="verif-detail-label">Verification Method</div><div class="verif-detail-value">' + escapeHtml(row.verify_method || '-') + '</div></div>';
    html += '</div>';
    html += '<div class="verif-footer">';
    html += '<span style="font-size:11.5px;color:var(--muted)">' + (row.verification_completed ? 'Completed ' + formatDate(row.verification_completed_at) : '') + '</span>';
    html += '<button class="verif-toggle-btn ' + (row.verification_completed ? 'mark-incomplete' : 'mark-complete') + '" data-verif-toggle="' + row.id + '">' + (row.verification_completed ? 'Mark Incomplete' : 'Mark Complete') + '</button>';
    html += '</div>';
    html += '</div>';
  });

  container.innerHTML = html || '<div style="text-align:center;padding:24px 0;color:var(--muted);font-size:13px">No verification requests.</div>';

  container.querySelectorAll('[data-verif-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      toggleVerification(btn.getAttribute('data-verif-toggle'), btn);
    });
  });

  filterVerifications();
}

async function toggleVerification(logId, btnEl) {
  var card = btnEl.closest('.verif-card');
  var currentlyComplete = card.getAttribute('data-verif-state') === 'complete';
  var newValue = !currentlyComplete;

  var { error } = await supabase
    .from('service_logs')
    .update({
      verification_completed: newValue,
      verification_completed_at: newValue ? new Date().toISOString() : null
    })
    .eq('id', logId);

  if (error) {
    console.error('verification toggle failed:', error.message, error.details, error.hint);
    alert('Could not update verification status:\n' + error.message);
    return;
  }

  renderVerificationList();
  loadApprovalStats();
}

var verifActiveFilter = 'incomplete';

export function switchVerificationFilter(filterName, el) {
  verifActiveFilter = filterName;
  document.querySelectorAll('#verif-filter-chips .filter-chip').forEach(function (c) { c.classList.remove('active'); });
  el.classList.add('active');
  filterVerifications();
}

export function filterVerifications() {
  var panel = document.getElementById('approval-verification');
  if (!panel) { return; }
  var input = document.getElementById('verif-search-input');
  var query = input ? input.value.trim().toLowerCase() : '';
  var cards = panel.querySelectorAll('.verif-card');

  cards.forEach(function (card) {
    var state = card.getAttribute('data-verif-state');
    var name = card.getAttribute('data-name') || '';
    var matchesFilter = verifActiveFilter === 'all' || state === verifActiveFilter;
    var matchesSearch = query === '' || name.indexOf(query) !== -1;
    card.style.display = (matchesFilter && matchesSearch) ? 'block' : 'none';
  });
}

/* ---------- Tab switching ---------- */
export function switchApprovalTab(name, el) {
  document.querySelectorAll('.tab-bar .tab').forEach(function (t) { t.classList.remove('active'); });
  el.classList.add('active');
  document.querySelectorAll('.approval-panel').forEach(function (p) { p.style.display = 'none'; });
  var target = document.getElementById('approval-' + name);
  if (target) { target.style.display = 'block'; }
}