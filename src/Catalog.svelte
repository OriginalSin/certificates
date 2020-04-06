<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	const close = () => {
		// console.log('modal close');
		dispatch('close');
	}
	// const prefix = '//map.mvs.group/skpdi/proxy.php?guid=';

	export let items;

	let cur = 0;
	const prev = () => {
		if (cur) { cur--; }
	};
	const next = () => {
		if (cur < items.length - 1) { cur++; }
	};
	
</script>

{#if items}
<main>
	<div class="modal-background" on:click|stopPropagation={close}></div>

	<div class="modal" role="dialog" aria-modal="true" on:click|stopPropagation={()=>{}}>
		<div title="Закрыть" class="ant-modal-close" on:click|stopPropagation={close}></div>
		<div class="ant-modal-content">
			<div class="ant-modal-header">
				<div class="ant-modal-title" id="rcDialogTitle1">{items[cur].imageTitle || 'Фото и схемы ДТП'}</div>
			</div>
			<div class="ant-modal-body">
				<div>
					<div class="carousel carousel-slider" style="width: 100%;">
						<button type="button" aria-label="previous slide / item" class="control-arrow control-prev" on:click|stopPropagation={prev}></button>
						<div class="slider-wrapper axis-horizontal">
							<a target="_blank" href="{items[cur].image}" title="Открыть на весь экран"><img src="{items[cur].image}" alt="" /></a>
						</div>
						<button type="button" aria-label="next slide / item" class="control-arrow control-next" on:click|stopPropagation={next}></button>
						<ul class="control-dots">
							{#each items as pt, index}
							<li on:click|stopPropagation={()=>{cur = index;}} class="dot{index === cur ? ' selected' : ''}" value="{index}" role="button" tabindex="0" aria-label="slide item {index}"></li>
							{/each}
						</ul>
						<p class="carousel-status">{cur + 1} из {items.length}</p>
					</div>

				</div>
			</div>
		</div>
	</div>
</main>
{/if}

<style>
	.modal-background {z-index:9000000;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3)}
	.modal {z-index:9000001;position:absolute;left:50%;top:50%;width:calc(100vw - 4em);max-width:32em;max-height:calc(100vh - 4em);overflow:auto;transform:translate(-50%,-50%);padding:1em;border-radius:0.2em;background:white}
	button {display:block}
	.ant-modal-content {position:relative;background-color:#fff;background-clip:padding-box;border:0;border-radius:4px;-webkit-box-shadow:0 4px 12px rgba(0,0,0,.15);box-shadow:0 4px 12px rgba(0,0,0,.15);pointer-events:auto}
	.ant-modal-close::after{display:block;width:14px;height:14px;content:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="64 64 896 896" width="14" height="14"><path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 0 0 203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path></svg>')}
	.ant-modal-close {position:absolute;top:6px;right:6px;z-index:10;padding:0;color:rgba(0,0,0,.45);font-weight:700;line-height:1;text-decoration:none;background:transparent;border:0;outline:0;cursor:pointer;-webkit-transition:color .3s;transition:color .3s}
	.ant-modal-header {padding:16px 24px;color:rgba(0,0,0,.65);background:#fff;border-bottom:1px solid #e8e8e8;border-radius:4px 4px 0 0}
	.ant-modal-body {padding:12px;font-size:14px;line-height:1.5;word-wrap:break-word}
	.ant-modal-body  .carousel {background-color:#d3d3d3}
	.carousel.carousel-slider {position:relative;margin:0;overflow:hidden}
	.carousel {position:relative;width:100%}
	.carousel  .slider-wrapper {overflow:hidden;margin:auto;width:100%;-webkit-transition:height .15s ease-in;transition:height .15s ease-in}
	.carousel   {box-sizing:border-box}
	.ant-modal-body  .carousel ul.control-dots {
		padding: 0px;
		background-color: lightslategray;
	}
	.ant-modal-body  .carousel .control-dots {margin:0}
	.carousel  .control-arrow ,.carousel.carousel-slider  .control-arrow {-webkit-transition:all 0.25s ease-in;-moz-transition:all 0.25s ease-in;-ms-transition:all 0.25s ease-in;-o-transition:all 0.25s ease-in;transition:all 0.25s ease-in;opacity:0.4;filter:alpha(opacity=40);position:absolute;z-index:2;top:20px;background:none;border:0;font-size:32px;cursor:pointer}
	.carousel  .control-arrow:hover{opacity:1;filter:alpha(opacity=100)}
	.carousel  .control-arrow:before,.carousel.carousel-slider  .control-arrow:before{margin:0 5px;display:inline-block;border-top:8px solid transparent;border-bottom:8px solid transparent;content:''}
	.carousel  .control-prev.control-arrow {left:0}
	.carousel  .control-prev.control-arrow:before{border-right:8px solid black}
	.carousel  .control-next.control-arrow {right:0}
	.carousel  .control-next.control-arrow:before{border-left:8px solid black}
	.carousel {position:relative;width:100%}
	.carousel   {-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}
	.carousel  img {width:100%;display:inline-block}
	.carousel  .control-arrow {outline:0;border:0;background:none;top:50%;margin-top:-13px;font-size:18px}
	.carousel  .thumb img {vertical-align:top}
	.carousel.carousel-slider {
		margin-bottom: 32px;
		position:relative;
		margin:0;
		overflow:hidden;
		padding-bottom:20px;
		}
	.carousel.carousel-slider  .control-arrow {top:0;color:#fff;font-size:26px;bottom:54px;margin-top:0;padding:5px}
	.carousel.carousel-slider  .control-arrow:hover{background:rgba(0, 0, 0, 0.2)}
	.carousel  .slider-wrapper {
		min-height: 200px;
		overflow:hidden;
		margin:auto;
		margin-bottom: 32px;
		width:100%;
		-webkit-transition:height 0.15s ease-in;-moz-transition:height 0.15s ease-in;-ms-transition:height 0.15s ease-in;-o-transition:height 0.15s ease-in;transition:height 0.15s ease-in
	}
	.carousel  .slide img {width:100%;vertical-align:top;border:0}
	.carousel  .control-dots {position:absolute;bottom:0;margin:10px 0;text-align:center;width:100%}
	@media(min-width: 960px){.carousel  .control-dots {bottom:0}
	}
	.carousel  .control-dots .dot {-webkit-transition:opacity 0.25s ease-in;-moz-transition:opacity 0.25s ease-in;-ms-transition:opacity 0.25s ease-in;-o-transition:opacity 0.25s ease-in;transition:opacity 0.25s ease-in;opacity:0.3;filter:alpha(opacity=30);box-shadow:1px 1px 2px rgba(0, 0, 0, 0.9);background:#fff;border-radius:50%;width:8px;height:8px;cursor:pointer;display:inline-block;margin:0 8px}
	.carousel  .control-dots .dot.selected ,.carousel  .control-dots .dot:hover{opacity:1;filter:alpha(opacity=100)}
	.carousel  .carousel-status {position:absolute;top:0;right:0;padding:5px;font-size:10px;text-shadow:1px 1px 1px rgba(0, 0, 0, 0.9);color:#fff}

</style>