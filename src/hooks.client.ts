import Persistor from '$lib/persistor.svelte';

Persistor(
	'localStorage',
	() => {
		console.log('Error DB init');
	},
	() => {
		console.log('Success DB init');
	}
);
