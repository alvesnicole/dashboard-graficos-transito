// ================== PAGINAÇÃO ==================
const pages = document.querySelectorAll(".page");
let currentPage = 0;
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");


function moveNavButtonsToChartBlock() {
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");
  const activePage = document.querySelector(".page.active");
  if (!activePage) return;

  const chartBlock = activePage.querySelector(".chart-block") || activePage.querySelector(".chart-wrap") || activePage;
  if (!chartBlock) return;

  if (chartBlock.contains(prevBtn) && chartBlock.contains(nextBtn)) return;

  chartBlock.appendChild(prevBtn);
  chartBlock.appendChild(nextBtn);
}

function showPage(index) {

  currentPage = index;
  
  pages.forEach((p, i) => {
    p.classList.remove("active");
    p.style.left = i < index ? "-100%" : "100%";
  });
  pages[index].classList.add("active");
  pages[index].style.left = "0";

  updateCurrentChart();

  moveNavButtonsToChartBlock();
}

document.addEventListener("DOMContentLoaded", () => {

  moveNavButtonsToChartBlock();
});

window.addEventListener("resize", () => {
  moveNavButtonsToChartBlock();
});


prevBtn.addEventListener("click", () => {
  const newPage = (currentPage - 1 + pages.length) % pages.length;
  showPage(newPage);
});

nextBtn.addEventListener("click", () => {
  const newPage = (currentPage + 1) % pages.length;
  showPage(newPage);
});

// ================== CORES DO GRÁFICO ==================
function colorForLabel(index) {
  const palette = [
    "#FF6B6B", "#4D96FF", "#6BCB77", "#FFD93D", "#C77DFF",
    "#7fc2b4ff", "#FF8E72", "#8358FF", "#E27396", "#00f5e4ff",
    "#FF9F43", "#A363D9", "#45B7D1", "#96CE54", "#FF6F91",
    "#6A89CC", "#F8C471", "#B8E994", "#E15F41", "#786FA6",
    "#F78FB3", "#546DE5", "#0a616dff", "#CF6A87", "#3a2f70ff",
    "#F19066", "#3DC7BE", "#E66767", "#778BEB", "#F7D794"
  ];
  return palette[index % palette.length];
}
// ================== DASHBOARD PARA MÚLTIPLOS GRÁFICOS ==================

const AUTO_REFRESH_MS = 8000;

const chartConfigs = {
  "grafico1": {
    dataUrl: "data/grafico1.json",
    dataKey: "faixas",
    labelKey: "faixa",
    valueKey: "valor"
  },
  "grafico2": {
    dataUrl: "data/grafico2.json", 
    dataKey: "sexo",
    labelKey: "sexo",
    valueKey: "valor"
  },
  "grafico3": {
    dataUrl: "data/grafico3.json",
    dataKey: "tipos",
    labelKey: "tipo", 
    valueKey: "valor"
  },
  "grafico4": {
    dataUrl: "data/grafico4.json",
    dataKey: "destinos",
    labelKey: "destino", 
    valueKey: "valor"
  },
  "grafico5": {
    dataUrl: "data/grafico5.json",
    dataKey: "ocorrenciasPorHorario",
    labelKey: "hora", 
    valueKey: "numeroDeAcidentes"
  },
  "grafico6": {
    dataUrl: "data/grafico6.json",
    dataKey: "frequenciaPorMesEAno",
    labelKey: "mes", 
    valueKey: "mediaMensal"
  }
};

const chartStates = {};

Object.keys(chartConfigs).forEach(chartId => {
  chartStates[chartId] = {
    rawData: null,
    sorted: false,
    chartInstance: null,
    currentType: "bar",
    firstRender: true
  };
});

function getCurrentChartId() {
  return pages[currentPage].getAttribute("data-chart");
}

function getCurrentChartConfig() {
  const chartId = getCurrentChartId();
  return chartConfigs[chartId];
}

function getCurrentChartState() {
  const chartId = getCurrentChartId();
  return chartStates[chartId];
}

function prepareDataset(dataArr, normalize = false, config, chartId) {
  const labels = dataArr.map(d => {
    if (chartId === "grafico5") {
      return `${d[config.labelKey]}h`;
    }
    return d[config.labelKey];
  });
  
  const values = dataArr.map(d => Number(d[config.valueKey]));
  const total = values.reduce((s, v) => s + v, 0);
  const displayValues = normalize ? values.map(v => Number(((v / total) * 100).toFixed(2))) : values;
  return { labels, values: displayValues, rawValues: values, total };
}

