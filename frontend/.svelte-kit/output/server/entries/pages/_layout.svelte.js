import { s as store_get, u as unsubscribe_stores } from "../../chunks/index2.js";
import { r as rgsConfig } from "../../chunks/socialMode.js";
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let mounted = false;
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="loading-screen svelte-12qhfyh"><div class="loading-content svelte-12qhfyh"><div class="spinner svelte-12qhfyh"></div> <p>Loading game...</p></div></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (store_get($$store_subs ??= {}, "$rgsConfig", rgsConfig).isDemo && mounted) ;
    else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
