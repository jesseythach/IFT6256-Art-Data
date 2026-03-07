const margin = 2;
let table;
let emissions = {};
let years = [];
let rings = [];
let provinces = [];
let provinceColors = {};

let startYear = 2009;
let endYear = 2023;

const INNER_RADIUS = 30;
const RING_SPACING = 28; // randomize it after animation
const MIN_THICKNESS = 4;
const MAX_THICKNESS = 18;

// ================================= Canvas =================================

function windowResized() {
  let canvasWidth = windowWidth - 2 * margin;
  let canvasHeight = windowHeight - 2 * margin;
  resizeCanvas(canvasWidth, canvasHeight);
}

function setup() {
  let canvasWidth = windowWidth - 2 * margin;
  let canvasHeight = windowHeight - 2 * margin;
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

  for (let year = startYear; year <= endYear; year++) {
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
      for (let year = startYear; year <= endYear; year++) {
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

  // Create a ring for each year
  rings = years.map(
    (year, index) => new Ring(year, index, provinces, emissions[year]),
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