function buildLegend(container, labels, colors, rawValues) {
  container.innerHTML = "";
  container.style.background = "#1b1b1b";
  container.style.padding = "16px";
  container.style.borderRadius = "10px";
  container.style.marginTop = "20px";
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fill, minmax(180px, 1fr))";
  container.style.gap = "12px";

  labels.forEach((lab, i) => {
    const box = document.createElement("div");
    box.style.display = "flex";
    box.style.alignItems = "center";
    box.style.gap = "10px";
    box.style.padding = "8px 12px";
    box.style.background = "#252525";
    box.style.borderRadius = "8px";
    box.style.color = "#f0f0f0";
    box.style.fontFamily = "Poppins, sans-serif";
    box.style.transition = "background 0.3s";

    const sw = document.createElement("span");
    sw.style.width = "16px";
    sw.style.height = "16px";
    sw.style.background = colors[i];
    sw.style.borderRadius = "4px";
    sw.style.flexShrink = "0";
    sw.style.border = "1px solid #444";

    const t = document.createElement("div");
    t.innerHTML = `<strong style="color:${colors[i]}">${lab}</strong><div style="font-size:0.85rem;color:#aaa;">${rawValues[i]} acidentes</div>`;

    box.appendChild(sw);
    box.appendChild(t);
    container.appendChild(box);
  });
}

function renderChart(type, prepared, animate = true) {
  const currentPageElement = pages[currentPage];
  const canvas = currentPageElement.querySelector(".chartCanvas");
  const normalizeChk = currentPageElement.querySelector(".normalizeChk");
  
  const ctx = canvas.getContext("2d");
  const chartState = getCurrentChartState();

  if (chartState.chartInstance) chartState.chartInstance.destroy();

  
  const colors = prepared.labels.map((_, i) => colorForLabel(i));
  const borderColor = "#a0ffef";

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animate ? { duration: 700, easing: "easeOutCubic" } : false,
    plugins: {
      legend: { display: false },
      datalabels: {
        color: "#fff",
        formatter: v => normalizeChk.checked ? `${v}%` : v,
        font: { size: 12, weight: "bold" }
      }
    }
  };


  if (type === "radar") {
    chartState.chartInstance = new Chart(ctx, {
      type: "radar",
      data: {
        labels: prepared.labels,
        datasets: [{
          label: normalizeChk.checked ? "% do total" : "Número de Acidentes",
          data: prepared.values,
          backgroundColor: "rgba(120, 120, 120, 0.4)", 
          borderColor: "rgba(63, 63, 63, 1)", 
          borderWidth: 2,
          pointBackgroundColor: colors, 
          pointBorderColor: "#ffffff",
          pointRadius: 6,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: colors.map(color => color + "CC"), 
          pointHoverBorderColor: "#ffffff",
          pointBorderWidth: 2,
        }]
      },
      options: {
        ...commonOptions,
        scales: {
          r: {
            angleLines: { color: "rgba(255, 255, 255, 0.1)" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            pointLabels: {
              color: "#f5f5f5",
              font: { size: 13, family: "Poppins, sans-serif", weight: "500" }
            },
            ticks: {
              display: false,
              stepSize: 10,
              color: "#999"
            },
            suggestedMin: 0
          }
        }
      },
      plugins: {
        legend: { display: false },
      }
    });
  } else {

    chartState.chartInstance = new Chart(ctx, {
      type: (type === "horizontalBar") ? "bar" : type,
      data: {
        labels: prepared.labels,
        datasets: [{
          label: normalizeChk.checked ? "% do total" : "Número de Acidentes",
          data: prepared.values,
          backgroundColor: colors,
          borderColor: "#dde4e1ff",
          borderWidth: 1
        }]
      },
      options: {
        ...commonOptions,
        indexAxis: (type === "horizontalBar") ? "y" : "x",
        scales: {
          x: { ticks: { color: "#ccc" }, grid: { color: "#333" } },
          y: { ticks: { color: "#ccc" }, grid: { color: "#333" } }
        }
      },
      
      plugins: [ChartDataLabels]
    });
  }

  const legendContainer = currentPageElement.querySelector(".legend-container");
  buildLegend(legendContainer, prepared.labels, colors, prepared.rawValues);
}

