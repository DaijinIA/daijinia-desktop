import React from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export default function Update() {
  const [update, setUpdate] = React.useState<1 | 2 | 3>(1);

  React.useEffect(() => {
    async function update() {
      try {
        const update = await check();
        if (update?.available) {
          setUpdate(2);
        }
      } catch {}
    }

    update();
  }, []);

  const download = React.useCallback(async () => {
    const update = await check();
    if (update?.available) {
      await update.downloadAndInstall();
      await relaunch();
    }
  }, []);

  if (update === 2) {
    return (
      <div className="update">
        <p>
          A new application update is available, <span onClick={download}>click here</span> to
          install
        </p>
      </div>
    );
  }

  if (update === 3) {
    return (
      <div className="update">
        <p>
          We are installing the new update, this may take a few minutes, once we finish we will
          restart the application.
        </p>
      </div>
    );
  }

  return <></>;
}
