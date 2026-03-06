// Canvas
const margin = 2;
let table;
let emissions = {};
let years = [];
let provinces = [];
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
  drawRadialChart();
}

function setup() {
  let canvasWidth = windowWidth - 2 * margin;
  let canvasHeight = windowHeight - 2 * margin;
  createCanvas(canvasWidth, canvasHeight);
  angleMode(RADIANS);
  noLoop();
  processData();
  years = shuffle(Object.keys(emissions).map(Number));
  provinces = Object.keys(emissions[years[0]]).sort();
  drawRadialChart();
}

function preload() {
  table = loadTable("emissions.csv", "csv", "header");
}

// ================================= Data Processing =================================
function processData() {
  let currentProvince = "";

  for (let row = 0; row < table.getRowCount(); row++) {
    let geo = table.getString(row, "Geography");
    let sector = table.getString(row, "Sector");

    // Get province name
    if (geo !== "") {
      currentProvince = geo;

      // Keep total emissions for industries and households
      if (
        sector === "Total, industries and households" &&
        currentProvince !== "Canada"
      ) {
        for (let year = startYear; year <= endYear; year++) {
          if (!emissions[year]) {
            emissions[year] = {};
          }

          let value = table.getString(row, year.toString());
          value = Number(value.replace(/,/g, "").trim());
          emissions[year][currentProvince] = value;
        }
      }
    }
  }
  // console.log(emissions);
}

// ================================= Visualization =================================
function drawRadialChart() {
  randomSeed(42);
  background(20);
  strokeCap(SQUARE);

  push();
  translate(width / 2, height / 2);

  // Each ring represents a year
  for (let year = 0; year < years.length; year++) {
    let currentYear = years[year];
    let radius = INNER_RADIUS + year * RING_SPACING;
    let angleCursor = random(TWO_PI);

    let shuffledProvinces = shuffle(provinces);

    // Generate random gaps for each province
    let gaps = [];
    let totalGapAngles = 0;
    for (let p = 0; p < shuffledProvinces.length; p++) {
      let randGap = random(0.1, 1.5); // Random gap width
      gaps.push(randGap);
      totalGapAngles += randGap;
    }

    // Normalize gaps so they don't consume the whole circle
    let randomGapPercent = random(0.1, 0.8);
    let maxGapAllowed = TWO_PI * randomGapPercent;
    let scale = maxGapAllowed / totalGapAngles;
    gaps = gaps.map((g) => g * scale);
    totalGapAngles = maxGapAllowed;

    // Calculate available angle (360 degrees minus the total gaps)
    let availableAngle = TWO_PI - totalGapAngles;

    let yearlyTotal = 0;
    for (let p = 0; p < shuffledProvinces.length; p++) {
      yearlyTotal += emissions[currentYear][shuffledProvinces[p]];
    }

    // Each segment represents a province's emissions for that year
    for (let p = 0; p < shuffledProvinces.length; p++) {
      let emissionAmount = emissions[currentYear][shuffledProvinces[p]];
      let arcSize = (emissionAmount / yearlyTotal) * availableAngle;
      let endAngle = angleCursor + arcSize;

      let randThickness = random(MIN_THICKNESS, MAX_THICKNESS);
      let originalIndex = provinces.indexOf(shuffledProvinces[p]);
      let arcColor = getProvinceColor(originalIndex, provinces.length);

      drawArcSegment(angleCursor, endAngle, radius, randThickness, arcColor);

      angleCursor = endAngle + gaps[p];
    }
  }
  pop();
  drawLegend();
}

function drawArcSegment(startAngle, endAngle, radius, thickness, color) {
  stroke(color);
  strokeWeight(thickness);
  noFill();
  arc(0, 0, radius * 2, radius * 2, startAngle, endAngle);
}

function getProvinceColor(index, total) {
  colorMode(HSB, 360, 100, 100);
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
    let color = getProvinceColor(i, provinces.length);
    fill(color);
    rect(0, i * 20, 12, 12); // Color swatch

    fill(255); // Text color
    text(provinces[i], 20, i * 20 + 6);
  }
  pop();
}
