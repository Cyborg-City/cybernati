import { QuartzTransformerPlugin } from "../types"

export const Redact: QuartzTransformerPlugin = () => {
  return {
    name: "Redact",
    textTransform(_ctx, src) {
      return src.replace(/\|\|(.+?)\|\|/g, '<span class="redacted">$1</span>')
    },
  }
}
