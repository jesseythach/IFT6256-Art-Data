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
  colorMode(HSB);

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

  spacingWeights = spacingWeights.map((weight) => weight * scale); 
  // spacingWeights.push(map(noise(i * 0.25), 0, 1, 0.5, 1.5)); // Real spacing in pixels

  // Build radiuses sequentially
  let runningRadius = INNER_RADIUS;
  for (let year = 0; year < TOTAL_YEARS; year++) {
    radiuses.push(runningRadius);
    runningRadius += spacingWeights[year];
  }

  // Create a ring for each year
  rings = years.map(
    (year, index) => new Ring(year, index, provinces, emissions[year], radiuses[index]),
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

  // drawLegend();
}

function generateProvinceColors(provinces) {
  const colors = {};
  provinces.forEach((p, i) => {
    colors[p] = getProvinceColor(i, provinces.length);
  });
  return colors;
}

function getProvinceColor(index, total) {
  let hue = map(index, 0, total, 180, 280); // Blue to Purple range
  return color(hue, 60, 80);
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
