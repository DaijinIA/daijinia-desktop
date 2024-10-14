import { readFile, BaseDirectory, exists, create, writeFile } from "@tauri-apps/plugin-fs";

interface Config {
  daijin_token: string;
}

const BaseConfig: Config = {
  daijin_token: "",
};

export default async function getConfig() {
  const SETTINGS_FILE = ".daijinia/config.json";

  if (!(await exists(SETTINGS_FILE, { baseDir: BaseDirectory.Home }))) {
    const file = await create(SETTINGS_FILE, {
      baseDir: BaseDirectory.Home,
    });
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(BaseConfig));
    await file.write(data);
    await file.close();
  }

  const content = await readFile(SETTINGS_FILE, {
    baseDir: BaseDirectory.Home,
  });

  const text = new TextDecoder().decode(content);

  const json = JSON.parse(text);

  function get(key: keyof Config) {
    return json[key];
  }

  function getAll() {
    return json;
  }

  async function set(key: keyof Config, value: string | number | boolean) {
    json[key] = value;

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(json));

    return await writeFile(SETTINGS_FILE, data, {
      baseDir: BaseDirectory.Home,
    });
  }

  return {
    get,
    getAll,
    set,
  };
}
