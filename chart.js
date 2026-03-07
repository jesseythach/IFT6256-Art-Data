const MARGIN = 2;
let table;
let emissions = {};
let years = [];
let rings = [];
let provinces = [];
let provinceColors = {};

const START_YEAR = 2009;
const END_YEAR = 2023;
const TOTAL_YEARS = END_YEAR - START_YEAR + 1;

const MIN_THICKNESS = 4;
const MAX_THICKNESS = 18;

let colorProfile = 1;
let enableLegend = false;
let stopAnimation = false;

// ================================= Canvas =================================

function windowResized() {
  let canvasWidth = windowWidth - 2 * MARGIN;
  let canvasHeight = windowHeight - 2 * MARGIN;
  resizeCanvas(canvasWidth, canvasHeight);
}

function setup() {
  let canvasWidth = windowWidth - 2 * MARGIN;
  let canvasHeight = windowHeight - 2 * MARGIN;
  createCanvas(canvasWidth, canvasHeight);
  angleMode(RADIANS);
  colorMode(HSB, 360, 100, 100);

  let savedProfile = localStorage.getItem("colorProfile");
  if (savedProfile !== null) {
    colorProfile = Number(savedProfile);
  }

  processData();
  years = Object.keys(emissions).map(Number);
  provinces = Object.keys(emissions[years[0]]).sort();
  provinceColors = generateProvinceColors(provinces);
  initializeRings();
}

// ================================= Data Processing =================================
function preload() {
  table = loadTable("emissions.csv", "csv", "header");
}

function processData() {
  let currentProvince = "";

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    emissions[year] = {};
  }

  for (let row = 0; row < table.getRowCount(); row++) {
    let geo = table.getString(row, "Geography");
    let sector = table.getString(row, "Sector");
    if (geo !== "") currentProvince = geo; // Get province name

    // Keep total emissions for industries and households only
    if (
      sector === "Total, industries and households" &&
      currentProvince !== "Canada"
    ) {
      for (let year = START_YEAR; year <= END_YEAR; year++) {
        let emissionValue = table.getString(row, year.toString());
        emissions[year][currentProvince] = Number(
          emissionValue.replace(/,/g, "").trim(),
        );
      }
    }
  }
}

// ================================= Visualization =================================
function initializeRings() {
  // randomSeed(42);

  let radiuses = [];
  let spacingWeights = [];

  let maxRadius = min(width, height) * 0.45; // Max radius for outermost ring
  let availableSpace = maxRadius - MAX_THICKNESS;

  // Generate random relative spacing weights for each ring
  for (let year = 0; year < TOTAL_YEARS; year++) {
    spacingWeights.push(random(1, 4));
  }

  // Normalize weights so rings fit inside canvas
  let totalWeight = spacingWeights.reduce((sum, weight) => sum + weight, 0);
  let scale = availableSpace / totalWeight;
  spacingWeights = spacingWeights.map((weight) => weight * scale); // Real spacing in pixels

  // Build radiuses sequentially
  let runningRadius = random(20, 40);
  for (let year = 0; year < TOTAL_YEARS; year++) {
    radiuses.push(runningRadius);
    runningRadius += spacingWeights[year];
  }

  // Create a ring for each year
  rings = years.map(
    (year, index) =>
      new Ring(year, index, provinces, emissions[year], radiuses[index]),
  );
}

function draw() {
  background(0);

  push();
  translate(width / 2, height / 2);
  let hovered = null;
  let mx = mouseX - width / 2;
  let my = mouseY - height / 2;
  let mouseAngle = atan2(my, mx);
  if (mouseAngle < 0) mouseAngle += TWO_PI;
  let mouseDist = dist(0, 0, mx, my);

  for (let ring of rings) {
    if (!stopAnimation) ring.update();
    ring.display();

    let seg = ring.getHoveredSegment(mouseAngle, mouseDist);
    if (seg) {
      hovered = {
        province: seg.province,
        year: ring.year,
      };
    }
  }
  pop();

  if (enableLegend) drawLegend();
  if (hovered) {
  drawTooltip(hovered);
}
}

// ================================= Utilities =================================
function generateProvinceColors(provinces) {
  const colors = {};
  provinces.forEach((p, i) => {
    colors[p] = getProvinceColor(p, i, provinces.length);
  });
  return colors;
}

function getProvinceColor(province, index, total) {
  // Profile 1: Fixed province colors
  if (colorProfile === 1) {
    const PROVINCE_COLOR_MAP = {
    "Alberta": "#0033A0",
    "British Columbia": "#0033A0",
    "Manitoba": "#C8102E",
    "New Brunswick": "#F2A900",
    "Newfoundland and Labrador": "#E41E26",
    "Northwest Territories": "#0099CC",
    "Nova Scotia": "#0033A0",
    "Nunavut": "#FFD100",
    "Ontario": "#C8102E",
    "Prince Edward Island": "#FCD116",
    "Quebec": "#003DA5",
    "Saskatchewan": "#006847",
    "Yukon": "#009739",
  };
    return color(PROVINCE_COLOR_MAP[province]);
  }

  // Profile 2: Gradient from blue to purple
  if (colorProfile === 2) {
    let hue = map(index, 0, total, 180, 280);
    return color(hue, 60, 80);
  }

  // Profile 3: Vibrant rainbow
  if (colorProfile === 3) {
    let hue = map(index, 0, total, 0, 360);
    let saturation = map(index, 0, total, 80, 100);
    let brightness = map(index, 0, total, 80, 100);
    return color(hue, saturation, brightness);
  }

  // Profile 4: Pastel
  if (colorProfile === 4) {
    const PASTEL_COLORS = [
      "#f7abcb",
      "#7cde98",
      "#e6dd91",
      "#56a1e8",
      "#a776cf",
      "#e86d96",
    ];
    return color(PASTEL_COLORS[index % PASTEL_COLORS.length]);
  }
}

function drawLegend() {
  push();
  translate(150, height / 2 - (provinces.length * 20) / 2);

  textAlign(LEFT, CENTER);
  textSize(20);
  noStroke();

  for (let prov = 0; prov < provinces.length; prov++) {
    let color = provinceColors[provinces[prov]];
    fill(color);
    rect(0, prov * 20, 12, 12);
    fill(200);
    text(provinces[prov], 20, prov * 20 + 6);
  }
  pop();
}

function drawTooltip(data) {
  let label = data.province + " " + data.year + " — " + emissions[data.year][data.province] + " kt";

  textSize(20);
  let padding = 8;
  let width = textWidth(label) + padding * 2;
  let height = 30;

  fill(255);
  stroke(255);
  rect(mouseX + 15, mouseY + 15, width, height, 12);

  fill(0);
  textAlign(LEFT, CENTER);
  text(label, mouseX + 15 + padding, mouseY + 16 + height / 2);
}

function keyPressed() {
  const validProfiles = ["1", "2", "3", "4"];
  if (validProfiles.includes(key)) {
    colorProfile = Number(key);
    provinceColors = generateProvinceColors(provinces);
    localStorage.setItem("colorProfile", colorProfile);
  }

  if (key === "l") {
    enableLegend = !enableLegend;
  }

  if (key === "s") {
    stopAnimation = !stopAnimation;
  }
}
