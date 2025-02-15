<script lang="ts">
	import * as Persistor from '$lib/persistor'

	// imported, independent state
	import { levelState } from './level.state.svelte'

	const colorStateInitValue: string | undefined = undefined

	// component level state
	let colorState: string | undefined = $state(colorStateInitValue)

	// optional: preinit database key-value
	// Persistor.put<string>('colorState', colorStateInitValue);

	Persistor.get<string>('colorState', (value) => {
		colorState = value ?? colorStateInitValue
	})

	// set state
	const onSetState = (level?: string, color?: string) => {
		levelState.value = level
		colorState = color
		// update component level state
		Persistor.put<string>('colorState', colorState)
	}

	// remove state record (unnecessary, e.g. deleting DB on explicit logout process is better way)
	const onRemoveRecord = () => {
		levelState.remove()
	}

	// complete deletion of the database (e.g. run on explicit logout)
	const onDeleteDB = () => {
		Persistor.deleteDB()
	}
</script>

<h1>Welcome to Persisting Svelte State research project</h1>

<div style="font-weight: 700; font-size: 120%">
	State value: {'' + levelState.value}
	{'' + colorState}
</div>

<br />
<button onclick={() => onSetState('Dark', 'Blue')}>Set level to 'Dark', color to 'Blue'</button>
<br /><br />
<button onclick={() => onSetState('Light', 'Red')}>Set level to 'Light', color to 'Red'</button>
<br /><br />
<button onclick={() => onSetState(undefined, undefined)}>Set level and color to undefined</button>
<br /><br /><br />
<button onclick={() => onRemoveRecord()}>Remove levelState key record</button>
<br /><br /><br />
<button onclick={() => onDeleteDB()}>Delete database</button>
