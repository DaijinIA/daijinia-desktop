import Settings from "../constants/Settings";
import { Chats } from "../stores/Store";
import { fetch } from "@tauri-apps/plugin-http";

export default async function createChat(token: string) {
  try {
    const response = await fetch(`${Settings.api}/chats/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      const json = (await response.json()) as {
        message: string;
        response: any;
      };

      return json.response as Chats;
    }

    return undefined;
  } catch (error) {
    return undefined;
  }
}
