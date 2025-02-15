import Persistor from '$lib/persistor'

Persistor(
	'localStorage',
	() => {
		console.log('Error DB init')
	},
	() => {
		console.log('Success DB init')
	}
)
