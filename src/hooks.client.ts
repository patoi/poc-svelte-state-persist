import * as Persistor from '$lib/persistor.svelte';

Persistor.openDB(
	() => {
		console.log('Error DB init');
	},
	() => {
		console.log('Success DB init');
	}
);
