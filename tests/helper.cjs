const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const source = readFileSync(join(__dirname, '../AirCanada-Aeroplan.user.js'), 'utf8');
const wait = (ms = 700) => new Promise(resolve => setTimeout(resolve, ms));
const profile = (id, name, number, aliases = []) => ({ id, name, number, aliases, nickname: '', enabled: true });

function setup(t, { profiles = [], language = 'en', legacy, pageLocale = 'en', lock = true } = {}) {
    const dom = new JSDOM('<!doctype html><body></body>', {
        url: `https://www.aircanada.com/manage-booking/ca/${pageLocale}/aco/manage`, runScripts: 'outside-only',
    });
    const w = dom.window;
    const doc = w.document;
    let stored = legacy ?? { schemaVersion: 2, language, profiles };
    const calls = { open: [], save: [] };
    const errors = [];
    let listener;
    const menus = new Map();
    w.structuredClone = structuredClone;
    w.confirm = () => true;
    w.GM_getValue = () => structuredClone(stored);
    w.GM_setValue = (_key, value) => { stored = structuredClone(value); };
    w.GM_addValueChangeListener = (_key, callback) => { listener = callback; };
    w.GM_registerMenuCommand = (name, fn) => { menus.set(name, fn); return name; };
    w.GM_unregisterMenuCommand = id => menus.delete(id);
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
    w.Element.prototype.getClientRects = function () { return this.isConnected && !this.closest('[hidden]') ? [{}] : []; };
    Object.defineProperty(w.navigator, 'locks', { value: { request: async (_key, _options, fn) => fn(lock ? {} : null) } });
    w.addEventListener('error', event => errors.push(event.error));

    function showBooking(passengers) {
        const trip = doc.createElement('section');
        trip.innerHTML = '<div class="booking-ref-id-text"><button aria-label="A B C 1 2 3">ABC123</button></div>';
        for (const { name, existing, prefilled, otherProgram, saveError } of passengers) {
            const card = doc.createElement('div');
            card.className = 'passenger-details-content';
            card.innerHTML = `<h3 class="passenger-name"></h3><ac-card class="loyalty-program-card ${existing ? '' : 'add-ffnumber'}">${existing ? 'Air Canada - Aeroplan' : '<div class="loyalty-program-block"><button></button></div>'}</ac-card>`;
            card.querySelector('h3').textContent = name;
            const add = card.querySelector('button');
            if (add) {
                add.textContent = pageLocale === 'fr' ? 'Ajouter un programme de fidélité' : 'Add loyalty program';
                add.addEventListener('click', () => {
                    calls.open.push(name);
                    const wrapper = doc.createElement('ac-side-drawer-modal');
                    wrapper.className = 'ac-drawer-loyalty-program';
                    wrapper.innerHTML = `<div role="dialog" tabindex="-1"><ac-dropdown formcontrolname="ffProgram"><div id="program" role="combobox" tabindex="0" aria-expanded="false"><span class="ac-selected-option-text"></span></div></ac-dropdown><ac-input formcontrolname="ffNumber"><input></ac-input><div class="ac-side-drawer-modal-footer-primary-section"><button disabled></button></div></div>`;
                    const combo = wrapper.querySelector('[role="combobox"]');
                    const selected = combo.querySelector('span');
                    const input = wrapper.querySelector('input');
                    const save = wrapper.querySelector('button');
                    save.textContent = pageLocale === 'fr' ? 'Enregistrer' : 'Save';
                    input.value = prefilled ?? '';
                    selected.textContent = otherProgram ? 'Other airline - Rewards' : '';
                    combo.addEventListener('keydown', event => {
                        if (event.key !== 'Enter' || doc.activeElement !== combo) return;
                        combo.setAttribute('aria-expanded', 'true');
                        const list = doc.createElement('div');
                        list.id = 'programOptionsPanel';
                        list.innerHTML = `<div role="option">${pageLocale === 'fr' ? 'Air Canada - Aéroplan' : 'Air Canada - Aeroplan'}</div>`;
                        doc.body.append(list);
                        list.firstElementChild.addEventListener('click', () => {
                            selected.textContent = list.textContent;
                            combo.setAttribute('aria-expanded', 'false');
                            list.remove();
                        });
                    });
                    input.addEventListener('blur', () => { save.disabled = !/^\d{9}$/.test(input.value); });
                    save.addEventListener('click', () => {
                        calls.save.push({ name, number: input.value });
                        if (saveError) return;
                        const loyalty = card.querySelector('ac-card');
                        loyalty.classList.remove('add-ffnumber');
                        loyalty.textContent = selected.textContent;
                        wrapper.remove();
                    });
                    doc.body.append(wrapper);
                    w.setTimeout(() => wrapper.querySelector('[role="dialog"]').focus(), 100);
                });
            }
            trip.append(card);
        }
        doc.body.prepend(trip);
    }
    w.eval(source);
    const shadow = doc.querySelector('#aircanada-aeroplan-helper').shadowRoot;
    t.after(async () => {
        w.history.replaceState(null, '', '/home/ca/en/aco/trips');
        await wait(180);
        w.close();
        assert.deepEqual(errors, []);
    });
    return {
        w, doc, shadow, calls, showBooking,
        stored: () => structuredClone(stored),
        remote(value) { stored = structuredClone(value); listener('key', null, value, true); },
        open(screen = 'people') { shadow.querySelector('.launcher').click(); shadow.querySelector(`[data-screen="${screen}"]`).click(); },
        input(name, value) {
            const input = shadow.querySelector(`[name="${name}"]`);
            input.value = value;
            input.dispatchEvent(new w.Event('input', { bubbles: true }));
        },
        async change(selector, value) {
            const input = shadow.querySelector(selector);
            input.value = value;
            input.dispatchEvent(new w.Event('change', { bubbles: true }));
            await wait(20);
        },
        async submit() { shadow.querySelector('form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await wait(20); },
    };
}
module.exports = { setup, profile, wait };
