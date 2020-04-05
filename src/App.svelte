<script>
	import { afterUpdate } from 'svelte';
	import Catalog from './Catalog.svelte';

	export let name;
	
	export let showModal = false;
	let data;

	let url = './data/' + name;
	afterUpdate(() => {
		// console.log('the component just updated', showModal, modal);
		if (showModal && !data) {
			fetch(url)
				.then(req => req.json())
				.then(json => {
					console.log('ddd', json);
					data = json;
				});
		}
	});
	function callbackFunction(event) {
		console.log(`Notify fired! Detail: ${event.detail}`);
		showModal = false;
	}
</script>

<main>
	<h1>Hello {name}!</h1>
	
	<p>
		Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.
	</p>
	<p>
		<button class="primary" on:click={() => showModal = true}>Фото ссертификатов</button>
	</p>
{#if data}
	<Catalog items={data} on:notify="{callbackFunction}" />
{/if}

</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

</style>