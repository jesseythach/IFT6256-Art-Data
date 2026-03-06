// Canvas
const margin = 2;
let table;
let emissions = {};
let years = [];
let provinces = [];
let minVal = Infinity;
let maxVal = -Infinity;
let startYear = 2009;
let endYear = 2023;

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
  drawRadialChart();
}

function preload() {
  table = loadTable("emissions.csv", "csv", "header");
}

function processData() {
  let currentProvince = "";

  for (let row = 0; row < table.getRowCount(); row++) {
    let geo = table.getString(row, "Geography");
    let sector = table.getString(row, "Sector");

    // Get province name
    if (geo !== "" && geo !== "Canada") {
      currentProvince = geo;
    }

    // Keep total emissions for industries and households
    if (
      sector === "Total, industries and households" &&
      currentProvince !== ""
    ) {
      emissions[currentProvince] = {};

      for (let year = startYear; year <= endYear; year++) {
        let value = table.getString(row, year.toString());
        if (value) {
          value = Number(value.replace(/,/g, ""));
          emissions[currentProvince][year] = value;

          minVal = min(minVal, value);
          maxVal = max(maxVal, value);
        }
      }
    }
  }

  provinces = Object.keys(emissions);

  for (let year = startYear; year <= endYear; year++) {
    // todo: can I put this for loop outside of processData?
    years.push(year);
  }

  console.log(emissions);
  console.log("Min:", minVal, "Max:", maxVal);
}

function drawRadialChart() {
  background(240);
  translate(width / 2, height / 2);

  let innerRadius = 20; // todo: global variable?
  let ringSpacing = 40; // todo: global variable?

  let startAngle = -PI / 2; // start from top
  let maxAngle = TWO_PI * 0.85; // leave gap like example

  for (let y = 0; y < years.length; y++) {
    let year = years[y];
    let radius = innerRadius + y * ringSpacing;
    let angleCursor = startAngle;

    for (let p = 0; p < provinces.length; p++) {
      let province = provinces[p];
      let value = emissions[province][year];

      if (!value) continue;

      // map emissions to arc length
      let arcSize = map(
        value,
        minVal,
        maxVal,
        0.01,
        (maxAngle / provinces.length) * 1.8,
      );
      let endAngle = angleCursor + arcSize;
      let col = color(map(p, 0, provinces.length, 50, 200), 150, 200);

      drawArcSegment(angleCursor, endAngle, radius, 18, col);
      angleCursor += arcSize + 0.03; // spacing between segments
    }
  }
}

function drawArcSegment(startAngle, endAngle, radius, thickness, col) {
  stroke(col);
  strokeWeight(thickness);
  noFill();
  arc(0, 0, radius * 2, radius * 2, startAngle, endAngle);
}