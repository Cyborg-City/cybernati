import { QuartzComponentConstructor, QuartzComponentProps } from "./types"

export default (() => {
  function Broadcast(props: QuartzComponentProps) {
    return (
      <div id="broadcast-root" class="broadcast-terminal">
        <div class="terminal-header">
            <div class="header-brand">
                <img width="18" height="22" class="terminal-icon" alt="" />
                <div class="terminal-version">CYBERNATI™ Player Beta |</div>
            </div>
            <div id="video-title" class="video-title">INITIALIZING...</div>
        </div>
        
        <div id="terminal-screen" class="terminal-screen">
            <div id="player-mount" class="player-mount">
                <div id="terminal-status-msg" class="signal-initializing">SCANNING FOR SIGNAL...</div>
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

        <div id="progress-container" class="progress-container">
            <div id="sync-progress" class="progress-bar"></div>
        </div>

        <div class="terminal-footer">
            {/* Row 1: Always visible — NEXT + controls */}
            <div class="footer-top-row">
                <div class="next-section">
                    <span class="label">Next:</span>
                    <span id="next-title" class="next-title">STANDBY</span>
                </div>
                <div class="top-controls">
                    <button id="desync-btn" class="desync-action-btn">DESYNC</button>
                    <button id="mute-toggle" class="mute-btn" title="Toggle Mute">
                        <svg id="speaker-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                            <line x1="23" y1="9" x2="17" y2="15"></line>
                            <line x1="17" y1="9" x2="23" y2="15"></line>
                        </svg>
                    </button>
                    <input type="range" id="volume-control" class="terminal-slider" min="0" max="100" value="0" />
                    <button id="fullscreen-toggle" class="mute-btn" title="Full Screen">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Row 2: Fold toggle */}
            <button id="footer-fold" class="footer-fold">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
            </button>
            
            {/* Row 3-5: Collapsible — Related + Embed */}
            <div id="footer-collapsible" class="footer-collapsible collapsed">
                <div class="footer-section">
                    <span class="label">Related Notes:</span>
                    <div id="related-links" class="links-container">NONE DETECTED</div>
                </div>
                <div class="footer-row-meta">
                    <button id="embed-trigger" class="desync-action-btn">[EMBED_SIGNAL]</button>
                </div>
            </div>
        </div>
        
        <script dangerouslySetInnerHTML={{ __html: `
            (function() {
                // CYBERNATI PLAYER CORE (SINGLETON)
                if (window.CyberPlayer) {
                    window.CyberPlayer.destroy();
                }

                window.CyberPlayer = {
                    player: null,
                    currentVolume: 0,
                    isMuted: true,
                    handshakeEstablished: false,
                    isDesynced: false,
                    updateTimer: null,
                    desyncTimer: null,
                    currentVideoId: null,
                    playlistData: null,
                    basePath: null,

                    icons: {
                        mute: '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>',
                        vol: '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>'
                    },

                    destroy: function() {
                        if (this.updateTimer) clearInterval(this.updateTimer);
                        if (this.desyncTimer) clearInterval(this.desyncTimer);
                        if (this.player && this.player.destroy) this.player.destroy();
                        this.player = null;
                        this.currentVideoId = null;
                        const mount = document.getElementById('player-mount');
                        if (mount) mount.innerHTML = '';
                    },

                    init: async function() {
                        const mount = document.getElementById('player-mount');
                        if (!mount || !window.YT || !window.YT.Player) return;
                        if (this.isInitializing) return;
                        this.isInitializing = true;

                        try {
                            const pathSegments = window.location.pathname.split('/');
                            this.basePath = pathSegments.length > 2 ? '/' + pathSegments[1] + '/' : '/';
                            
                            const response = await fetch(this.basePath + 'static/video_playlist.json?v=' + Date.now());
                            if (!response.ok) throw new Error("Playlist 404");
                            this.playlistData = await response.json();
                            
                            this.setupUI();
                            this.startLoop();
                        } catch (e) {
                            const status = document.getElementById('terminal-status-msg');
                            if (status) status.innerHTML = "CONNECTION ERROR: ARCHIVE UNREACHABLE";
                            console.error("Player Error:", e);
                        } finally {
                            this.isInitializing = false;
                        }
                    },

                    setupUI: function() {
                        const self = this;
                        
                        const icon = document.querySelector('.terminal-icon');
                        if (icon) icon.src = self.basePath + 'static/cybernati.svg';

                        const handleInteraction = () => {
                            if (self.handshakeEstablished) return;
                            self.handshakeEstablished = true;
                            self.isMuted = false;
                            self.currentVolume = 25;
                            if (self.player && self.player.unMute) {
                                self.player.unMute();
                                self.player.setVolume(self.currentVolume);
                            }
                            const speaker = document.getElementById('speaker-icon');
                            if (speaker) speaker.innerHTML = self.icons.vol;
                            const slider = document.getElementById('volume-control');
                            if (slider) slider.value = 25;
                            const muteBtn = document.getElementById('mute-toggle');
                            if (muteBtn) muteBtn.classList.remove('muted');
                        };
                        window.addEventListener('click', handleInteraction, { once: true });

                        const muteBtn = document.getElementById('mute-toggle');
                        if (muteBtn) {
                            muteBtn.classList.toggle('muted', self.isMuted);
                            muteBtn.onclick = () => {
                                self.isMuted = !self.isMuted;
                                if (self.player) {
                                    if (self.isMuted) self.player.mute();
                                    else {
                                        if (self.currentVolume === 0) self.currentVolume = 50;
                                        self.player.unMute();
                                        self.player.setVolume(self.currentVolume);
                                    }
                                }
                                const speaker = document.getElementById('speaker-icon');
                                if (speaker) speaker.innerHTML = self.isMuted ? self.icons.mute : self.icons.vol;
                                const slider = document.getElementById('volume-control');
                                if (slider) slider.value = self.isMuted ? 0 : self.currentVolume;
                                if (muteBtn) muteBtn.classList.toggle('muted', self.isMuted);
                            };
                        }

                        const volSlider = document.getElementById('volume-control');
                        if (volSlider) volSlider.oninput = (e) => {
                            self.currentVolume = e.target.value;
                            self.isMuted = self.currentVolume == 0;
                            if (self.player && self.player.setVolume) {
                                if (self.isMuted) self.player.mute();
                                else { self.player.unMute(); self.player.setVolume(self.currentVolume); }
                            }
                            const speaker = document.getElementById('speaker-icon');
                            if (speaker) speaker.innerHTML = self.isMuted ? self.icons.mute : self.icons.vol;
                            if (muteBtn) muteBtn.classList.toggle('muted', self.isMuted);
                        };

                        const fsBtn = document.getElementById('fullscreen-toggle');
                        if (fsBtn) fsBtn.onclick = () => {
                            const root = document.getElementById('broadcast-root');
                            if (!document.fullscreenElement) root.requestFullscreen();
                            else document.exitFullscreen();
                        };

                        const foldBtn = document.getElementById('footer-fold');
                        const collapsible = document.getElementById('footer-collapsible');
                        if (foldBtn && collapsible) {
                            foldBtn.onclick = () => {
                                collapsible.classList.toggle('collapsed');
                                const arrow = foldBtn.querySelector('svg');
                                if (arrow) {
                                    const isCollapsed = collapsible.classList.contains('collapsed');
                                    arrow.innerHTML = isCollapsed
                                        ? '<line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline>'
                                        : '<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>';
                                }
                            };
                        }

                        const desyncBtn = document.getElementById('desync-btn');
                        if (desyncBtn) desyncBtn.onclick = () => {
                            self.isDesynced = !self.isDesynced;
                            desyncBtn.innerHTML = self.isDesynced ? "SYNC" : "DESYNC";
                            desyncBtn.classList.toggle('active', self.isDesynced);
                            
                            // Clear any pending timers
                            if (self.desyncTimer) clearInterval(self.desyncTimer);
                            if (self.updateTimer) clearInterval(self.updateTimer);
                            
                            // Reset player state when toggling
                            if (self.player && self.player.destroy) {
                                self.player.destroy();
                            }
                            self.player = null;
                            self.currentVideoId = null;
                            
                            if (self.isDesynced) {
                                self.startDesyncSequence();
                            } else {
                                self.startLoop();
                            }
                        };

                        const embedBtn = document.getElementById('embed-trigger');
                        if (embedBtn) embedBtn.onclick = () => { document.getElementById('embed-modal').style.display = 'flex'; };
                        const closeEmbed = document.getElementById('close-embed-btn');
                        if (closeEmbed) closeEmbed.onclick = () => { document.getElementById('embed-modal').style.display = 'none'; };
                    },

                    startLoop: function() {
                        const { totalLoopDuration, schedule, interstitials } = this.playlistData;
                        const self = this;

                        const update = () => {
                            if (self.isDesynced) return;
                            
                            const now = Math.floor(Date.now() / 1000);
                            const pos = now % totalLoopDuration;
                            let active = null; let standby = true; let wait = 0; let off = 0; let nextIdx = 0;

                            for (let i = 0; i < schedule.length; i++) {
                                const p = schedule[i];
                                if (pos >= p.start && pos < p.end) { active = p; standby = false; off = pos - p.start; nextIdx = (i + 1) % schedule.length; break; }
                                if (pos >= p.end && (i === schedule.length - 1 || pos < schedule[i+1].start)) {
                                    standby = true; wait = (i === schedule.length - 1) ? (totalLoopDuration - pos) : (schedule[i+1].start - pos);
                                    nextIdx = (i + 1) % schedule.length;
                                    break;
                                }
                            }

                            const progressBar = document.getElementById('sync-progress');
                            const titleEl = document.getElementById('video-title');
                            const nextEl = document.getElementById('next-title');

                            if (!standby && active) {
                                if (progressBar) progressBar.style.width = (100 - (off / active.duration) * 100) + "%";
                                if (titleEl) titleEl.innerHTML = active.title.toUpperCase();
                                if (nextEl) nextEl.innerHTML = schedule[nextIdx].title.toUpperCase();
                                
                                // Force remount if player exists but wrong video
                                if (self.currentVideoId !== active.id) {
                                    self.mountVideo(active, off);
                                } else if (self.player && self.player.getCurrentTime) {
                                    // Resync if drift exceeds 3 seconds (e.g. user paused tab)
                                    const drift = Math.abs(self.player.getCurrentTime() - off);
                                    if (drift > 3) self.player.seekTo(off, true);
                                }
                            } else {
                                if (progressBar) progressBar.style.width = Math.min(100, (wait / 30) * 100) + "%";
                                if (titleEl) titleEl.innerHTML = "SIGNAL_LOST: RE-ALIGNING...";
                                if (nextEl) nextEl.innerHTML = schedule[nextIdx].title.toUpperCase();
                                self.mountStandby(interstitials);
                            }
                        };

                        if (this.updateTimer) clearInterval(this.updateTimer);
                        this.updateTimer = setInterval(update, 1000);
                        update();
                    },

                    startDesyncSequence: function() {
                        const { schedule, interstitials } = this.playlistData;
                        const self = this;
                        
                        if (this.updateTimer) clearInterval(this.updateTimer);
                        
                        const playRandom = () => {
                            const prog = schedule[Math.floor(Math.random() * schedule.length)];
                            const playWindow = Math.min(prog.duration, 300);
                            const startAt = Math.floor(Math.random() * (prog.duration - playWindow));
                            
                            self.mountVideo(prog, startAt);
                            
                            let remaining = playWindow;
                            if (self.desyncTimer) clearInterval(self.desyncTimer);
                            self.desyncTimer = setInterval(() => {
                                if (!self.isDesynced) { clearInterval(self.desyncTimer); return; }
                                remaining--;
                                const progressBar = document.getElementById('sync-progress');
                                if (progressBar) progressBar.style.width = (remaining / playWindow * 100) + "%";
                                if (document.getElementById('program-info')) document.getElementById('program-info').innerHTML = "STATUS: UNAUTHORIZED_ACCESS";
                                
                                if (remaining <= 0) {
                                    clearInterval(self.desyncTimer);
                                    self.mountStandby(interstitials);
                                    setTimeout(playRandom, 5000); // 5s gap in random mode
                                }
                            }, 1000);
                        };
                        
                        playRandom();
                    },

                    mountVideo: function(prog, offset) {
                        const mount = document.getElementById('player-mount');
                        if (!mount) return;
                        
                        // Only reload if different video or player not ready
                        if (this.currentVideoId === prog.id && this.player && this.player.getPlayerState && this.player.getPlayerState() > 0) {
                            // Video already playing, just update position if needed
                            return;
                        }
                        
                        // Destroy existing player first
                        if (this.player && this.player.destroy) {
                            this.player.destroy();
                        }
                        this.player = null;
                        this.currentVideoId = prog.id;
                        
                        // Clear and recreate the mount point
                        mount.innerHTML = '<div id="yt-player"></div>';
                        
                        const self = this;
                        this.player = new YT.Player('yt-player', {
                            height: '100%', width: '100%', videoId: prog.id,
                            playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, modestbranding: 1, rel: 0, start: Math.floor(offset) },
                            events: { 
                                onReady: (e) => { 
                                    if (self.isMuted) { e.target.mute(); }
                                    else { e.target.unMute(); e.target.setVolume(self.currentVolume); }
                                },
                                onError: (e) => { console.error('YT Player Error:', e); }
                            }
                        });

                        const linksEl = document.getElementById('related-links');
                        if (linksEl) {
                            linksEl.innerHTML = (prog.related?.length > 0) 
                                ? prog.related.map(l => '<a href="' + this.basePath + l.slug + '" target="_blank" class="vault-link">' + l.name + '</a>').join(' ') 
                                : "NONE DETECTED";
                        }
                    },

                    mountStandby: function(interstitials) {
                        const mount = document.getElementById('player-mount');
                        if (!mount) return;
                        
                        const intFile = this.basePath + interstitials[Math.floor(Date.now() / 10000) % interstitials.length].replace(/^\\//, '');
                        
                        // Only recreate if interstitial changed or no video exists
                        const existing = mount.querySelector('video');
                        if (existing && existing.getAttribute('src') === intFile) return;
                        
                        if (this.player && this.player.destroy) { this.player.destroy(); this.player = null; this.currentVideoId = null; }
                        
                        mount.innerHTML = '<video src="' + intFile + '" autoplay muted loop style="width:100%; height:100%; background:black; object-fit: cover;"></video>';
                    }
                };

                // Loader
                if (!window.YT) {
                    const tag = document.createElement('script');
                    tag.src = "https://www.youtube.com/iframe_api";
                    document.head.appendChild(tag);
                }

                const checkReady = setInterval(() => {
                    if (window.YT && window.YT.Player && document.getElementById('player-mount')) {
                        clearInterval(checkReady);
                        window.CyberPlayer.init();
                    }
                }, 500);

                let navDebounce;
                document.addEventListener("nav", () => {
                    clearTimeout(navDebounce);
                    if (window.CyberPlayer.player) window.CyberPlayer.destroy();
                    navDebounce = setTimeout(() => {
                        if (document.getElementById('player-mount') && window.YT && window.YT.Player) {
                            window.CyberPlayer.init();
                        }
                    }, 100);
                });
            })();
        `}} />
      </div>
    )
  }

  Broadcast.css = `
  .broadcast-terminal {
    margin: 2rem 0; padding: 1.5rem; background: #050505;
    border: 2px solid #1a1a1a; border-radius: 4px; box-shadow: 0 0 30px rgba(0,255,0,0.05);
    font-family: 'Special Elite', cursive; position: relative;
    display: flex; flex-direction: column;
  }

  .terminal-header { margin-bottom: 1rem; border-bottom: 1px solid #1a1a1a; padding-bottom: 0.8rem; display: flex; flex-direction: column; gap: 0.4rem; }
  .header-brand { display: flex; align-items: center; gap: 0.6rem; }
  .terminal-icon { width: 18px; height: 22px; display: inline-block; vertical-align: middle; }
  .terminal-version { font-size: 1.1rem; color: #fff; text-transform: uppercase; letter-spacing: 0.1rem; line-height: 1; }
  .video-title { color: #0f0; font-size: 1.1rem; font-weight: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1; }

  .terminal-screen { position: relative; width: 100%; height: 400px; background: black; overflow: hidden; border: 1px solid #222; }
  .player-mount { width: 100%; height: 100%; }

  .progress-container { width: 100%; height: 4px; background: #111; position: relative; overflow: hidden; }
  .progress-bar { height: 100%; background: #0f0; width: 0%; transition: width 1s linear; box-shadow: 0 0 10px #0f0; }

  .terminal-footer { display: flex; flex-direction: column; margin-top: 1rem; padding-top: 0.5rem; color: #0f0; font-size: 0.8rem; gap: 0.4rem; }
  .footer-top-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
  .next-section { display: flex; align-items: center; gap: 0.4rem; }
  .top-controls { display: flex; align-items: center; gap: 0.8rem; }
  .footer-fold { width: 100%; text-align: center; background: transparent; border: none; color: #060; cursor: pointer; padding: 0.6rem; font-family: 'IBM Plex Mono', monospace !important; font-size: 0.7rem; border-top: 1px solid #111; border-bottom: 1px solid #111; display: flex; align-items: center; justify-content: center; }
  .footer-fold:hover { color: #0f0; }
  .footer-collapsible { overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease; max-height: 500px; opacity: 1; }
  .footer-collapsible.collapsed { max-height: 0; opacity: 0; }
  .footer-section { display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-start; margin-top: 0.5rem; }
  .footer-section .label { color: #fff; font-weight: bold; text-transform: uppercase; font-size: 0.7rem; font-family: 'IBM Plex Mono', monospace !important; }
  .footer-row-meta { display: flex; gap: 1.5rem; align-items: center; margin-top: 0.5rem; }
  .links-container { display: flex; flex-wrap: wrap; gap: 8px; }
  .vault-link {
    color: #fff; text-decoration: none; border: 1px solid #060; padding: 4px 10px 2px 10px;
    background: rgba(0,255,0,0.05); display: inline-flex; align-items: center; justify-content: center;
    font-size: 0.75rem; transition: all 0.1s ease; line-height: 1;
  }
  .vault-link:hover { background: #0f0; color: #000; }
  .next-title { color: #0c0; font-style: italic; }
  .mute-btn { background: transparent; border: none; color: #060; cursor: pointer; padding: 2px; display: flex; align-items: center; }
  .mute-btn:hover { color: #0f0; }
  .mute-btn.muted { color: #0f0; animation: blink 1s infinite; }

  .desync-action-btn {
      background: #010; border: 1px solid #060; color: #fff; padding: 4px 12px 2px 12px;
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; font-family: inherit; font-size: 0.75rem; border-radius: 2px; line-height: 1;
  }
  .desync-action-btn:hover { background: #0f0; color: #000; }
  .desync-action-btn.active { color: #000; background: #0f0; }

  .terminal-slider { width: 80px; accent-color: #0f0; cursor: pointer; background: transparent; }

  .embed-modal { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 2rem; }
  .modal-content { background: #050505; border: 1px solid #0f0; padding: 1.5rem; width: 90%; max-width: 500px; color: #0f0; box-shadow: 0 0 40px rgba(0,255,0,0.2); box-sizing: border-box; }
  .modal-header { font-size: 0.7rem; margin-bottom: 0.5rem; border-bottom: 1px solid #040; }
  #embed-code { width: 100%; height: 80px; background: #000; color: #0c0; border: 1px solid #040; font-family: inherit; font-size: 0.6rem; padding: 0.5rem; margin-bottom: 1rem; resize: none; }
  .handshake-btn { background: transparent; border: 1px solid #0f0; color: #0f0; padding: 0.4rem 1rem; cursor: pointer; font-family: inherit; font-size: 0.7rem; text-transform: uppercase; }
  .handshake-btn:hover { background: #0f0; color: #000; }

  .signal-initializing { height: 100%; display: flex; align-items: center; justify-content: center; background: #000; color: #0f0; }
  @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }

  /* FULLSCREEN */
  .broadcast-terminal:fullscreen { padding: 30px; background: #000; width: 100vw; height: 100vh; }
  .broadcast-terminal:fullscreen .terminal-screen { flex-grow: 1; height: auto !important; margin-bottom: 20px; }
  .broadcast-terminal:fullscreen iframe, .broadcast-terminal:fullscreen video { height: 100% !important; width: 100% !important; }
  .broadcast-terminal:fullscreen .terminal-footer { margin-top: auto; }
  `

  return Broadcast
}) satisfies QuartzComponentConstructor