async function fetchAndUpdate(chartId) {
  try {
    const config = chartConfigs[chartId];
    const chartState = chartStates[chartId];
    const currentPageElement = document.querySelector(`[data-chart="${chartId}"]`);

    if (!currentPageElement || !config) return;

    const metaInfo = currentPageElement.querySelector(".metaInfo");
    const footerText = currentPageElement.querySelector(".footerText");
    const normalizeChk = currentPageElement.querySelector(".normalizeChk");

    const res = await fetch(config.dataUrl, { cache: "no-store" });
    const json = await res.json();

    chartState.rawData = json;
    metaInfo.textContent = `Fonte: ${json.meta.fonte}`;
    footerText.textContent = `Fonte: ${json.meta.fonte}`;
    
if (chartId === "grafico6") {
  const dataObj = json[config.dataKey];
  const currentPageElement = pages[currentPage];
  const canvas = currentPageElement.querySelector(".chartCanvas");
  const ctx = canvas.getContext("2d");
  const normalizeChk = currentPageElement.querySelector(".normalizeChk");
  const chartTypeSel = currentPageElement.querySelector(".chartType");
  const chartType = chartTypeSel ? chartTypeSel.value : "bar";

  if (chartState.chartInstance) chartState.chartInstance.destroy();

  const prepared = {
    labels: dataObj.labels,
    datasets: dataObj.datasets.map(ds => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.backgroundColor,
      borderColor: ds.borderColor || "#8f8f8fff",
      borderWidth: 2,
      fill: chartType === "radar" ? true : false,
      tension: 0.3
    }))
  };

  const isFirstRender = chartState.firstRender;
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: isFirstRender ? { duration: 700, easing: "easeOutCubic" } : false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#f0f0f0",
          font: { family: "Poppins, sans-serif", size: 13 }
        }
      },
      datalabels: {
        color: "#fff",
        font: { size: 11, weight: "bold" },
        anchor: "end",
        align: "top"
      }
    },
    scales: {
      x: {
        ticks: { color: "#ccc" },
        grid: { color: "rgba(255,255,255,0.1)" }
      },
      y: {
        ticks: { color: "#ccc" },
        grid: { color: "rgba(255,255,255,0.1)" },
        beginAtZero: true
      }
    }
  };

  const typeMap = {
    bar: "bar",
    horizontalBar: "bar",
    pie: "pie",
    doughnut: "doughnut",
    radar: "radar"
  };

  if (chartType === "horizontalBar") {
    commonOptions.indexAxis = "y";
  }
  if (chartType === "radar") {
    prepared.datasets = prepared.datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: i === 0 ? "rgba(54, 162, 235, 0.35)" : "rgba(255, 99, 132, 0.35)", // azul e vermelho translúcidos
      borderColor: i === 0 ? "rgba(54, 162, 235, 1)" : "rgba(255, 99, 132, 1)",
      pointBackgroundColor: i === 0 ? "rgba(54, 162, 235, 1)" : "rgba(255, 99, 132, 1)",
      pointBorderColor: "#fff",
      pointRadius: 6,
      pointHoverRadius: 8,
      pointHoverBackgroundColor: i === 0 ? "rgba(54, 162, 235, 1)" : "rgba(255, 99, 132, 1)",
      pointHoverBorderColor: "#fff",
      borderWidth: 2,
      fill: true,
      tension: 0.3
    }));

        commonOptions.scales = {
      r: {
        grid: { color: "rgba(255, 255, 255, 0.08)" },
        angleLines: { color: "rgba(255, 255, 255, 0.08)" },
        pointLabels: {
          color: "#f5f5f5",
          font: { size: 13, family: "Poppins, sans-serif" }
        },
        ticks: {
          display: false,
          beginAtZero: true
        }
      }
    };
  }
  
  chartState.chartInstance = new Chart(ctx, {
    type: typeMap[chartType],
    data: prepared,
    options: commonOptions,
    plugins: [ChartDataLabels]
  });

  
  chartState.firstRender = false;

  const legendContainer = currentPageElement.querySelector(".legend-container");
  legendContainer.innerHTML = "";
  prepared.datasets.forEach((ds, i) => {
    const box = document.createElement("div");
    box.style.display = "flex";
    box.style.alignItems = "center";
    box.style.gap = "10px";
    box.style.padding = "8px 12px";
    box.style.background = "#252525";
    box.style.borderRadius = "8px";
    box.style.color = "#f0f0f0";
    box.style.fontFamily = "Poppins, sans-serif";

    const sw = document.createElement("span");
    sw.style.width = "16px";
    sw.style.height = "16px";
    sw.style.background = ds.backgroundColor;
    sw.style.borderRadius = "4px";
    sw.style.border = "1px solid #444";

    const t = document.createElement("div");
    t.innerHTML = `<strong style="color:${ds.backgroundColor}">${ds.label}</strong>`;

    box.appendChild(sw);
    box.appendChild(t);
    legendContainer.appendChild(box);
  });

  return; 
}


    let dataArr = json[config.dataKey].map(x => ({
      [config.labelKey]: x[config.labelKey],
      [config.valueKey]: Number(x[config.valueKey])
    }));

    if (chartState.sorted)
      dataArr = dataArr.slice().sort((a, b) => b[config.valueKey] - a[config.valueKey]);

    const prepared = prepareDataset(dataArr, normalizeChk.checked, config, chartId);
    renderChart(chartState.currentType, prepared, chartState.firstRender);

    chartState.firstRender = false;
  } catch (err) {
    console.error(`Erro ao carregar dados para ${chartId}:`, err);
    const currentPageElement = document.querySelector(`[data-chart="${chartId}"]`);
    if (currentPageElement) {
      const metaInfo = currentPageElement.querySelector(".metaInfo");
      metaInfo.textContent = "Erro ao carregar dados — ver console.";
    }
  }
}


