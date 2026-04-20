const SLOT_CONFIG = [
  { key: "hero-1", label: "Hole Card 1" },
  { key: "hero-2", label: "Hole Card 2" },
  { key: "flop-1", label: "Flop 1" },
  { key: "flop-2", label: "Flop 2" },
  { key: "flop-3", label: "Flop 3" },
  { key: "turn", label: "Turn" },
  { key: "river", label: "River" },
];

const DEFAULT_STATE = {
  "hero-1": "",
  "hero-2": "",
  "flop-1": "",
  "flop-2": "",
  "flop-3": "",
  turn: "",
  river: "",
  opponents: 1,
};

const state = { ...DEFAULT_STATE };
const slotElements = new Map();

const opponentSelect = document.querySelector("#opponent-count");
const resetButton = document.querySelector("#reset-button");
const validationMessage = document.querySelector("#validation-message");
const handStrength = document.querySelector("#hand-strength");
const winRate = document.querySelector("#win-rate");
const tieRate = document.querySelector("#tie-rate");
const lossRate = document.querySelector("#loss-rate");
const simulationMeta = document.querySelector("#simulation-meta");
const bestHandCards = document.querySelector("#best-hand-cards");

function createOptionList(values, placeholder, formatter) {
  const placeholderOption = `<option value="">${placeholder}</option>`;
  const options = values
    .map((value) => {
      const label = formatter ? formatter(value) : value;
      return `<option value="${value}">${label}</option>`;
    })
    .join("");
  return placeholderOption + options;
}

function renderCardFace(card) {
  if (!card) {
    return `<div class="playing-card empty">No card selected</div>`;
  }

  const color = PokerCalculator.cardColor(card);
  return `
    <div class="playing-card ${color}">
      <div class="card-face">
        <div class="corner-top">
          <span class="corner-rank">${card[0]}</span>
          <span class="corner-suit">${PokerCalculator.SUIT_SYMBOLS[card[1]]}</span>
        </div>
        <div class="center-suit">${PokerCalculator.SUIT_SYMBOLS[card[1]]}</div>
        <div class="corner-bottom">
          <span class="corner-rank">${card[0]}</span>
          <span class="corner-suit">${PokerCalculator.SUIT_SYMBOLS[card[1]]}</span>
        </div>
      </div>
    </div>
  `;
}

function createSlotElement(config) {
  const container = document.querySelector(`.card-slot[data-slot="${config.key}"]`);
  container.innerHTML = `
    <div class="slot-shell">
      <p class="slot-title">${config.label}</p>
      <div class="selector-row">
        <select class="rank-select" aria-label="${config.label} rank">
          ${createOptionList(PokerCalculator.RANKS, "Rank")}
        </select>
        <select class="suit-select" aria-label="${config.label} suit">
          ${createOptionList(
            PokerCalculator.SUITS,
            "Suit",
            (suit) => `${PokerCalculator.SUIT_SYMBOLS[suit]} ${PokerCalculator.SUIT_NAMES[suit]}`
          )}
        </select>
      </div>
      <div class="card-preview">${renderCardFace("")}</div>
    </div>
  `;

  const rankSelect = container.querySelector(".rank-select");
  const suitSelect = container.querySelector(".suit-select");
  const preview = container.querySelector(".card-preview");

  function syncSlot() {
    const card = rankSelect.value && suitSelect.value ? `${rankSelect.value}${suitSelect.value}` : "";
    state[config.key] = card;
    preview.innerHTML = renderCardFace(card);
    updateResults();
  }

  rankSelect.addEventListener("change", syncSlot);
  suitSelect.addEventListener("change", syncSlot);

  slotElements.set(config.key, {
    rankSelect,
    suitSelect,
    preview,
  });
}

function getHeroCards() {
  return [state["hero-1"], state["hero-2"]].filter(Boolean);
}

function getBoardCards() {
  return [state["flop-1"], state["flop-2"], state["flop-3"], state.turn, state.river].filter(Boolean);
}

