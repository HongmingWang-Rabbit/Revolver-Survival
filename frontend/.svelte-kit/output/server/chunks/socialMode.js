import { d as derived, w as writable } from "./index.js";
const GAME_MODES = [
  { name: "mode_1_bullet", bullets: 1, survivalRate: 0.8333, multiplier: 1.17, displayName: "1 Bullet" },
  { name: "mode_2_bullet", bullets: 2, survivalRate: 0.6667, multiplier: 1.46, displayName: "2 Bullets" },
  { name: "mode_3_bullet", bullets: 3, survivalRate: 0.5, multiplier: 1.95, displayName: "3 Bullets" },
  { name: "mode_4_bullet", bullets: 4, survivalRate: 0.3333, multiplier: 2.93, displayName: "4 Bullets" },
  { name: "mode_5_bullet", bullets: 5, survivalRate: 0.1667, multiplier: 5.86, displayName: "5 Bullets" }
];
const initialRoundState = {
  gameState: "idle",
  selectedBullets: 1,
  betAmount: 1,
  currentPot: 0,
  lastResult: null,
  roundHistory: []
};
const initialRGSConfig = {
  initialized: false,
  loading: false,
  error: null,
  minBet: 0.01,
  maxBet: 1e3,
  stepBet: 0.01,
  defaultBet: 1,
  betLevels: [],
  currency: "USD",
  isDemo: true
};
const balance = writable(0);
const roundState = writable(initialRoundState);
const isSpinning = writable(false);
const showResult = writable(false);
const rgsConfig = writable(initialRGSConfig);
const currentMode = derived(
  roundState,
  ($roundState) => GAME_MODES.find((m) => m.bullets === $roundState.selectedBullets) || GAME_MODES[0]
);
const canPlaceBet = derived(
  [balance, roundState, rgsConfig],
  ([$balance, $roundState, $rgsConfig]) => $rgsConfig.initialized && $roundState.gameState === "idle" && $roundState.betAmount >= $rgsConfig.minBet && $roundState.betAmount <= $rgsConfig.maxBet && $roundState.betAmount <= $balance
);
const canSpin = derived(
  [roundState, isSpinning],
  ([$roundState, $isSpinning]) => ($roundState.gameState === "betting" || $roundState.gameState === "continue") && !$isSpinning
);
const potentialWin = derived(
  [roundState, currentMode],
  ([$roundState, $currentMode]) => {
    const amount = $roundState.gameState === "continue" ? $roundState.currentPot : $roundState.betAmount;
    return amount * $currentMode.multiplier;
  }
);
derived(rgsConfig, ($config) => $config.minBet);
derived(rgsConfig, ($config) => $config.maxBet);
const isSocialMode = writable(false);
const textMappings = {
  // Bet-related
  "bet": "play",
  "Bet": "Play",
  "BET": "PLAY",
  "bets": "plays",
  "Bets": "Plays",
  "BETS": "PLAYS",
  "betting": "playing",
  "Betting": "Playing",
  "BETTING": "PLAYING",
  "Place your bet": "Place your play",
  "PLACE BET": "PLAY NOW",
  "BET PLACED": "PLAYING",
  "BET AMOUNT": "PLAY AMOUNT",
  "total bet": "total play",
  "Total Bet": "Total Play",
  "TOTAL BET": "TOTAL PLAY",
  // Cash-related
  "cash": "coins",
  "Cash": "Coins",
  "CASH": "COINS",
  "CASH OUT": "COLLECT",
  "Cash Out": "Collect",
  "cash out": "collect",
  // Money-related
  "money": "coins",
  "Money": "Coins",
  "MONEY": "COINS",
  // Currency
  "currency": "token",
  "Currency": "Token",
  "CURRENCY": "TOKEN",
  // Other gambling terms
  "gamble": "play",
  "Gamble": "Play",
  "GAMBLE": "PLAY",
  "wager": "play",
  "Wager": "Play",
  "WAGER": "PLAY",
  "deposit": "get coins",
  "Deposit": "Get Coins",
  "DEPOSIT": "GET COINS",
  "withdraw": "redeem",
  "Withdraw": "Redeem",
  "WITHDRAW": "REDEEM",
  "credit": "coins",
  "Credit": "Coins",
  "CREDIT": "COINS",
  // Payout-related
  "pay out": "win",
  "Pay Out": "Win",
  "PAY OUT": "WIN",
  "paid out": "won",
  "Paid Out": "Won",
  "PAID OUT": "WON",
  "pays out": "wins",
  "Pays Out": "Wins",
  "PAYS OUT": "WINS",
  // Buy-related
  "buy bonus": "get bonus",
  "Buy Bonus": "Get Bonus",
  "BUY BONUS": "GET BONUS",
  "bonus buy": "bonus",
  "Bonus Buy": "Bonus",
  "BONUS BUY": "BONUS"
};
function createSocialText(standardText, socialText) {
  return derived(isSocialMode, ($isSocial) => {
    if (!$isSocial) {
      return standardText;
    }
    if (socialText) {
      return socialText;
    }
    if (textMappings[standardText]) {
      return textMappings[standardText];
    }
    return standardText;
  });
}
const TEXT = {
  placeBet: createSocialText("Place your bet", "Place your play"),
  betAmount: createSocialText("BET AMOUNT", "PLAY AMOUNT"),
  placeBetBtn: createSocialText("PLACE BET", "PLAY NOW"),
  betPlaced: createSocialText("BET PLACED", "PLAYING"),
  cashOut: createSocialText("CASH OUT", "COLLECT"),
  balance: createSocialText("BALANCE", "COINS")
};
export {
  GAME_MODES as G,
  TEXT as T,
  roundState as a,
  balance as b,
  canPlaceBet as c,
  canSpin as d,
  isSpinning as i,
  potentialWin as p,
  rgsConfig as r,
  showResult as s
};
