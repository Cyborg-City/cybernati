import { QuartzComponentConstructor, QuartzComponentProps } from "./types"

export default (() => {
  function Broadcast(props: QuartzComponentProps) {
    const baseDir = props.fileData.slug === "404" ? "/" : "../".repeat(props.fileData.slug.split("/").length - 1) || "./"
    return (
      <div class="broadcast-embed-container">
        <iframe
          src={baseDir + "player.html"}
          width="100%"
          height="520"
          frameborder="0"
          allowfullscreen
          style="border: none; display: block;"
          title="Cybernati Player"
        />
      </div>
    )
  }

  Broadcast.css = `
  .broadcast-embed-container {
    width: 100%;
    margin: 2rem 0;
  }
  .broadcast-embed-container iframe {
    border-radius: 4px;
    box-shadow: 0 0 30px rgba(0,255,0,0.05);
  }
  `

  return Broadcast
}) satisfies QuartzComponentConstructor
