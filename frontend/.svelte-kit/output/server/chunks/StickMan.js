import { a as store_get, b as attr_class, c as attr, e as ensure_array_like, u as unsubscribe_stores, d as stringify } from "./index2.js";
import { X as escape_html } from "./context.js";
import { d as derived, w as writable } from "./index.js";
const MIN_BET = 0.01;
const MAX_BET = 1e3;
const GAME_MODES = [
  { name: "mode_1_bullet", bullets: 1, survivalRate: 0.8333, multiplier: 1.17, displayName: "1 Bullet" },
  { name: "mode_2_bullet", bullets: 2, survivalRate: 0.6667, multiplier: 1.47, displayName: "2 Bullets" },
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
const balance = writable(100);
const roundState = writable(initialRoundState);
const isSpinning = writable(false);
const showResult = writable(false);
const currentMode = derived(
  roundState,
  ($roundState) => GAME_MODES.find((m) => m.bullets === $roundState.selectedBullets) || GAME_MODES[0]
);
const canPlaceBet = derived(
  [balance, roundState],
  ([$balance, $roundState]) => $roundState.gameState === "idle" && $roundState.betAmount >= MIN_BET && $roundState.betAmount <= $balance
);
const canSpin = derived(
  [roundState, isSpinning],
  ([$roundState, $isSpinning]) => ($roundState.gameState === "betting" || $roundState.gameState === "continue") && !$isSpinning
);
const potentialWin = derived(
  [roundState, currentMode],
  ([$roundState, $currentMode]) => {
    const pot = $roundState.gameState === "continue" ? $roundState.currentPot : $roundState.betAmount;
    return pot * $currentMode.multiplier;
  }
);
class SoundManager {
  audioContext = null;
  sounds = /* @__PURE__ */ new Map();
  enabled = true;
  constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }
  async init() {
    try {
      this.audioContext = new AudioContext();
      await this.generateSounds();
    } catch (e) {
      console.warn("Audio not available:", e);
    }
  }
  async generateSounds() {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    this.sounds.set("click", this.createTone(ctx, 800, 0.05));
    this.sounds.set("spin", this.createTone(ctx, 400, 0.3, 200));
    this.sounds.set("empty", this.createTone(ctx, 1e3, 0.1));
    this.sounds.set("bang", this.createGunshot(ctx));
    this.sounds.set("win", this.createTone(ctx, 440, 0.5, 880));
    this.sounds.set("cashout", this.createTone(ctx, 1200, 0.2, 1400));
    this.sounds.set("bet", this.createTone(ctx, 600, 0.1));
  }
  createTone(ctx, startFreq, duration, endFreq) {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = endFreq ? startFreq + (endFreq - startFreq) * (i / length) : startFreq;
      const envelope = 1 - i / length;
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
    }
    return buffer;
  }
  createNoise(ctx, duration) {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const envelope = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * envelope * 0.8;
    }
    return buffer;
  }
  createGunshot(ctx) {
    const sampleRate = ctx.sampleRate;
    const duration = 0.6;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const attackEnd = 0.01;
      let amplitude = 0;
      if (t < attackEnd) {
        amplitude = 1;
      } else {
        amplitude = Math.exp(-8 * (t - attackEnd));
      }
      const noise = Math.random() * 2 - 1;
      const bass = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-10 * t);
      const mid = Math.sin(2 * Math.PI * 150 * t) * Math.exp(-15 * t);
      const high = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-30 * t);
      const mix = (noise * 0.5 + bass * 0.8 + mid * 0.4 + high * 0.3) * amplitude;
      data[i] = Math.max(-1, Math.min(1, mix));
    }
    return buffer;
  }
  play(name) {
    if (!this.enabled || !this.audioContext) return;
    const buffer = this.sounds.get(name);
    if (!buffer) return;
    try {
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (e) {
      console.warn("Failed to play sound:", e);
    }
  }
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  get isEnabled() {
    return this.enabled;
  }
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}
const SFX = new SoundManager();
function BetControls($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let currentBet, selectedBullets, gameState, canBet, currentMode2;
    let betInput = "1.00";
    currentBet = store_get($$store_subs ??= {}, "$roundState", roundState).betAmount;
    selectedBullets = store_get($$store_subs ??= {}, "$roundState", roundState).selectedBullets;
    gameState = store_get($$store_subs ??= {}, "$roundState", roundState).gameState;
    canBet = store_get($$store_subs ??= {}, "$canPlaceBet", canPlaceBet);
    betInput = currentBet.toFixed(2);
    currentMode2 = GAME_MODES.find((m) => m.bullets === selectedBullets);
    $$renderer2.push(`<div${attr_class("bet-controls svelte-1lv3ktd", void 0, { "disabled": gameState !== "idle" })}>`);
    if (gameState === "idle") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="panel-header svelte-1lv3ktd"><span class="panel-title svelte-1lv3ktd">Place your bet</span> <span class="panel-subtitle svelte-1lv3ktd">Load the chamber and pull the trigger</span></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="bet-section"><span class="section-label svelte-1lv3ktd">BET AMOUNT</span> <div class="bet-input-group svelte-1lv3ktd"><button class="adjust-btn svelte-1lv3ktd">1/2</button> <div class="input-wrapper svelte-1lv3ktd"><span class="currency svelte-1lv3ktd">$</span> <input type="number"${attr("value", betInput)}${attr("min", MIN_BET)}${attr("max", MAX_BET)} step="0.01"${attr("disabled", gameState !== "idle", true)} class="svelte-1lv3ktd"/></div> <button class="adjust-btn svelte-1lv3ktd">2x</button></div> <div class="balance-display svelte-1lv3ktd">Balance: <span class="balance-value svelte-1lv3ktd">$${escape_html(store_get($$store_subs ??= {}, "$balance", balance).toFixed(2))}</span></div></div> <div class="bullet-section"><span class="section-label svelte-1lv3ktd">BULLETS</span> <div class="bullet-buttons svelte-1lv3ktd"><!--[-->`);
    const each_array = ensure_array_like(GAME_MODES);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let mode = each_array[$$index];
      $$renderer2.push(`<button${attr_class("bullet-btn svelte-1lv3ktd", void 0, { "selected": selectedBullets === mode.bullets })}${attr("disabled", gameState !== "idle", true)}><span class="bullet-count svelte-1lv3ktd">${escape_html(mode.bullets)}</span> <span class="bullet-mult svelte-1lv3ktd">x${escape_html(mode.multiplier)}</span></button>`);
    }
    $$renderer2.push(`<!--]--></div></div> `);
    if (currentMode2) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="mode-info svelte-1lv3ktd"><div class="info-row svelte-1lv3ktd"><span class="info-label svelte-1lv3ktd">Survival Rate:</span> <span class="info-value survival svelte-1lv3ktd">${escape_html((currentMode2.survivalRate * 100).toFixed(1))}%</span></div> <div class="info-row svelte-1lv3ktd"><span class="info-label svelte-1lv3ktd">Potential Win:</span> <span class="info-value win svelte-1lv3ktd">$${escape_html((currentBet * currentMode2.multiplier).toFixed(2))}</span></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button class="place-bet-btn svelte-1lv3ktd"${attr("disabled", !canBet, true)}>`);
    if (gameState === "idle") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`PLACE BET`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`BET PLACED`);
    }
    $$renderer2.push(`<!--]--></button></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function GameActions($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let gameState, currentPot, spinning, result, showingResult, potential, survived;
    let lastPlayedResultId = null;
    gameState = store_get($$store_subs ??= {}, "$roundState", roundState).gameState;
    currentPot = store_get($$store_subs ??= {}, "$roundState", roundState).currentPot;
    spinning = store_get($$store_subs ??= {}, "$isSpinning", isSpinning);
    result = store_get($$store_subs ??= {}, "$roundState", roundState).lastResult;
    showingResult = store_get($$store_subs ??= {}, "$showResult", showResult);
    store_get($$store_subs ??= {}, "$canSpin", canSpin);
    store_get($$store_subs ??= {}, "$currentMode", currentMode);
    potential = store_get($$store_subs ??= {}, "$potentialWin", potentialWin);
    survived = result?.events.find((e) => e.type === "outcome")?.status === "survived";
    if (showingResult && result && result.id !== lastPlayedResultId) {
      lastPlayedResultId = result.id;
      if (result.payoutMultiplier > 0) {
        SFX.play("empty");
        setTimeout(() => SFX.play("win"), 100);
      } else {
        SFX.play("bang");
      }
    }
    $$renderer2.push(`<div class="game-actions svelte-11hl62d">`);
    if (gameState === "idle") {
      $$renderer2.push("<!--[-->");
    } else {
      $$renderer2.push("<!--[!-->");
      if (gameState === "betting" || gameState === "continue") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="action-group svelte-11hl62d"><div class="pot-display svelte-11hl62d"><span class="pot-label svelte-11hl62d">CURRENT POT</span> <span class="pot-value svelte-11hl62d">$${escape_html(currentPot.toFixed(2))}</span></div> <button${attr_class("spin-btn svelte-11hl62d", void 0, { "spinning": spinning })}${attr("disabled", spinning, true)}>`);
        if (spinning) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="spinner svelte-11hl62d"></span> SPINNING...`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`PULL TRIGGER`);
        }
        $$renderer2.push(`<!--]--></button> <div class="potential-win svelte-11hl62d">Win up to <span class="win-amount svelte-11hl62d">$${escape_html(potential.toFixed(2))}</span></div> `);
        if (gameState === "continue") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<button class="cashout-btn svelte-11hl62d">CASH OUT $${escape_html(currentPot.toFixed(2))}</button>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (gameState === "spinning") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="spinning-message svelte-11hl62d"><span class="spinner large svelte-11hl62d"></span> <p>The cylinder spins...</p></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
          if (gameState === "result" && showingResult) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="result-actions animate-fade-in svelte-11hl62d">`);
            if (survived) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="win-display svelte-11hl62d"><span class="win-label svelte-11hl62d">YOU SURVIVED!</span> <span class="win-value svelte-11hl62d">$${escape_html(currentPot.toFixed(2))}</span></div> <div class="action-buttons svelte-11hl62d"><button class="continue-btn svelte-11hl62d">DOUBLE OR NOTHING</button> <button class="cashout-btn svelte-11hl62d">CASH OUT</button></div>`);
            } else {
              $$renderer2.push("<!--[!-->");
              $$renderer2.push(`<div class="loss-display svelte-11hl62d"><span class="loss-label svelte-11hl62d">GAME OVER</span> <span class="loss-message svelte-11hl62d">Better luck next time...</span></div>`);
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function Header($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    $$renderer2.push(`<header class="header svelte-1elxaub"><div class="balance-chip svelte-1elxaub"><span class="balance-label svelte-1elxaub">BALANCE</span> <span class="balance-amount svelte-1elxaub">$${escape_html(store_get($$store_subs ??= {}, "$balance", balance).toFixed(2))}</span></div></header>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function StickMan($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let spinning, result, showingResult, gameState, bullets, survived, pose, showGun, showFlash;
    spinning = store_get($$store_subs ??= {}, "$isSpinning", isSpinning);
    result = store_get($$store_subs ??= {}, "$roundState", roundState).lastResult;
    showingResult = store_get($$store_subs ??= {}, "$showResult", showResult);
    gameState = store_get($$store_subs ??= {}, "$roundState", roundState).gameState;
    bullets = store_get($$store_subs ??= {}, "$roundState", roundState).selectedBullets;
    survived = result?.events.find((e) => e.type === "outcome")?.status === "survived";
    pose = (() => {
      if (showingResult && !survived) return "pose-dead";
      if (showingResult && survived) return "pose-win";
      if (spinning) return "pose-aim";
      if (gameState === "betting" || gameState === "continue") return "pose-spin";
      return "pose-idle";
    })();
    showGun = gameState !== "idle";
    showFlash = showingResult && !survived;
    $$renderer2.push(`<div class="stickman-container svelte-zlieng"><div${attr_class(`stickman ${stringify(pose)}`, "svelte-zlieng")}><div class="torso limb svelte-zlieng"><div class="head svelte-zlieng">`);
    if (showingResult && !survived) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="eyes-dead svelte-zlieng"><span class="x-eye left svelte-zlieng"></span> <span class="x-eye right svelte-zlieng"></span></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (showingResult && survived) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="eyes-happy svelte-zlieng"><span class="eye left svelte-zlieng"></span> <span class="eye right svelte-zlieng"></span> <span class="mouth happy svelte-zlieng"></span></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (spinning) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="eyes-scared svelte-zlieng"><span class="eye left svelte-zlieng"></span> <span class="eye right svelte-zlieng"></span> <span class="sweat svelte-zlieng"></span></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<div class="eyes svelte-zlieng"><span class="eye left svelte-zlieng"></span> <span class="eye right svelte-zlieng"></span></div>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> <div class="limb leg-l svelte-zlieng"><div class="limb shin-l svelte-zlieng"></div></div> <div class="limb leg-r svelte-zlieng"><div class="limb shin-r svelte-zlieng"></div></div> <div class="limb arm-l svelte-zlieng"><div class="limb forearm-l svelte-zlieng"></div></div> <div class="limb arm-r svelte-zlieng"><div class="limb forearm-r svelte-zlieng"><div${attr_class("gun svelte-zlieng", void 0, { "gun-hidden": !showGun })}><div class="gun-body svelte-zlieng"><div class="gun-grip svelte-zlieng"></div> <div class="gun-cylinder svelte-zlieng"><!--[-->`);
    const each_array = ensure_array_like(Array(6));
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      each_array[i];
      $$renderer2.push(`<div${attr_class("chamber svelte-zlieng", void 0, { "has-bullet": i < bullets })}></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="gun-barrel svelte-zlieng"></div></div> <div${attr_class("muzzle-flash svelte-zlieng", void 0, { "show": showFlash })}></div></div></div></div></div></div> `);
    if (showingResult && !survived) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="blood-effects svelte-zlieng"><div class="blood-splatter s1 svelte-zlieng"></div> <div class="blood-splatter s2 svelte-zlieng"></div> <div class="blood-splatter s3 svelte-zlieng"></div> <div class="blood-pool svelte-zlieng"></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="status-msg svelte-zlieng">`);
    if (showingResult && !survived) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="dead svelte-zlieng">GAME OVER</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (showingResult && survived) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="alive svelte-zlieng">SURVIVED!</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (spinning) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="aiming svelte-zlieng">Aiming...</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
          if (gameState === "betting" || gameState === "continue") {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<span class="ready svelte-zlieng">Spinning cylinder...</span>`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<span class="idle svelte-zlieng">Ready</span>`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  BetControls as B,
  GAME_MODES as G,
  Header as H,
  StickMan as S,
  GameActions as a,
  roundState as r
};
