import path from "path";
import os from "os";

const APP_NAME = "popcorn";

function getDataDir(): string {
  const platform = process.platform;
  if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", APP_NAME);
  }
  if (platform === "win32") {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      APP_NAME,
    );
  }
  return path.join(
    process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share"),
    APP_NAME,
  );
}

function getConfigDir(): string {
  const platform = process.platform;
  if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", APP_NAME);
  }
  if (platform === "win32") {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      APP_NAME,
    );
  }
  return path.join(
    process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"),
    APP_NAME,
  );
}

function getStateDir(): string {
  const platform = process.platform;
  if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", APP_NAME);
  }
  if (platform === "win32") {
    return path.join(
      process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"),
      APP_NAME,
    );
  }
  return path.join(
    process.env.XDG_STATE_HOME || path.join(os.homedir(), ".local", "state"),
    APP_NAME,
  );
}

export namespace Global {
  export const Path = {
    get home() {
      return os.homedir();
    },
    get data() {
      return getDataDir();
    },
    get config() {
      return getConfigDir();
    },
    get state() {
      return getStateDir();
    },
    get bin() {
      return path.join(getDataDir(), "bin");
    },
  };
}
