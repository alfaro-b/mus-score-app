import "./style.css";

const TTANTTO_PER_HAMARREKO = 5;
const MAX_HAMARREKO = 8;
const STORAGE_KEY = "mus-score-app-state";

const state = {
  team1: { hamarreko: 0, ttantto: 0, hasWon: false },
  team2: { hamarreko: 0, ttantto: 0, hasWon: false },
};

function getTeamName(team) {
  const inputId = team === "team1" ? "teamName1" : "teamName2";
  const input = document.getElementById(inputId);
  const value = input ? input.value.trim() : "";

  if (value) return value;
  return team === "team1" ? "Équipe 1" : "Équipe 2";
}

function saveGame() {
  const data = {
    team1: state.team1,
    team2: state.team2,
    teamName1: document.getElementById("teamName1")?.value || "Équipe 1",
    teamName2: document.getElementById("teamName2")?.value || "Équipe 2",
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadGame() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);

    if (parsed.team1) {
      state.team1.hamarreko = parsed.team1.hamarreko ?? 0;
      state.team1.ttantto = parsed.team1.ttantto ?? 0;
      state.team1.hasWon = parsed.team1.hasWon ?? false;
    }

    if (parsed.team2) {
      state.team2.hamarreko = parsed.team2.hamarreko ?? 0;
      state.team2.ttantto = parsed.team2.ttantto ?? 0;
      state.team2.hasWon = parsed.team2.hasWon ?? false;
    }

    const teamName1Input = document.getElementById("teamName1");
    const teamName2Input = document.getElementById("teamName2");

    if (teamName1Input && parsed.teamName1) {
      teamName1Input.value = parsed.teamName1;
    }

    if (teamName2Input && parsed.teamName2) {
      teamName2Input.value = parsed.teamName2;
    }
  } catch (error) {
    console.error("Erreur lors du chargement de la sauvegarde :", error);
  }
}

function createDots(containerId, totalDots, activeDots) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < totalDots; i += 1) {
    const dot = document.createElement("div");
    dot.className = "dot";

    if (i < activeDots) {
      dot.classList.add("active");
    }

    container.appendChild(dot);
  }
}

function normalizeTeam(team) {
  let { hamarreko, ttantto } = state[team];

  if (ttantto >= TTANTTO_PER_HAMARREKO) {
    const carry = Math.floor(ttantto / TTANTTO_PER_HAMARREKO);
    hamarreko += carry;
    ttantto %= TTANTTO_PER_HAMARREKO;
  }

  while (ttantto < 0 && hamarreko > 0) {
    hamarreko -= 1;
    ttantto += TTANTTO_PER_HAMARREKO;
  }

  if (hamarreko < 0) hamarreko = 0;
  if (hamarreko === 0 && ttantto < 0) ttantto = 0;

  if (hamarreko > MAX_HAMARREKO) {
    hamarreko = MAX_HAMARREKO;
    ttantto = 0;
  }

  if (hamarreko === MAX_HAMARREKO) {
    ttantto = 0;
  }

  state[team].hamarreko = hamarreko;
  state[team].ttantto = ttantto;
}

function render() {
  createDots("hamarrekoDotsTeam1", MAX_HAMARREKO, state.team1.hamarreko);
  createDots("ttanttoDotsTeam1", TTANTTO_PER_HAMARREKO, state.team1.ttantto);

  createDots("hamarrekoDotsTeam2", MAX_HAMARREKO, state.team2.hamarreko);
  createDots("ttanttoDotsTeam2", TTANTTO_PER_HAMARREKO, state.team2.ttantto);
}

function launchConfetti() {
  const container = document.getElementById("confettiContainer");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < 60; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.animationDuration = `${1.8 + Math.random() * 1.2}s`;
    container.appendChild(piece);
  }
}

function showWinner(team) {
  const overlay = document.getElementById("winnerOverlay");
  const message = document.getElementById("winnerMessage");

  if (!overlay || !message) return;

  message.textContent = `Bravo ${getTeamName(team)} !`;
  overlay.classList.remove("hidden");
  launchConfetti();
}

function hideWinner() {
  const overlay = document.getElementById("winnerOverlay");
  const container = document.getElementById("confettiContainer");

  if (!overlay || !container) return;

  overlay.classList.add("hidden");
  container.innerHTML = "";
}

function checkWinner(team) {
  const won = state[team].hamarreko >= MAX_HAMARREKO;

  if (won && !state[team].hasWon) {
    state[team].hasWon = true;
    showWinner(team);
  }

  if (!won) {
    state[team].hasWon = false;
  }
}

function addTtantto(team) {
  if (state[team].hamarreko >= MAX_HAMARREKO) return;

  state[team].ttantto += 1;
  normalizeTeam(team);
  checkWinner(team);
  saveGame();
  render();
}

function removeTtantto(team) {
  if (state[team].hamarreko === 0 && state[team].ttantto === 0) return;

  state[team].ttantto -= 1;
  normalizeTeam(team);
  checkWinner(team);
  saveGame();
  render();
}

function resetGame() {
  state.team1.hamarreko = 0;
  state.team1.ttantto = 0;
  state.team1.hasWon = false;

  state.team2.hamarreko = 0;
  state.team2.ttantto = 0;
  state.team2.hasWon = false;

  hideWinner();
  saveGame();
  render();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action, team } = button.dataset;
  if (!team) return;

  if (action === "plus") addTtantto(team);
  if (action === "minus") removeTtantto(team);
});

const closeButton = document.getElementById("closeWinner");
if (closeButton) {
  closeButton.addEventListener("click", hideWinner);
}

const resetButton = document.getElementById("resetAll");
if (resetButton) {
  resetButton.addEventListener("click", () => {
    const ok = window.confirm("Nouvelle manche ?");
    if (ok) {
      resetGame();
    }
  });
}

const teamName1Input = document.getElementById("teamName1");
const teamName2Input = document.getElementById("teamName2");

if (teamName1Input) {
  teamName1Input.addEventListener("input", saveGame);
}

if (teamName2Input) {
  teamName2Input.addEventListener("input", saveGame);
}

loadGame();
render();