const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setup, profile, wait } = require('./helper.cjs');
const alex = profile('alex', 'Alex Demo', '000000001');
const jamie = profile('jamie', 'Jamie Demo', '000000002');

test('migrates a v1 profile and preserves paused data', async t => {
    const app = setup(t, { legacy: { name: alex.name, number: alex.number } });
    assert.equal(app.stored().schemaVersion, 2);
    assert.equal(app.stored().profiles[0].number, alex.number);
    app.showBooking([{ name: alex.name }]);
    await wait();
    assert.deepEqual(app.calls.save, [{ name: alex.name, number: alex.number }]);
    const paused = setup(t, { legacy: { name: alex.name, number: '' } });
    assert.equal(paused.stored().profiles[0].enabled, false);
    assert.equal(paused.stored().profiles[0].name, alex.name);
});

test('adds multiple matching travellers sequentially with their own numbers', async t => {
    const app = setup(t, { profiles: [alex, jamie] });
    app.showBooking([{ name: 'ALEX   DEMO' }, { name: jamie.name }, { name: 'Unknown Traveller' }]);
    await wait(1100);
    assert.deepEqual(app.calls.save, [{ name: 'ALEX   DEMO', number: alex.number }, { name: jamie.name, number: jamie.number }]);
    assert.equal(app.doc.querySelectorAll('ac-side-drawer-modal').length, 0);
});

test('works on a French route with French controls and an accented Aéroplan label', async t => {
    const app = setup(t, { profiles: [alex], pageLocale: 'fr', language: 'fr' });
    app.showBooking([{ name: alex.name }]);
    await wait();
    assert.equal(app.calls.save.length, 1);
    app.open();
    assert.equal(app.shadow.querySelector('h2').textContent, 'Gérer les voyageurs');
});

test('uses explicitly saved name formats and never infers reversed or partial names', async t => {
    const app = setup(t, { profiles: [{ ...alex, aliases: ['Demo Alex'] }] });
    app.showBooking([{ name: 'Demo Alex' }, { name: 'Alex' }]);
    await wait();
    assert.deepEqual(app.calls.save, [{ name: 'Demo Alex', number: alex.number }]);
});

test('asks for a profile choice when two profiles share one ticket name', async t => {
    const app = setup(t, { profiles: [alex, { ...jamie, name: alex.name }] });
    app.showBooking([{ name: alex.name }]);
    await wait(220);
    assert.equal(app.calls.open.length, 0);
    app.open('matching');
    await app.change('[data-match="0"]', jamie.id);
    app.shadow.querySelector('[data-close]').click();
    await wait();
    assert.deepEqual(app.calls.save, [{ name: alex.name, number: jamie.number }]);
});

test('keeps same-name passengers separate and prevents reuse of a selected profile', async t => {
    const app = setup(t, { profiles: [alex, { ...jamie, name: alex.name }] });
    app.showBooking([{ name: alex.name }, { name: alex.name }]);
    app.open('matching');
    await app.change('[data-match="0"]', alex.id);
    await app.change('[data-match="1"]', alex.id);
    assert.match(app.shadow.querySelector('.feedback').textContent, /already assigned/);
    await app.change('[data-match="1"]', jamie.id);
    app.shadow.querySelector('[data-close]').click();
    await wait(1100);
    assert.deepEqual(app.calls.save.map(call => call.number), [alex.number, jamie.number]);
});

test('allows an explicit selection to resolve a profile matching two alias names', async t => {
    const app = setup(t, { profiles: [{ ...alex, aliases: ['Demo Alex'] }] });
    app.showBooking([{ name: alex.name }, { name: 'Demo Alex' }]);
    app.open('matching');
    await app.change('[data-match="0"]', alex.id);
    app.shadow.querySelector('[data-close]').click();
    await wait();
    assert.deepEqual(app.calls.save, [{ name: alex.name, number: alex.number }]);
});

