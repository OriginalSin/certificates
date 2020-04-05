import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		name: 'certificates.json'
	}
});

export default app;