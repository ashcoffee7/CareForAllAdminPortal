import { supabase } from './supabase.js';
import { buildSimpleLineChartSVG, monthNames, availableYears } from './charts.js';
import { MEMBER_ROLES } from './roles.js';

var knownIcons = {
  totalmembers: '&#128101;',
  totalchapters: '&#127987;',
  'People Reached': '&#129309;',
  'Items Distributed': '&#128230;',
  'Funds Raised': '&#128181;',
  'Roads Mapped': '&#128739;',
  'Buildings Mapped': '&#127970;'
};
var fallbackIcon = '&#128202;';

function iconFor(key) {
  return knownIcons[key] || fallbackIcon;
}

function formatCompactNumber(n) {
  if (n >= 1000000) { return (n / 1000000).toFixed(1) + 'M'; }
  if (n >= 1000) { return (n / 1000).toFixed(1) + 'k'; }
  return String(Math.round(n));
}

// events: { totalmembers: [{date}], totalchapters: [{date}], categories: { 'People Reached': [{date, magnitude}], ... } }
var events = null;
var selectedMetric = 'totalmembers';
var chartRange = 'month';
var selectedMonthIndex = null;
var selectedYear = new Date().getFullYear();

async function loadAllImpactEvents() {
  var { data: memberRows, error: memberErr } = await supabase
    .from('profiles')
    .select('created_at')
    .in('role', MEMBER_ROLES);
  if (memberErr) { console.error('members fetch failed:', memberErr.message, memberErr.details, memberErr.hint); }

  var { data: chapterRows, error: chapterErr } = await supabase
    .from('chapters')
    .select('created_at');
  if (chapterErr) { console.error('chapters fetch failed:', chapterErr.message, chapterErr.details, chapterErr.hint); }

  var { data: logs, error: logsErr } = await supabase
    .from('service_logs')
    .select('primary_impact, impact_magnitude, secondary_impact, secondary_impact_magnitude, submitted_at')
    .eq('status', 'approved');
  if (logsErr) { console.error('service_logs (impact) fetch failed:', logsErr.message, logsErr.details, logsErr.hint); }

  var categories = {};
  function addEvent(category, magnitude, date) {
    if (!category || !date) { return; }
    if (!categories[category]) { categories[category] = []; }
    categories[category].push({ date: date, magnitude: Number(magnitude) || 0 });
  }
  (logs || []).forEach(function (row) {
    if (row.primary_impact) { addEvent(row.primary_impact, row.impact_magnitude, row.submitted_at); }
    if (row.secondary_impact) { addEvent(row.secondary_impact, row.secondary_impact_magnitude, row.submitted_at); }
  });

  return {
    totalmembers: (memberRows || []).map(function (r) { return { date: r.created_at, magnitude: 1 }; }),
    totalchapters: (chapterRows || []).map(function (r) { return { date: r.created_at, magnitude: 1 }; }),
    categories: categories
  };
}

// These three don't exist anywhere in the current data (no "Funds Raised"
// entries logged yet, and no mapping-specific fields anywhere in the
// schema) but should still show up as 0 rather than being hidden -- unlike
// other categories, which only appear once real data exists for them.
var GUARANTEED_CATEGORIES = ['Funds Raised', 'Roads Mapped', 'Buildings Mapped'];

function metricList() {
  var list = [
    { key: 'totalmembers', label: 'Total Members', events: events.totalmembers },
    { key: 'totalchapters', label: 'Total Chapters', events: events.totalchapters }
  ];

  var categoryKeys = Object.keys(events.categories);
  GUARANTEED_CATEGORIES.forEach(function (key) {
    if (categoryKeys.indexOf(key) === -1) { categoryKeys.push(key); }
  });

  categoryKeys.forEach(function (category) {
    list.push({ key: category, label: category, events: events.categories[category] || [] });
  });

  return list;
}

function totalFor(metric) {
  if (metric.key === 'totalmembers' || metric.key === 'totalchapters') {
    return metric.events.length;
  }
  return metric.events.reduce(function (sum, e) { return sum + e.magnitude; }, 0);
}