test('does not act on disabled profiles, existing numbers, other programs, or populated forms', async t => {
    for (const attributes of [{ existing: true }, { otherProgram: true }, { prefilled: '999999999' }]) {
        const app = setup(t, { profiles: [alex] });
        app.showBooking([{ name: alex.name, ...attributes }]);
        await wait(550);
        assert.equal(app.calls.save.length, 0);
    }
    const app = setup(t, { profiles: [{ ...alex, enabled: false }] });
    app.showBooking([{ name: alex.name }]);
    await wait(220);
    assert.equal(app.calls.open.length, 0);
});

test('settings validates, creates, edits and deletes profiles, with complete locale switching', async t => {
    const app = setup(t);
    app.open();
    app.shadow.querySelector('[data-add]').click();
    app.input('name', '<b>Alex Demo</b>');
    app.input('number', '123');
    await app.submit();
    assert.match(app.shadow.querySelector('.error').textContent, /9-digit/);
    app.input('number', '000 000-001');
    app.input('aliases', 'Alex Demo\nDemo Alex');
    await app.submit();
    assert.equal(app.stored().profiles.length, 1);
    assert.equal(app.shadow.querySelector('.person-name b'), null);
    assert.deepEqual(app.stored().profiles[0].aliases, ['Alex Demo', 'Demo Alex']);
    app.shadow.querySelector('[data-edit]').click();
    app.input('nickname', 'Demo label');
    await app.submit();
    assert.equal(app.stored().profiles[0].nickname, 'Demo label');
    app.shadow.querySelector('[data-screen="language"]').click();
    await app.change('[data-language]', 'zh');
    assert.equal(app.shadow.querySelector('h2').textContent, '界面语言');
    await app.change('[data-language]', 'fr');
    assert.equal(app.shadow.querySelector('[data-screen="people"]').textContent, 'Voyageurs');
    app.shadow.querySelector('[data-screen="people"]').click();
    app.shadow.querySelector('[data-edit]').click();
    app.shadow.querySelector('[data-delete]').click();
    assert.equal(app.stored().profiles.length, 0);
});

test('merges new profiles with remote changes and detects edits to the same profile', async t => {
    const app = setup(t, { profiles: [alex] });
    app.open();
    app.shadow.querySelector('[data-edit]').click();
    app.input('nickname', 'Local edit');
    app.remote({ schemaVersion: 2, language: 'en', profiles: [{ ...alex, nickname: 'Remote edit' }, jamie] });
    await app.submit();
    assert.match(app.shadow.querySelector('.error').textContent, /Another tab/);
    assert.equal(app.stored().profiles[0].nickname, 'Remote edit');
    app.shadow.querySelector('[data-cancel]').click();
    app.shadow.querySelector('[data-add]').click();
    app.input('name', 'Third Demo');
    app.input('number', '000000003');
    await app.submit();
    assert.equal(app.stored().profiles.length, 3);
});

test('settings suppresses automation until closed and route changes cancel a pending operation', async t => {
    const app = setup(t, { profiles: [alex] });
    app.showBooking([{ name: alex.name }]);
    app.open();
    await wait(220);
    assert.equal(app.calls.open.length, 0);
    app.shadow.querySelector('[data-close]').click();
    app.w.setTimeout(() => app.w.history.replaceState(null, '', '/home/ca/en/aco/trips'), 180);
    await wait();
    assert.equal(app.calls.save.length, 0);
});

test('locks avoid concurrent submission and an unconfirmed save is submitted only once', async t => {
    const locked = setup(t, { profiles: [alex], lock: false });
    locked.showBooking([{ name: alex.name }]);
    await wait(220);
    assert.equal(locked.calls.open.length, 0);
    const app = setup(t, { profiles: [alex] });
    app.showBooking([{ name: alex.name, saveError: true }]);
    await wait(1000);
    assert.equal(app.calls.save.length, 1);
});
