import { registerSW } from "virtual:pwa-register";
registerSW({ immediate: true });

import "./style.css";
import { translations } from "./i18n.js";

const TTANTTO_PER_HAMARREKO = 5;
const MAX_HAMARREKO = 8;
const STORAGE_KEY = "mus-score-app-state";
const STORAGE_LANG_KEY = "mus-lang";

let currentLang = localStorage.getItem(STORAGE_LANG_KEY) || "eu";

const state = {
  team1: { hamarreko: 0, ttantto: 0, hasWon: false },
  team2: { hamarreko: 0, ttantto: 0, hasWon: false },
};

function translate(translationKey, parameters = {}) {
  let translatedText =
    translations[currentLang][translationKey] || translationKey;

  Object.entries(parameters).forEach(([parameterName, parameterValue]) => {
    translatedText = translatedText.replace(
      `{${parameterName}}`,
      parameterValue
    );
  });

  return translatedText;
}

function applyTranslations() {
  const currentDictionary = translations[currentLang];

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const translationKey = element.dataset.i18n;

    if (currentDictionary[translationKey]) {
      element.textContent = currentDictionary[translationKey];
    }
  });

  document
    .querySelectorAll("[data-i18n-placeholder]")
    .forEach((inputElement) => {
      const translationKey = inputElement.dataset.i18nPlaceholder;

      if (currentDictionary[translationKey]) {
        inputElement.placeholder = currentDictionary[translationKey];
      }
    });

  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const translationKey = element.dataset.i18nAria;

    if (currentDictionary[translationKey]) {
      element.setAttribute("aria-label", currentDictionary[translationKey]);
    }
  });
}

function switchLanguage(languageCode) {
  currentLang = languageCode;
  localStorage.setItem(STORAGE_LANG_KEY, currentLang);
  applyTranslations();
  updateLangUI();
}

function updateLangUI() {
  const btnEu = document.getElementById("langEu");
  const btnFr = document.getElementById("langFr");

  btnEu?.classList.toggle("active", currentLang === "eu");
  btnFr?.classList.toggle("active", currentLang === "fr");
}

document.getElementById("langEu")?.addEventListener("click", () => {
  switchLanguage("eu");
});

document.getElementById("langFr")?.addEventListener("click", () => {
  switchLanguage("fr");
});

function getTeamName(team) {
  const inputId = team === "team1" ? "teamName1" : "teamName2";
  const teamNameInput = document.getElementById(inputId);
  const customTeamName = teamNameInput ? teamNameInput.value.trim() : "";

  if (customTeamName) {
    return customTeamName;
  }

  return team === "team1"
    ? translate("team1_default")
    : translate("team2_default");
}

