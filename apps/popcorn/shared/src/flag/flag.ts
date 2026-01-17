function envBool(name: string): boolean {
  const value = process.env[name]
  return value === "1" || value === "true"
}

export namespace Flag {
  export const OPENCODE_DISABLE_TERMINAL_TITLE = envBool("OPENCODE_DISABLE_TERMINAL_TITLE")
  export const OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT = envBool("OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT")
  export const DEBUG = envBool("DEBUG")
}
