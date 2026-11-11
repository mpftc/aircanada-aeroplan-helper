// ==UserScript==
// @name         Air Canada 自动添加 Aeroplan 号码
// @name:en      Air Canada Aeroplan Helper
// @name:zh-CN   Air Canada Aeroplan 旅客助手
// @name:fr      Assistant Aéroplan Air Canada
// @namespace    local.aircanada.aeroplan
// @version      1.1.1
// @description  管理多位旅客资料，为 Air Canada 订座中匹配的旅客自动添加 Aeroplan 号码。
// @description:en Manage traveller profiles and add matching Aeroplan numbers to Air Canada bookings.
// @description:zh-CN 管理多位旅客资料，为 Air Canada 订座中匹配的旅客自动添加 Aeroplan 号码。
// @description:fr Gérez les voyageurs et ajoutez leur numéro Aéroplan aux réservations Air Canada.
// @match        https://www.aircanada.com/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @homepageURL  https://github.com/mpftc/aircanada-aeroplan-helper
// @supportURL   https://github.com/mpftc/aircanada-aeroplan-helper/issues
// @downloadURL  https://github.com/mpftc/aircanada-aeroplan-helper/releases/latest/download/AirCanada-Aeroplan.user.js
// @updateURL    https://github.com/mpftc/aircanada-aeroplan-helper/releases/latest/download/AirCanada-Aeroplan.meta.js
// @license      MIT
// ==/UserScript==

