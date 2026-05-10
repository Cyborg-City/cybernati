import { QuartzComponentConstructor, QuartzComponentProps } from "./types"

export default (() => {
  function Broadcast(props: QuartzComponentProps) {
    return (
      <div class="broadcast-terminal">
        <div class="terminal-header">
            <div id="video-title" class="terminal-id">TERMINAL://INIT_SIGNAL</div>
            <div id="sync-gauge" class="sync-gauge">SYNC_LOCK: --.-%</div>
        </div>
        
        <div id="terminal-screen" class="terminal-screen">
            <div id="player-mount" class="player-mount">
                <div class="signal-initializing">SCANNING FOR SIGNAL...</div>
            </div>
            {/* EMBED POPUP */}
            <div id="embed-modal" class="embed-modal">
                <div class="modal-content">
                    <div class="modal-header">ESTABLISH_REMOTE_NODE</div>
                    <textarea id="embed-code" readonly></textarea>
                    <div class="modal-footer">
                        <button id="copy-embed-btn" class="handshake-btn">COPY_CODE</button>
                        <button id="close-embed-btn" class="handshake-btn">CLOSE</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="terminal-footer">
            <div class="footer-left">
                <div id="program-info">OFFLINE</div>
                <div id="related-links" class="related-links"></div>
                <div class="footer-row-3">
                    <button id="embed-trigger" class="text-btn">[EMBED_SIGNAL]</button>
                </div>
            </div>
            <div class="footer-right">
                <div class="control-row">
                    <button id="mute-toggle" class="mute-btn" title="Toggle Mute">
                        <svg id="speaker-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-x">
                            <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                            <line x1="23" y1="9" x2="17" y2="15"></line>
                            <line x1="17" y1="9" x2="23" y2="15"></line>
                        </svg>
                    </button>
                    <input type="range" id="volume-control" class="terminal-slider" min="0" max="100" value="0" />
                </div>
                <div class="control-row">
                    <span class="control-label">DESYNC:</span>
                    <label class="switch">
                        <input type="checkbox" id="desync-toggle" />
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        </div>
        
        <script dangerouslySetInnerHTML={{ __html: `
            let player;
            let currentVolume = 0;
            let isMuted = true;
            let currentVideoId = null;
            let handshakeEstablished = false;
            let isDesynced = false;
            let desyncTimeout = null;

            const iconMute = '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
            const iconVol = '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>';

            // Load YouTube API
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            // GHOST LAYOUT (For Embeds)
            if (window.location.search.includes('embed=true')) {
                const style = document.createElement('style');
                style.innerHTML = \`
                    header, footer, .left, .right, .backlinks, .toc, .recent-notes { display: none !important; }
                    .center { width: 100% !important; max-width: 100% !important; padding: 0 !important; }
                    .broadcast-terminal { margin: 0 !important; border: none !important; border-radius: 0 !important; height: 100vh !important; }
                    body { background: black !important; }
                \`;
                document.head.appendChild(style);
            }

            async function startTerminal() {
                const mount = document.getElementById('player-mount');
                const info = document.getElementById('program-info');
                const titleEl = document.getElementById('video-title');
                const linksEl = document.getElementById('related-links');
                const volSlider = document.getElementById('volume-control');
                const muteBtn = document.getElementById('mute-toggle');
                const desyncToggle = document.getElementById('desync-toggle');
                const speakerIcon = document.getElementById('speaker-icon');
                const syncGauge = document.getElementById('sync-gauge');
                
                try {
                    const pathSegments = window.location.pathname.split('/');
                    const isSubdir = pathSegments.length > 2;
                    const base = isSubdir ? '/' + pathSegments[1] + '/' : '/';
                    
                    const response = await fetch(base + 'static/video_playlist.json?v=' + Date.now());
                    const data = await response.json();
                    const { totalLoopDuration, schedule, interstitials } = data;

                    // Generate Embed Code
                    const embedUrl = window.location.origin + window.location.pathname + '?embed=true';
                    document.getElementById('embed-code').value = \`<iframe src="\${embedUrl}" width="100%" height="500" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\`;

                    const playVideo = (id, title, startOffset, related) => {
                        titleEl.innerHTML = \`DECODING://\${title.toUpperCase()}\`;
                        if (currentVideoId !== id) {
                            currentVideoId = id;
                            mount.innerHTML = '<div id="yt-player"></div>';
                            player = new YT.Player('yt-player', {
                                height: '100%', width: '100%', videoId: id,
                                playerVars: { autoplay: 1, mute: isMuted ? 1 : 0, controls: 0, disablekb: 1, modestbranding: 1, rel: 0, start: Math.floor(startOffset) },
                                events: { 
                                    onReady: (e) => { if (!isMuted) { e.target.unMute(); e.target.setVolume(currentVolume); } },
                                    onStateChange: (e) => { if (isDesynced && e.data === YT.PlayerState.ENDED) startDesyncSequence(); }
                                }
                            });
                        }
                        if (related && related.length > 0) {
                            linksEl.innerHTML = "LINKS: " + related.map(link => \`<a href="\${base}\${link.slug}" target="_blank" class="vault-link">[\${link.name}]</a>\`).join(' ');
                        } else { linksEl.innerHTML = ""; }
                    };

                    const playStandby = (timeRemaining) => {
                        syncGauge.innerHTML = \`ALIGNING: T-minus \${timeRemaining}s\`;
                        syncGauge.classList.add('searching');
                        titleEl.innerHTML = "TERMINAL://SEARCHING_SIGNAL";
                        linksEl.innerHTML = "";
                        if (player) { if (player.destroy) player.destroy(); player = null; currentVideoId = null; mount.innerHTML = ''; }
                        const intIndex = Math.floor(Date.now() / 10000) % interstitials.length;
                        const intFile = base + interstitials[intIndex].replace(/^\\//, '');
                        if (!mount.querySelector('video') || !mount.querySelector('video').src.includes(intFile)) {
                            mount.innerHTML = \`<video src="\${intFile}" autoplay muted loop style="width:100%; height:100%; background:black; object-fit: cover;"></video>\`;
                        }
                    };

                    const startDesyncSequence = () => {
                        if (!isDesynced) return;
                        const prog = schedule[Math.floor(Math.random() * schedule.length)];
                        let startAt = 0; let playTime = prog.duration;
                        if (prog.duration > 300) { startAt = Math.floor(Math.random() * (prog.duration - 300)); playTime = 300; }
                        playVideo(prog.id, prog.title, startAt, prog.related);
                        let remaining = playTime;
                        if (desyncTimeout) clearInterval(desyncTimeout);
                        desyncTimeout = setInterval(() => {
                            if (!isDesynced) { clearInterval(desyncTimeout); return; }
                            remaining--;
                            syncGauge.innerHTML = \`PRIVATE_SIGNAL: \${((remaining / playTime) * 100).toFixed(1)}%\`;
                            if (remaining <= 0) { clearInterval(desyncTimeout); playStandby(10); setTimeout(startDesyncSequence, 10000); }
                        }, 1000);
                    };

                    const updateTerminal = () => {
                        if (isDesynced) { info.innerHTML = "STATUS: <span class='fading'>SCANNING FREQUENCIES...</span>"; return; }
                        info.innerHTML = "STATUS: LIVE_SYNC";
                        const now = Math.floor(Date.now() / 1000);
                        const currentPos = now % totalLoopDuration;
                        let activeProgram = null; let isStandby = true; let timeUntilNext = 0; let offset = 0;
                        for (let i = 0; i < schedule.length; i++) {
                            const prog = schedule[i];
                            if (currentPos >= prog.start && currentPos < prog.end) { activeProgram = prog; isStandby = false; offset = currentPos - prog.start; break; }
                            if (currentPos >= prog.end && (i === schedule.length - 1 || currentPos < schedule[i+1].start)) {
                                isStandby = true; timeUntilNext = (i === schedule.length - 1) ? (totalLoopDuration - currentPos) : (schedule[i+1].start - currentPos);
                                break;
                            }
                        }
                        if (!isStandby && activeProgram) {
                            const progress = offset / activeProgram.duration;
                            syncGauge.innerHTML = \`SYNC_LOCK: \${(99.9 * (1 - progress)).toFixed(1)}%\`;
                            syncGauge.classList.remove('searching');
                            playVideo(activeProgram.id, activeProgram.title, offset, activeProgram.related);
                        } else { playStandby(timeUntilNext); }
                    };

                    // Control Handlers
                    desyncToggle.addEventListener('change', (e) => {
                        isDesynced = e.target.checked;
                        if (isDesynced) startDesyncSequence(); else { if (desyncTimeout) clearInterval(desyncTimeout); currentVideoId = null; updateTerminal(); }
                    });

                    volSlider.addEventListener('input', (e) => {
                        currentVolume = e.target.value; isMuted = currentVolume == 0;
                        if (player) { if (isMuted) player.mute(); else { player.unMute(); player.setVolume(currentVolume); } }
                        updateAudioUI();
                    });

                    muteBtn.addEventListener('click', () => {
                        isMuted = !isMuted;
                        if (isMuted) { if (player) player.mute(); } 
                        else { if (currentVolume === 0) currentVolume = 50; if (player) { player.unMute(); player.setVolume(currentVolume); } }
                        updateAudioUI();
                    });

                    const updateAudioUI = () => { speakerIcon.innerHTML = isMuted ? iconMute : iconVol; volSlider.value = currentVolume; };
                    const establishHandshake = () => { if (handshakeEstablished) return; handshakeEstablished = true; isMuted = false; currentVolume = 25; if (player && player.unMute) { player.unMute(); player.setVolume(currentVolume); } updateAudioUI(); };
                    window.addEventListener('click', establishHandshake);

                    updateTerminal();
                    setInterval(updateTerminal, 2000);

                    // Embed Modal Logic
                    document.getElementById('embed-trigger').addEventListener('click', () => { document.getElementById('embed-modal').style.display = 'flex'; });
                    document.getElementById('close-embed-btn').addEventListener('click', () => { document.getElementById('embed-modal').style.display = 'none'; });
                    document.getElementById('copy-embed-btn').addEventListener('click', () => {
                        document.getElementById('embed-code').select();
                        document.execCommand('copy');
                        document.getElementById('copy-embed-btn').innerHTML = 'SIGNAL_COPIED';
                        setTimeout(() => { document.getElementById('copy-embed-btn').innerHTML = 'COPY_CODE'; }, 2000);
                    });

                } catch (e) {
                    console.error("Terminal Error:", e);
                    mount.innerHTML = '<div class="signal-lost">TERMINAL ERROR: SIGNAL INTERRUPTED</div>';
                }
            }

            const checkAPI = setInterval(() => { if (window.YT && window.YT.Player) { clearInterval(checkAPI); startTerminal(); } }, 500);
        `}} />
      </div>
    )
  }

  Broadcast.css = `
  .broadcast-terminal {
    margin: 2rem 0;
    padding: 1.5rem;
    background: #050505;
    border: 2px solid #1a1a1a;
    border-radius: 4px;
    box-shadow: 0 0 30px rgba(0,255,0,0.05);
    font-family: 'Courier New', Courier, monospace;
    position: relative;
  }

  .terminal-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    color: #0f0;
    font-size: 0.8rem;
    text-transform: uppercase;
    border-bottom: 1px solid #1a1a1a;
    padding-bottom: 0.5rem;
  }

  .sync-gauge {
    color: #0f0;
    font-weight: bold;
    min-width: 200px;
    text-align: right;
  }

  .sync-gauge.searching {
    color: #ff0;
    animation: pulse 1s infinite;
  }

  .fading {
    animation: fadeInOut 3s infinite;
  }

  @keyframes fadeInOut {
    0% { opacity: 0.3; }
    50% { opacity: 1; }
    100% { opacity: 0.3; }
  }

  .terminal-screen {
    position: relative;
    width: 100%;
    height: 400px;
    background: black;
    overflow: hidden;
    border: 1px solid #222;
  }

  .player-mount {
    width: 100%;
    height: 100%;
  }

  /* EMBED MODAL */
  .embed-modal {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.9);
    z-index: 1000;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .modal-content {
    background: #050505;
    border: 1px solid #0f0;
    padding: 1rem;
    width: 100%;
    color: #0f0;
  }

  .modal-header {
    font-size: 0.7rem;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #040;
  }

  #embed-code {
    width: 100%;
    height: 80px;
    background: #000;
    color: #0c0;
    border: 1px solid #040;
    font-family: inherit;
    font-size: 0.6rem;
    padding: 0.5rem;
    margin-bottom: 1rem;
    resize: none;
  }

  .modal-footer {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .terminal-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-top: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid #1a1a1a;
    color: #0f0;
    font-size: 0.8rem;
  }

  .related-links {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #0c0;
  }

  .text-btn {
    background: transparent;
    border: none;
    color: #060;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.7rem;
    padding: 0;
    margin-top: 0.5rem;
    text-transform: uppercase;
  }

  .text-btn:hover {
    color: #0f0;
  }

  .vault-link {
    color: #0f0;
    text-decoration: none;
    margin-right: 0.5rem;
    border: 1px solid #040;
    padding: 2px 4px;
    background: rgba(0,255,0,0.05);
  }

  .vault-link:hover {
    background: #0f0;
    color: #000;
  }

  .footer-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.8rem;
  }

  .control-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .control-label {
    font-size: 0.7rem;
    color: #0f0;
    font-weight: bold;
    letter-spacing: 0.05rem;
  }

  .mute-btn {
    background: transparent;
    border: none;
    color: #0f0;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
  }

  .handshake-btn {
    background: transparent;
    border: 1px solid #0f0;
    color: #0f0;
    padding: 0.4rem 1rem;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.7rem;
    text-transform: uppercase;
  }

  .handshake-btn:hover {
    background: #0f0;
    color: #000;
  }

  .terminal-slider {
    width: 80px;
    accent-color: #0f0;
    cursor: pointer;
    background: transparent;
  }

  /* SWITCH STYLING */
  .switch {
    position: relative;
    display: inline-block;
    width: 34px;
    height: 14px;
  }

  .switch input { opacity: 0; width: 0; height: 0; }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: #010;
    border: 1px solid #040;
    transition: .4s;
    border-radius: 2px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 8px; width: 8px;
    left: 3px; bottom: 2px;
    background-color: #040;
    transition: .4s;
    border-radius: 1px;
  }

  input:checked + .slider { border-color: #0f0; background-color: #010; }
  input:checked + .slider:before { transform: translateX(18px); background-color: #0f0; box-shadow: 0 0 8px rgba(0,255,0,0.4); }

  .signal-initializing, .signal-lost {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    color: #0f0;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }
  `

  return Broadcast
}) satisfies QuartzComponentConstructor