function renderBestHand(bestHand) {
  if (!bestHand) {
    bestHandCards.className = "best-hand-strip empty";
    bestHandCards.textContent = "Complete at least five cards to evaluate the full hand.";
    return;
  }

  bestHandCards.className = "best-hand-strip";
  bestHandCards.innerHTML = bestHand.cards
    .map((card) => {
      const color = PokerCalculator.cardColor(card);
      return `
        <div class="mini-card ${color}">
          <span class="mini-card-rank">${card[0]}</span>
          <span class="mini-card-suit">${PokerCalculator.SUIT_SYMBOLS[card[1]]}</span>
        </div>
      `;
    })
    .join("");
}

function clearRates() {
  winRate.textContent = "--";
  tieRate.textContent = "--";
  lossRate.textContent = "--";
}

function validateBoardSequence() {
  const flopSlots = [state["flop-1"], state["flop-2"], state["flop-3"]];
  const turn = state.turn;
  const river = state.river;

  if (!flopSlots[0] && (flopSlots[1] || flopSlots[2] || turn || river)) {
    return "Start community cards from Flop 1.";
  }
  if (!flopSlots[1] && (flopSlots[2] || turn || river)) {
    return "Complete Flop 2 before adding later community cards.";
  }
  if (!flopSlots[2] && (turn || river)) {
    return "Complete all three flop cards before adding the turn or river.";
  }
  if (!turn && river) {
    return "Choose the turn card before adding the river.";
  }

  return "";
}

function updateResults() {
  const heroCards = getHeroCards();
  const boardCards = getBoardCards();
  const selectionState = PokerCalculator.describeKnownCards([...heroCards, ...boardCards]);

  handStrength.textContent = selectionState.label;
  renderBestHand(selectionState.bestHand);

  const validation = PokerCalculator.validateSelection([...heroCards, ...boardCards]);
  if (!validation.valid) {
    validationMessage.textContent = validation.message;
    validationMessage.className = "validation-message error";
    simulationMeta.textContent = "Fix the duplicate card selection to continue.";
    clearRates();
    return;
  }

  validationMessage.textContent = "";
  validationMessage.className = "validation-message";

  const boardSequenceError = validateBoardSequence();
  if (boardSequenceError) {
    clearRates();
    validationMessage.textContent = boardSequenceError;
    validationMessage.className = "validation-message error";
    simulationMeta.textContent = "Add the community cards in flop, turn, river order.";
    return;
  }

  if (heroCards.length !== 2) {
    clearRates();
    simulationMeta.textContent = "Choose both hole cards to start calculating the odds.";
    return;
  }

  const result = PokerCalculator.runSimulation({
    heroCards,
    boardCards,
    opponents: Number(state.opponents),
  });

  if (!result.valid) {
    clearRates();
    simulationMeta.textContent = result.message;
    return;
  }

  winRate.textContent = PokerCalculator.formatPercent(result.winRate);
  tieRate.textContent = PokerCalculator.formatPercent(result.tieRate);
  lossRate.textContent = PokerCalculator.formatPercent(result.lossRate);
  simulationMeta.textContent = `${result.method} using ${result.iterations.toLocaleString()} trial${result.iterations === 1 ? "" : "s"} against ${state.opponents} random opponent${Number(state.opponents) === 1 ? "" : "s"}.`;
}

function resetState() {
  Object.assign(state, DEFAULT_STATE);
  opponentSelect.value = "1";

  for (const config of SLOT_CONFIG) {
    const slot = slotElements.get(config.key);
    slot.rankSelect.value = "";
    slot.suitSelect.value = "";
    slot.preview.innerHTML = renderCardFace("");
  }

  validationMessage.textContent = "";
  validationMessage.className = "validation-message";
  updateResults();
}

function initialize() {
  SLOT_CONFIG.forEach(createSlotElement);

  opponentSelect.addEventListener("change", (event) => {
    state.opponents = Number(event.target.value);
    updateResults();
  });

  resetButton.addEventListener("click", resetState);
  updateResults();
}

initialize();
