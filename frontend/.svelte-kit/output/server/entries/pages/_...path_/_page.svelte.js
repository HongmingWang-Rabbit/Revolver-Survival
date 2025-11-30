import { a as store_get, h as head, b as attr_class, u as unsubscribe_stores } from "../../../chunks/index2.js";
import { G as GAME_MODES, H as Header, B as BetControls, S as StickMan, a as GameActions, r as roundState } from "../../../chunks/StickMan.js";
import { X as escape_html } from "../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let selectedMode, gameState;
    selectedMode = GAME_MODES.find((m) => m.bullets === store_get($$store_subs ??= {}, "$roundState", roundState).selectedBullets);
    gameState = store_get($$store_subs ??= {}, "$roundState", roundState).gameState;
    head("1pgso1u", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Revolver Survival | High Stakes Survival Game</title>`);
      });
      $$renderer3.push(`<meta name="description" content="A high-stakes betting game inspired by Russian Roulette. Choose your risk, pull the trigger, survive and win!"/>`);
    });
    $$renderer2.push(`<div class="game-container svelte-1pgso1u">`);
    Header($$renderer2);
    $$renderer2.push(`<!----> <main class="game-main svelte-1pgso1u"><div class="game-layout svelte-1pgso1u"><aside class="left-panel svelte-1pgso1u">`);
    BetControls($$renderer2);
    $$renderer2.push(`<!----></aside> <section class="center-panel svelte-1pgso1u"><div class="game-scene svelte-1pgso1u">`);
    StickMan($$renderer2);
    $$renderer2.push(`<!----></div> `);
    if (selectedMode) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div${attr_class("mode-badge svelte-1pgso1u", void 0, { "active": gameState !== "idle" })}><span class="mode-bullets svelte-1pgso1u">${escape_html(selectedMode.bullets)} Bullet${escape_html(selectedMode.bullets > 1 ? "s" : "")}</span> <span class="mode-odds svelte-1pgso1u">${escape_html((selectedMode.survivalRate * 100).toFixed(0))}% Survival</span></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></section> <aside class="right-panel svelte-1pgso1u">`);
    GameActions($$renderer2);
    $$renderer2.push(`<!----></aside></div></main></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
