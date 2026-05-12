import { QuartzComponentConstructor, QuartzComponentProps } from "./types"

export default (() => {
  function Broadcast(props: QuartzComponentProps) {
    const baseDir = props.fileData.slug === "404" ? "/" : "../".repeat(props.fileData.slug.split("/").length - 1) || "./"
    return (
      <div class="broadcast-embed-container">
        <iframe
          src={baseDir + "player.html"}
          width="100%"
          height="500"
          frameborder="0"
          allowfullscreen
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
    display: block;
    border: 1px solid #1a1a1a;
    border-radius: 8px;
    box-shadow: 0 0 30px rgba(0,255,0,0.05);
  }
  `

  return Broadcast
}) satisfies QuartzComponentConstructor
