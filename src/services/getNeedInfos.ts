import { fetch } from "@tauri-apps/plugin-http";
import Settings from "../constants/Settings";
import getComputerInfo from "./getComputerInfo";

export default async function getNeedInfos(token: string, prompt: string) {
  try {
    const response = await fetch(`${Settings.api}/ia/need`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    });

    const json = await response.json();
    const needs = json.need as string[];

    let infos = "";

    if (needs.includes("process")) {
      const proccess = await getComputerInfo().getProccess();
      infos += `Seus processos em execução no computador: \n${proccess}\n\n`;
    }

    if (needs.includes("user_info")) {
      const user = await getComputerInfo().getUserInfos();
      infos += `Informações do usuário: \n${user}\n\n`;
    }

    if (needs.includes("memory")) {
      const memory = await getComputerInfo().getRamInfo();
      infos += `Informações da memória ram: \n${memory}\n\n`;
    }

    if (needs.includes("internet")) {
      const internet = await getComputerInfo().getUserInternet();
      infos += `Informações da internet: \n${internet}\n\n`;
    }

    if (needs.includes("cpu")) {
      const cpu = await getComputerInfo().getCpuInfo();
      infos += `Informações da cpu: \n${cpu}\n\n`;
    }

    if (needs.includes("mainboard")) {
      const mainboard = await getComputerInfo().getGpuInfos();
      infos += `Informações da placa mãe: \n${mainboard}\n\n`;
    }

    if (needs.includes("gpu")) {
      const gpu = await getComputerInfo().getGpuInfos();
      infos += `Informações da placa de vídeo: \n${gpu}\n\n`;
    }

    if (needs.includes("system_type")) {
      const system_type = getComputerInfo().getSystem();
      infos += `Sistema: \n${JSON.stringify(system_type)}\n\n`;
    }

    if (needs.includes("system_version")) {
      const system_version = getComputerInfo().getSystemVersion();
      infos += `Versão do sistema: \n${JSON.stringify(system_version)}\n\n`;
    }

    if (needs.includes("system")) {
      const system = getComputerInfo().getSystemInfos();
      infos += `Informações do sistema: \n${JSON.stringify(system)}\n\n`;
    }

    if (needs.includes("disk")) {
      const disk = await getComputerInfo().getDiskInfo();
      infos += `Informações do armazenamento (disco): \n${disk}\n\n`;
    }

    if (needs.includes("date")) {
      const date = new Date().toISOString();
      infos += `Informações da data atual: \n${date}\n\n`;
    }

    if (needs.includes("daijin")) {
      infos += `Informações da sua conta DaijinIA: {$_%DAIJIN INFOS%_$}`;
    }

    let image: Blob | undefined = undefined;

    if (needs.includes("image")) {
      const screenshot = await getComputerInfo().getImage();

      if (screenshot) {
        image = screenshot;
      }
    }

    return {
      infos: infos,
      image: image,
    };
  } catch {
    return undefined;
  }
}
