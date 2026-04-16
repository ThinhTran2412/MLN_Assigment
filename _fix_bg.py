import re

with open(r'E:\mln_game\game.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Tìm chính xác drawBackground start và drawFarmingZones start
bg_m    = re.search(r'  drawBackground\(ctx\) \{', content)
farm_m  = re.search(r'  drawFarmingZones\(ctx\) \{', content)

if not bg_m:   print('drawBackground NOT FOUND'); exit(1)
if not farm_m: print('drawFarmingZones NOT FOUND'); exit(1)

print(f'bg={bg_m.start()}, farm={farm_m.start()}')

NEW_BG_AND_TERRAIN = '''  drawBackground(ctx) {
    const W = this.canvas.width;
    const H = this.canvas.height;

    // === Phase 0: desert.png (contain, centred) ===
    if (STATE.phase === 0) {
      const desertImg = IMAGES['desert'];
      if (desertImg) {
        const iw = desertImg.width  || desertImg.naturalWidth  || W;
        const ih = desertImg.height || desertImg.naturalHeight || H;
        const scale = Math.min(W / iw, H / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        ctx.fillStyle = '#b89050';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(desertImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(0, 0, W, H);
      } else {
        ctx.fillStyle = '#c4902e';
        ctx.fillRect(0, 0, W, H);
      }
      return;
    }

    // === Các phase khác: gradient ===
    const skyGrad    = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    const groundGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);

    if (STATE.phase === 1) {
      skyGrad.addColorStop(0, '#1a3f6b'); skyGrad.addColorStop(1, '#2e7d53');
      groundGrad.addColorStop(0, '#2d6a3f'); groundGrad.addColorStop(1, '#1a3a24');
    } else if (STATE.phase === 2) {
      skyGrad.addColorStop(0, '#2c2a1a'); skyGrad.addColorStop(1, '#5a4a2a');
      groundGrad.addColorStop(0, '#6b5a32'); groundGrad.addColorStop(1, '#3a2e1a');
    } else if (STATE.phase === 3) {
      skyGrad.addColorStop(0, '#1a0a0a'); skyGrad.addColorStop(1, '#4a1a1a');
      groundGrad.addColorStop(0, '#3a1a1a'); groundGrad.addColorStop(1, '#1a0808');
    } else {
      skyGrad.addColorStop(0, '#050714'); skyGrad.addColorStop(1, '#1a1c3a');
      groundGrad.addColorStop(0, '#1a1c2c'); groundGrad.addColorStop(1, '#0a0b14');
    }

    ctx.fillStyle = skyGrad;    ctx.fillRect(0, 0, W, H * 0.6);
    ctx.fillStyle = groundGrad; ctx.fillRect(0, H * 0.55, W, H * 0.45);

    const horizonGrad = ctx.createLinearGradient(0, H * 0.5, 0, H * 0.65);
    horizonGrad.addColorStop(0, 'rgba(255,255,255,0.04)');
    horizonGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = horizonGrad;
    ctx.fillRect(0, H * 0.5, W, H * 0.15);

    if (STATE.conflict > 45) {
      const alpha = (STATE.conflict - 45) / 100;
      const warGrad = ctx.createRadialGradient(W/2, H, 0, W/2, H, W * 0.8);
      warGrad.addColorStop(0, `rgba(200, 30, 0, ${alpha * 0.35})`);
      warGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = warGrad;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.018)';
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 55) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke(); }
    for (let i = 0; i < H; i += 55) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(W,i); ctx.stroke(); }
  }

  // ===================================================================
  // PHASE 0: Ve dia hinh Thoi dai Da
  // ===================================================================
  drawPhase0Terrain(ctx) {
    const W = this.canvas.width;
    const H = this.canvas.height;

    const cX  = W * 0.83, cY  = H * 0.44;
    const mRx = W * 0.155, mRy = H * 0.220;
    const eX  = cX - mRx * 0.08, eY = cY;
    const aRx = mRx * 0.40, aRy = mRy * 0.54;

    STATE.cavePos = { x: eX, y: eY };

    // Bong go
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.beginPath();
    ctx.ellipse(cX+9, cY+mRy*0.50, mRx+6, mRy*0.36, 0, 0, Math.PI*2);
    ctx.fill();

    // Mat go dat
    const mg = ctx.createRadialGradient(cX-mRx*0.28, cY-mRy*0.35, 0, cX, cY, mRx*1.12);
    mg.addColorStop(0.00,'#dcc07a'); mg.addColorStop(0.28,'#c8a255');
    mg.addColorStop(0.60,'#a07c38'); mg.addColorStop(1.00,'#7a5520');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.ellipse(cX, cY, mRx, mRy, 0, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = 'rgba(55,32,8,0.30)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(cX, cY, mRx-2, mRy-2, 0, 0, Math.PI*2); ctx.stroke();

    // Van nut mosaic
    ctx.strokeStyle = 'rgba(85,52,14,0.40)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    [
      [[-0.30,-0.06],[-0.08,0.28],[0.12,0.44]],
      [[0.08,-0.40],[0.24,0.05],[0.40,0.35]],
      [[-0.54,0.10],[-0.28,0.06]],
      [[0.38,-0.24],[0.64,-0.06],[0.60,0.20]],
      [[-0.16,-0.54],[0.04,-0.18],[0.20,-0.10]],
      [[0.14,0.08],[-0.06,0.38]],
      [[-0.56,-0.18],[-0.30,-0.34]],
      [[-0.04,-0.20],[-0.24,0.10],[-0.38,0.40]],
      [[0.36,0.08],[0.20,0.32],[0.32,0.52]],
      [[-0.45,-0.44],[-0.28,-0.20],[-0.14,0.04]],
      [[0.55,-0.28],[0.42,0.0]],
      [[-0.10,0.58],[0.08,0.40],[0.14,0.22]],
    ].forEach(pts => {
      ctx.beginPath();
      ctx.moveTo(cX+pts[0][0]*mRx, cY+pts[0][1]*mRy);
      for (let k=1;k<pts.length;k++) ctx.lineTo(cX+pts[k][0]*mRx, cY+pts[k][1]*mRy);
      ctx.stroke();
    });

    // Vong da xay (brick ring)
    [
      [0,13,9,38],[1,11,8,42],[2,14,9,40],[3,12,8,37],[4,13,9,43],
      [5,11,8,39],[6,14,9,41],[7,12,8,38],[8,13,9,40],[9,11,8,42],
      [10,14,9,37],[11,12,8,41],[12,13,9,39],[13,11,8,43],
    ].forEach(([idx,bw,bh,l]) => {
      const a=(idx/14)*Math.PI*2;
      const bx=eX+Math.cos(a)*(aRx+11), by=eY+Math.sin(a)*(aRy+11);
      ctx.save(); ctx.translate(bx,by); ctx.rotate(a);
      ctx.fillStyle=`hsl(28,40%,${l}%)`; ctx.fillRect(-bw/2,-bh/2,bw,bh);
      ctx.strokeStyle='rgba(35,20,5,0.55)'; ctx.lineWidth=1; ctx.strokeRect(-bw/2,-bh/2,bw,bh);
      ctx.strokeStyle='rgba(230,190,110,0.28)'; ctx.lineWidth=0.9;
      ctx.beginPath(); ctx.moveTo(-bw/2+1,-bh/2+1); ctx.lineTo(bw/2-1,-bh/2+1); ctx.stroke();
      ctx.restore();
    });

    // Lo hang toi
    const hg = ctx.createRadialGradient(eX, eY+aRy*0.10, 0, eX, eY, aRx*0.90);
    hg.addColorStop(0.00,'rgba(1,0,3,1.00)'); hg.addColorStop(0.52,'rgba(5,3,12,0.99)');
    hg.addColorStop(0.85,'rgba(18,10,4,0.75)'); hg.addColorStop(1.00,'rgba(25,14,5,0.00)');
    ctx.fillStyle=hg; ctx.beginPath(); ctx.ellipse(eX,eY,aRx*0.88,aRy*0.84,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(150,95,35,0.32)'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.ellipse(eX,eY,aRx*0.88,aRy*0.84,0,0,Math.PI*2); ctx.stroke();

    // Co kho quanh go
    [
      {gx:cX+mRx*0.55,gy:cY+mRy*0.67,n:4},{gx:cX-mRx*0.74,gy:cY+mRy*0.70,n:3},
      {gx:cX+mRx*0.84,gy:cY+mRy*0.38,n:4},{gx:cX-mRx*0.18,gy:cY+mRy*0.88,n:3},
      {gx:cX+mRx*0.28,gy:cY-mRy*0.82,n:3},
    ].forEach(gd => {
      ctx.strokeStyle='#9a8040'; ctx.lineWidth=1.3;
      for(let g=0;g<gd.n;g++){
        const bx=gd.gx+(g-gd.n/2)*6, lean=g%2===0?-4:4;
        ctx.beginPath(); ctx.moveTo(bx,gd.gy+3);
        ctx.quadraticCurveTo(bx+lean,gd.gy-5,bx+lean*1.6,gd.gy-14); ctx.stroke();
      }
    });

    // Canh cay kho
    const twX=cX+mRx*0.70, twY=cY-mRy*0.50;
    ctx.strokeStyle='#6b4e22'; ctx.lineWidth=2.2; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(twX,twY+14); ctx.lineTo(twX+2,twY-8); ctx.stroke();
    ctx.lineWidth=1.3;
    ctx.beginPath(); ctx.moveTo(twX+1,twY+4); ctx.lineTo(twX-7,twY-5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(twX+1,twY);   ctx.lineTo(twX+9,twY-8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(twX+2,twY-4); ctx.lineTo(twX-3,twY-12); ctx.stroke();

    // Ho lua trung tam
    const fX=W*0.46, fY=H*0.68;
    for(let i=0;i<10;i++){
      const a=(i/10)*Math.PI*2;
      ctx.fillStyle='#8B7255'; ctx.beginPath();
      ctx.ellipse(fX+Math.cos(a)*27, fY+Math.sin(a)*13, 7, 5, a, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle='rgba(70,46,18,0.7)'; ctx.beginPath(); ctx.ellipse(fX,fY,18,9,0,0,Math.PI*2); ctx.fill();
    const fGrad=ctx.createRadialGradient(fX,fY-5,0,fX,fY,42);
    fGrad.addColorStop(0,'rgba(255,200,70,0.85)'); fGrad.addColorStop(0.4,'rgba(255,95,15,0.45)'); fGrad.addColorStop(1,'rgba(255,40,0,0)');
    ctx.fillStyle=fGrad; ctx.beginPath(); ctx.arc(fX,fY,42,0,Math.PI*2); ctx.fill();
    ctx.font='22px Arial'; ctx.textAlign='center';
    ctx.fillText('\U0001F525', fX, fY+6);

    // Cay an qua (apple_tree.png) - 5x nho hon cu
    const treeImg = IMAGES['apple_tree'];
    if (treeImg) {
      const TREE_SPOTS = [
        {fx:0.30,fy:0.22,s:0.15,fruit:true},
        {fx:0.50,fy:0.16,s:0.16,fruit:true},
        {fx:0.38,fy:0.50,s:0.14,fruit:true},
        {fx:0.20,fy:0.28,s:0.12,fruit:false},
        {fx:0.60,fy:0.12,s:0.13,fruit:false},
        {fx:0.14,fy:0.56,s:0.11,fruit:false},
        {fx:0.44,fy:0.35,s:0.12,fruit:false},
        {fx:0.26,fy:0.42,s:0.10,fruit:false},
      ];
      const iw=treeImg.width||treeImg.naturalWidth||528;
      const ih=treeImg.height||treeImg.naturalHeight||464;
      TREE_SPOTS.forEach(t => {
        const tw=iw*t.s*(W/800), th=ih*t.s*(W/800);
        const tx=t.fx*W-tw/2, ty=t.fy*H-th;
        if (t.fruit) {
          ctx.save();
          const glow=ctx.createRadialGradient(t.fx*W,t.fy*H,0,t.fx*W,t.fy*H,tw*0.45);
          glow.addColorStop(0,'rgba(255,200,80,0.18)'); glow.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=glow; ctx.beginPath();
          ctx.ellipse(t.fx*W,t.fy*H,tw*0.45,th*0.22,0,0,Math.PI*2); ctx.fill();
          ctx.restore();
        }
        ctx.drawImage(treeImg,tx,ty,tw,th);
      });
      if (!STATE.fruitTrees||STATE.fruitTrees.length===0) {
        STATE.fruitTrees=TREE_SPOTS.filter(t=>t.fruit).map(t=>({x:t.fx*W,y:t.fy*H+20}));
      }
    }
  }

'''

# Cut out old corrupted section, insert clean version
before = content[:bg_m.start()]
after  = content[farm_m.start():]
new_content = before + NEW_BG_AND_TERRAIN + after

with open(r'E:\mln_game\game.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('DONE - written', len(new_content), 'chars')
