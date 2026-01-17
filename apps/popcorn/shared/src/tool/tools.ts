/**
 * Minimal tool type stubs for TUI rendering
 * TODO: Refactor to use proper kernl tool types
 */
export namespace Tool {
  export interface Info {
    name: string
    parameters?: any
    metadata?: any
  }

  export type InferParameters<T> = T extends { parameters: infer P } ? P : any
  export type InferMetadata<T> = T extends { metadata: infer M } ? M : Record<string, any>
}

export interface ReadTool extends Tool.Info {
  name: "read"
  parameters: {
    filePath: string
    offset?: number
    limit?: number
  }
}

export interface WriteTool extends Tool.Info {
  name: "write"
  parameters: {
    filePath: string
    content: string
  }
}

export interface BashTool extends Tool.Info {
  name: "bash"
  parameters: {
    command: string
    workdir?: string
    timeout?: number
    description?: string
  }
}

export interface GlobTool extends Tool.Info {
  name: "glob"
  parameters: {
    pattern: string
    path?: string
  }
}

export interface GrepTool extends Tool.Info {
  name: "grep"
  parameters: {
    pattern: string
    path?: string
    include?: string
  }
}

export interface EditTool extends Tool.Info {
  name: "edit"
  parameters: {
    filePath: string
    oldString: string
    newString: string
    replaceAll?: boolean
  }
}

export interface PatchTool extends Tool.Info {
  name: "patch"
  parameters: {
    filePath: string
    patch: string
  }
}

export interface ListTool extends Tool.Info {
  name: "ls"
  parameters: {
    path: string
  }
}

export interface TodoWriteTool extends Tool.Info {
  name: "todowrite"
  parameters: {
    todos: Array<{
      id: string
      content: string
      status: "pending" | "in_progress" | "completed"
    }>
  }
}

export interface WebFetchTool extends Tool.Info {
  name: "webfetch"
  parameters: {
    url: string
  }
}

export interface TaskTool extends Tool.Info {
  name: "task"
  parameters: {
    description: string
    prompt: string
    subagent_type: string
    session_id?: string
    command?: string
  }
}

export interface QuestionTool extends Tool.Info {
  name: "question"
  parameters: {
    questions: Array<{
      question: string
      header: string
      options: Array<{
        label: string
        description?: string
      }>
      multiSelect?: boolean
    }>
  }
}
