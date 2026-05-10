import { QuartzComponentConstructor, QuartzComponentProps } from "./types"

export default (() => {
  function Broadcast(props: QuartzComponentProps) {
    return (
      <div class="broadcast-terminal">
        <div class="terminal-header">
            <div id="video-title" class="terminal-id">TERMINAL://BOOTING_...</div>
            <div id="sync-gauge" class="sync-gauge">SYNC_LOCK: --.-%</div>
        </div>
        
        <div id="terminal-screen" class="terminal-screen">
            <div id="player-mount" class="player-mount">
                <div class="signal-initializing">SCANNING FOR SIGNAL...</div>
            </div>
        </div>

        <div class="terminal-footer">
            <div class="footer-left">
                <div id="program-info">OFFLINE</div>
                <div id="related-links" class="related-links"></div>
            </div>
            <div class="footer-right">
                <button id="mute-toggle" class="mute-btn" title="Toggle Mute">
                    <svg id="speaker-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-x">
                        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                </button>
                <input type="range" id="volume-control" min="0" max="100" value="0" />
            </div>
        </div>
        
        <script dangerouslySetInnerHTML={{ __html: `
            let player;
            let currentVolume = 0;
            let isMuted = true;
            let currentVideoId = null;
            let handshakeEstablished = false;

            const iconMute = '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
            const iconVol = '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>';

            // Load YouTube API
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            async function startTerminal() {
                const mount = document.getElementById('player-mount');
                const info = document.getElementById('program-info');
                const titleEl = document.getElementById('video-title');
                const linksEl = document.getElementById('related-links');
                const volSlider = document.getElementById('volume-control');
                const muteBtn = document.getElementById('mute-toggle');
                const speakerIcon = document.getElementById('speaker-icon');
                const syncGauge = document.getElementById('sync-gauge');
                
                try {
                    const pathSegments = window.location.pathname.split('/');
                    const isSubdir = pathSegments.length > 2;
                    const base = isSubdir ? '/' + pathSegments[1] + '/' : '/';
                    
                    console.log("Terminal: Loading playlist from " + base + 'static/video_playlist.json');
                    const response = await fetch(base + 'static/video_playlist.json?v=' + Date.now()); // Bypass cache
                    const data = await response.json();
                    const { totalLoopDuration, schedule, interstitials } = data;
                    
                    console.log("Terminal: Loop Initialized. Duration: " + totalLoopDuration + "s. Items: " + schedule.length);

                    const updateTerminal = () => {
                        const now = Math.floor(Date.now() / 1000);
                        const currentPos = now % totalLoopDuration;
                        
                        let activeProgram = null;
                        let isStandby = true;
                        let timeUntilNext = 0;
                        let offset = 0;

                        // Precise Timeline Match
                        for (let i = 0; i < schedule.length; i++) {
                            const prog = schedule[i];
                            if (currentPos >= prog.start && currentPos < prog.end) {
                                activeProgram = prog;
                                isStandby = false;
                                offset = currentPos - prog.start;
                                break;
                            }
                            // Check if we are in the gap after this program
                            if (currentPos >= prog.end && (i === schedule.length - 1 || currentPos < schedule[i+1].start)) {
                                isStandby = true;
                                timeUntilNext = (i === schedule.length - 1) 
                                    ? (totalLoopDuration - currentPos) 
                                    : (schedule[i+1].start - currentPos);
                                break;
                            }
                        }

                        if (!isStandby && activeProgram) {
                            const progress = offset / activeProgram.duration;
                            const lockVal = Math.max(0.1, (99.9 * (1 - progress))).toFixed(1);
                            
                            syncGauge.innerHTML = \`SYNC_LOCK: \${lockVal}%\`;
                            syncGauge.classList.remove('searching');
                            titleEl.innerHTML = \`DECODING://\${activeProgram.title.toUpperCase()}\`;
                            info.innerHTML = "STATUS: SIGNAL LOCKED";
                            
                            if (activeProgram.related && activeProgram.related.length > 0) {
                                const linksHtml = activeProgram.related.map(link => \`<a href="\${base}\${link.slug}" class="vault-link">[\${link.name}]</a>\`).join(' ');
                                linksEl.innerHTML = "LINKS: " + linksHtml;
                            } else {
                                linksEl.innerHTML = "";
                            }

                            if (currentVideoId !== activeProgram.id) {
                                console.log("Terminal: Locking new signal: " + activeProgram.id + " at offset " + offset);
                                currentVideoId = activeProgram.id;
                                mount.innerHTML = '<div id="yt-player"></div>';
                                player = new YT.Player('yt-player', {
                                    height: '100%',
                                    width: '100%',
                                    videoId: activeProgram.id,
                                    playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, modestbranding: 1, rel: 0, start: Math.floor(offset) },
                                    events: { onReady: (e) => { if (!isMuted) { e.target.unMute(); e.target.setVolume(currentVolume); } } }
                                });
                            }
                        } else {
                            // STANDBY MODE
                            syncGauge.innerHTML = \`ALIGNING: T-minus \${timeUntilNext}s\`;
                            syncGauge.classList.add('searching');
                            titleEl.innerHTML = "TERMINAL://SEARCHING_SIGNAL";
                            info.innerHTML = "STATUS: STANDBY // NEXT SIGNAL PENDING";
                            linksEl.innerHTML = "";

                            if (player) {
                                console.log("Terminal: Dropping signal. Entering Standby.");
                                if (player.destroy) player.destroy();
                                player = null;
                                currentVideoId = null;
                                mount.innerHTML = '';
                            }

                            const intIndex = Math.floor(now / 10) % interstitials.length;
                            const intFile = base + interstitials[intIndex].replace(/^\\//, '');
                            
                            if (!mount.querySelector('video') || !mount.querySelector('video').src.includes(intFile)) {
                                mount.innerHTML = \`<video src="\${intFile}" autoplay muted loop style="width:100%; height:100%; background:black; object-fit: cover;"></video>\`;
                            }
                        }
                    };

                    const updateAudioUI = () => {
                        speakerIcon.innerHTML = isMuted ? iconMute : iconVol;
                        volSlider.value = currentVolume;
                    };

                    const establishHandshake = () => {
                        if (handshakeEstablished) return;
                        handshakeEstablished = true;
                        isMuted = false;
                        currentVolume = 25;
                        if (player && player.unMute) { player.unMute(); player.setVolume(currentVolume); }
                        updateAudioUI();
                        window.removeEventListener('click', establishHandshake);
                    };

                    window.addEventListener('click', establishHandshake);

                    volSlider.addEventListener('input', (e) => {
                        currentVolume = e.target.value;
                        isMuted = currentVolume == 0;
                        if (player) { if (isMuted) player.mute(); else { player.unMute(); player.setVolume(currentVolume); } }
                        updateAudioUI();
                    });

                    muteBtn.addEventListener('click', () => {
                        isMuted = !isMuted;
                        if (isMuted) { if (player) player.mute(); } 
                        else { if (currentVolume === 0) currentVolume = 50; if (player) { player.unMute(); player.setVolume(currentVolume); } }
                        updateAudioUI();
                    });

                    updateTerminal();
                    setInterval(updateTerminal, 2000); // Check every 2s for stability

                } catch (e) {
                    console.error("Terminal Error:", e);
                    mount.innerHTML = '<div class="signal-lost">TERMINAL ERROR: SIGNAL INTERRUPTED</div>';
                }
            }

            const checkAPI = setInterval(() => {
                if (window.YT && window.YT.Player) {
                    clearInterval(checkAPI);
                    startTerminal();
                }
            }, 500);
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
    align-items: center;
    gap: 0.5rem;
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

  #volume-control {
    width: 80px;
    accent-color: #0f0;
    cursor: pointer;
    background: transparent;
  }

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
