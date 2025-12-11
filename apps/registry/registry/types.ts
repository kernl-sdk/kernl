export type RegistryType = "registry:toolkit" | "registry:agent" | "registry:skill";

export interface RegistryFile {
  path: string;
}

export interface RegistryItem {
  name: string;
  type: RegistryType;
  title: string;
  description: string;
  dependencies?: string[];
  env?: string[];
  files: RegistryFile[];
}
