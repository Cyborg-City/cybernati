import { i18n } from "../../i18n"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { joinSegments, pathToRoot } from "../../util/path"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  // If baseUrl contains a pathname after the domain, use this as the home link
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = url.pathname
  const rootDir = pathToRoot("")
  const imagePath = joinSegments(rootDir, "static", "404.png")

  return (
    <article class="popover-hint">
      <img src={imagePath} alt="404 — Page Not Found" style="max-width: 400px; width: 100%; height: auto; display: block; margin: 0 auto 2rem;" />
      <h1>404</h1>
      <p>{i18n(cfg.locale).pages.error.notFound}</p>
      <a href={baseDir}>{i18n(cfg.locale).pages.error.home}</a>
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor
