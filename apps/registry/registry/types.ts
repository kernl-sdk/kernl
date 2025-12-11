export type RegistryType = "registry:toolkit" | "registry:agent" | "registry:skill";

export interface RegistryFile {
  path: string;
}

export interface RegistryItem {
  name: string;
  type: RegistryType;
  title: string;
  description: string;
  icon?: string;
  category?: string;
  dependencies?: string[];
  env?: string[];
  files: RegistryFile[];
}