function saveGame() {
  const savedData = {
    team1: state.team1,
    team2: state.team2,
    teamName1: document.getElementById("teamName1")?.value?.trim() || "",
    teamName2: document.getElementById("teamName2")?.value?.trim() || "",
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
}

function loadGame() {
  const savedGame = localStorage.getItem(STORAGE_KEY);
  if (!savedGame) return;

  try {
    const parsedGame = JSON.parse(savedGame);

    if (parsedGame.team1) {
      state.team1.hamarreko = parsedGame.team1.hamarreko ?? 0;
      state.team1.ttantto = parsedGame.team1.ttantto ?? 0;
      state.team1.hasWon = parsedGame.team1.hasWon ?? false;
    }

    if (parsedGame.team2) {
      state.team2.hamarreko = parsedGame.team2.hamarreko ?? 0;
      state.team2.ttantto = parsedGame.team2.ttantto ?? 0;
      state.team2.hasWon = parsedGame.team2.hasWon ?? false;
    }

    const team1NameInput = document.getElementById("teamName1");
    const team2NameInput = document.getElementById("teamName2");

    if (team1NameInput) {
      team1NameInput.value = parsedGame.teamName1 || "";
    }

    if (team2NameInput) {
      team2NameInput.value = parsedGame.teamName2 || "";
    }
  } catch (error) {
    console.error("Erreur lors du chargement de la sauvegarde :", error);
  }
}

function createDots(containerId, totalDots, activeDots) {
  const dotsContainer = document.getElementById(containerId);
  if (!dotsContainer) return;

  dotsContainer.innerHTML = "";

  for (let dotIndex = 0; dotIndex < totalDots; dotIndex += 1) {
    const dotElement = document.createElement("div");
    dotElement.className = "dot";

    if (dotIndex < activeDots) {
      dotElement.classList.add("active");
    }

    dotsContainer.appendChild(dotElement);
  }
}

function normalizeTeam(team) {
  let { hamarreko, ttantto } = state[team];

  if (ttantto >= TTANTTO_PER_HAMARREKO) {
    const carriedHamarreko = Math.floor(ttantto / TTANTTO_PER_HAMARREKO);
    hamarreko += carriedHamarreko;
    ttantto %= TTANTTO_PER_HAMARREKO;
  }

  while (ttantto < 0 && hamarreko > 0) {
    hamarreko -= 1;
    ttantto += TTANTTO_PER_HAMARREKO;
  }

  if (hamarreko < 0) {
    hamarreko = 0;
  }

  if (hamarreko === 0 && ttantto < 0) {
    ttantto = 0;
  }

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
  const confettiContainer = document.getElementById("confettiContainer");
  if (!confettiContainer) return;

  confettiContainer.innerHTML = "";

  for (let pieceIndex = 0; pieceIndex < 60; pieceIndex += 1) {
    const confettiPiece = document.createElement("span");
    confettiPiece.className = "confetti-piece";
    confettiPiece.style.left = `${Math.random() * 100}%`;
    confettiPiece.style.animationDelay = `${Math.random() * 0.4}s`;
    confettiPiece.style.animationDuration = `${1.8 + Math.random() * 1.2}s`;
    confettiContainer.appendChild(confettiPiece);
  }
}

function showWinner(team) {
  const winnerOverlay = document.getElementById("winnerOverlay");
  const winnerMessageElement = document.getElementById("winnerMessage");

  if (!winnerOverlay || !winnerMessageElement) return;

  winnerMessageElement.textContent = translate("winner_message", {
    team: getTeamName(team),
  });

  winnerOverlay.classList.remove("hidden");
  launchConfetti();
}

function hideWinner() {
  const winnerOverlay = document.getElementById("winnerOverlay");
  const confettiContainer = document.getElementById("confettiContainer");

  if (!winnerOverlay || !confettiContainer) return;

  winnerOverlay.classList.add("hidden");
  confettiContainer.innerHTML = "";
}

function checkWinner(team) {
  const teamHasWon = state[team].hamarreko >= MAX_HAMARREKO;

  if (teamHasWon && !state[team].hasWon) {
    state[team].hasWon = true;
    showWinner(team);
  }

  if (!teamHasWon) {
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

document.addEventListener("click", (clickEvent) => {
  const actionButton = clickEvent.target.closest("[data-action]");
  if (!actionButton) return;

  const { action, team } = actionButton.dataset;
  if (!team) return;

  if (action === "plus") {
    addTtantto(team);
  }

  if (action === "minus") {
    removeTtantto(team);
  }
});

const closeWinnerButton = document.getElementById("closeWinner");
if (closeWinnerButton) {
  closeWinnerButton.addEventListener("click", hideWinner);
}

const resetAllButton = document.getElementById("resetAll");
if (resetAllButton) {
  resetAllButton.addEventListener("click", () => {
    const userConfirmedReset = window.confirm(translate("confirm_reset"));

    if (userConfirmedReset) {
      resetGame();
    }
  });
}

const team1NameInput = document.getElementById("teamName1");
const team2NameInput = document.getElementById("teamName2");

if (team1NameInput) {
  team1NameInput.addEventListener("input", saveGame);
}

if (team2NameInput) {
  team2NameInput.addEventListener("input", saveGame);
}

loadGame();
applyTranslations();
updateLangUI();
render();