function renderMetricCards() {
  var container = document.getElementById('metric-card-grid');
  if (!container) { return; }

  var list = metricList();
  var html = '';
  list.forEach(function (m) {
    var selectedClass = m.key === selectedMetric ? ' selected' : '';
    var total = totalFor(m);
    html += '<div class="metric-card' + selectedClass + '" data-metric="' + m.key + '">';
    html += '<div class="metric-card-icon">' + iconFor(m.key) + '</div>';
    html += '<div class="metric-card-n">' + formatCompactNumber(total) + '</div>';
    html += '<div class="metric-card-l">' + m.label + '</div>';
    html += '</div>';
  });
  container.innerHTML = html;

  container.querySelectorAll('.metric-card').forEach(function (card) {
    card.addEventListener('click', function () {
      selectImpactMetric(card.getAttribute('data-metric'), card);
    });
  });
}

function cumulativeMonthlySeries(metricEvents, year) {
  var monthly = new Array(12).fill(0);
  metricEvents.forEach(function (e) {
    var d = new Date(e.date);
    if (d.getFullYear() !== year) { return; }
    monthly[d.getMonth()] += e.magnitude;
  });
  var running = 0;
  return monthly.map(function (v) { running += v; return running; });
}

function cumulativeWeeklySeriesForMonth(metricEvents, year, monthIdx) {
  var weekly = [0, 0, 0, 0];
  metricEvents.forEach(function (e) {
    var d = new Date(e.date);
    if (d.getFullYear() !== year || d.getMonth() !== monthIdx) { return; }
    var week = Math.min(3, Math.floor((d.getDate() - 1) / 7));
    weekly[week] += e.magnitude;
  });
  var running = 0;
  return weekly.map(function (v) { running += v; return running; });
}

function populatePeriodSelector() {
  var sel = document.getElementById('period-selector');
  if (!sel) { return; }
  var html = '';
  if (chartRange === 'month') {
    for (var i = 0; i < monthNames.length; i++) {
      var selectedAttr = i === selectedMonthIndex ? ' selected' : '';
      html += '<option value="' + i + '"' + selectedAttr + '>' + monthNames[i] + ' ' + selectedYear + '</option>';
    }
  } else {
    for (var y = 0; y < availableYears.length; y++) {
      var yr = availableYears[y];
      var selectedAttr2 = yr === selectedYear ? ' selected' : '';
      html += '<option value="' + yr + '"' + selectedAttr2 + '>' + yr + '</option>';
    }
  }
  sel.innerHTML = html;
}

function renderChart() {
  var container = document.getElementById('chart-single-container');
  if (!container) { return; }

  var list = metricList();
  var metric = list.find(function (m) { return m.key === selectedMetric; });
  if (!metric) { return; }

  if (selectedMonthIndex === null) {
    var monthsWithData = metric.events
      .map(function (e) { return new Date(e.date); })
      .filter(function (d) { return d.getFullYear() === selectedYear; })
      .map(function (d) { return d.getMonth(); });
    selectedMonthIndex = monthsWithData.length > 0 ? Math.max.apply(null, monthsWithData) : new Date().getMonth();
  }

  var data, labels;
  if (chartRange === 'month') {
    data = cumulativeWeeklySeriesForMonth(metric.events, selectedYear, selectedMonthIndex);
    labels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
  } else {
    data = cumulativeMonthlySeries(metric.events, selectedYear);
    labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }

  container.innerHTML = buildSimpleLineChartSVG(data, labels, '#245ec2', 700, 260);

  var iconEl = document.getElementById('chart-panel-icon');
  var titleEl = document.getElementById('chart-panel-title-text');
  if (iconEl) { iconEl.innerHTML = iconFor(metric.key); }
  if (titleEl) { titleEl.textContent = metric.label; }

  populatePeriodSelector();
}

export function selectImpactMetric(key, el) {
  selectedMetric = key;
  selectedMonthIndex = null;
  document.querySelectorAll('#metric-card-grid .metric-card').forEach(function (c) { c.classList.remove('selected'); });
  if (el) { el.classList.add('selected'); }
  renderChart();
}

export function switchChartPeriod(value) {
  if (chartRange === 'month') {
    selectedMonthIndex = parseInt(value, 10);
  } else {
    selectedYear = parseInt(value, 10);
    selectedMonthIndex = null;
  }
  renderChart();
}

export function switchChartRange(range) {
  chartRange = range;
  selectedMonthIndex = null;
  var monthBtn = document.getElementById('range-month');
  var yearBtn = document.getElementById('range-year');
  if (monthBtn) { monthBtn.classList.toggle('active', range === 'month'); }
  if (yearBtn) { yearBtn.classList.toggle('active', range === 'year'); }
  renderChart();
}

export async function loadImpactPage() {
  events = await loadAllImpactEvents();
  renderMetricCards();
  renderChart();
}