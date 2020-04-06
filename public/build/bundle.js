
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Catalog.svelte generated by Svelte v3.20.1 */
    const file = "src\\Catalog.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (23:0) {#if items}
    function create_if_block(ctx) {
    	let main;
    	let div0;
    	let t0;
    	let div9;
    	let div1;
    	let t1;
    	let div8;
    	let div3;
    	let div2;
    	let t2_value = (/*items*/ ctx[0][/*cur*/ ctx[1]].imageTitle || "Фото и схемы ДТП") + "";
    	let t2;
    	let t3;
    	let div7;
    	let div6;
    	let div5;
    	let button0;
    	let t4;
    	let div4;
    	let a;
    	let img;
    	let img_src_value;
    	let a_href_value;
    	let t5;
    	let button1;
    	let t6;
    	let ul;
    	let t7;
    	let p;
    	let t8_value = /*cur*/ ctx[1] + 1 + "";
    	let t8;
    	let t9;
    	let t10_value = /*items*/ ctx[0].length + "";
    	let t10;
    	let dispose;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			t0 = space();
    			div9 = element("div");
    			div1 = element("div");
    			t1 = space();
    			div8 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			button0 = element("button");
    			t4 = space();
    			div4 = element("div");
    			a = element("a");
    			img = element("img");
    			t5 = space();
    			button1 = element("button");
    			t6 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			p = element("p");
    			t8 = text(t8_value);
    			t9 = text(" из ");
    			t10 = text(t10_value);
    			attr_dev(div0, "class", "modal-background svelte-1nkz2qi");
    			add_location(div0, file, 24, 1, 425);
    			attr_dev(div1, "title", "Закрыть");
    			attr_dev(div1, "class", "ant-modal-close svelte-1nkz2qi");
    			add_location(div1, file, 27, 2, 585);
    			attr_dev(div2, "class", "ant-modal-title");
    			attr_dev(div2, "id", "rcDialogTitle1");
    			add_location(div2, file, 30, 4, 742);
    			attr_dev(div3, "class", "ant-modal-header svelte-1nkz2qi");
    			add_location(div3, file, 29, 3, 707);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "aria-label", "previous slide / item");
    			attr_dev(button0, "class", "control-arrow control-prev svelte-1nkz2qi");
    			add_location(button0, file, 35, 6, 966);
    			if (img.src !== (img_src_value = /*items*/ ctx[0][/*cur*/ ctx[1]].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-1nkz2qi");
    			add_location(img, file, 37, 82, 1233);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", a_href_value = /*items*/ ctx[0][/*cur*/ ctx[1]].image);
    			attr_dev(a, "title", "Открыть на весь экран");
    			add_location(a, file, 37, 7, 1158);
    			attr_dev(div4, "class", "slider-wrapper axis-horizontal svelte-1nkz2qi");
    			add_location(div4, file, 36, 6, 1106);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "aria-label", "next slide / item");
    			attr_dev(button1, "class", "control-arrow control-next svelte-1nkz2qi");
    			add_location(button1, file, 39, 6, 1296);
    			attr_dev(ul, "class", "control-dots svelte-1nkz2qi");
    			add_location(ul, file, 40, 6, 1432);
    			attr_dev(p, "class", "carousel-status svelte-1nkz2qi");
    			add_location(p, file, 45, 6, 1709);
    			attr_dev(div5, "class", "carousel carousel-slider svelte-1nkz2qi");
    			set_style(div5, "width", "100%");
    			add_location(div5, file, 34, 5, 900);
    			add_location(div6, file, 33, 4, 889);
    			attr_dev(div7, "class", "ant-modal-body svelte-1nkz2qi");
    			add_location(div7, file, 32, 3, 856);
    			attr_dev(div8, "class", "ant-modal-content svelte-1nkz2qi");
    			add_location(div8, file, 28, 2, 672);
    			attr_dev(div9, "class", "modal svelte-1nkz2qi");
    			attr_dev(div9, "role", "dialog");
    			attr_dev(div9, "aria-modal", "true");
    			add_location(div9, file, 26, 1, 497);
    			add_location(main, file, 23, 0, 417);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(main, t0);
    			append_dev(main, div9);
    			append_dev(div9, div1);
    			append_dev(div9, t1);
    			append_dev(div9, div8);
    			append_dev(div8, div3);
    			append_dev(div3, div2);
    			append_dev(div2, t2);
    			append_dev(div8, t3);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, button0);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, a);
    			append_dev(a, img);
    			append_dev(div5, t5);
    			append_dev(div5, button1);
    			append_dev(div5, t6);
    			append_dev(div5, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div5, t7);
    			append_dev(div5, p);
    			append_dev(p, t8);
    			append_dev(p, t9);
    			append_dev(p, t10);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(div0, "click", stop_propagation(/*close*/ ctx[2]), false, false, true),
    				listen_dev(div1, "click", stop_propagation(/*close*/ ctx[2]), false, false, true),
    				listen_dev(button0, "click", stop_propagation(/*prev*/ ctx[3]), false, false, true),
    				listen_dev(button1, "click", stop_propagation(/*next*/ ctx[4]), false, false, true),
    				listen_dev(div9, "click", stop_propagation(click_handler_1), false, false, true)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items, cur*/ 3 && t2_value !== (t2_value = (/*items*/ ctx[0][/*cur*/ ctx[1]].imageTitle || "Фото и схемы ДТП") + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*items, cur*/ 3 && img.src !== (img_src_value = /*items*/ ctx[0][/*cur*/ ctx[1]].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*items, cur*/ 3 && a_href_value !== (a_href_value = /*items*/ ctx[0][/*cur*/ ctx[1]].image)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*cur, items*/ 3) {
    				each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*cur*/ 2 && t8_value !== (t8_value = /*cur*/ ctx[1] + 1 + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*items*/ 1 && t10_value !== (t10_value = /*items*/ ctx[0].length + "")) set_data_dev(t10, t10_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(23:0) {#if items}",
    		ctx
    	});

    	return block;
    }

    // (42:7) {#each items as pt, index}
    function create_each_block(ctx) {
    	let li;
    	let li_class_value;
    	let li_value_value;
    	let li_aria_label_value;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*index*/ ctx[9], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			attr_dev(li, "class", li_class_value = "dot" + (/*index*/ ctx[9] === /*cur*/ ctx[1] ? " selected" : "") + " svelte-1nkz2qi");
    			li.value = li_value_value = /*index*/ ctx[9];
    			attr_dev(li, "role", "button");
    			attr_dev(li, "tabindex", "0");
    			attr_dev(li, "aria-label", li_aria_label_value = "slide item " + /*index*/ ctx[9]);
    			add_location(li, file, 42, 7, 1499);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, li, anchor);
    			if (remount) dispose();
    			dispose = listen_dev(li, "click", stop_propagation(click_handler), false, false, true);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*cur*/ 2 && li_class_value !== (li_class_value = "dot" + (/*index*/ ctx[9] === /*cur*/ ctx[1] ? " selected" : "") + " svelte-1nkz2qi")) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(42:7) {#each items as pt, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let if_block = /*items*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*items*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const click_handler_1 = () => {
    	
    };

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

    	const close = () => {
    		// console.log('modal close');
    		dispatch("close");
    	};

    	let { items } = $$props;
    	let cur = 0;

    	const prev = () => {
    		if (cur) {
    			$$invalidate(1, cur--, cur);
    		}
    	};

    	const next = () => {
    		if (cur < items.length - 1) {
    			$$invalidate(1, cur++, cur);
    		}
    	};

    	const writable_props = ["items"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Catalog> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Catalog", $$slots, []);

    	const click_handler = index => {
    		$$invalidate(1, cur = index);
    	};

    	$$self.$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		close,
    		items,
    		cur,
    		prev,
    		next
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("cur" in $$props) $$invalidate(1, cur = $$props.cur);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, cur, close, prev, next, dispatch, click_handler];
    }

    class Catalog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { items: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Catalog",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console.warn("<Catalog> was created without expected prop 'items'");
    		}
    	}

    	get items() {
    		throw new Error("<Catalog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Catalog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.20.1 */

    const { console: console_1 } = globals;
    const file$1 = "src\\App.svelte";

    // (37:0) {#if data}
    function create_if_block$1(ctx) {
    	let current;

    	const catalog = new Catalog({
    			props: { items: /*data*/ ctx[2] },
    			$$inline: true
    		});

    	catalog.$on("notify", /*callbackFunction*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(catalog.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(catalog, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const catalog_changes = {};
    			if (dirty & /*data*/ 4) catalog_changes.items = /*data*/ ctx[2];
    			catalog.$set(catalog_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(catalog.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(catalog.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(catalog, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(37:0) {#if data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let p0;
    	let t4;
    	let a;
    	let t6;
    	let t7;
    	let p1;
    	let button;
    	let t9;
    	let current;
    	let dispose;
    	let if_block = /*data*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text("Hello ");
    			t1 = text(/*name*/ ctx[1]);
    			t2 = text("!");
    			t3 = space();
    			p0 = element("p");
    			t4 = text("Visit the ");
    			a = element("a");
    			a.textContent = "Svelte tutorial";
    			t6 = text(" to learn how to build Svelte apps.");
    			t7 = space();
    			p1 = element("p");
    			button = element("button");
    			button.textContent = "Фото ссертификатов";
    			t9 = space();
    			if (if_block) if_block.c();
    			attr_dev(h1, "class", "svelte-1gqwiq3");
    			add_location(h1, file$1, 28, 1, 561);
    			attr_dev(a, "href", "https://svelte.dev/tutorial");
    			add_location(a, file$1, 31, 12, 603);
    			add_location(p0, file$1, 30, 1, 587);
    			attr_dev(button, "class", "primary");
    			add_location(button, file$1, 34, 2, 709);
    			add_location(p1, file$1, 33, 1, 703);
    			attr_dev(main, "class", "svelte-1gqwiq3");
    			add_location(main, file$1, 27, 0, 553);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(main, t3);
    			append_dev(main, p0);
    			append_dev(p0, t4);
    			append_dev(p0, a);
    			append_dev(p0, t6);
    			append_dev(main, t7);
    			append_dev(main, p1);
    			append_dev(p1, button);
    			append_dev(main, t9);
    			if (if_block) if_block.m(main, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 2) set_data_dev(t1, /*name*/ ctx[1]);

    			if (/*data*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	let { showModal = false } = $$props;
    	let data;
    	let url = "./data/" + name;

    	afterUpdate(() => {
    		// console.log('the component just updated', showModal, modal);
    		if (showModal && !data) {
    			fetch(url).then(req => req.json()).then(json => {
    				console.log("ddd", json);
    				$$invalidate(2, data = json);
    			});
    		}
    	});

    	function callbackFunction(event) {
    		console.log(`Notify fired! Detail: ${event.detail}`);
    		$$invalidate(0, showModal = false);
    	}

    	const writable_props = ["name", "showModal"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	const click_handler = () => $$invalidate(0, showModal = true);

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("showModal" in $$props) $$invalidate(0, showModal = $$props.showModal);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		Catalog,
    		name,
    		showModal,
    		data,
    		url,
    		callbackFunction
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("showModal" in $$props) $$invalidate(0, showModal = $$props.showModal);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("url" in $$props) url = $$props.url;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showModal, name, data, callbackFunction, url, click_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 1, showModal: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[1] === undefined && !("name" in props)) {
    			console_1.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showModal() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showModal(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'certificates.json'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
