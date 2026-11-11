# Air Canada Aeroplan Helper

A Tampermonkey userscript for managing traveller profiles and adding matching Aeroplan numbers to Air Canada bookings.

Interface languages are 简体中文, English and Français. Automatic entry supports English and French `Manage booking` routes.

## Install or update

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser.
2. Open the [latest userscript](https://github.com/mpftc/aircanada-aeroplan-helper/releases/latest/download/AirCanada-Aeroplan.user.js) and confirm installation in Tampermonkey.
3. Open Air Canada and click the **Aeroplan** button at the bottom right. The Tampermonkey menu also opens settings.
4. Add each traveller’s ticket name and 9-digit Aeroplan number. Open a booking to start matching.

If the download opens as a file, open the installed script in Tampermonkey’s editor, replace its contents and save. Chrome may require **Allow User Scripts** in Tampermonkey’s extension settings. See the [official permission instructions](https://www.tampermonkey.net/faq.php?locale=en&q=Q209).

The original script name, namespace and storage key are retained. Updating the existing v1.0.x script migrates its saved traveller to the multi-profile format. A previously paused traveller is migrated as disabled.

## Features

- A persistent settings entry, responsive settings page, light/dark appearance and isolated styles.
- Multiple traveller profiles with labels, ticket names, Aeroplan numbers, additional name formats and individual enabled states.
- Exact name matching after Unicode normalization, case conversion and whitespace normalization. Additional name formats are entered explicitly.
- A **Name matching** page for choosing among ambiguous profiles or same-name passengers. One profile can be assigned to one traveller per booking.
- Sequential entry for matching travellers, using each person’s own number.
- Chinese, English and French menus, settings, validation and operation messages. The default follows the browser language, with manual selection under **Language**.

Automatic entry runs on `https://www.aircanada.com/manage-booking/{edition}/{en|fr}/{aco|ado}/manage`. The settings entry is available throughout `www.aircanada.com`.

## 中文使用说明

打开页面右下角的 **Aeroplan**，在 **旅客资料** 中添加姓名和号码。姓名按官网 Passenger details 的显示顺序填写。不同姓名写法可按行登记，也可用逗号分隔。

在同一订座中，脚本逐位添加已匹配旅客的号码。同名或匹配不唯一时，进入 **姓名匹配** 选择对应资料，关闭设置后开始处理。**语言** 页面可选择简体中文、English、Français 或跟随浏览器。

升级时更新油猴中的已有脚本，原来保存的姓名和号码会自动迁移。

## Utilisation en français

Ouvrez **Aeroplan** en bas à droite, puis ajoutez les voyageurs et leurs numéros dans **Voyageurs**. Saisissez les noms dans l’ordre affiché sur la réservation. Les autres formats du nom peuvent être ajoutés explicitement.

En cas de correspondance ambiguë, choisissez les profils dans **Correspondance des noms**, puis fermez les réglages. Les voyageurs associés sont traités un par un. La langue se choisit dans **Langue**.

## Data and behaviour

Profiles are stored using Tampermonkey’s `GM_getValue` / `GM_setValue` storage. Storage synchronization and access are governed by your userscript manager and its settings.

The script interacts with the visible Air Canada loyalty form. A saved number is transmitted to Air Canada through that form when it is submitted. Existing loyalty associations and populated forms are left for manual handling. Interacting with the page during entry hands control back to the user. An attempt is made once per matched traveller and number in the current page session.

Two tabs use Web Locks to coordinate booking submissions and profile changes where that API is available. Editing the same profile from another tab produces a conflict message. Settings stay open for correction if input validation fails.

This is an independent community userscript. Website layout changes can require an update.

## Verification

Run with Node.js 22 or later.

```sh
npm ci
npm run check
npm test
```

The regression suite covers migration, multiple travellers, explicit name variants, duplicate names, French controls, settings management, cross-tab edits, route changes and submission guards. DOM fixtures are based on the observed Air Canada component structure.

The original single-traveller English flow was confirmed on a real booking. Version 1.1 settings have been inspected in Chromium, and the multi-traveller and French flows pass simulated DOM tests. Live multi-traveller and French booking submissions remain to be verified with suitable reservations.

## License

[MIT](LICENSE)
