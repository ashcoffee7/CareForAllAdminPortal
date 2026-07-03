import { supabase } from './supabase.js';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function initialsFor(name) {
  var parts = (name || '').trim().split(/\s+/);
  var initials = '';
  for (var i = 0; i < parts.length && initials.length < 2; i++) {
    if (parts[i][0]) { initials += parts[i][0].toUpperCase(); }
  }
  return initials || 'M';
}

var colorPalette = ['#245ec2', '#10b981', '#7db9ff', '#f59e0b', '#ff5961', '#14224a'];
function colorFor(index) {
  return colorPalette[index % colorPalette.length];
}

var lastLoadedMentors = [];

export async function loadMentorshipPage() {
  var { data: mentors, error: mentorsErr } = await supabase
    .from('mentors')
    .select('id, name, calendly_link, available')
    .order('name');

  if (mentorsErr) {
    console.error('mentors fetch failed:', mentorsErr.message, mentorsErr.details, mentorsErr.hint);
    lastLoadedMentors = [];
  } else {
    lastLoadedMentors = mentors;
  }

  var { count: sessionCount, error: sessionsErr } = await supabase
    .from('mentorship_sessions')
    .select('*', { count: 'exact', head: true });
  if (sessionsErr) { console.error('mentorship_sessions fetch failed:', sessionsErr.message, sessionsErr.details, sessionsErr.hint); }

  var totalSessionsEl = document.getElementById('stat-total-sessions');
  if (totalSessionsEl) { totalSessionsEl.textContent = sessionCount != null ? sessionCount : '—'; }

  renderMentorList();
}

function renderMentorList() {
  var listEl = document.getElementById('mentor-admin-list');
  if (!listEl) { return; }

  var html = '';
  lastLoadedMentors.forEach(function (m, i) {
    var pillBg = m.available ? '#d1fae5' : '#fef3c7';
    var pillColor = m.available ? '#065f46' : '#92400e';
    var pillText = m.available ? 'Available' : 'Unavailable';
    var toggleOnClass = m.available ? ' on' : '';
    var labelOnClass = m.available ? 'on' : 'off';
    var labelText = m.available ? 'ON' : 'OFF';
    var linkDisplay = (m.calendly_link || '').replace(/^https?:\/\//, '') || '—';
    var initials = initialsFor(m.name);
    var color = colorFor(i);

    html += '<div class="mentor-admin-row" data-mentor-id="' + m.id + '" data-mentor-name="' + escapeHtml((m.name || '').toLowerCase()) + '">';
    html += '<div class="mentor-info-cell">';
    html += '<div class="avatar" style="width:38px;height:38px;font-size:13px;background:' + color + '">' + initials + '</div>';
    html += '<div><div class="mentor-info-name">' + escapeHtml(m.name || 'Unknown') + '</div></div>';
    html += '</div>';
    html += '<div class="leader-meta" style="word-break:break-all">' + escapeHtml(linkDisplay) + '</div>';
    html += '<div><span class="status-pill" style="background:' + pillBg + ';color:' + pillColor + '">' + pillText + '</span></div>';
    html += '<div class="toggle-with-label">';
    html += '<div class="toggle-switch' + toggleOnClass + '" data-mentor-toggle="' + m.id + '"><div class="toggle-knob"></div></div>';
    html += '<span class="toggle-state-label ' + labelOnClass + '">' + labelText + '</span>';
    html += '</div>';
    html += '</div>';
  });

  listEl.innerHTML = html;

  listEl.querySelectorAll('[data-mentor-toggle]').forEach(function (el) {
    el.addEventListener('click', function () {
      handleMentorToggleClick(el.getAttribute('data-mentor-toggle'));
    });
  });

  refreshAvailabilityCounts();
  filterMentorTable();
}

function refreshAvailabilityCounts() {
  var availableCount = lastLoadedMentors.filter(function (m) { return m.available; }).length;
  var totalEl = document.getElementById('stat-total-mentors');
  var availEl = document.getElementById('stat-available-count');
  var unavailEl = document.getElementById('stat-unavailable-count');
  if (totalEl) { totalEl.textContent = lastLoadedMentors.length; }
  if (availEl) { availEl.textContent = availableCount; }
  if (unavailEl) { unavailEl.textContent = lastLoadedMentors.length - availableCount; }
}

async function setMentorAvailability(mentorId, available) {
  var { error } = await supabase
    .from('mentors')
    .update({ available: available })
    .eq('id', mentorId);

  if (error) {
    console.error('mentor availability update failed:', error.message, error.details, error.hint);
    alert('Could not update mentor availability:\n' + error.message);
    return;
  }

  var mentor = lastLoadedMentors.find(function (m) { return m.id === mentorId; });
  if (mentor) { mentor.available = available; }
  renderMentorList();
}

function handleMentorToggleClick(mentorId) {
  var mentor = lastLoadedMentors.find(function (m) { return m.id === mentorId; });
  if (!mentor) { return; }

  if (mentor.available) {
    // Turning OFF requires confirmation, same as the original design.
    openConfirmModal(
      'Turn off booking?',
      'Are you sure you want to turn 1:1 booking off for ' + (mentor.name || 'this mentor') + '?',
      function () { setMentorAvailability(mentorId, false); }
    );
  } else {
    // Turning ON is immediate.
    setMentorAvailability(mentorId, true);
  }
}

function openConfirmModal(titleText, bodyText, onYes) {
  var titleEl = document.getElementById('confirm-modal-title');
  var textEl = document.getElementById('confirm-modal-text');
  var yesBtn = document.getElementById('confirm-modal-yes-btn');
  var overlay = document.getElementById('confirm-modal-overlay');
  if (!titleEl || !textEl || !yesBtn || !overlay) { return; }

  titleEl.textContent = titleText;
  textEl.textContent = bodyText;
  yesBtn.onclick = function () {
    onYes();
    overlay.classList.remove('open');
  };
  overlay.classList.add('open');
}

export function filterMentorTable() {
  var input = document.getElementById('mentor-search-input');
  if (!input) { return; }
  var query = input.value.trim().toLowerCase();
  var rows = document.querySelectorAll('#mentor-admin-list .mentor-admin-row');
  var visibleCount = 0;
  rows.forEach(function (row) {
    var matches = row.getAttribute('data-mentor-name').indexOf(query) !== -1;
    row.style.display = matches ? '' : 'none';
    if (matches) { visibleCount++; }
  });
  var noResultsEl = document.getElementById('mentor-no-results');
  if (noResultsEl) { noResultsEl.style.display = visibleCount === 0 ? 'block' : 'none'; }
}