import { QuartzComponentConstructor, QuartzComponentProps } from "./types"

export default (() => {
  function Broadcast(props: QuartzComponentProps) {
    return (
      <div class="broadcast-terminal">
        <div class="terminal-header">
            <div class="terminal-id">TERMINAL://CH-0000</div>
            <div id="sync-gauge" class="sync-gauge">SYNC_LOCK: --.-%</div>
        </div>
        
        <div id="terminal-screen" class="terminal-screen">
            {/* INITIAL HANDSHAKE OVERLAY */}
            <div id="handshake-overlay" class="handshake-overlay">
                <div class="handshake-content">
                    <div class="glitch-text">SIGNAL ENCRYPTED</div>
                    <button id="connect-btn" class="handshake-btn">CONNECT TO FEED</button>
                </div>
            </div>

            <div id="player-mount" class="player-mount">
                <div class="signal-initializing">WAITING FOR HANDSHAKE...</div>
            </div>
        </div>

        <div class="terminal-footer">
            <div class="footer-left">
                <div id="program-info">OFFLINE</div>
            </div>
            <div class="footer-right">
                <span class="volume-label">VOL:</span>
                <input type="range" id="volume-control" min="0" max="100" value="50" />
            </div>
        </div>
        
        <script dangerouslySetInnerHTML={{ __html: `
            let player;
            let currentVolume = 50;
            let currentVideoId = null;
            let isConnected = false;

            // Load YouTube API
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            async function startTerminal() {
                if (isConnected) return;
                isConnected = true;
                
                // Hide overlay
                document.getElementById('handshake-overlay').style.display = 'none';
                
                const mount = document.getElementById('player-mount');
                const info = document.getElementById('program-info');
                const volSlider = document.getElementById('volume-control');
                const syncGauge = document.getElementById('sync-gauge');
                
                try {
                    const pathSegments = window.location.pathname.split('/');
                    const isSubdir = pathSegments.length > 2;
                    const base = isSubdir ? '/' + pathSegments[1] + '/' : '/';
                    
                    const response = await fetch(base + 'static/video_playlist.json');
                    const data = await response.json();
                    const { schedule, interstitials } = data;
                    
                    const intelLength = 300;
                    const interLength = 60;
                    const totalSlotLength = intelLength + interLength; 
                    
                    const updateTerminal = () => {
                        const now = Math.floor(Date.now() / 1000);
                        const slotIndex = Math.floor(now / totalSlotLength) % schedule.length;
                        const timeInSlot = now % totalSlotLength;
                        
                        const isIntelligenceTime = timeInSlot < intelLength;
                        const program = schedule[slotIndex];
                        
                        if (isIntelligenceTime) {
                            const progress = timeInSlot / intelLength;
                            const jitter = (Math.random() * 1.5) - 0.75;
                            const lockVal = Math.max(0.1, (99.9 * (1 - progress)) + jitter).toFixed(1);
                            syncGauge.innerHTML = \`SYNC_LOCK: \${lockVal}%\`;
                            syncGauge.classList.remove('searching');
                        } else {
                            const countdown = interLength - (timeInSlot - intelLength);
                            syncGauge.innerHTML = \`ALIGNING: T-minus \${countdown}s\`;
                            syncGauge.classList.add('searching');
                        }

                        const isDeadAir = !isIntelligenceTime || timeInSlot >= program.duration;

                        if (isDeadAir) {
                            if (player && player.destroy) {
                                player.destroy();
                                player = null;
                                currentVideoId = null;
                                mount.innerHTML = '';
                            }

                            const intIndex = Math.floor(now / totalSlotLength) % interstitials.length;
                            const intFile = base + interstitials[intIndex].replace(/^\\//, '');
                            
                            info.innerHTML = isIntelligenceTime ? "STATUS: SIGNAL DEGRADED // FILLING GAP" : "STATUS: STANDBY // NEXT SIGNAL PENDING";
                            
                            if (!mount.querySelector('video') || !mount.querySelector('video').src.includes(intFile)) {
                                mount.innerHTML = \`<video 
                                    src="\${intFile}" 
                                    autoplay 
                                    loop
                                    style="width:100%; height:100%; background:black; object-fit: cover;">
                                </video>\`;
                                const v = mount.querySelector('video');
                                v.volume = currentVolume / 100;
                            }
                        } else {
                            info.innerHTML = \`DECODING: \${program.title.toUpperCase()}\`;
                            
                            if (currentVideoId !== program.id) {
                                currentVideoId = program.id;
                                mount.innerHTML = '<div id="yt-player"></div>';
                                
                                player = new YT.Player('yt-player', {
                                    height: '100%',
                                    width: '100%',
                                    videoId: program.id,
                                    playerVars: {
                                        autoplay: 1,
                                        controls: 0,
                                        disablekb: 1,
                                        modestbranding: 1,
                                        rel: 0,
                                        start: timeInSlot
                                    },
                                    events: {
                                        onReady: (event) => {
                                            event.target.setVolume(currentVolume);
                                        }
                                    }
                                });
                            }
                        }
                    };

                    volSlider.addEventListener('input', (e) => {
                        currentVolume = e.target.value;
                        if (player && player.setVolume) player.setVolume(currentVolume);
                        const video = mount.querySelector('video');
                        if (video) video.volume = currentVolume / 100;
                    });

                    updateTerminal();
                    setInterval(updateTerminal, 1000);

                } catch (e) {
                    console.error("Terminal Error:", e);
                    mount.innerHTML = '<div class="signal-lost">TERMINAL ERROR: SIGNAL INTERRUPTED</div>';
                }
            }
            
            document.getElementById('connect-btn').addEventListener('click', () => {
                // Ensure YT API is ready before starting
                if (window.YT && window.YT.Player) {
                    startTerminal();
                } else {
                    const checkAPI = setInterval(() => {
                        if (window.YT && window.YT.Player) {
                            clearInterval(checkAPI);
                            startTerminal();
                        }
                    }, 100);
                }
            });
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
    min-width: 180px;
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

  /* HANDSHAKE OVERLAY */
  .handshake-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .handshake-content {
    color: #0f0;
  }

  .glitch-text {
    font-weight: bold;
    margin-bottom: 1.5rem;
    letter-spacing: 0.2rem;
    animation: blink 2s infinite steps(1);
  }

  .handshake-btn {
    background: transparent;
    border: 1px solid #0f0;
    color: #0f0;
    padding: 0.8rem 1.5rem;
    cursor: pointer;
    font-family: inherit;
    text-transform: uppercase;
    transition: all 0.2s ease;
  }

  .handshake-btn:hover {
    background: #0f0;
    color: #000;
    box-shadow: 0 0 15px #0f0;
  }

  .player-mount {
    width: 100%;
    height: 100%;
  }

  .terminal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid #1a1a1a;
    color: #0f0;
    font-size: 0.8rem;
  }

  #volume-control {
    width: 100px;
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

  @keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0.2; }
    100% { opacity: 1; }
  }
  `

  return Broadcast
}) satisfies QuartzComponentConstructor
