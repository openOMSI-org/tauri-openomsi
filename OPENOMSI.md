# tauri-openomsi

openOMSI's fork of [Tauri](https://github.com/tauri-apps/tauri) for its desktop launcher.
Branch `openomsi/v2` is the upstream tag `tauri-v2.12.3` plus the changes below, each small
enough to be offered upstream. openOMSI uses the fork through `[patch.crates-io]` in
`launcher/src-tauri/Cargo.toml` (every crate of the fork that its `Cargo.lock` lists).

## Changes

* **`app_mode`** (`WebviewBuilder::app_mode`, `WebviewWindowBuilder::app_mode`): the webview
  is an application's interface, not a browser tab. Reloading (F5, Ctrl/Cmd+R), printing,
  find-in-page, caret browsing, history navigation (Alt+Left/Right, the mouse's back and
  forward buttons, Backspace outside a text field), the browser's context menu outside text
  fields and a dropped file replacing the page are switched off; developer tools stay in debug
  builds. On Windows it also turns off WebView2's browser accelerator keys and default context
  menus.
* **`show_when_loaded`** (`WebviewWindowBuilder::show_when_loaded`): the window stays hidden
  until its page has finished loading, so it never shows the empty, white webview first (the
  Windows "white flash"); a page that has not loaded after five seconds is shown anyway.
* **WebKitGTK's blank window**: on Linux with NVIDIA's proprietary driver, and in an AppImage,
  `WEBKIT_DISABLE_DMABUF_RENDERER=1` is set before the event loop starts (unless the user set
  it), the usual cause of an empty window there.

## Updating

```bash
git fetch upstream --tags
git rebase --onto tauri-v<new> tauri-v2.12.3 openomsi/v2
```