(() => {
    'use strict';

    const storageKey = 'traveller-aeroplan';
    const managePage = /^\/manage-booking\/[^/]+\/(?:en|fr)\/(?:aco|ado)\/manage\/?$/i;
    const drawerSelector = 'ac-side-drawer-modal.ac-drawer-loyalty-program [role="dialog"]';
    const addSelector = 'ac-card.loyalty-program-card.add-ffnumber .loyalty-program-block button';
    const messages = {
        zh: {
            settings: 'Aeroplan 设置', people: '旅客资料', matching: '姓名匹配', language: '语言', close: '关闭',
            title: '管理旅客', intro: '按机票上的姓名，匹配各自的 Aeroplan 号码。', add: '添加旅客',
            edit: '编辑', enabled: '启用', empty: '添加第一位旅客，开始自动匹配。',
            local: '资料保存在油猴的脚本存储中。', newPerson: '添加旅客', editPerson: '编辑旅客',
            nickname: '备注名（可选）', name: '机票上的姓名', nameHint: '按 Passenger details 的姓名顺序填写。',
            number: 'Aeroplan 号码', numberHint: '9 位数字', aliases: '其他姓名写法（可选）',
            aliasesHint: '每行一种，或用逗号分隔。登记的写法参与精确匹配。', cancel: '取消', save: '保存资料',
            remove: '删除旅客', removeQuestion: '删除这位旅客的已保存资料？', reveal: '显示号码', hide: '隐藏号码',
            invalidName: '请填写机票上的姓名。', invalidNumber: 'Aeroplan 号码需要 9 位数字。',
            duplicateNumber: '这个 Aeroplan 号码已有旅客资料，请编辑已有资料。',
            conflict: '其他标签页修改了这位旅客。请取消后重新打开编辑。',
            unavailable: '脚本存储暂时不可用，请刷新后再试。', incompatible: '资料格式无法读取。请恢复兼容版本后打开设置。',
            matchTitle: '当前行程的姓名匹配', matchIntro: '匹配不唯一时，选择每位旅客对应的资料，关闭设置后开始添加。',
            noBooking: '打开英文或法文 Manage booking 订座详情后，可查看姓名匹配。',
            noProfiles: '先添加并启用旅客资料。', unknown: '未找到资料，请登记此姓名或其他姓名写法。',
            choose: '请选择旅客资料', chosen: '已选择', matched: '已匹配', existing: '已有关联号码',
            needsChoice: '需要选择资料', used: '这份资料已用于本行程的另一位旅客。', passenger: '旅客',
            openMatches: '查看姓名匹配', saved: '资料已保存', languageTitle: '界面语言',
            languageIntro: '菜单、设置、验证信息和操作提示使用所选语言。', auto: '跟随浏览器',
            adding: '正在为 {name} 添加 Aeroplan…', added: '已为 {name} 添加 Aeroplan',
            submitted: '已为 {name} 点击保存，请在官网核对结果。', interrupted: '操作已交给你，请检查会员表单。',
            formError: '会员表单尚未就绪，请在官网检查。', optionError: '请在会员表单中选择 Aeroplan。',
            filled: '号码已填写，请查看官网验证信息并保存。', waitingChoice: '部分旅客需要选择资料',
            addingLabel: '添加中', idle: '旅客设置', menu: '打开 Aeroplan 旅客设置',
        },
        en: {
            settings: 'Aeroplan settings', people: 'Travellers', matching: 'Name matching', language: 'Language', close: 'Close',
            title: 'Manage travellers', intro: 'Match each traveller’s ticket name to their Aeroplan number.', add: 'Add traveller',
            edit: 'Edit', enabled: 'Enabled', empty: 'Add a traveller to start matching bookings.',
            local: 'Profiles are saved in Tampermonkey script storage.', newPerson: 'Add traveller', editPerson: 'Edit traveller',
            nickname: 'Label (optional)', name: 'Name on ticket', nameHint: 'Use the name order shown under Passenger details.',
            number: 'Aeroplan number', numberHint: '9 digits', aliases: 'Other name formats (optional)',
            aliasesHint: 'One per line, or separate with commas. Saved formats are matched exactly.', cancel: 'Cancel', save: 'Save profile',
            remove: 'Delete traveller', removeQuestion: 'Delete this saved traveller profile?', reveal: 'Show number', hide: 'Hide number',
            invalidName: 'Enter the name on the ticket.', invalidNumber: 'Enter a 9-digit Aeroplan number.',
            duplicateNumber: 'This Aeroplan number already has a profile. Edit the existing profile.',
            conflict: 'Another tab changed this traveller. Cancel and reopen the editor.',
            unavailable: 'Script storage is unavailable. Refresh and try again.', incompatible: 'This profile format cannot be read. Open settings with a compatible version.',
            matchTitle: 'Name matching for this booking', matchIntro: 'Choose a profile for each ambiguous match. Adding starts after settings are closed.',
            noBooking: 'Open booking details in English or French to review name matching.',
            noProfiles: 'Add and enable traveller profiles first.', unknown: 'No profile found. Save this ticket name or an additional name format.',
            choose: 'Choose a traveller profile', chosen: 'Selected', matched: 'Matched', existing: 'Number already linked',
            needsChoice: 'Choose a profile', used: 'This profile is already assigned to another traveller in this booking.', passenger: 'Traveller',
            openMatches: 'Review name matching', saved: 'Profile saved', languageTitle: 'Interface language',
            languageIntro: 'Menus, settings, validation and status messages use your selected language.', auto: 'Follow browser',
            adding: 'Adding Aeroplan for {name}…', added: 'Aeroplan added for {name}',
            submitted: 'Save clicked for {name}. Check the result on the Air Canada page.', interrupted: 'You have control. Check the loyalty form.',
            formError: 'The loyalty form is not ready. Check the Air Canada page.', optionError: 'Select Aeroplan in the loyalty form.',
            filled: 'Number filled. Review website validation and save.', waitingChoice: 'Some travellers need a profile selection',
            addingLabel: 'Adding', idle: 'Traveller settings', menu: 'Open Aeroplan traveller settings',
        },
        fr: {
            settings: 'Réglages Aéroplan', people: 'Voyageurs', matching: 'Correspondance des noms', language: 'Langue', close: 'Fermer',
            title: 'Gérer les voyageurs', intro: 'Associez le nom sur le billet au numéro Aéroplan de chaque voyageur.', add: 'Ajouter un voyageur',
            edit: 'Modifier', enabled: 'Actif', empty: 'Ajoutez un voyageur pour associer les réservations.',
            local: 'Les profils sont enregistrés dans le stockage du script Tampermonkey.', newPerson: 'Ajouter un voyageur', editPerson: 'Modifier le voyageur',
            nickname: 'Libellé (facultatif)', name: 'Nom sur le billet', nameHint: 'Respectez l’ordre affiché dans les détails du passager.',
            number: 'Numéro Aéroplan', numberHint: '9 chiffres', aliases: 'Autres formats du nom (facultatif)',
            aliasesHint: 'Un par ligne ou séparés par des virgules. Les formats enregistrés sont comparés exactement.', cancel: 'Annuler', save: 'Enregistrer le profil',
            remove: 'Supprimer le voyageur', removeQuestion: 'Supprimer ce profil de voyageur enregistré ?', reveal: 'Afficher le numéro', hide: 'Masquer le numéro',
            invalidName: 'Saisissez le nom figurant sur le billet.', invalidNumber: 'Saisissez un numéro Aéroplan à 9 chiffres.',
            duplicateNumber: 'Ce numéro Aéroplan a déjà un profil. Modifiez le profil existant.',
            conflict: 'Un autre onglet a modifié ce voyageur. Annulez et rouvrez le formulaire.',
            unavailable: 'Le stockage du script est indisponible. Actualisez la page.', incompatible: 'Ce format de profil est illisible. Utilisez une version compatible.',
            matchTitle: 'Correspondance des noms de cette réservation', matchIntro: 'Choisissez un profil pour chaque correspondance ambiguë. L’ajout commence à la fermeture des réglages.',
            noBooking: 'Ouvrez les détails d’une réservation en anglais ou en français pour vérifier les noms.',
            noProfiles: 'Ajoutez et activez d’abord des profils de voyageurs.', unknown: 'Aucun profil trouvé. Enregistrez ce nom ou un autre format du nom.',
            choose: 'Choisir un profil de voyageur', chosen: 'Sélectionné', matched: 'Associé', existing: 'Numéro déjà associé',
            needsChoice: 'Choisissez un profil', used: 'Ce profil est déjà attribué à un autre voyageur de cette réservation.', passenger: 'Voyageur',
            openMatches: 'Vérifier les noms', saved: 'Profil enregistré', languageTitle: 'Langue de l’interface',
            languageIntro: 'Les menus, réglages, validations et messages utilisent la langue choisie.', auto: 'Langue du navigateur',
            adding: 'Ajout du numéro Aéroplan pour {name}…', added: 'Numéro Aéroplan ajouté pour {name}',
            submitted: 'Enregistrement demandé pour {name}. Vérifiez le résultat sur le site.', interrupted: 'Vous avez le contrôle. Vérifiez le formulaire de fidélité.',
            formError: 'Le formulaire de fidélité n’est pas prêt. Vérifiez la page Air Canada.', optionError: 'Sélectionnez Aéroplan dans le formulaire de fidélité.',
            filled: 'Numéro saisi. Vérifiez les messages du site et enregistrez.', waitingChoice: 'Certains voyageurs nécessitent un choix de profil',
            addingLabel: 'Ajout en cours', idle: 'Réglages voyageurs', menu: 'Ouvrir les réglages des voyageurs Aéroplan',
        },
    };

    const nameKey = value => String(value).normalize('NFKC').trim().replace(/\s+/g, ' ').toUpperCase();
    const textOf = element => element?.textContent.trim() ?? '';
    const visible = element => Boolean(element?.isConnected && element.getClientRects().length && getComputedStyle(element).visibility === 'visible');
    const enabled = element => visible(element) && !element.matches(':disabled, [aria-disabled="true"]');
    const isAeroplan = value => /\baeroplan\b/i.test(value.normalize('NFD').replace(/\p{M}/gu, ''));
    const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    let config;
    let storageError = '';
    try {
        const saved = GM_getValue(storageKey, {});
        if (saved.schemaVersion && saved.schemaVersion !== 2) throw new Error('incompatible');
        config = saved.schemaVersion === 2 ? saved : {
            schemaVersion: 2, language: 'auto', profiles: saved.name ? [{
                id: crypto.randomUUID(), nickname: '', name: saved.name, number: saved.number || '',
                aliases: [], enabled: /^\d{9}$/.test(saved.number || ''),
            }] : [],
        };
        if (!Array.isArray(config.profiles) || config.profiles.some(profile =>
            !profile || typeof profile.id !== 'string' || typeof profile.name !== 'string' ||
            typeof profile.number !== 'string' || !Array.isArray(profile.aliases) ||
            profile.aliases.some(alias => typeof alias !== 'string'))) throw new Error('incompatible');
        if (!saved.schemaVersion) GM_setValue(storageKey, config);
    } catch (error) {
        storageError = error.message === 'incompatible' ? 'incompatible' : 'unavailable';
        config = { schemaVersion: 2, language: 'auto', profiles: [] };
    }

    function locale() {
        const requested = config.language === 'auto' ? navigator.language : config.language;
        const key = String(requested).toLowerCase().split('-')[0];
        return messages[key] ? key : 'en';
    }
    function t(key, values = {}) {
        return messages[locale()][key].replace(/\{(\w+)\}/g, (_match, name) => values[name] ?? '');
    }
    async function saveConfig(change) {
        const write = () => {
            if (storageError) throw new Error(storageError);
            const latest = GM_getValue(storageKey, config);
            if (latest.schemaVersion !== 2 || !Array.isArray(latest.profiles)) throw new Error('incompatible');
            const updated = structuredClone(latest);
            change(updated);
            GM_setValue(storageKey, updated);
            config = updated;
            updateMenu();
            updateLauncher();
            scheduleScan();
        };
        if (navigator.locks) await navigator.locks.request('aircanada-aeroplan-settings', {}, write);
        else write();
    }

    const host = document.createElement('div');
    host.id = 'aircanada-aeroplan-helper';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>
        :host{all:initial;color-scheme:light dark;--bg:light-dark(#f5f6f8,#171a20);--panel:light-dark(#fff,#22262e);--text:light-dark(#252a33,#edf0f4);--muted:light-dark(#616c7d,#adb6c4);--line:light-dark(#e0e4ea,#3a414c);--red:light-dark(#b72d3b,#f598a3);--fill:light-dark(#b72d3b,#a52b3a);--tint:light-dark(#f9edef,#42242d);font:14px/1.5 Inter,"Segoe UI","Microsoft YaHei",sans-serif;color:var(--text)}
        *{box-sizing:border-box}[hidden]{display:none!important}button,input,select,textarea{font:inherit}button{cursor:pointer}button:disabled{cursor:default;opacity:.5}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--red);outline-offset:3px}
        .launcher{position:fixed;right:22px;bottom:22px;z-index:2147483646;display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:28px;padding:11px 17px;background:var(--panel);color:var(--text);box-shadow:0 5px 24px #0002}.plane{color:var(--red);font-size:20px}.launcher-detail{font-size:12px;color:var(--muted)}
        dialog{border:1px solid var(--line);border-radius:16px;padding:0;width:min(940px,calc(100vw - 32px));max-width:940px;max-height:calc(100dvh - 40px);background:var(--panel);color:var(--text);box-shadow:0 20px 80px #0003;overflow:auto}dialog::backdrop{background:#0006}
        header{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:21px 24px;border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:600}.shell{display:grid;grid-template-columns:192px minmax(0,1fr);min-height:400px}nav{padding:18px 12px;background:var(--bg);border-right:1px solid var(--line);display:flex;flex-direction:column;gap:7px}nav button{background:transparent;border:1px solid transparent;color:var(--muted);text-align:left;border-radius:8px;padding:11px 12px}nav button[aria-current=page]{background:var(--panel);border-color:var(--line);color:var(--red)}main{padding:25px 28px;min-width:0}.heading{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;margin-bottom:22px}h2{font-size:22px;line-height:1.3;margin:0 0 7px;font-weight:600}p{margin:0;color:var(--muted)}.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--text);padding:8px 13px}.btn:hover{filter:brightness(.95)}.primary{background:var(--fill);border-color:var(--fill);color:#fff}.quiet{border-color:transparent;color:var(--muted)}.close{font-size:23px;padding:0 8px}
        .profiles{display:grid;gap:12px}.profile{display:flex;align-items:center;gap:13px;padding:17px;border:1px solid var(--line);border-radius:12px}.avatar{display:flex;align-items:center;justify-content:center;width:40px;height:40px;flex-shrink:0;border-radius:50%;background:var(--bg);color:var(--muted)}.profile-info{flex:1;min-width:0;overflow-wrap:anywhere}.person-name{font-weight:600}.small{font-size:12px;color:var(--muted)}.number{font-size:13px;font-variant-numeric:tabular-nums;color:var(--muted)}.actions{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap}.check{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--muted)}input[type=checkbox]{accent-color:var(--fill);width:17px;height:17px}.note{margin-top:18px}.fields{display:grid;grid-template-columns:1fr 1fr;gap:18px}label.field{display:flex;flex-direction:column;gap:7px;min-width:0}.wide{grid-column:1/-1}input[type=text],select,textarea{width:100%;min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:7px;background:var(--panel);color:var(--text)}textarea{resize:vertical;min-height:82px}.form-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:22px}.error{color:var(--red);margin-top:14px}.row{padding:16px 0;border-bottom:1px solid var(--line)}.row-title{font-weight:600;margin-bottom:5px}.row select{margin-top:10px}.language{max-width:330px}.toast{position:fixed;bottom:85px;right:22px;z-index:2147483646;width:max-content;max-width:min(420px,calc(100vw - 44px));padding:12px 16px;background:var(--panel);border:1px solid var(--line);border-radius:10px;color:var(--text);box-shadow:0 5px 24px #0002}.feedback{min-height:40px;border-top:1px solid var(--line);padding:10px 24px;font-size:12px;color:var(--muted)}
        @media(max-width:680px){.shell{display:block;min-height:0}nav{flex-direction:row;flex-wrap:wrap;border-right:0;border-bottom:1px solid var(--line);padding:10px}nav button{flex:1;text-align:center}main{padding:21px 18px}header{padding:17px 18px}.fields{grid-template-columns:1fr}.profile{flex-wrap:wrap}.actions{margin-left:auto}.launcher{right:12px;bottom:12px}.launcher-detail{display:none}dialog{max-height:calc(100dvh - 24px)}}
        @media(pointer:coarse){button,select,input[type=text]{min-height:44px}input[type=text],textarea{font-size:16px}}
    </style><button type="button" class="launcher" aria-haspopup="dialog"><span class="plane" aria-hidden="true">✈</span><span>Aeroplan</span><span class="launcher-detail"></span></button>
    <dialog aria-labelledby="helper-title"><header><div class="brand"><span class="plane" aria-hidden="true">✈</span><span id="helper-title">Aeroplan Helper</span></div><button type="button" class="btn quiet close" data-close>×</button></header><div class="shell"><nav></nav><main></main></div><div class="feedback" role="status" aria-live="polite"></div></dialog><div class="toast" role="status" aria-live="polite" hidden></div>`;
    document.body.append(host);
    const dialog = shadow.querySelector('dialog');
    const main = shadow.querySelector('main');
    let screen = 'people';
    let editing = null;
    let draft;
    let editBase;
    let menuId;
    let toastTimer;
    let running = false;
    let scanTimer;
    let activeRef = '';
    let choices = new WeakMap();
    const attempted = new Set();
    const reserved = new Map();
    const duplicateIds = new WeakMap();

    function notify(key, values) {
        const toast = shadow.querySelector('.toast');
        toast.textContent = t(key, values);
        toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toast.hidden = true; }, 10000);
    }
    function feedback(key) {
        shadow.querySelector('.feedback').textContent = t(key);
    }
    function updateMenu() {
        if (menuId !== undefined) GM_unregisterMenuCommand(menuId);
        menuId = GM_registerMenuCommand(t('menu'), () => openSettings('people'));
    }
    function updateLauncher(needsChoice = false) {
        shadow.querySelector('.launcher').setAttribute('aria-label', t('settings'));
        shadow.querySelector('.launcher-detail').textContent = t(running ? 'addingLabel' : needsChoice ? 'needsChoice' : 'idle');
    }
    function openSettings(nextScreen) {
        screen = nextScreen;
        editing = null;
        render();
        if (!dialog.open) dialog.showModal();
    }
    function heading(title, intro, action = '') {
        return `<div class="heading"><div><h2>${t(title)}</h2><p>${t(intro)}</p></div>${action}</div>`;
    }
    function render() {
        host.lang = locale() === 'zh' ? 'zh-CN' : locale();
        shadow.querySelector('[data-close]').setAttribute('aria-label', t('close'));
        shadow.querySelector('nav').setAttribute('aria-label', t('settings'));
        shadow.querySelector('nav').innerHTML = ['people', 'matching', 'language'].map(key =>
            `<button type="button" data-screen="${key}" ${screen === key ? 'aria-current="page"' : ''}>${t(key)}</button>`).join('');
        shadow.querySelector('.feedback').textContent = '';
        if (storageError) {
            main.innerHTML = `<p class="error" role="alert">${t(storageError)}</p>`;
            return;
        }
        if (editing !== null) renderEditor();
        else if (screen === 'people') renderPeople();
        else if (screen === 'matching') renderMatches();
        else renderLanguage();
    }
    function renderPeople() {
        main.innerHTML = heading('title', 'intro', `<button type="button" class="btn primary" data-add>+ ${t('add')}</button>`) +
            `<div class="profiles">${config.profiles.map(profile => `<div class="profile">
                <div class="avatar" aria-hidden="true">${escapeHtml(profile.name.split(/\s+/).map(word => word[0]).join('').slice(0, 2))}</div>
                <div class="profile-info"><div class="person-name">${escapeHtml(profile.nickname || profile.name)}</div>
                ${profile.nickname ? `<div class="small">${escapeHtml(profile.name)}</div>` : ''}
                <div class="number">Aeroplan · ••••• ${escapeHtml(profile.number.slice(-4))}</div></div>
                <div class="actions"><label class="check"><input type="checkbox" data-enabled="${escapeHtml(profile.id)}" ${profile.enabled ? 'checked' : ''}>${t('enabled')}</label><button type="button" class="btn" data-edit="${escapeHtml(profile.id)}">${t('edit')}</button></div>
            </div>`).join('')}</div>${config.profiles.length ? '' : `<p>${t('empty')}</p>`}<p class="small note">${t('local')}</p>`;
    }
    function renderEditor() {
        main.innerHTML = `<div class="heading"><h2>${t(editing ? 'editPerson' : 'newPerson')}</h2></div><form novalidate>
            <div class="fields"><label class="field">${t('nickname')}<input type="text" name="nickname" value="${escapeHtml(draft.nickname)}"></label>
            <label class="field">${t('name')}<input type="text" name="name" value="${escapeHtml(draft.name)}" required><span class="small">${t('nameHint')}</span></label>
            <label class="field">${t('number')}<input type="text" name="number" inputmode="numeric" value="${escapeHtml(draft.number)}" required><span class="small">${t('numberHint')}</span></label>
            <label class="field">${t('enabled')}<input type="checkbox" name="enabled" ${draft.enabled ? 'checked' : ''}></label>
            <label class="field wide">${t('aliases')}<textarea name="aliases">${escapeHtml(draft.aliases.join('\n'))}</textarea><span class="small">${t('aliasesHint')}</span></label></div>
            <div class="error" role="alert"></div><div class="form-actions">${editing ? `<button type="button" class="btn quiet" data-delete>${t('remove')}</button>` : ''}<button type="button" class="btn" data-cancel>${t('cancel')}</button><button type="submit" class="btn primary">${t('save')}</button></div></form>`;
        main.querySelector('[name="name"]').focus({ preventScroll: true });
    }
    function renderLanguage() {
        main.innerHTML = heading('languageTitle', 'languageIntro') + `<label class="field language">${t('language')}<select data-language>
            ${[['auto', t('auto')], ['zh', '简体中文'], ['en', 'English'], ['fr', 'Français']].map(([value, label]) => `<option value="${value}" ${config.language === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>`;
    }
    function renderMatches() {
        main.innerHTML = heading('matchTitle', 'matchIntro');
        if (!bookingReference()) {
            main.insertAdjacentHTML('beforeend', `<p>${t('noBooking')}</p>`);
            return;
        }
        const records = matchingRecords();
        main.insertAdjacentHTML('beforeend', records.map((record, index) => `<div class="row">
            <div class="row-title">${escapeHtml(record.name)}${record.duplicate ? ` · ${t('passenger')} ${index + 1}` : ''}</div>
            <p class="small">${t(!record.button ? 'existing' : record.profile ? choices.has(record.card) ? 'chosen' : 'matched' : record.candidates.length ? 'needsChoice' : 'unknown')}</p>
            ${record.button && record.candidates.length ? `<select data-match="${index}" aria-label="${escapeHtml(`${t('choose')} · ${record.name}`)}"><option value="">${t('choose')}</option>${record.candidates.map(profile => `<option value="${escapeHtml(profile.id)}" ${record.profile?.id === profile.id ? 'selected' : ''}>${escapeHtml(profile.nickname || profile.name)} · ••••• ${escapeHtml(profile.number.slice(-4))}</option>`).join('')}</select>` : ''}
        </div>`).join(''));
        if (!config.profiles.some(profile => profile.enabled)) main.insertAdjacentHTML('beforeend', `<p class="note">${t('noProfiles')}</p>`);
    }

    shadow.querySelector('.launcher').addEventListener('click', () => openSettings('people'));
    shadow.addEventListener('click', async event => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.hasAttribute('data-close')) dialog.close();
        if (button.dataset.screen) { screen = button.dataset.screen; editing = null; render(); }
        if (button.hasAttribute('data-add')) {
            editing = '';
            draft = { nickname: '', name: '', number: '', aliases: [], enabled: true };
            render();
        }
        if (button.dataset.edit) {
            const profile = config.profiles.find(item => item.id === button.dataset.edit);
            if (!profile) return;
            editing = profile.id;
            editBase = JSON.stringify(profile);
            draft = structuredClone(profile);
            render();
        }
        if (button.hasAttribute('data-cancel')) { editing = null; render(); }
        if (button.hasAttribute('data-delete') && window.confirm(t('removeQuestion'))) {
            const id = editing;
            try {
                await saveConfig(latest => { latest.profiles = latest.profiles.filter(profile => profile.id !== id); });
                if (editing === id) { editing = null; render(); }
            } catch (error) { feedback(messages.en[error.message] ? error.message : 'unavailable'); }
        }
    });
    shadow.addEventListener('input', event => {
        const input = event.target;
        if (editing === null || !input.name) return;
        if (input.name === 'aliases') draft.aliases = input.value.split(/[\n,，]/).map(value => value.trim()).filter(Boolean);
        else draft[input.name] = input.type === 'checkbox' ? input.checked : input.value;
    });
    shadow.addEventListener('submit', async event => {
        event.preventDefault();
        const editorDraft = draft;
        const changes = structuredClone(draft);
        const id = editing;
        const base = editBase;
        const number = changes.number.replace(/[\s-]/g, '');
        const name = changes.name.trim();
        let errorKey = '';
        if (!nameKey(name)) errorKey = 'invalidName';
        else if (!/^\d{9}$/.test(number)) errorKey = 'invalidNumber';
        if (errorKey) { main.querySelector('.error').textContent = t(errorKey); return; }
        try {
            await saveConfig(latest => {
                const existing = latest.profiles.find(profile => profile.id === id);
                if (id && JSON.stringify(existing) !== base) throw new Error('conflict');
                if (latest.profiles.some(profile => profile.id !== id && profile.number === number)) throw new Error('duplicateNumber');
                const aliases = [...new Set(changes.aliases.map(value => value.trim()).filter(Boolean))];
                const profile = { ...changes, id: id || crypto.randomUUID(), name, number, aliases };
                if (id) latest.profiles[latest.profiles.findIndex(item => item.id === id)] = profile;
                else latest.profiles.push(profile);
            });
            if (draft === editorDraft && editing === id) { editing = null; render(); }
            feedback('saved');
        } catch (error) {
            const key = messages.en[error.message] ? error.message : 'unavailable';
            const errorBox = main.querySelector('.error');
            if (errorBox && draft === editorDraft) errorBox.textContent = t(key);
            else feedback(key);
        }
    });
    shadow.addEventListener('change', async event => {
        const input = event.target;
        try {
            if (input.hasAttribute('data-language')) {
                await saveConfig(latest => { latest.language = input.value; });
                render();
            }
            if (input.dataset.enabled) {
                await saveConfig(latest => {
                    const profile = latest.profiles.find(item => item.id === input.dataset.enabled);
                    if (profile) profile.enabled = input.checked;
                });
            }
            if (input.dataset.match !== undefined) {
                const records = matchingRecords();
                const record = records[Number(input.dataset.match)];
                if (!record) return;
                if (input.value && records.some(other => other.card !== record.card && other.profile?.id === input.value)) {
                    input.value = record.profile?.id || '';
                    feedback('used');
                    return;
                }
                if (input.value) choices.set(record.card, input.value);
                else choices.delete(record.card);
                renderMatches();
            }
        } catch { feedback('unavailable'); }
    });
    dialog.addEventListener('close', () => {
        editing = null;
        shadow.querySelector('.launcher').focus();
        scheduleScan();
    });

    function bookingReference() {
        if (!managePage.test(location.pathname)) return '';
        const button = document.querySelector('.booking-ref-id-text button');
        const ref = (button?.getAttribute('aria-label') || textOf(button)).replace(/\s+/g, '');
        return /^[A-Z0-9]{6}$/i.test(ref) ? ref.toUpperCase() : '';
    }
    function matchingRecords() {
        const ref = bookingReference();
        if (ref !== activeRef) {
            activeRef = ref;
            attempted.clear();
            reserved.clear();
            choices = new WeakMap();
        }
        const records = [...document.querySelectorAll('.passenger-details-content .passenger-name')].filter(visible).map(heading => {
            const card = heading.closest('.passenger-details-content');
            const name = textOf(heading);
            const candidates = config.profiles.filter(profile => profile.enabled && /^\d{9}$/.test(profile.number) &&
                [profile.name, ...profile.aliases].some(alias => nameKey(alias) === nameKey(name)));
            return { card, name, candidates, button: card.querySelector(addSelector), profile: null };
        });
        for (const record of records) {
            record.duplicate = records.filter(other => nameKey(other.name) === nameKey(record.name)).length > 1;
            if (record.duplicate && !duplicateIds.has(record.card)) duplicateIds.set(record.card, crypto.randomUUID());
            record.key = record.duplicate ? duplicateIds.get(record.card) : nameKey(record.name);
            record.profile = record.candidates.find(profile => profile.id === choices.get(record.card)) ||
                (!record.duplicate && record.candidates.length === 1 ? record.candidates[0] : null);
        }
        const explicit = new Map();
        for (const record of records) {
            if (record.profile && choices.has(record.card)) explicit.set(record.profile.id, record.key);
        }
        for (const record of records) {
            if (record.profile && explicit.has(record.profile.id) && explicit.get(record.profile.id) !== record.key) record.profile = null;
        }
        const counts = new Map();
        for (const record of records) {
            if (record.profile) counts.set(record.profile.id, (counts.get(record.profile.id) || 0) + 1);
        }
        for (const record of records) {
            if (record.profile && (counts.get(record.profile.id) > 1 ||
                (reserved.has(record.profile.id) && reserved.get(record.profile.id) !== record.key))) record.profile = null;
        }
        return records;
    }
    function attemptKey(record) { return `${record.key}|${record.profile.id}|${record.profile.number}`; }
    async function waitFor(read, canContinue, timeout = 5000) {
        const deadline = performance.now() + timeout;
        while (canContinue() && performance.now() < deadline) {
            const value = read();
            if (value) return value;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return null;
    }
    async function addAeroplan(ref, record) {
        const profile = { ...record.profile };
        let userInteracted = false;
        const stopForUser = event => { if (event.isTrusted) userInteracted = true; };
        const sameBooking = () => bookingReference() === ref;
        const current = () => {
            const saved = config.profiles.find(item => item.id === profile.id);
            return !dialog.open && !userInteracted && sameBooking() && record.card.isConnected && saved?.enabled &&
                saved.number === profile.number && nameKey(textOf(record.card.querySelector('.passenger-name'))) === nameKey(record.name) &&
                [saved.name, ...saved.aliases].some(alias => nameKey(alias) === nameKey(record.name));
        };
        const report = key => notify(key, { name: record.name });
        if (!current() || !enabled(record.button)) return;
        document.addEventListener('pointerdown', stopForUser, true);
        document.addEventListener('keydown', stopForUser, true);
        try {
            report('adding');
            record.button.click();
            const form = await waitFor(() => {
                const drawer = document.querySelector(drawerSelector);
                const combo = drawer?.querySelector('[formcontrolname="ffProgram"] [role="combobox"]');
                const input = drawer?.querySelector('[formcontrolname="ffNumber"] input');
                return drawer?.contains(document.activeElement) && enabled(combo) && enabled(input) ? { drawer, combo, input } : null;
            }, current);
            if (!form) { report(userInteracted || dialog.open ? 'interrupted' : 'formError'); return; }
            const { drawer, combo, input } = form;
            const inDrawer = () => current() && visible(drawer);
            const chosen = () => textOf(combo.querySelector('.ac-selected-option-text'));
            if (input.readOnly || input.value.trim() || (chosen() && !isAeroplan(chosen()))) { report('interrupted'); return; }
            if (!chosen()) {
                if (combo.getAttribute('aria-expanded') !== 'true') {
                    combo.focus({ preventScroll: true });
                    combo.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 'Enter', code: 'Enter', bubbles: true, cancelable: true, composed: true,
                    }));
                }
                const option = await waitFor(() => {
                    if (!combo.id || combo.getAttribute('aria-expanded') !== 'true') return null;
                    return [...(document.getElementById(`${combo.id}OptionsPanel`)?.querySelectorAll('[role="option"]') || [])]
                        .find(element => enabled(element) && isAeroplan(textOf(element)));
                }, inDrawer);
                if (!option || !inDrawer()) { report(userInteracted || dialog.open ? 'interrupted' : 'optionError'); return; }
                option.click();
            }
            if (!await waitFor(() => isAeroplan(chosen()), inDrawer) || !inDrawer()) { report('interrupted'); return; }
            if (!enabled(input) || input.readOnly || input.value.trim()) { report('interrupted'); return; }
            input.focus({ preventScroll: true });
            input.value = profile.number;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.blur();
            const save = await waitFor(() => {
                const button = drawer.querySelector('.ac-side-drawer-modal-footer-primary-section button');
                return enabled(button) ? button : null;
            }, inDrawer);
            if (!save || !inDrawer() || !isAeroplan(chosen()) || input.value !== profile.number) { report('filled'); return; }
            reserved.set(profile.id, record.key);
            save.click();
            const confirmed = await waitFor(() => {
                if (visible(drawer)) return false;
                const updated = matchingRecords().find(item => item.key === record.key)?.card.querySelector('ac-card.loyalty-program-card');
                return visible(updated) && !updated.matches('.add-ffnumber') && isAeroplan(textOf(updated));
            }, sameBooking, 12000);
            if (sameBooking()) report(confirmed ? 'added' : 'submitted');
        } finally {
            document.removeEventListener('pointerdown', stopForUser, true);
            document.removeEventListener('keydown', stopForUser, true);
        }
    }
    function scheduleScan() {
        if (scanTimer || running || storageError) return;
        scanTimer = setTimeout(scan, 150);
    }
    async function scan() {
        scanTimer = undefined;
        if (running || dialog.open || storageError) return;
        const ref = bookingReference();
        if (!ref) return;
        const records = matchingRecords();
        updateLauncher(records.some(record => record.button && record.candidates.length && !record.profile));
        if ([...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].some(visible)) return;
        const record = records.find(item => enabled(item.button) && item.profile && !attempted.has(attemptKey(item)));
        if (!record) return;
        attempted.add(attemptKey(record));
        running = true;
        updateLauncher();
        try {
            if (navigator.locks) {
                await navigator.locks.request(`aircanada-aeroplan-${ref}`, { ifAvailable: true }, async lock => {
                    if (lock) await addAeroplan(ref, record);
                });
            } else await addAeroplan(ref, record);
        } catch { notify('formError'); }
        finally { running = false; updateLauncher(); scheduleScan(); }
    }

    updateMenu();
    updateLauncher();
    GM_addValueChangeListener(storageKey, (_key, _old, value, remote) => {
        if (!remote) return;
        if (value?.schemaVersion !== 2 || !Array.isArray(value.profiles)) {
            storageError = 'incompatible';
        } else { config = value; storageError = ''; }
        updateMenu();
        updateLauncher();
        if (dialog.open && editing === null) render();
        scheduleScan();
    });
    new MutationObserver(scheduleScan).observe(document.body, {
        subtree: true, childList: true, characterData: true, attributes: true,
        attributeFilter: ['class', 'disabled', 'aria-hidden'],
    });
    window.addEventListener('pageshow', scheduleScan);
    window.navigation?.addEventListener('currententrychange', scheduleScan);
    scheduleScan();
})();
