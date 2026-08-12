"use strict";

window.ChartTools = {
  charts: [],
  clear() { this.charts.forEach((chart) => chart.destroy()); this.charts = []; },
  draw(id, type, labels, values, colors) {
    const canvas = document.getElementById(id);
    if (!canvas || typeof Chart === "undefined") return;
    const chart = new Chart(canvas, {
      type,
      data: { labels, datasets: [{ data: values, backgroundColor: type === "doughnut" ? colors : colors[0], borderColor: type === "line" ? colors[0] : "transparent", borderWidth: type === "line" ? 3 : 0, borderRadius: type === "bar" ? 7 : 0, tension: .38, fill: type === "line", pointRadius: type === "line" ? 4 : 0, pointBackgroundColor: "#fff", pointBorderWidth: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: type === "doughnut", position: "bottom", labels: { usePointStyle: true, boxWidth: 8, color: "#64748b", font: { size: 10 } } } }, scales: type === "doughnut" ? {} : { x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 10 } } }, y: { beginAtZero: true, max: type === "line" ? 100 : undefined, grid: { color: "#eef2ff" }, ticks: { color: "#94a3b8", font: { size: 10 } } } } }
    });
    this.charts.push(chart);
  }
};
