
$(document).ready(function () {
    const canvas = document.getElementById("neonCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const COLORS = ["#B794FF", "#9B6CFF", "#D9C5FF", "#65E6FF"];
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let hands = [];
    let logo = [];
    let phase = "approach";
    let phaseStart = performance.now();

    const PARTICLE_COUNT = 360;

    function resize() {
        const rect = canvas.getBoundingClientRect();

        width = rect.width;
        height = rect.height;
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        createHands();
        createLogo();
        createParticles();
    }

    // Build a smooth curve from control points.
    function curve(points, steps = 40) {
        const result = [];

        for (let i = 0; i < points.length - 1; i++) {
            const a = points[i];
            const b = points[i + 1];
            const c1 = a[2] || a;
            const c2 = b[2] || b;

            for (let j = 0; j < steps; j++) {
                const t = j / steps;
                const mt = 1 - t;

                result.push({
                    x: mt * mt * mt * a[0] +
                        3 * mt * mt * t * c1[0] +
                        3 * mt * t * t * c2[0] +
                        t * t * t * b[0],
                    y: mt * mt * mt * a[1] +
                        3 * mt * mt * t * c1[1] +
                        3 * mt * t * t * c2[1] +
                        t * t * t * b[1]
                });
            }
        }

        return result;
    }

    function mirror(paths) {
        return paths.map(path =>
            path.map(point => [1 - point[0], point[1]])
        );
    }

    function createHands() {
        // Left arm, palm, extended index finger and other fingers.
        const leftPaths = [
            [
                [0.015, 0.65], [0.20, 0.53],
                [0.31, 0.49], [0.37, 0.43],
                [0.39, 0.405], [0.49, 0.405],
                [0.50, 0.425]
            ],
            [
                [0.50, 0.425], [0.49, 0.445],
                [0.40, 0.445], [0.38, 0.47],
                [0.35, 0.52], [0.30, 0.55],
                [0.21, 0.60], [0.06, 0.72]
            ],
            [
                [0.36, 0.48], [0.35, 0.38],
                [0.36, 0.32], [0.38, 0.315],
                [0.40, 0.33], [0.405, 0.43]
            ],
            [
                [0.39, 0.44], [0.405, 0.35],
                [0.42, 0.335], [0.44, 0.35],
                [0.435, 0.43]
            ],
            [
                [0.42, 0.445], [0.445, 0.39],
                [0.46, 0.385], [0.475, 0.40],
                [0.46, 0.445]
            ],
            [
                [0.33, 0.50], [0.36, 0.53],
                [0.385, 0.55], [0.405, 0.535]
            ]
        ];

        const rightPaths = mirror(leftPaths);

        const sceneSize = Math.min(width * 0.84, height * 0.72, 520);
        const originX = width * 0.27 - sceneSize / 2;
        const originY = height / 2 - sceneSize / 2;

        function convert(paths, side) {
            const result = [];

            paths.forEach(path => {
                const normalized = path.map(point => [
                    originX + point[0] * sceneSize,
                    originY + point[1] * sceneSize
                ]);

                curve(normalized, 22).forEach(point => {
                    result.push({ ...point, side });
                });
            });

            return result;
        }

        hands = [
            ...convert(leftPaths, "left"),
            ...convert(rightPaths, "right")
        ];
    }

    function createLogo() {
        const offscreen = document.createElement("canvas");
        const g = offscreen.getContext("2d");

        offscreen.width = 500;
        offscreen.height = 160;

        g.fillStyle = "#fff";
        g.font = "bold 110px Arial";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("iLink", 250, 82);

        const data = g.getImageData(0, 0, 500, 160).data;
        const scale = Math.min(width * 0.65, 320) / 500;

        logo = [];

        for (let y = 0; y < 160; y += 3) {
            for (let x = 0; x < 500; x += 3) {
                if (data[(y * 500 + x) * 4 + 3] > 120) {
                    logo.push({
                        x: width * 0.27 + (x - 250) * scale,
                        y: height / 2 + (y - 80) * scale
                    });
                }
            }
        }
    }

    function createParticles() {
        particles = [];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const targetIndex = Math.floor(
                i * hands.length / PARTICLE_COUNT
            );
            const target = hands[targetIndex];

            particles.push({
                x: target.x + (Math.random() - 0.5) * 100,
                y: target.y + (Math.random() - 0.5) * 100,
                vx: 0,
                vy: 0,
                size: 1 + Math.random() * 1.2,
                color: COLORS[i % COLORS.length],
                targetIndex,
                exploding: false
            });
        }
    }

    function drawParticle(p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = p.color + "30";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 9;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function drawTargets(targets, elapsed, isApproaching) {
        particles.forEach((p, i) => {
            const target = targets[
                Math.floor(i * targets.length / particles.length)
            ];

            let tx = target.x;
            let ty = target.y;

            if (isApproaching && target.side) {
                const distance = 65 * (1 - Math.min(elapsed / 1600, 1));
                tx += target.side === "left" ? -distance : distance;
            }

            p.x += (tx - p.x) * 0.12;
            p.y += (ty - p.y) * 0.12;

            drawParticle(p);
        });
    }

    function touchFlash() {
        const x = width * 0.27;
        const y = height / 2;

        const pulse = 1 + Math.sin(performance.now() / 75) * 0.3;
        const glow = ctx.createRadialGradient(
            x, y, 0, x, y, 70 * pulse
        );

        glow.addColorStop(0, "rgba(220, 200, 255, 0.85)");
        glow.addColorStop(0.3, "rgba(139, 92, 246, 0.3)");
        glow.addColorStop(1, "rgba(139, 92, 246, 0)");

        ctx.fillStyle = glow;
        ctx.fillRect(x - 90, y - 90, 180, 180);
    }

    function explode() {
        particles.forEach(p => {
            if (!p.exploding) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 5;

                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
                p.exploding = true;
            }

            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.985;
            p.vy *= 0.985;

            drawParticle(p);
        });
    }

    function animate(now) {
        ctx.clearRect(0, 0, width, height);

        const elapsed = now - phaseStart;

        if (phase === "approach") {
            drawTargets(hands, elapsed, true);

            if (elapsed > 2200) {
                phase = "touch";
                phaseStart = now;
            }
        } else if (phase === "touch") {
            drawTargets(hands, 2000, true);
            touchFlash();

            if (elapsed > 900) {
                phase = "logo";
                phaseStart = now;
            }
        } else if (phase === "logo") {
            drawTargets(logo, elapsed, false);

            if (elapsed > 2800) {
                phase = "explode";
                phaseStart = now;
                particles.forEach(p => p.exploding = false);
            }
        } else {
            explode();

            if (elapsed > 1400) {
                createParticles();
                phase = "approach";
                phaseStart = now;
            }
        }

        if (!reducedMotion) {
            requestAnimationFrame(animate);
        }
    }

    resize();
    window.addEventListener("resize", resize);

    if (reducedMotion) {
        drawTargets(logo, 3000, false);
    } else {
        requestAnimationFrame(animate);
    }
});
