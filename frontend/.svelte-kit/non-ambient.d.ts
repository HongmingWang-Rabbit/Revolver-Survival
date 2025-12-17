
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/[...path]";
		RouteParams(): {
			"/[...path]": { path: string }
		};
		LayoutParams(): {
			"/": { path?: string };
			"/[...path]": { path: string }
		};
		Pathname(): "/" | `/${string}` & {} | `/${string}/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.png" | "/sounds/Failed.mp3" | "/sounds/Reload.mp3" | "/sounds/ShootFailed.mp3" | "/sounds/ShootLoad.mp3" | "/sounds/Shooting.mp3" | "/sounds/Tap.mp3" | "/sounds/WinA.mp3" | "/sounds/WinB.mp3" | "/spine/demo.atlas" | "/spine/demo.json" | "/spine/demo.png" | "/sw.js" | string & {};
	}
}