(function () {
  const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
  const SUITS = ["s", "h", "d", "c"];
  const SUIT_SYMBOLS = {
    s: "♠",
    h: "♥",
    d: "♦",
    c: "♣",
  };
  const SUIT_NAMES = {
    s: "spades",
    h: "hearts",
    d: "diamonds",
    c: "clubs",
  };
  const RANK_VALUE = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };
  const VALUE_TO_RANK = {
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    10: "T",
    11: "J",
    12: "Q",
    13: "K",
    14: "A",
  };
  const CATEGORY_NAMES = [
    "High Card",
    "Pair",
    "Two Pair",
    "Three of a Kind",
    "Straight",
    "Flush",
    "Full House",
    "Four of a Kind",
    "Straight Flush",
  ];

  function createDeck() {
    const deck = [];
    for (const rank of RANKS) {
      for (const suit of SUITS) {
        deck.push(rank + suit);
      }
    }
    return deck;
  }

  function cardColor(card) {
    return card && (card[1] === "h" || card[1] === "d") ? "red" : "black";
  }

  function cardLabel(card) {
    if (!card) {
      return "";
    }
    return `${card[0]}${SUIT_SYMBOLS[card[1]]}`;
  }

  function rankWord(value, plural) {
    const words = {
      14: "Ace",
      13: "King",
      12: "Queen",
      11: "Jack",
      10: "Ten",
      9: "Nine",
      8: "Eight",
      7: "Seven",
      6: "Six",
      5: "Five",
      4: "Four",
      3: "Three",
      2: "Two",
    };
    if (!plural) {
      return words[value];
    }
    if (value === 6) {
      return "Sixes";
    }
    return `${words[value]}s`;
  }

  function parseCard(card) {
    return {
      code: card,
      rank: RANK_VALUE[card[0]],
      suit: card[1],
    };
  }

  function compareScore(a, b) {
    for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
      const left = a[index] || 0;
      const right = b[index] || 0;
      if (left > right) {
        return 1;
      }
      if (left < right) {
        return -1;
      }
    }
    return 0;
  }

  function uniqueDescending(values) {
    return [...new Set(values)].sort((a, b) => b - a);
  }

  function detectStraight(ranks) {
    const unique = uniqueDescending(ranks);
    if (unique[0] === 14) {
      unique.push(1);
    }

    let run = 1;
    for (let index = 0; index < unique.length - 1; index += 1) {
      if (unique[index] - 1 === unique[index + 1]) {
        run += 1;
        if (run >= 5) {
          return unique[index - 3];
        }
      } else {
        run = 1;
      }
    }
    return null;
  }

  function describeScore(score) {
    const category = score[0];
    switch (category) {
      case 8:
        return score[1] === 14 ? "Royal Flush" : `${rankWord(score[1])}-high Straight Flush`;
      case 7:
        return `Four of a Kind, ${rankWord(score[1], true)}`;
      case 6:
        return `Full House, ${rankWord(score[1], true)} over ${rankWord(score[2], true)}`;
      case 5:
        return `${rankWord(score[1])}-high Flush`;
      case 4:
        return `${rankWord(score[1])}-high Straight`;
      case 3:
        return `Three of a Kind, ${rankWord(score[1], true)}`;
      case 2:
        return `Two Pair, ${rankWord(score[1], true)} and ${rankWord(score[2], true)}`;
      case 1:
        return `Pair of ${rankWord(score[1], true)}`;
      default:
        return `${rankWord(score[1])}-high`;
    }
  }

  function evaluateFiveCards(cardCodes) {
    const cards = cardCodes.map(parseCard).sort((a, b) => b.rank - a.rank);
    const ranks = cards.map((card) => card.rank);
    const suits = cards.map((card) => card.suit);
    const isFlush = suits.every((suit) => suit === suits[0]);
    const straightHigh = detectStraight(ranks);

    const frequencyMap = new Map();
    for (const rank of ranks) {
      frequencyMap.set(rank, (frequencyMap.get(rank) || 0) + 1);
    }

    const groups = [...frequencyMap.entries()]
      .map(([rank, count]) => ({ rank: Number(rank), count }))
      .sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count;
        }
        return right.rank - left.rank;
      });

    let score;

    if (isFlush && straightHigh) {
      score = [8, straightHigh];
    } else if (groups[0].count === 4) {
      score = [7, groups[0].rank, groups[1].rank];
    } else if (groups[0].count === 3 && groups[1].count === 2) {
      score = [6, groups[0].rank, groups[1].rank];
    } else if (isFlush) {
      score = [5, ...ranks];
    } else if (straightHigh) {
      score = [4, straightHigh];
    } else if (groups[0].count === 3) {
      const kickers = groups.filter((group) => group.count === 1).map((group) => group.rank);
      score = [3, groups[0].rank, ...kickers];
    } else if (groups[0].count === 2 && groups[1].count === 2) {
      const highPair = Math.max(groups[0].rank, groups[1].rank);
      const lowPair = Math.min(groups[0].rank, groups[1].rank);
      const kicker = groups.find((group) => group.count === 1).rank;
      score = [2, highPair, lowPair, kicker];
    } else if (groups[0].count === 2) {
      const kickers = groups.filter((group) => group.count === 1).map((group) => group.rank);
      score = [1, groups[0].rank, ...kickers];
    } else {
      score = [0, ...ranks];
    }

    return {
      cards: [...cardCodes],
      score,
      category: CATEGORY_NAMES[score[0]],
      description: describeScore(score),
    };
  }

  function combinations(cards, choose) {
    const result = [];

    function walk(start, combination) {
      if (combination.length === choose) {
        result.push([...combination]);
        return;
      }

      for (let index = start; index <= cards.length - (choose - combination.length); index += 1) {
        combination.push(cards[index]);
        walk(index + 1, combination);
        combination.pop();
      }
    }

    walk(0, []);
    return result;
  }

  function evaluateBestHand(cardCodes) {
    if (cardCodes.length < 5) {
      return null;
    }

    const combos = combinations(cardCodes, 5);
    let best = null;
    for (const combo of combos) {
      const candidate = evaluateFiveCards(combo);
      if (!best || compareScore(candidate.score, best.score) > 0) {
        best = candidate;
      }
    }
    return best;
  }

  function describeKnownCards(cardCodes) {
    if (cardCodes.length >= 5) {
      const best = evaluateBestHand(cardCodes);
      return {
        label: best.description,
        bestHand: best,
      };
    }

    if (cardCodes.length === 4) {
      const ranks = cardCodes.map((card) => RANK_VALUE[card[0]]).sort((a, b) => b - a);
      const pairMap = new Map();
      for (const rank of ranks) {
        pairMap.set(rank, (pairMap.get(rank) || 0) + 1);
      }
      const pairs = [...pairMap.entries()].filter((entry) => entry[1] === 2);
      if (pairs.length === 2) {
        const ordered = pairs.map((entry) => entry[0]).sort((a, b) => b - a);
        return {
          label: `Two visible pairs: ${rankWord(ordered[0], true)} and ${rankWord(ordered[1], true)}`,
          bestHand: null,
        };
      }
    }

    if (cardCodes.length >= 2) {
      const ranks = cardCodes.map((card) => RANK_VALUE[card[0]]);
      const frequencyMap = new Map();
      for (const rank of ranks) {
        frequencyMap.set(rank, (frequencyMap.get(rank) || 0) + 1);
      }

      const groups = [...frequencyMap.entries()].sort((left, right) => right[1] - left[1] || right[0] - left[0]);
      if (groups[0][1] === 3) {
        return {
          label: `Trips showing: ${rankWord(groups[0][0], true)}`,
          bestHand: null,
        };
      }
      if (groups[0][1] === 2) {
        return {
          label: `Pair showing: ${rankWord(groups[0][0], true)}`,
          bestHand: null,
        };
      }

      const ordered = ranks.sort((a, b) => b - a);
      return {
        label: `${rankWord(ordered[0])}-high so far`,
        bestHand: null,
      };
    }

    return {
      label: "Select cards to begin",
      bestHand: null,
    };
  }

  function sampleWithoutReplacement(array, count) {
    const pool = [...array];
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }
    return pool.slice(0, count);
  }

  function formatPercent(value) {
    return `${(value * 100).toFixed(1)}%`;
  }

  function validateSelection(cards) {
    const defined = cards.filter(Boolean);
    const duplicates = defined.filter((card, index) => defined.indexOf(card) !== index);
    if (duplicates.length > 0) {
      return {
        valid: false,
        message: `Duplicate card detected: ${cardLabel(duplicates[0])}. Each card must be unique.`,
      };
    }
    return { valid: true, message: "" };
  }

  function runSimulation(input) {
    const heroCards = input.heroCards.filter(Boolean);
    const boardCards = input.boardCards.filter(Boolean);
    const allKnown = [...heroCards, ...boardCards];
    const validation = validateSelection(allKnown);
    if (!validation.valid) {
      return {
        valid: false,
        message: validation.message,
      };
    }

    if (heroCards.length !== 2) {
      return {
        valid: false,
        message: "Choose both hole cards to calculate the odds.",
      };
    }

    const opponents = input.opponents || 1;
    const deck = createDeck().filter((card) => !allKnown.includes(card));
    const cardsNeededPerIteration = (5 - boardCards.length) + opponents * 2;
    if (deck.length < cardsNeededPerIteration) {
      return {
        valid: false,
        message: "There are not enough unseen cards left for this setup.",
      };
    }

    if (boardCards.length === 5 && opponents === 1) {
      return runExactRiverHeadsUp(heroCards, boardCards, deck);
    }

    return runMonteCarlo(heroCards, boardCards, deck, opponents);
  }

  function runExactRiverHeadsUp(heroCards, boardCards, deck) {
    let wins = 0;
    let ties = 0;
    let losses = 0;

    const heroScore = evaluateBestHand([...heroCards, ...boardCards]).score;
    const opponentHands = combinations(deck, 2);

    for (const hand of opponentHands) {
      const opponentScore = evaluateBestHand([...hand, ...boardCards]).score;
      const comparison = compareScore(heroScore, opponentScore);
      if (comparison > 0) {
        wins += 1;
      } else if (comparison < 0) {
        losses += 1;
      } else {
        ties += 1;
      }
    }

    const total = opponentHands.length;
    return {
      valid: true,
      method: "Exact enumeration",
      iterations: total,
      winRate: wins / total,
      tieRate: ties / total,
      lossRate: losses / total,
    };
  }

  function runMonteCarlo(heroCards, boardCards, deck, opponents) {
    const stage = boardCards.length;
    const iterations = stage >= 4 ? 18000 : stage === 3 ? 14000 : 12000;

    let wins = 0;
    let ties = 0;
    let losses = 0;

    for (let count = 0; count < iterations; count += 1) {
      const cardsDrawn = sampleWithoutReplacement(deck, (5 - boardCards.length) + opponents * 2);
      const simulatedBoard = [...boardCards];
      while (simulatedBoard.length < 5) {
        simulatedBoard.push(cardsDrawn.shift());
      }

      const heroResult = evaluateBestHand([...heroCards, ...simulatedBoard]);
      let bestComparison = 1;

      for (let opponentIndex = 0; opponentIndex < opponents; opponentIndex += 1) {
        const opponentHand = [cardsDrawn.shift(), cardsDrawn.shift()];
        const opponentResult = evaluateBestHand([...opponentHand, ...simulatedBoard]);
        const comparison = compareScore(heroResult.score, opponentResult.score);

        if (comparison < 0) {
          bestComparison = -1;
          break;
        }
        if (comparison === 0) {
          bestComparison = 0;
        }
      }

      if (bestComparison > 0) {
        wins += 1;
      } else if (bestComparison === 0) {
        ties += 1;
      } else {
        losses += 1;
      }
    }

    return {
      valid: true,
      method: "Monte Carlo simulation",
      iterations,
      winRate: wins / iterations,
      tieRate: ties / iterations,
      lossRate: losses / iterations,
    };
  }

  window.PokerCalculator = {
    RANKS,
    SUITS,
    SUIT_SYMBOLS,
    SUIT_NAMES,
    cardColor,
    cardLabel,
    createDeck,
    compareScore,
    describeKnownCards,
    evaluateBestHand,
    formatPercent,
    runSimulation,
    validateSelection,
  };
})();
