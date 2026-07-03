export var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export var availableYears = [2025, 2026];

export function formatCompact(v) {
  var sign = v < 0 ? "-" : "";
  v = Math.abs(v);
  if (v >= 10000) { return sign + Math.round(v / 1000) + "k"; }
  if (v >= 1000) { return sign + (v / 1000).toFixed(1) + "k"; }
  return sign + Math.round(v);
}

export function buildSimpleLineChartSVG(data, labels, color, width, height) {
  var padTop = 20, padRight = 20, padBottom = 30, padLeft = 44;
  var maxVal = Math.max.apply(null, data) * 1.15;
  var minRaw = Math.min.apply(null, data) * 0.95;
  var minVal = minRaw > 0 ? 0 : minRaw;
  if (maxVal === minVal) { maxVal = minVal + 1; }

  var plotW = width - padLeft - padRight;
  var plotH = height - padTop - padBottom;
  var n = labels.length;

  function xAt(i) { return padLeft + (i / (n - 1)) * plotW; }
  function yAt(v) { return padTop + plotH - ((v - minVal) / (maxVal - minVal)) * plotH; }

  var parts = [];
  parts.push("<svg viewBox=\"0 0 " + width + " " + height + "\" style=\"width:100%;height:" + height + "px;display:block\">");

  for (var g = 0; g <= 3; g++) {
    var gv = minVal + ((maxVal - minVal) / 3) * (3 - g);
    var gy = padTop + (plotH / 3) * g;
    parts.push("<line x1=\"" + padLeft + "\" y1=\"" + gy + "\" x2=\"" + (width - padRight) + "\" y2=\"" + gy + "\" stroke=\"#e7e9ee\" stroke-width=\"1\"></line>");
    parts.push("<text x=\"" + (padLeft - 8) + "\" y=\"" + (gy + 3) + "\" font-size=\"9.5\" fill=\"#6b7280\" text-anchor=\"end\" font-family=\"Manrope, sans-serif\">" + formatCompact(gv) + "</text>");
  }

  for (var i = 0; i < labels.length; i++) {
    if (n > 8 && i % 2 !== 0 && i !== n - 1) { continue; }
    parts.push("<text x=\"" + xAt(i) + "\" y=\"" + (height - 8) + "\" font-size=\"9.5\" fill=\"#6b7280\" text-anchor=\"middle\" font-family=\"Manrope, sans-serif\">" + labels[i] + "</text>");
  }

  var linePoints = [];
  for (var j = 0; j < data.length; j++) {
    linePoints.push(xAt(j) + "," + yAt(data[j]));
  }

  var areaD = "M" + xAt(0) + "," + yAt(minVal);
  for (var k = 0; k < data.length; k++) {
    areaD += " L" + xAt(k) + "," + yAt(data[k]);
  }
  areaD += " L" + xAt(data.length - 1) + "," + yAt(minVal) + " Z";
  parts.push("<path d=\"" + areaD + "\" fill=\"" + color + "\" opacity=\"0.1\"></path>");

  parts.push("<polyline points=\"" + linePoints.join(" ") + "\" fill=\"none\" stroke=\"" + color + "\" stroke-width=\"2.75\" stroke-linejoin=\"round\" stroke-linecap=\"round\"></polyline>");

  for (var m = 0; m < data.length; m++) {
    parts.push("<circle cx=\"" + xAt(m) + "\" cy=\"" + yAt(data[m]) + "\" r=\"4\" fill=\"" + color + "\" stroke=\"white\" stroke-width=\"2\"></circle>");
  }

  parts.push("</svg>");
  return parts.join("");
}

export function buildPieChartSVG(data, size) {
  var total = 0;
  for (var i = 0; i < data.length; i++) { total += data[i].value; }
  if (total === 0) { return "<div style=\"text-align:center;color:#6b7280;font-size:12px;padding:20px 0\">No data yet</div>"; }

  var cx = size / 2;
  var cy = size / 2;
  var r = size / 2 - 6;
  var startAngle = -90;
  var parts = [];
  parts.push("<svg viewBox=\"0 0 " + size + " " + size + "\" style=\"width:100%;max-width:" + size + "px;height:auto;display:block;margin:0 auto\">");

  for (var s = 0; s < data.length; s++) {
    var slice = data[s];
    var angle = (slice.value / total) * 360;
    var endAngle = startAngle + angle;

    var startRad = (Math.PI / 180) * startAngle;
    var endRad = (Math.PI / 180) * endAngle;

    var x1 = cx + r * Math.cos(startRad);
    var y1 = cy + r * Math.sin(startRad);
    var x2 = cx + r * Math.cos(endRad);
    var y2 = cy + r * Math.sin(endRad);

    var largeArc = angle > 180 ? 1 : 0;
    var pathD = "M" + cx + "," + cy + " L" + x1 + "," + y1 + " A" + r + "," + r + " 0 " + largeArc + " 1 " + x2 + "," + y2 + " Z";

    parts.push("<path d=\"" + pathD + "\" fill=\"" + slice.color + "\" stroke=\"white\" stroke-width=\"2\"></path>");
    startAngle = endAngle;
  }

  parts.push("</svg>");
  return parts.join("");
}