document.addEventListener('DOMContentLoaded', () => {
    const switcher = document.getElementById('language-switcher');
    const roomSwitcher = document.getElementById('room-switcher');
    const artistsEl = document.getElementById('artists-names');
    const artworkEl = document.getElementById('artwork-name');
    const artworkNumberEl = document.getElementById('artwork-number');
    const artworkNumberWrapperEl = document.getElementById('artwork-number-wrapper');

    // --- WebGL background with Codrops-style displacement transition ---
    const setupBackground = () => {
        const canvas = document.getElementById('background-canvas');
        if (!canvas) return null;
        const gl = canvas.getContext('webgl');
        if (!gl) return null;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize();
        window.addEventListener('resize', resize);

        const vsSource = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        const fsSource = `
            precision mediump float;
            uniform sampler2D u_from;
            uniform sampler2D u_to;
            uniform sampler2D u_disp;
            uniform vec2 u_fromSize;
            uniform vec2 u_toSize;
            uniform vec2 u_canvasSize;
            uniform float u_progress;
            uniform float u_intensity1;
            uniform float u_intensity2;
            uniform float u_angle1;
            uniform float u_angle2;
            varying vec2 v_uv;

            vec2 coverUV(vec2 uv, vec2 imgSize, vec2 canvasSize) {
                float imgAspect = imgSize.x / imgSize.y;
                float canvasAspect = canvasSize.x / canvasSize.y;
                vec2 ratio = imgAspect > canvasAspect
                    ? vec2(canvasAspect / imgAspect, 1.0)
                    : vec2(1.0, imgAspect / canvasAspect);
                return (uv - 0.5) * ratio + 0.5;
            }

            mat2 getRotM(float angle) {
                float s = sin(angle);
                float c = cos(angle);
                return mat2(c, -s, s, c);
            }

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
            }

            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
            }

            float fbm(vec2 st) {
                float v = 0.0;
                float amp = 0.5;
                for (int i = 0; i < 4; i++) {
                    v += amp * noise(st);
                    st *= 2.0;
                    amp *= 0.5;
                }
                return v;
            }

            void main() {
                vec4 disp = texture2D(u_disp, v_uv);
                vec2 dispVec = vec2(disp.r, disp.g) - 0.5;

                vec2 pos1 = v_uv + getRotM(u_angle1) * dispVec * u_intensity1 * u_progress;
                vec2 pos2 = v_uv + getRotM(u_angle2) * dispVec * u_intensity2 * (1.0 - u_progress);

                pos1 = coverUV(pos1, u_fromSize, u_canvasSize);
                pos2 = coverUV(pos2, u_toSize, u_canvasSize);

                vec4 t1 = texture2D(u_from, pos1);
                vec4 t2 = texture2D(u_to, pos2);

                float threshold = fbm(v_uv * 4.0);
                gl_FragColor = step(threshold, u_progress) > 0.5 ? t2 : t1;
            }
        `;

        const compile = (type, src) => {
            const sh = gl.createShader(type);
            gl.shaderSource(sh, src);
            gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                console.error('Shader error:', gl.getShaderInfoLog(sh));
            }
            return sh;
        };

        const program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vsSource));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fsSource));
        gl.linkProgram(program);
        gl.useProgram(program);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const u = {
            from: gl.getUniformLocation(program, 'u_from'),
            to: gl.getUniformLocation(program, 'u_to'),
            disp: gl.getUniformLocation(program, 'u_disp'),
            fromSize: gl.getUniformLocation(program, 'u_fromSize'),
            toSize: gl.getUniformLocation(program, 'u_toSize'),
            canvasSize: gl.getUniformLocation(program, 'u_canvasSize'),
            progress: gl.getUniformLocation(program, 'u_progress'),
            intensity1: gl.getUniformLocation(program, 'u_intensity1'),
            intensity2: gl.getUniformLocation(program, 'u_intensity2'),
            angle1: gl.getUniformLocation(program, 'u_angle1'),
            angle2: gl.getUniformLocation(program, 'u_angle2'),
        };
        gl.uniform1i(u.from, 0);
        gl.uniform1i(u.to, 1);
        gl.uniform1i(u.disp, 2);

        const mkTex = (filter = gl.LINEAR) => {
            const t = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, t);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
            return t;
        };
        const texFrom = mkTex();
        const texTo = mkTex();
        const texDisp = mkTex(gl.NEAREST);

        let fromImg = null;
        let toImg = null;

        const loadImage = src => new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });

        const upload = (tex, source) => {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        };

        // Build a blurred displacement texture from a source image
        const buildDisplacementTexture = src => loadImage(src).then(img => {
            upload(texDisp, img);
        });

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        const render = (progress) => {
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texFrom);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, texTo);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, texDisp);
            gl.uniform1f(u.progress, progress);
            gl.uniform1f(u.intensity1, 0.5);
            gl.uniform1f(u.intensity2, 0.5);
            gl.uniform1f(u.angle1, Math.PI / 4);
            gl.uniform1f(u.angle2, -Math.PI / 4 * 3);
            gl.uniform2f(u.fromSize, fromImg ? fromImg.width : 1, fromImg ? fromImg.height : 1);
            gl.uniform2f(u.toSize, toImg ? toImg.width : 1, toImg ? toImg.height : 1);
            gl.uniform2f(u.canvasSize, canvas.width, canvas.height);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };

        let currentSrc = null;
        let animId = null;
        let dispReady = false;

        // Initialize displacement texture from image-1
        buildDisplacementTexture('assets/images/image-1.png').then(() => {
            dispReady = true;
            if (fromImg) render(0);
        });

        const transitionTo = (newSrc, duration = 1200) => {
            if (newSrc === currentSrc) return;
            currentSrc = newSrc;
            loadImage(newSrc).then(img => {
                if (!fromImg) {
                    fromImg = img;
                    toImg = img;
                    upload(texFrom, img);
                    upload(texTo, img);
                    if (dispReady) render(0);
                    return;
                }
                toImg = img;
                upload(texTo, img);
                if (animId) cancelAnimationFrame(animId);
                const start = performance.now();
                const step = now => {
                    const t = Math.min((now - start) / duration, 1);
                    render(t);
                    if (t < 1) {
                        animId = requestAnimationFrame(step);
                    } else {
                        fromImg = toImg;
                        upload(texFrom, toImg);
                        render(0);
                        animId = null;
                    }
                };
                animId = requestAnimationFrame(step);
            }).catch(err => console.error('Image load failed:', err));
        };

        window.addEventListener('resize', () => {
            if (fromImg && dispReady) render(animId ? 0.5 : 0);
        });

        return { transitionTo };
    };

    const background = setupBackground();

    const playButton = document.getElementById('play-button');
    const audio = document.getElementById('audio');
    const progressBar = document.getElementById('seekbar-progress');
    const progressFill = document.getElementById('seekbar-progress-fill');
    const currentTimeEl = document.getElementById('seekbar-time-current');
    const totalTimeEl = document.getElementById('seekbar-time-total');

    // --- Click-to-center on language items ---
    document.querySelectorAll('#language-switcher > [data-lang]').forEach(item => {
        item.addEventListener('click', () => {
            item.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
    });

    // --- Audio playback ---
    if (playButton && audio) {
        playButton.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
            } else {
                audio.pause();
            }
        });

        audio.addEventListener('play', () => playButton.classList.add('playing'));
        audio.addEventListener('pause', () => playButton.classList.remove('playing'));
        audio.addEventListener('ended', () => playButton.classList.remove('playing'));
    }

    // --- Time display and progress fill ---
    const formatTime = seconds => {
        if (!isFinite(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const updateProgressFill = () => {
        if (!progressFill) return;
        if (isFinite(audio.duration) && audio.duration > 0) {
            const pct = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = `${pct}%`;
        } else {
            progressFill.style.width = '0%';
        }
    };

    if (audio) {
        audio.addEventListener('loadedmetadata', () => {
            if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration);
            updateProgressFill();
        });

        audio.addEventListener('timeupdate', () => {
            if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
            updateProgressFill();
        });

        audio.addEventListener('seeked', () => {
            if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
            updateProgressFill();
        });
    }

    // --- Seekbar interaction (click/drag) ---
    if (audio && progressBar) {
        const seekFromPointer = e => {
            const rect = progressBar.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            let pct = rect.width > 0 ? x / rect.width : 0;
            if (document.documentElement.dir === 'rtl') pct = 1 - pct;

            if (progressFill) progressFill.style.width = `${pct * 100}%`;

            if (isFinite(audio.duration)) {
                const newTime = pct * audio.duration;
                if (currentTimeEl) currentTimeEl.textContent = formatTime(newTime);
                audio.currentTime = newTime;
            }
        };

        let dragging = false;

        progressBar.addEventListener('pointerdown', e => {
            dragging = true;
            progressBar.setPointerCapture(e.pointerId);
            seekFromPointer(e);
        });

        progressBar.addEventListener('pointermove', e => {
            if (dragging) seekFromPointer(e);
        });

        const endDrag = e => {
            dragging = false;
            if (progressBar.hasPointerCapture(e.pointerId)) {
                progressBar.releasePointerCapture(e.pointerId);
            }
        };

        progressBar.addEventListener('pointerup', endDrag);
        progressBar.addEventListener('pointercancel', endDrag);
    }

    // --- Slide transition for titles ---
    const SLIDE_DURATION = 400;

    const slideTransition = (el, newHTML, direction = 'next') => {
        if (!el) return;
        const outX = direction === 'next' ? -100 : 100;
        const inX = direction === 'next' ? 100 : -100;

        el.style.transition = `transform ${SLIDE_DURATION}ms ease`;
        el.style.transform = `translateX(${outX}vw)`;

        setTimeout(() => {
            el.innerHTML = newHTML;
            el.style.transition = 'none';
            el.style.transform = `translateX(${inX}vw)`;

            void el.offsetHeight;

            el.style.transition = `transform ${SLIDE_DURATION}ms ease`;
            el.style.transform = 'translateX(0)';
        }, SLIDE_DURATION);
    };

    // --- Scale transition for the artwork number ---
    const SCALE_DURATION = 400;

    const scaleTransition = (wrapperEl, contentEl, newContent) => {
        if (!wrapperEl || !contentEl) return;

        wrapperEl.style.transition = `transform ${SCALE_DURATION}ms ease`;
        wrapperEl.style.transform = 'scale(0.5)';

        setTimeout(() => {
            contentEl.textContent = newContent;

            wrapperEl.style.transition = 'none';
            wrapperEl.style.transform = 'scale(0.5)';

            void wrapperEl.offsetHeight;

            wrapperEl.style.transition = `transform ${SCALE_DURATION}ms ease`;
            wrapperEl.style.transform = 'scale(1)';
        }, SCALE_DURATION);
    };

    // --- Translation + track navigation system ---
    let data = null;
    let activeLang = null;
    let activeTrackIndex = 0;
    let applying = false;

    const apply = (trackIndex, lang, direction = 'next') => {
        if (!data || !data.languages[lang] || !data.tracks[trackIndex]) return;
        const track = data.tracks[trackIndex];
        const t = track.translations[lang];
        if (!t) return;
        if (lang === activeLang && trackIndex === activeTrackIndex) return;

        activeLang = lang;
        activeTrackIndex = trackIndex;
        applying = true;

        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            if (t.audioSrc && audio.src !== t.audioSrc) {
                audio.src = t.audioSrc;
            }
        }

        if (background && track.image) {
            background.transitionTo(track.image);
        }

        if (artworkNumberWrapperEl && artworkNumberEl && track.number !== undefined) {
            scaleTransition(artworkNumberWrapperEl, artworkNumberEl, track.number);
        }

        if (playButton) playButton.classList.remove('playing');
        if (progressFill) progressFill.style.width = '0%';
        if (currentTimeEl) currentTimeEl.textContent = '0:00';

        slideTransition(artistsEl, t.artistName, direction);
        setTimeout(() => slideTransition(artworkEl, t.artworkName, direction), 120);

        const langMeta = data.languages[lang];
        document.documentElement.lang = langMeta.lang;
        document.documentElement.dir = langMeta.dir;

        if (roomSwitcher && Array.isArray(data.rooms)) {
            roomSwitcher.querySelectorAll('[data-room]').forEach(item => {
                const room = data.rooms.find(r => String(r.number) === item.dataset.room);
                const label = room && room.translations[lang] && room.translations[lang].name;
                if (label) item.textContent = label;
            });
        }

        const activeItem = switcher && switcher.querySelector(`[data-lang="${lang}"]`);
        if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'instant', inline: 'center', block: 'nearest' });
        }

        setTimeout(() => { applying = false; }, 150);
    };

    const detectCenteredLanguage = () => {
        if (!switcher || applying) return;
        const switcherRect = switcher.getBoundingClientRect();
        const centerX = switcherRect.left + switcherRect.width / 2;
        let closest = null;
        let closestDist = Infinity;
        switcher.querySelectorAll('[data-lang]').forEach(item => {
            const r = item.getBoundingClientRect();
            const dist = Math.abs(r.left + r.width / 2 - centerX);
            if (dist < closestDist) {
                closest = item;
                closestDist = dist;
            }
        });
        if (closest) apply(activeTrackIndex, closest.dataset.lang);
    };

    if (switcher) {
        let scrollTimer = null;
        switcher.addEventListener('scroll', () => {
            if (applying) return;
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(detectCenteredLanguage, 150);
        });
    }

    const prevButton = document.getElementById('previous-button');
    const nextButton = document.getElementById('next-button');

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (!data || data.tracks.length === 0) return;
            const newIndex = (activeTrackIndex - 1 + data.tracks.length) % data.tracks.length;
            apply(newIndex, activeLang, 'prev');
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (!data || data.tracks.length === 0) return;
            const newIndex = (activeTrackIndex + 1) % data.tracks.length;
            apply(newIndex, activeLang, 'next');
        });
    }

    const prefetchAllAudio = () => {
        if (!data || !data.tracks) return;
        const urls = new Set();
        data.tracks.forEach(track => {
            Object.values(track.translations).forEach(t => {
                if (t.audioSrc) urls.add(t.audioSrc);
            });
        });
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'audio';
            link.href = url;
            document.head.appendChild(link);
        });
    };

    const loadInlineData = () => {
        const node = document.getElementById('page-data');
        if (!node) return null;
        try {
            const parsed = JSON.parse(node.textContent);
            const roomIdx = 0;
            const room = parsed.rooms && parsed.rooms[roomIdx];
            if (!room) return null;
            return {
                languages: parsed.languages,
                rooms: parsed.rooms,
                tracks: room.tracks,
            };
        } catch (err) {
            console.error('Failed to parse inline page data:', err);
            return null;
        }
    };

    const inline = loadInlineData();
    if (inline) {
        data = inline;
        apply(0, document.documentElement.lang || 'en');
        prefetchAllAudio();
    }

    // --- Initial centering of default language (English) ---
    const defaultLang = document.getElementById('language-switcher-english');
    if (defaultLang) {
        const centerDefault = () => {
            defaultLang.scrollIntoView({ behavior: 'instant', inline: 'center', block: 'nearest' });
        };
        centerDefault();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(centerDefault);
        }
    }
});