function updateCurrentChart() {
  const chartId = getCurrentChartId();
  if (chartId && chartConfigs[chartId]) {
    fetchAndUpdate(chartId);
  }
}

function setupPageListeners() {
  pages.forEach(page => {
    const chartId = page.getAttribute("data-chart");
    if (!chartId || !chartConfigs[chartId]) return;
    
    const chartTypeSel = page.querySelector(".chartType");
    const toggleSortBtn = page.querySelector(".toggleSortBtn");
    const normalizeChk = page.querySelector(".normalizeChk");
    
    if (chartTypeSel) {
      chartTypeSel.value = chartStates[chartId].currentType;
      chartTypeSel.addEventListener("change", e => {
        chartStates[chartId].currentType = e.target.value;
        fetchAndUpdate(chartId);
      });
    }
    
    if (toggleSortBtn) {
      toggleSortBtn.addEventListener("click", () => {
        chartStates[chartId].sorted = !chartStates[chartId].sorted;
        fetchAndUpdate(chartId);
      });
    }
    
    if (normalizeChk) {
      normalizeChk.addEventListener("change", () => {
        fetchAndUpdate(chartId);
      });
    }
  });
}

function initializeAllCharts() {
  const currentChartId = getCurrentChartId();
  if (currentChartId && chartConfigs[currentChartId]) {
    fetchAndUpdate(currentChartId);
  }
  

}

document.addEventListener('DOMContentLoaded', function() {
  setupPageListeners();
  initializeAllCharts();
});

setInterval(() => {
  const currentChartId = getCurrentChartId();
  if (currentChartId && chartConfigs[currentChartId]) {
    fetchAndUpdate(currentChartId);
  }
}, AUTO_REFRESH_MS);

const arrowLeft = document.getElementById("prevPage");
const arrowRight = document.getElementById("nextPage");

arrowLeft.style.visibility = "hidden";
arrowRight.style.visibility = "hidden";

window.addEventListener("load", () => {
  setTimeout(() => {
    arrowLeft.style.visibility = "visible";
    arrowRight.style.visibility = "visible";
  }, 150);
});

document.addEventListener('DOMContentLoaded', function() {
  const introBlock = document.querySelector('.intro-block');

  if (!introBlock.querySelector('.minimize-btn')) {
    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'minimize-btn';
    minimizeBtn.innerHTML = '−';
    minimizeBtn.title = 'Minimizar/Maximizar';
    
    introBlock.appendChild(minimizeBtn);

    minimizeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      introBlock.classList.toggle('minimized');
      minimizeBtn.innerHTML = introBlock.classList.contains('minimized') ? '+' : '−';
    });


    introBlock.addEventListener('click', function(e) {
      if (introBlock.classList.contains('minimized') && e.target !== minimizeBtn) {
        introBlock.classList.remove('minimized');
        minimizeBtn.innerHTML = '−';
      }
    });
  }
});


