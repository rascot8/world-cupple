import React, { useRef, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';

const worldCupFlags = {
  Algeria: ['#006233', '#FFFFFF', '#D21034'],
  Argentina: ['#75AADB', '#FFFFFF', '#FCBF49'],
  Australia: ['#012169', '#FFFFFF', '#E4002B'],
  Austria: ['#EF3340', '#FFFFFF'],
  Belgium: ['#000000', '#FDDA24', '#EF3340'],
  BosniaAndHerzegovina: ['#002395', '#FECB00', '#FFFFFF'],
  Brazil: ['#009739', '#FEDD00', '#012169'],
  CaboVerde: ['#003893', '#FFFFFF', '#CF2027', '#F7D116'],
  Canada: ['#FF0000', '#FFFFFF'],
  Colombia: ['#FCD116', '#003893', '#CE1126'],
  CongoDR: ['#007FFF', '#CE1021', '#F7D618'],
  Croatia: ['#FF0000', '#FFFFFF', '#171796'],
  Curacao: ['#002B7F', '#F9E814', '#FFFFFF'],
  Czechia: ['#11457E', '#FFFFFF', '#D7141A'],
  Ecuador: ['#FFDD00', '#034EA2', '#ED1C24'],
  Egypt: ['#CE1126', '#FFFFFF', '#000000', '#C09300'],
  England: ['#FFFFFF', '#CE1124'],
  France: ['#002395', '#FFFFFF', '#ED2939'],
  Germany: ['#000000', '#DD0000', '#FFCE00'],
  Ghana: ['#CE1126', '#FCD116', '#006B3F', '#000000'],
  Haiti: ['#00209F', '#D21034'],
  Iran: ['#239F40', '#FFFFFF', '#DA0000'],
  Iraq: ['#CE1126', '#FFFFFF', '#000000', '#007A3D'],
  IvoryCoast: ['#FF8200', '#FFFFFF', '#009A44'],
  Japan: ['#FFFFFF', '#BC002D'],
  Jordan: ['#000000', '#FFFFFF', '#007A3D', '#CE1126'],
  Mexico: ['#006847', '#FFFFFF', '#CE1126'],
  Morocco: ['#C1272D', '#006233'],
  Netherlands: ['#AE1C28', '#FFFFFF', '#21468B'],
  NewZealand: ['#00247D', '#FFFFFF', '#CC142B'],
  Norway: ['#BA0C2F', '#FFFFFF', '#00205B'],
  Panama: ['#FFFFFF', '#CE1126', '#002B7F'],
  Paraguay: ['#D52B1E', '#FFFFFF', '#0038A8'],
  Portugal: ['#006600', '#FF0000', '#FFDF00'],
  Qatar: ['#8A1538', '#FFFFFF'],
  SaudiArabia: ['#006C35', '#FFFFFF'],
  Scotland: ['#005EB8', '#FFFFFF'],
  Senegal: ['#00853F', '#FDEF42', '#E31B23'],
  SouthAfrica: ['#007749', '#000000', '#FFFFFF', '#FFB81C', '#E03C31', '#001489'],
  SouthKorea: ['#FFFFFF', '#000000', '#CD2E3A', '#0F64CD'],
  Spain: ['#AA151B', '#F1BF00'],
  Sweden: ['#006AA7', '#FECC00'],
  Switzerland: ['#FF0000', '#FFFFFF'],
  Tunisia: ['#E70013', '#FFFFFF'],
  Turkiye: ['#E30A17', '#FFFFFF'],
  UnitedStates: ['#B31942', '#FFFFFF', '#0A3161'],
  Uruguay: ['#FFFFFF', '#0038A8', '#FCD116'],
  Uzbekistan: ['#0099B5', '#FFFFFF', '#1EB53A', '#CE1126']
};

const countryNames = Object.keys(worldCupFlags);

const DancingBackground = () => {
  const canvasRef = useRef(null);
  const audioContext = useAudio();
  const getAudioData = audioContext?.getAudioData || (() => null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); 
    
    const CLUSTER_COUNT = 10; // Reduced to 10 for max performance on any device
    const clusters = [];
    
    const initCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    const createCluster = (x, y) => {
      const country = countryNames[Math.floor(Math.random() * countryNames.length)];
      const colors = worldCupFlags[country];
      const particles = colors.map(color => ({
        offsetX: (Math.random() - 0.5) * 40,
        offsetY: (Math.random() - 0.5) * 40,
        swayOffset: Math.random() * Math.PI * 2, // For horizontal sine sway
        radius: Math.random() * 3 + 1.5,
        color: color,
        opacity: Math.random() * 0.4 + 0.3
      }));

      return {
        x: x !== undefined ? x : Math.random() * window.innerWidth,
        y: y !== undefined ? y : Math.random() * window.innerHeight,
        baseVy: (Math.random() * -0.5) - 0.3, // Drift upwards
        particles,
        country
      };
    };

    const initParticles = () => {
      clusters.length = 0;
      for (let i = 0; i < CLUSTER_COUNT; i++) {
        clusters.push(createCluster());
      }
    };

    let sparkParticles = [];
    const createSparks = (streakCount) => {
      const sparks = [];
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      
      // Scale up the explosion based on the streak (Streak 7 = Level 1, Streak 10 = Level 4)
      const intensityLevel = Math.min(Math.max(streakCount - 6, 1), 4);
      const sparkAmount = 15 * intensityLevel;
      const velocityMultiplier = 1 + (intensityLevel * 0.25);
      const fadeRate = 0.04 - (intensityLevel * 0.005); // Fade slower as streak gets higher

      for (let i = 0; i < sparkAmount; i++) {
        sparks.push({
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 12 * velocityMultiplier,
          vy: (Math.random() - 0.5) * 12 * velocityMultiplier,
          life: 1.0,
          fadeRate: fadeRate,
          color: Math.random() > 0.5 ? '#FFA500' : '#FF4500'
        });
      }
      sparkParticles.push(...sparks);
    };

    const handleStreakFire = (e) => {
      const currentStreak = e.detail?.streak || 7;
      createSparks(currentStreak);
    };
    window.addEventListener('streak-fire', handleStreakFire);

    // Celebration confetti: paper rains from the top with gravity + sway.
    // Fired for legendary pulls, purchases, milestones, page completions.
    let confettiParticles = [];
    const FESTIVE = ['#39FF14', '#1DB954', '#FF4D6D', '#4DA6FF', '#FFD700', '#FF8C42', '#E040FB', '#FFFFFF'];
    const GOLDS = ['#FFD700', '#FFC107', '#FFE082', '#F9A825', '#FFF8E1'];
    const handleConfetti = (e) => {
      const count = Math.min(e.detail?.count || 80, 200);
      const palette = e.detail?.gold ? GOLDS : FESTIVE;
      for (let i = 0; i < count; i++) {
        confettiParticles.push({
          x: Math.random() * window.innerWidth,
          y: -20 - Math.random() * window.innerHeight * 0.3,
          vx: (Math.random() - 0.5) * 2.5,
          vy: 2 + Math.random() * 3.5,
          size: 3 + Math.random() * 5,
          swayOffset: Math.random() * Math.PI * 2,
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 0.25,
          color: palette[Math.floor(Math.random() * palette.length)],
          life: 1
        });
      }
    };
    window.addEventListener('confetti-burst', handleConfetti);

    initCanvas();
    initParticles();

    // Debounced Resize Handler
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        initCanvas();
        clusters.forEach(c => {
          if (c.x > window.innerWidth) c.x = Math.random() * window.innerWidth;
          if (c.y > window.innerHeight) c.y = Math.random() * window.innerHeight;
        });
      }, 150);
    };
    window.addEventListener('resize', handleResize);

    const renderLoop = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const dataArray = getAudioData();
      
      let bassAvg = 0;
      let midAvg = 0;
      let highAvg = 0;
      
      if (dataArray) {
        let bassSum = 0;
        for (let i = 0; i < 10; i++) bassSum += dataArray[i];
        bassAvg = bassSum / 10;
        
        let midSum = 0;
        for (let i = 10; i < 40; i++) midSum += dataArray[i];
        midAvg = midSum / 30;
        
        let highSum = 0;
        for (let i = 40; i < 60; i++) highSum += dataArray[i];
        highAvg = highSum / 20;
      }

      // 1. Fill base ambient background
      ctx.fillStyle = '#0a0a0a'; 
      ctx.fillRect(0, 0, width, height);

      // 2. Central Glow (Static ambient glow)
      const radius = Math.max(width, height) * 0.4;
      const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, radius);
      
      const centerOpacity = 0.08; 
      gradient.addColorStop(0, `rgba(29, 185, 84, ${centerOpacity})`); 
      gradient.addColorStop(1, 'rgba(10, 10, 10, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 3. Render Clusters 
      const totalIntensity = ((bassAvg + midAvg + highAvg) / 3) / 255; 
      const bassIntensity = bassAvg / 255; 
      
      // Calculate global shake for this frame
      const shakePower = bassIntensity > 0.8 ? (bassIntensity - 0.8) * 50 : 0; 
      const globalShakeX = (Math.random() - 0.5) * shakePower;
      const globalShakeY = (Math.random() - 0.5) * shakePower;
      const extraSpeed = totalIntensity * -8;

      // Pre-calculate collision arrays to keep it fast
      const flatParticles = [];
      clusters.forEach(c => {
        c.particles.forEach(p => {
          flatParticles.push({ p, c });
        });
      });

      // Overlap Prevention Physics (O(N^2) localized check)
      for (let i = 0; i < flatParticles.length; i++) {
        for (let j = i + 1; j < flatParticles.length; j++) {
          const { p: p1, c: c1 } = flatParticles[i];
          const { p: p2, c: c2 } = flatParticles[j];

          const x1 = c1.x + p1.offsetX;
          const y1 = c1.y + p1.offsetY;
          const x2 = c2.x + p2.offsetX;
          const y2 = c2.y + p2.offsetY;

          const dx = x2 - x1;
          const dy = y2 - y1;
          const distSq = dx * dx + dy * dy;
          const minD = (p1.radius + p2.radius) * 0.7; // Prevent >30% overlap

          if (distSq < minD * minD && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const overlap = minD - dist;
            const pushX = (dx / dist) * overlap * 0.15; // Gentle repulsive force
            const pushY = (dy / dist) * overlap * 0.15;
            
            p1.offsetX -= pushX;
            p1.offsetY -= pushY;
            p2.offsetX += pushX;
            p2.offsetY += pushY;
          }
        }
      }

      clusters.forEach((cluster, index) => {
        // Move cluster upwards
        cluster.y += cluster.baseVy + extraSpeed;
        
        // Wrap around to bottom when moving off top
        if (cluster.y < -50) {
          clusters[index] = createCluster(Math.random() * width, height + 50);
        }

        // Render each particle in the cluster
        cluster.particles.forEach(p => {
          // Horizontal Sway (organic underwater feel - absolute so they stay grouped)
          const currentSway = Math.sin(Date.now() * 0.001 + p.swayOffset) * 8;

          const particleOpacity = Math.min(1, p.opacity + totalIntensity * 1.5);
          const particleRadius = p.radius + totalIntensity * 5;

          const finalX = cluster.x + p.offsetX + globalShakeX + currentSway;
          const finalY = cluster.y + p.offsetY + globalShakeY;

          // FAST PULSING GLOW: Reacts to music intensity but uses flat geometry (10x faster than shadowBlur)
          ctx.beginPath();
          ctx.arc(finalX, finalY, particleRadius * (2.5 + totalIntensity * 2.5), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(1, particleOpacity * (0.15 + totalIntensity * 0.3)); 
          ctx.fill();
          ctx.closePath();

          // CORE PARTICLE
          ctx.beginPath();
          ctx.arc(finalX, finalY, particleRadius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = particleOpacity;
          ctx.fill();
          ctx.closePath();
        });
      });

      // Render sparks (optimized)
      if (sparkParticles.length > 0) {
        ctx.globalCompositeOperation = 'lighter';
        sparkParticles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.fadeRate;

          if (p.life <= 0) return;

          // Fast glow for sparks
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.life * 8, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life * 0.3;
          ctx.fill();
          ctx.closePath();

          // Core spark
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.life * 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = p.life;
          ctx.fill();
          ctx.closePath();
        });
        ctx.globalCompositeOperation = 'source-over';
        sparkParticles = sparkParticles.filter(p => p.life > 0);
      }

      // Render confetti (rotating paper rectangles with gravity)
      if (confettiParticles.length > 0) {
        confettiParticles.forEach((p) => {
          p.x += p.vx + Math.sin(Date.now() * 0.002 + p.swayOffset) * 1.2;
          p.y += p.vy;
          p.vy += 0.04; // gravity
          p.rot += p.vrot;
          if (p.y > height * 0.75) p.life -= 0.03;
          if (p.life <= 0) return;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        });
        confettiParticles = confettiParticles.filter((p) => p.life > 0 && p.y < height + 30);
      }

      // Reset global states
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      frameRef.current = requestAnimationFrame(renderLoop);
    };

    frameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('streak-fire', handleStreakFire);
      window.removeEventListener('confetti-burst', handleConfetti);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [getAudioData]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
};

export default DancingBackground;
