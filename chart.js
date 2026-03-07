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

const INNER_RADIUS = 30;
const MIN_THICKNESS = 4;
const MAX_THICKNESS = 18;

let colorProfile = 1;

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

  // Load saved color profile
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
  randomSeed(42);

  let radiuses = [];
  let spacingWeights = [];

  let maxRadius = min(width, height) * 0.42; // Max radius for outermost ring
  let availableSpace = maxRadius - INNER_RADIUS - MAX_THICKNESS;

  // Generate random relative spacing weights for each ring
  for (let year = 0; year < TOTAL_YEARS; year++) {
    spacingWeights.push(random(0.5, 1.5));
  }

  // Normalize weights so rings fit inside canvas
  let totalWeight = spacingWeights.reduce((sum, weight) => sum + weight, 0);
  let scale = availableSpace / totalWeight;
  spacingWeights = spacingWeights.map((weight) => weight * scale); // Real spacing in pixels

  // Build radiuses sequentially
  let runningRadius = INNER_RADIUS;
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
  background(5);

  push();
  translate(width / 2, height / 2);
  for (let ring of rings) {
    ring.update();
    ring.display();
  }
  pop();

  drawLegend();
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
    return color(PROVINCE_COLOR_MAP[province] || "#888888");
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
    let hex = PASTEL_COLORS[index % PASTEL_COLORS.length];
    return color(hex);
  }
}

function drawLegend() {
  push();
  translate(150, height / 2 - (provinces.length * 20) / 2);

  textAlign(LEFT, CENTER);
  textSize(20);
  noStroke();

  for (let i = 0; i < provinces.length; i++) {
    let color = provinceColors[provinces[i]];
    fill(color);
    rect(0, i * 20, 12, 12); // Color swatch

    fill(200); // Text color
    text(provinces[i], 20, i * 20 + 6);
  }
  pop();
}

function keyPressed() {
  const validProfiles = ["1", "2", "3", "4"];
  if (validProfiles.includes(key)) {
    colorProfile = Number(key);
    provinceColors = generateProvinceColors(provinces);
    localStorage.setItem("colorProfile", colorProfile);
  }
}
