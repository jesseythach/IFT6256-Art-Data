// Represents an arc segment for a province in a given year
class Segment {
  constructor(start, end, thickness, color, provinceName) {
    this.start = start;
    this.end = end;
    this.thickness = thickness;
    this.color = color;
    this.province = provinceName;
  }

  display(radius) {
    stroke(this.color);
    strokeWeight(this.thickness);
    noFill();
    strokeCap(SQUARE);
    arc(0, 0, radius * 2, radius * 2, this.start, this.end);
  }
}

// ===============================================================================

// Represents a ring for a specific year, containing segments for each province
class Ring {
  constructor(year, ringIndex, provinces, provinceEmission, radius) {
    this.year = year;
    this.provinces = provinces;
    this.radius = radius;
    this.rotation = random(TWO_PI); // Start with a random rotation
    this.speed = random(-0.02, 0.02) * map(ringIndex, 0, TOTAL_YEARS, 1, 0.1); // Outer rings rotate faster
    this.segments = [];

    this._initSegments(provinceEmission);
  }

  _initSegments(provinceEmission) {
    let shuffledProvinces = shuffle([...this.provinces]);
    let yearlyTotal = Object.values(provinceEmission).reduce(
      (a, b) => a + b,
      0,
    );

    // Generate random gaps between segments, then scale them to fit within the circle
    let rawGaps = shuffledProvinces.map(() => random(0.1, 1.5));
    let cumulativeRawGaps = rawGaps.reduce((a, b) => a + b, 0);

    let maxGapAllowed = TWO_PI * random(0.1, 0.8); // Allow gaps to take up 10% to 80% of the circle
    let scale = maxGapAllowed / cumulativeRawGaps;
    let scaledGaps = rawGaps.map((g) => g * scale);

    let angleCursor = 0;
    let availableAngle = TWO_PI - maxGapAllowed; // Angle available for segments after accounting for gaps

    // Create segments for each province based on their emissions
    for (let shuffledIndex = 0; shuffledIndex < shuffledProvinces.length; shuffledIndex++) {
      let province = shuffledProvinces[shuffledIndex];
      let emission = provinceEmission[province];
      let arcSize = (emission / yearlyTotal) * availableAngle; // Scale arc size based on available angle
      let segment = new Segment(
        angleCursor,
        angleCursor + arcSize,
        random(MIN_THICKNESS, MAX_THICKNESS),
        provinceColors[province],
        province,
      );

      this.segments.push(segment);
      angleCursor += arcSize + scaledGaps[shuffledIndex];
    }
  }

  update() {
    this.rotation += this.speed;
  }

  display() {
    push();
    rotate(this.rotation);
    for (let seg of this.segments) {
      seg.display(this.radius);
    }
    pop();
  }
}
