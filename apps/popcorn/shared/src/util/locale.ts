export namespace Locale {
  export function format(template: string, ...args: unknown[]): string {
    return template.replace(/{(\d+)}/g, (_, index) => {
      const i = parseInt(index, 10)
      return args[i] !== undefined ? String(args[i]) : `{${index}}`
    })
  }

  export function plural(count: number, singular: string, plural?: string): string {
    return count === 1 ? singular : (plural ?? singular + "s")
  }

  export function join(items: string[], separator = ", ", lastSeparator = " and "): string {
    if (items.length === 0) return ""
    if (items.length === 1) return items[0]
    if (items.length === 2) return items.join(lastSeparator)
    return items.slice(0, -1).join(separator) + lastSeparator + items[items.length - 1]
  }

  export function time(date: Date | number): string {
    const d = typeof date === "number" ? new Date(date) : date
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  }

  export function datetime(date: Date | number): string {
    const d = typeof date === "number" ? new Date(date) : date
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 1) + "…"
  }

  export function truncateMiddle(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    const half = Math.floor((maxLength - 1) / 2)
    return text.slice(0, half) + "…" + text.slice(-half)
  }

  export function titlecase(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }

  export function pluralize(count: number, singular: string, plural?: string): string {
    return `${count} ${count === 1 ? singular : (plural ?? singular + "s")}`
  }

  export function todayTimeOrDateTime(date: Date | number): string {
    const d = typeof date === "number" ? new Date(date) : date
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return time(d)
    }
    return datetime(d)
  }

  export function duration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes < 60) return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
}
