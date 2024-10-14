import { invoke } from "@tauri-apps/api/core";
import { Command } from "@tauri-apps/plugin-shell";
import {
  platform,
  version,
  arch,
  family,
  exeExtension,
  eol,
  type,
  locale,
  hostname,
} from "@tauri-apps/plugin-os";
import { readFile, BaseDirectory, exists } from "@tauri-apps/plugin-fs";

export default function getComputerInfo() {
  async function getCpuInfo() {
    return invoke("get_cpu_info");
  }

  async function getDiskInfo() {
    return invoke("get_disk_info");
  }

  async function getRamInfo() {
    return invoke("get_ram_info");
  }

  async function getProccess() {
    return invoke("get_running_processes");
  }

  async function getGpuInfos() {
    const currentPlatform = platform();
    if (currentPlatform === "windows") {
      return (
        await Command.create("get-windows-gpu", [
          "/C",
          "wmic",
          "path",
          "win32_videocontroller",
          "get",
          "name,adapterram,VideoProcessor,AdapterRAM,AdapterCompatibility",
        ]).execute()
      ).stdout;
    } else if (currentPlatform === "linux") {
      return (await Command.create("get-linux-gpu", ["lshw", "-C", "display"]).execute()).stdout;
    }
  }

  async function getMonitorInfos() {
    const currentPlatform = platform();
    if (currentPlatform === "windows") {
      return (
        await Command.create("get-windows-monitor", [
          "/C",
          "wmic",
          "path",
          "Win32_DesktopMonitor",
          "get",
          "Name, MonitorType, ScreenHeight, ScreenWidth",
        ]).execute()
      ).stdout;
    } else if (currentPlatform === "linux") {
      return (await Command.create("get-linux-monitor", ["xrandr", "--verbose"]).execute()).stdout;
    }
  }

  async function getUserInfos() {
    const currentPlatform = platform();
    if (currentPlatform === "windows") {
      return (await Command.create("get-windows-user", ["/C", "whoami"]).execute()).stdout;
    } else if (currentPlatform === "linux") {
      return (await Command.create("get-linux-user", []).execute()).stdout;
    }
  }

  async function getUserInternet() {
    const currentPlatform = platform();
    if (currentPlatform === "windows") {
      return (await Command.create("get-windows-internet", ["/C", "ipconfig", "/all"]).execute())
        .stdout;
    } else if (currentPlatform === "linux") {
      return (await Command.create("get-linux-internet", []).execute()).stdout;
    }
  }

  async function getImage() {
    if (
      await exists(".daijinia\\screenshot\\screenshot.png", {
        baseDir: BaseDirectory.Home,
      })
    ) {
      const content = await readFile(".daijinia\\screenshot\\screenshot.png", {
        baseDir: BaseDirectory.Home,
      });
      const blob = new Blob([content], { type: "image/png" });
      return blob;
    }

    return undefined;
  }

  function getSystem() {
    return platform();
  }

  function getSystemVersion() {
    return version();
  }

  function getSystemInfos() {
    return `
      arch: ${arch()}, family: ${family()}, exeExtension: ${exeExtension()}, eol: ${eol()}, type: ${type()}, locale: ${locale()}, hostname: ${hostname()}
    `;
  }

  return {
    getCpuInfo,
    getRamInfo,
    getProccess,
    getGpuInfos,
    getMonitorInfos,
    getUserInfos,
    getUserInternet,
    getImage,
    getDiskInfo,
    getSystem,
    getSystemVersion,
    getSystemInfos,
  };
}
