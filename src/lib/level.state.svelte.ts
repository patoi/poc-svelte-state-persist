import * as Persistor from './persistor.svelte';

const name = 'levelState';
const initValue: string | undefined | null = undefined

function createState() {
	let state: string | undefined | null = $state(initValue);

	// optional: preinit database key-value
	// Persistor.put<string>(name, initValue);

	// first read: state initialization
	Persistor.get<string>(name, (value) => {
		state = value;
	});

	return {
		get value() {
			return state;
		},
		set value(value) {
			// save all changes
			Persistor.put<string>(name, value);
			state = value;
		},
		// can be optionally implemented
		remove() {
			Persistor.remove(name);
		}
	};
}

export const levelState = createState();
