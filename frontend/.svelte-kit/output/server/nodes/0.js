

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.DZNbz6t1.js","_app/immutable/chunks/BFaY53dP.js","_app/immutable/chunks/D8GNug9x.js","_app/immutable/chunks/DCEoJI_l.js"];
export const stylesheets = ["_app/immutable/assets/0.CnaX-zj4.css"];
export const fonts = [];
