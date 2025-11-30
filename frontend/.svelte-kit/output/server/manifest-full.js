export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","sw.js"]),
	mimeTypes: {".png":"image/png",".js":"text/javascript"},
	_: {
		client: {start:"_app/immutable/entry/start.OE0j5wbE.js",app:"_app/immutable/entry/app.C-Ri6Qrb.js",imports:["_app/immutable/entry/start.OE0j5wbE.js","_app/immutable/chunks/--9jzv7_.js","_app/immutable/chunks/D8GNug9x.js","_app/immutable/chunks/Bong8zDx.js","_app/immutable/chunks/CtplzeyV.js","_app/immutable/entry/app.C-Ri6Qrb.js","_app/immutable/chunks/D8GNug9x.js","_app/immutable/chunks/mlAXKK-r.js","_app/immutable/chunks/BFaY53dP.js","_app/immutable/chunks/CtplzeyV.js","_app/immutable/chunks/Cxj6vayZ.js","_app/immutable/chunks/Bong8zDx.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/[...path]",
				pattern: /^(?:\/([^]*))?\/?$/,
				params: [{"name":"path","optional":false,"rest":true,"chained":true}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
