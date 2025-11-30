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
		client: {start:"_app/immutable/entry/start.BKYb9gX6.js",app:"_app/immutable/entry/app.Dv79uEnS.js",imports:["_app/immutable/entry/start.BKYb9gX6.js","_app/immutable/chunks/CBAH3L7K.js","_app/immutable/chunks/EPEsNJVS.js","_app/immutable/entry/app.Dv79uEnS.js","_app/immutable/chunks/EPEsNJVS.js","_app/immutable/chunks/BQXzpLn-.js","_app/immutable/chunks/Nwcx5Idz.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
