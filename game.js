const svg = document.getElementById("map");
const input = document.getElementById("guess-input");
const message = document.getElementById("message");

let mode = "aimag"; 
let places = [];    // buh gazriin jagsaalt 
let secret;       // computeriin songoson nuuts gazar
let guesses = []; // toglogchiin taasan gazruud, tednii zai
let gameOver = false;

const MAP_WIDTH = 1000;

// Mongoliin hamgiin zahiin tseguud
const MIN_LON = 87.7, MAX_LON = 120, MIN_LAT = 41.5, MAX_LAT = 52.2;
const COS = Math.cos(47 * Math.PI / 180);
const SCALE = MAP_WIDTH / ((MAX_LON - MIN_LON) * COS);
const MAP_HEIGHT = (MAX_LAT - MIN_LAT) * SCALE;

svg.setAttribute("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);

// urtgar urgurug gesen tseguudiig holboj svg zam zurna
function toPath(rings) {
  let d = "";
  for (const ring of rings) {
    ring.forEach(([lon, lat], i) => {
      const x = (lon - MIN_LON) * COS * SCALE;
      const y = (MAX_LAT - lat) * SCALE;
      d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
    });
    d += "Z";
  }
  return d;
}

// <path> element uusgej helber bolon class uguud svg dotor nemne
function addShape(rings, className) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", toPath(rings));
  path.setAttribute("class", className);
  svg.appendChild(path);
  return path;
}

function drawMap() {
  svg.innerHTML = "";
  for (const place of places) {
    place.el = addShape(place.rings, "region");
  }
  if (mode === "sum") {
    for (const aimag of AIMAGS) addShape(aimag.rings, "aimag-border");
  }
}

// delhiin bumburtsgiin 2 tsegiin hoorondoh zaig olno
function haversine(lon1, lat1, lon2, lat2) {
  const r = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * r / 2) ** 2 +
            Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lon2 - lon1) * r / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

// a gazriin hil deerh tseg buriig b gazriin hil deerh tseg burtei haritsuulj hamgiin oir hosiin zaig olno.
function distance(a, b) {
  let best = Infinity;
  for (const [lon1, lat1] of a.rings.flat()) {
    for (const [lon2, lat2] of b.rings.flat()) {
      best = Math.min(best, haversine(lon1, lat1, lon2, lat2));
    }
  }
  return best < 3 ? 0 : Math.round(best); // 3 км-ээс бага бол хөрш
}

// km oirtoh tusam ulaan, holdoh tusam tsaivar
function colorFor(km) {
  const t = Math.min(km / 1200, 1);
  return `hsl(${10 + t * 40}, 100%, ${45 + t * 40}%)`;
}


function startGame() {
  if (mode === "aimag") {
    places = AIMAGS.map((a) => ({ label: a.name, rings: a.rings }));
  } else {
    places = SUMS
      .filter((s) => s.aimag !== "Улаанбаатар")
      .map((s) => ({ label: `${s.name} (${s.aimag})`, rings: s.rings }));
  }

  secret = places[Math.floor(Math.random() * places.length)];
  guesses = [];
  gameOver = false;
  message.textContent = "";

  document.getElementById("names").innerHTML =
    places.map((p) => `<option value="${p.label}">`).join("");

  drawMap();
  drawList();
}

function makeGuess() {
  if (gameOver) return;

  const text = input.value.trim().toLowerCase();
  const place = places.find((p) => p.label.toLowerCase() === text) ||
                places.find((p) => p.label.toLowerCase().startsWith(text));
  input.value = "";

  if (!text || !place) {
    message.textContent = "Ийм нэр олдсонгүй";
    return;
  }
  if (guesses.some((g) => g.place === place)) {
    message.textContent = "Аль хэдийн таасан байна";
    return;
  }

  const km = place === secret ? -1 : distance(place, secret);
  guesses.push({ place, km });

  if (place === secret) {
    place.el.style.fill = "#2f9e44";
    message.textContent = `Олчихлоо! ${guesses.length} таалтаар.`;
    gameOver = true;
  } else {
    place.el.style.fill = colorFor(km);
    message.textContent = km === 0 ? "Маш ойрхон, бараг л хөрш байна!" : `${km} км зайтай`;
  }

  drawList();
}

function drawList() {
  const list = document.getElementById("guess-list");
  list.innerHTML = "";

  const sorted = [...guesses].sort((a, b) => a.km - b.km);
  for (const g of sorted) {
    const isSecret = g.place === secret;
    const li = document.createElement("li");
    li.style.borderColor = isSecret ? "#2f9e44" : colorFor(g.km);
    li.innerHTML = `<span>${g.place.label}</span>
                    <b>${isSecret ? "✓" : g.km === 0 ? "Хөрш" : g.km + " км"}</b>`;
    list.appendChild(li);
  }
}


document.getElementById("guess-btn").addEventListener("click", makeGuess);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") makeGuess();
});

document.getElementById("new-game").addEventListener("click", startGame);

document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelector(".mode-btn.active").classList.remove("active");
    btn.classList.add("active");
    mode = btn.dataset.mode;
    startGame();
  });
});

startGame();