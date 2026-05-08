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
            <div id="player-mount" class="player-mount">
                <div class="signal-initializing">SCANNING FOR SIGNAL...</div>
            </div>
        </div>

        <div class="terminal-footer">
            <div class="footer-left">
                <div id="program-info">WAITING FOR DATA...</div>
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
                const volSlider = document.getElementById('volume-control');
                const muteBtn = document.getElementById('mute-toggle');
                const speakerIcon = document.getElementById('speaker-icon');
                const syncGauge = document.getElementById('sync-gauge');
                
                try {
                    const pathSegments = window.location.pathname.split('/');
                    const isSubdir = pathSegments.length > 2;
                    const base = isSubdir ? '/' + pathSegments[1] + '/' : '/';
                    
                    const response = await fetch(base + 'static/video_playlist.json');
                    const data = await response.json();
                    const { schedule, interstitials } = data;
                    
                    const intelLength = 300;
                    const interLength = 30;
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
                                    muted
                                    loop
                                    style="width:100%; height:100%; background:black; object-fit: cover;">
                                </video>\`;
                                // Interstitials are ALWAYS forced silent
                                const v = mount.querySelector('video');
                                v.muted = true;
                                v.volume = 0;
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
                                        mute: 1, // Start muted for autoplay
                                        controls: 0,
                                        disablekb: 1,
                                        modestbranding: 1,
                                        rel: 0,
                                        start: timeInSlot
                                    },
                                    events: {
                                        onReady: (event) => {
                                            if (!isMuted) {
                                                event.target.unMute();
                                                event.target.setVolume(currentVolume);
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    };

                    const updateAudioUI = () => {
                        speakerIcon.innerHTML = isMuted ? iconMute : iconVol;
                        volSlider.value = currentVolume;
                    };

                    volSlider.addEventListener('input', (e) => {
                        currentVolume = e.target.value;
                        if (currentVolume > 0 && isMuted) {
                            isMuted = false;
                        } else if (currentVolume == 0 && !isMuted) {
                            isMuted = true;
                        }
                        
                        if (player) {
                            if (isMuted) player.mute(); else { player.unMute(); player.setVolume(currentVolume); }
                        }
                        // Note: We skip updating local <video> tags because interstitials must stay silent
                        updateAudioUI();
                    });

                    muteBtn.addEventListener('click', () => {
                        isMuted = !isMuted;
                        if (isMuted) {
                            if (player) player.mute();
                        } else {
                            if (currentVolume === 0) currentVolume = 50;
                            if (player) { player.unMute(); player.setVolume(currentVolume); }
                        }
                        // Note: We skip updating local <video> tags because interstitials must stay silent
                        updateAudioUI();
                    });

                    // Start loop
                    const checkAPI = setInterval(() => {
                        if (window.YT && window.YT.Player) {
                            clearInterval(checkAPI);
                            updateTerminal();
                            setInterval(updateTerminal, 1000);

                            // INVISIBLE HANDSHAKE: Unmute on first interaction anywhere on page
                            const establishHandshake = () => {
                                if (isMuted) {
                                    isMuted = false;
                                    currentVolume = 25; // Default to 25% on handshake
                                    if (player && player.unMute) {
                                        player.unMute();
                                        player.setVolume(currentVolume);
                                    }
                                    updateAudioUI();
                                }
                                window.removeEventListener('click', establishHandshake);
                                window.removeEventListener('keydown', establishHandshake);
                            };
                            window.addEventListener('click', establishHandshake);
                            window.addEventListener('keydown', establishHandshake);

                            } catch (e) {


                } catch (e) {
                    console.error("Terminal Error:", e);
                    mount.innerHTML = '<div class="signal-lost">TERMINAL ERROR: SIGNAL INTERRUPTED</div>';
                }
            }
            
            window.addEventListener('load', startTerminal);
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
    transition: transform 0.1s ease;
  }

  .mute-btn:hover {
    transform: scale(1.1);
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
