import { LogicalPosition, LogicalSize, Window } from "@tauri-apps/api/window";
import { enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { currentMonitor } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { register, isRegistered } from "@tauri-apps/plugin-global-shortcut";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import getConfig from "../services/getConfig";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

async function main() {
  let permissionGranted = await isPermissionGranted();

  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
  }

  if (!(await isEnabled())) {
    await enable();
  }

  const window = Window.getCurrent();
  window.hide();

  if (!(await isRegistered("Alt+J"))) {
    await register(["Alt+J"], async () => {
      await invoke("capture_screen");
      const textarea = document.querySelector<HTMLDivElement>("[data-textarea]");
      textarea?.focus();
      window.show();
    });
  }

  window.onFocusChanged((status) => {
    if (!status.payload) {
      window.hide();
    }
  });

  const monitor = await currentMonitor();

  await onOpenUrl((urls) => {
    const signUrlRegexp = /^daijindesktop\:\/\/daijintoken\/?\?token=([\w]{2}-[\w]+$)/i;

    urls.forEach((url) => {
      const match = signUrlRegexp.exec(url.trim());

      if (match) {
        const token = match[1];

        getConfig().then((config) => {
          config.set("daijin_token", token);
          if (permissionGranted) {
            sendNotification({
              title: "DaijinIA token added",
              body: "Your token has been linked to the application, you can now start enjoying your personal copilot!",
            });
          }
        });
      }
    });
  });

  const width = (monitor?.size.width ?? 1280) * 0.8;
  const height = (monitor?.size.height ?? 720) * 0.8;

  const x = (monitor?.size.width ?? 1280) / 2 - width / 2;
  const y = (monitor?.size.height ?? 720) / 2 - height / 2;

  window.setSize(new LogicalSize(width, height));
  window.setPosition(new LogicalPosition(x, y));
}

main();
