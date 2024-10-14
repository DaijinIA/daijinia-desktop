import { fetch } from "@tauri-apps/plugin-http";
import Settings from "../constants/Settings";

export default async function sendMessage(
  token: string,
  chat: string,
  message: string,
  system_infos: string,
  image?: Blob
) {
  try {
    const formData = new FormData();
    formData.append("chatid", chat);
    formData.append("prompt", message);
    formData.append("system_infos", system_infos);

    if (image) {
      formData.append("image", image, "screenshot.png");
    }

    const response = await fetch(`${Settings.api}/ia/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const json = (await response.json()) as {
      message: string;
      response: string;
    };

    return json.response;
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
