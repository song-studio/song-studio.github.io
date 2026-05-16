'use strict';

const hardAlpha = 1;
const generativeTileSize = 768;
const generativeCanvasSize = generativeTileSize*8;
const fixFirefoxFontBug = 1; // fix firefox not drawing fonts below a min size
const spriteSize = (generativeTileSize - 2*bleedPixels) / generativeCanvasSize;

function initGenerative()
{
    // create the textures
    generateTetures();

    if (debug)
    {
        debugGenerativeCanvasCached = document.createElement('canvas');
        debugGenerativeCanvasCached.height = 
        debugGenerativeCanvasCached.width = generativeCanvasSize;
        const context = debugGenerativeCanvasCached.getContext('2d');
        context.drawImage(mainCanvas, 0, 0);
    }
    
    // create webgl texture
    glContext.bindTexture(gl_TEXTURE_2D, glCreateTexture(mainCanvas));
}

function generateTetures()
{
    const context = mainContext;
    mainCanvas.height = mainCanvas.width = generativeCanvasSize;
    random.setSeed(13);

    class Particle
    {
        constructor(x, y, vx, vy, accel, sizeStart=.1, sizeEnd=0, c=BLACK, mutateColor=.1)
        {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.accel = accel;
            this.sizeStart = sizeStart;
            this.sizeEnd = sizeEnd;
            this.color = c;
            this.style = this.colorRandom = 0;
            this.iterations = 50;
            this.mutateColor = mutateColor;
        }

        draw()
        {
            const pos = vec3();
            for(let i=0; i<this.iterations; ++i)
            {
                if (this.color)
                    color(random.mutateColor(this.color, this.colorRandom, this.mutateColor))
                const p = i/this.iterations;
                pos.x = this.x + this.vx * p;
                pos.y = this.y + this.vy * p + this.accel * p * p;
                const s = this.style ?
                    Math.sin(p*PI)*(this.sizeStart-this.sizeEnd) + this.sizeEnd :
                    lerp(p, this.sizeStart, this.sizeEnd);
                rect(pos.x, pos.y, s, s);
            }
            return pos;
        }
    };

    class Tree
    {
        constructor()
        {
            this.pos = vec3(.5,1);
            this.startWidth = .09;
            this.startLength = .01;
            this.branchAngle = 1.2;
            this.branchAngleRandomness = .1;
            this.branchRate = 451;
            this.branchLoss = .9;
            this.leafChance = 3;
            this.leafMaxSize = .06;
            this.leafOffset = .03;
            this.nodeScale = .98;
            this.crookedness = .02;
            this.lightPower = .01;
            this.minBranchSize = 0.005;
            this.leafHue = .3;
            this.leafBrightness = .4;
            this.flowerColor = RED;
            this.branchScale = 1;
            this.leafSat = .5;
            this.branchDieChance =
            this.multiBranch = 
            this.flowerChance = 
            this.stump = 0;
        }

        draw()
        {
            let treeOverflow = 0;
            const leafList = [];
            const pos = this.pos;
            const startWidth = this.startWidth;
            const startLength = this.startLength;
            const branchAngle = this.branchAngle;
            const branchAngleRandomness = this.branchAngleRandomness;
            const branchRate = this.branchRate;
            const branchLoss = this.branchLoss;
            const branchDieChance = this.branchDieChance;
            const multiBranch = this.multiBranch;
            const leafChance = this.leafChance;
            const leafMaxSize = this.leafMaxSize;
            const leafOffset = this.leafOffset;
            const nodeScale = this.nodeScale;
            const crookedness = this.crookedness;
            const lightPower = this.lightPower;
            const minBranchSize = this.minBranchSize;
            const leafHue = this.leafHue;
            const leafBrightness = this.leafBrightness;
            const leafSat = this.leafSat;

            const treeLimb = (p,w,l,a=0,b=0,bs=random.bool()?1:-1)=>
            {
                //if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) return;
                if (treeOverflow++ >1e4)
                {
                    debug && console.log('Tree overflow!')
                    return;
                }
                
                if (w < minBranchSize)
                {
                    // leaf
                    if (!random.bool(leafChance))
                        return;
                    for(let i=max(1,leafChance|0);i--;)
                        leafList.push(p);
                    return;
                }

                // draw limb
                const d = vec3(0,-l).rotateZ(a);
                const p2 = p.add(d);
                color(hsl(.1,.6,random.float(.1,.2)));
                rectLine(p.x,p.y,p2.x,p2.y,w);
                
                // branch
                if (b>branchRate*w)
                {
                    const s1 = random.float(.5,1)*this.branchScale;
                    const s2 = random.float(.5,1)*this.branchScale;
                    treeLimb(p2,w*s1,l*s2,a+bs*(branchAngle+random.floatSign(branchAngleRandomness)));
                    bs *= -1
                    b = 0;
                    if (random.bool(multiBranch))
                        treeLimb(p2,w*s1,l*s2,a+bs*(branchAngle+random.floatSign(branchAngleRandomness)));
                    w *= branchLoss;
                }

                if (w < startWidth/2 && random.bool(branchDieChance)) // dead branches
                    return;
                if (this.stump && treeOverflow > 300)
                    return;
                
                // continue limb
                a *= 1-lightPower;
                treeLimb(p2, w*=nodeScale, l, a+=random.floatSign(crookedness), b+1,bs);
            }

            treeLimb(pos,startWidth,startLength);
            for(const i in shuffle(leafList))
            {
                let leafPos = leafList[i];
                const p = i/leafList.length;
                const leafSize = (1-p)*leafMaxSize;
                const sat = leafSat + random.floatSign(.2);
                const brightness = .1+random.float(p,1)*leafBrightness;
                color(random.mutateColor(hsl(leafHue,sat,brightness),.1));
                leafPos = leafPos.add(random.circle(leafOffset));
                rect(leafPos.x,leafPos.y,leafSize,leafSize,random.float(2*PI));
                if (random.bool(this.flowerChance))
                    drawFlower(leafPos, 5, random.float(.01,.02), this.flowerColor)
            }
        }
    }
    {
        // basic shapes
        color(WHITE);
        setupContext(0,0);
        circle(.5,.5,.45);
        setupContext(1,0);
        // radial gradient
        for(let i=40;i--;)
            color(hsl(0,0,1,i/300)),
            circle(.5,.5,.5-i/80);
        setupContext(2,0);
        // rectangle gradient for car shadow
        for(let i=40,a;i--;)
        {
            color(hsl(0,0,1,a=i/40)),
            rect(.5,.5,.5-a/3,.9-a/3);
        }
        setupContext(3,0);
        drawLicensePlate();
        setupContext(4,0);
        text(13,.5,.48,.5,.9,.02,undefined,undefined,900);
        setupContext(6,0);
        drawCheckpointSign(1);
        setupContext(7,0);
        drawCheckpointSign(-1);

        // plants
        setupContext(0,1);
        drawPalmTree();
        setupContext(1,1);
        {
            // green tree
            random.setSeed(13);
            const t = new Tree;
            t.draw();
        }
        setupContext(2,1);
        {
            // dead tree stump
            random.setSeed(192);
            const t = new Tree;
            t.startWidth = .1;
            t.branchRate = 300;
            t.leafChance = 0;
            t.branchAngle = 1.2;
            t.branchAngleRandomness = .2;
            t.branchDieChance = .03;
            t.lightPower = .05
            t.crookedness = .1;
            t.draw();
        }
        setupContext(3,1);
        {
            // dead tree
            random.setSeed(131);
            const t = new Tree;
            t.leafChance = 0;
            t.startWidth = .08;
            t.branchAngleRandomness = .5;
            t.branchAngle = 1.5;
            t.crookedness = .05;
            t.lightPower = .01;
            t.draw();
        }
        setupContext(4,1);
        {
            // pink tree
            random.setSeed(400);
            const t = new Tree;
            t.crookedness = .1;
            t.branchAngle = 1.5;
            t.branchAngleRandomness = .1;
            t.leafHue = 0;
            t.leafSat = .7;
            t.leafBrightness = .7;
            t.lightPower = .02;
            t.flowerChance = .05;
            t.flowerColor = WHITE;
            t.draw();
        }
        setupContext(5,1);
        {
            // low bush
            random.setSeed(1333);
            const t = new Tree;
            t.multiBranch = 1;
            t.branchRate = 800;
            t.startWidth = .04;
            t.minBranchSize = .005;
            t.branchAngle = 1.5;
            t.crookedness = .1;
            t.branchAngleRandomness = .2;
            t.leafChance = 4;
            t.leafOffset = .04;
            t.leafHue = .2;
            t.lightPower = .002;
            t.flowerChance = .01;
            t.draw();
        }
        setupContext(6,1);
        {
            // fall tree
            random.setSeed(293);
            const t = new Tree;
            t.startWidth = .07;
            t.crookedness = .05;
            t.leafHue = .08;
            t.leafBrightness= .6;
            t.leafSat = 1;
            t.draw();
        }
        /*setupContext(7,1);
        {
            // tree with flowers
            random.setSeed(192);
            const t = new Tree;
            t.startWidth = .07;
            t.branchRate = 700;
            t.leafChance = .5;
            t.multiBranch = 1;
            t.branchAngle = 1.2;
            t.branchAngleRandomness = .2;
            t.leafHue = .35;
            t.flowerChance = .1;
            t.draw();
        }*/

        // 中国交通路牌
        random.setSeed(13);
        setupContext(0,2);
        drawSpeedSign();      // 限速牌
        setupContext(1,2);
        drawRouteSign();      // 高速编号
        setupContext(2,2);
        drawDistanceSign();   // 出口距离
        setupContext(3,2);
        drawPicAd1();         // 图片广告牌1
        setupContext(4,2);
        for(let i=5; i--;)
            drawRedLantern(.3+i*.1, .5, .08);
        setupContext(5,2);
        drawPicAd2();         // 图片广告牌2
        setupContext(7,2);
        drawExitSign();       // 出口指示

        // grass,flowers, more trees
        setupContext(0,3);
        drawGrass();
        setupContext(1,3);
        drawGrass(.23,.5,.3,.3);
        setupContext(2,3);
        drawGrass(.35,.5,.3,.3,YELLOW);
        setupContext(3,3);
        random.setSeed(5);
        drawGrass(.3,.5,.3,.64,BLUE);
        setupContext(4,3);
        {
            // snowy tree
            random.setSeed(5);
            const t = new Tree;
            t.leafHue = .5;
            t.leafBrightness = 1.2;
            t.leafMaxSize = .04;
            t.branchRate = 300; 
            t.lightPower = 0.01;
            t.flowerChance = .01;
            t.flowerColor = BLUE;
            t.draw();
        }
        setupContext(5,3);
        {
            // yellow tree
            random.setSeed(9);
            const t = new Tree;
            t.leafHue = .13;
            t.leafBrightness = .5;
            t.leafSat = .9;
            t.multiBranch = 1;
            t.branchRate = 500;
            t.minBranchSize = .008;
            t.startWidth = .1;
            t.draw();
        }

        // track objects
        setupContext(0,4);
        {
            // telephone pole
            const c = hsl(.08,.4,.2)
            messyRect(.5,.5,.04,1,0,c);
            messyRect(.5,.06,.03,.2,PI/2,c);
            messyRect(.5,.12,.03,.2,PI/2,c);
        }
        setupContext(1,4);
        drawRock();// tall rock
        setupContext(2,4);
        {
            // big rocks
            drawRock(.55,.08,.53,.015,.6,.7, .5);
            drawRock(.4,.1,.45,.012,.3,.7);
            drawRock(.6,.2,.2,.005,.4,.6);
        }
        setupContext(3,4);
        for(let i=39; i--;) // small rocks
        {
            const y = .02;
            const z = random.float(.002,.015);
            drawRock(.5+random.floatSign(.45),random.float(.005,.02),random.float(.02,.05),.005,.4,.3,.3,y,z);
        }
        setupContext(4,4);
        for(let i=199; i--;) // sand
        {
            const x = .5+random.floatSign(.45)
            const y = .03;
            const z = random.float(.003,.006);
            const cHSL = vec3(.13,.3,.7);
            drawRock(x,random.float(.03),random.float(.05),.005,.4,.3,.3,y,z,500,cHSL,.4);
        }
        setupContext(5,4);
        for(let i=99; i--;) // water
        {
            const p = i/99;
            const w = .01;
            const x = lerp(p,.05,.95);
            const h = lerp(p,.02,.13);
            const cHSL = vec3(.53,1,1);
            drawRock(x,w,h,.01,.3,.6,.5,0,.01,500,cHSL,.4-p*.2);
        }
        setupContext(6,4);
        {
            // tunnel
            drawRock(.85,.05,.53,.002,.6,.7, .5,-.1,.02,1e3);
            drawRock(.15,.05,.53,.002,.6,.7, .5,-.1,.02,1e3);
            drawRock(.5,.42,.25,.002,.5,.7, .5,.2,.02,1e3,undefined,undefined,0);
        }
        setupContext(7,4);
        {
            // tunnel 2
            color(hsl(0,0,1));
            rect(1,1,.4,.5);
            rect(0,1,.4,.5);
            color(hsl(0,0,.7));
            rect(.5,.75,1,.15);
        }

        // road signs
        setupContext(0,5); // turn left
        {
            drawSignBackground(.5,.5,WHITE,BLACK,.05,GRAY,.3,.3,1);
            color(BLACK);
            triangle(.42,.5,.12,-PI/2)
            context.lineWidth=.09;
            context.beginPath();
            context.arc(.44,.7,.2,PI*3/2,PI*2);
            context.stroke();
        }
        /*setupContext(1,5); // curvy road
        {
            drawSignBackground(.5,.5,WHITE,BLACK,.04,GRAY,.3,.3,1);
            
            color(BLACK);
            triangle(.5,.46,.12)
            for(let i=99; i--;)
            {
                const p = i/99;
                rect(.5-.1*Math.cos(p*10)*Math.sin(p*3)**2,.5+p/4,.09,.01);
            }
        }*/
        /*const warningColor = hsl(.14,1,.5);
        setupContext(0,5,1); // turn left
        {
            drawRoadSignBackground();
            color(BLACK);
            triangle(.44,.23,.07,-PI/2)
            context.lineWidth=.05;
            context.lineCap='butt';
            context.beginPath();
            context.arc(.47,.35,.12,PI*3/2,PI*2);
            context.stroke();
        }
        setupContext(1,5);
        {
            // curvy road
            drawRoadSignBackground();
            color(BLACK);
            triangle(.5,.18,.07)
            for(let i=99; i--;)
            {
                const p = i/99;
                rect(.5+.05*Math.cos(p*10)*Math.sin(p*3)**2,.22+p*.2,.04,.01);
            }
        }
        setupContext(2,5);
        {
            // big turn left
            drawSignBackground(.4,.5,warningColor,BLACK,.04,GRAY,.3,.3,1);
            color(BLACK);
            triangle(.53,.55,.17,-PI/2)
        }*/
        /*setupContext(2,5);
        {
            // warning
            drawSignBackground(.8,.3,WHITE,BLACK,.04,GRAY,.3,.4,1);
            color(BLACK);

            // set up clip
            const w=.79,h=.29;
            context.save();
            context.beginPath();
            context.rect(.5-w/2,.55-h/2,w,h);
            context.clip();//context.fill();

            for(let j=5; j--;)
            {
                const x=j*.18,y=.4,h2=.4;
                rectLine(x,y,x+h2,y+h2,.045);
            }
            context.restore();
        }*/
        /*setupContext(4,5);
        {
            // speed limit
            drawSignBackground(.35,.43,WHITE,BLACK,.04,GRAY,0,.03,1,.05);
            color(BLACK);
            text('SPEED',.5,.1,.08,1,0,undefined,undefined,600);
            text('LIMIT',.5,.185,.08,1,0,undefined,undefined,600);
            text(55,.5,.34,.24,1,0,undefined,undefined,600);
        }
        setupContext(5,5);
        {
            // interstate 13
            drawSignBackground(0,0,WHITE,BLACK,.04,GRAY,0,.1,1,.05);

            for(let k=2; k--;)
            for(let i=99; i--;)
            {
                color(k?WHITE:hsl(.6,.9,.4));
                const p = i/99;
                const w = k?.5:.47;
                const h = k?.6:.57;
                rect(.5,h-p*.5,w*Math.sin(p*2.2-.2)**.7,.01);
            }

            color(WHITE)
            rect(.5,.1,.5,.15)
            color(hsl(0,.7,.5))
            rect(.5,.1,.45,.1)
            
            color(WHITE)
            lineColor(WHITE)
            text('INTERSTATE',.5,.105,.1,.43,0,undefined,undefined,600);
            text(13,.48,.33,.3,1,.007);
        }*/

        // more stuff
        setupContext(0,6);
        drawStartSign('终点');
        setupContext(1,6);
        drawStartSign('起点');
        /*setupContext(1,6);
        {
            // grave cross
            for(let i=2; i--;)
            {
                const o = i*.02;
                color(hsl(0,0,i?.1:1));
                rect(.5+o,.6,.08,.8);
                rect(.5+o,.4,.4,.08);
            }
        }*/
        setupContext(2,6);
        {
            // grave stone
            for(let k=2;k--;)
            for(let i=9;i--;)
            {
                const p = i/9;
                color(hsl(0,0,k?.2:.9));
                circle(.5+k*.05,.5+p/2,.3,.4);
            }
        }
        /*setupContext(2,6,1);
        {
            // grave stone
            drawRock(.5,.2,.7,0.003,.9,1,undefined,undefined,undefined,undefined,vec3(0,0,2));
        }*/
        setupContext(3,6);
        if (1) // 中国宝塔 (Chinese Pagoda) - 高品质版
        {
            const pagodaWarmRed = hsl(.03,.75,.38);
            const pagodaGold = hsl(.13,.85,.52);
            const pagodaDark = hsl(.08,.35,.12);
            const pagodaMid = hsl(.03,.6,.3);
            const tiers = random.int(5,8);

            for(let t=tiers; t--;)
            {
                const tp = t/tiers;
                const y = .08 + tp*.78;
                const tierW = lerp(tp,.12,.32);
                const roofOverhang = tierW + .07;

                // 多层飞檐 - 向上翘曲
                for(let layer=3; layer--;)
                {
                    const lo = layer*.015;
                    color(layer?pagodaGold:pagodaDark);
                    for(let i=10; i--;)
                    {
                        const rp = i/10;
                        const rx = .5 - roofOverhang + lo + rp*(roofOverhang*2-lo*2);
                        const curve = Math.sin(rp*PI)*.05;
                        rect(rx, y-curve+lo, (roofOverhang*2)/10, .03);
                    }
                }
                // 屋脊线
                color(pagodaDark);
                rect(.5, y-.04, roofOverhang*2+.03, .012);

                // 墙体
                const wallH = .07;
                const wallW = tierW*2;
                color(pagodaWarmRed);
                rect(.5, y+wallH/2, wallW, wallH);
                // 墙体竖线装饰
                color(pagodaMid);
                for(let i=5; i--;)
                {
                    const lx = .5 - wallW/2 + (i+1)*wallW/6;
                    rect(lx, y+wallH/2, .006, wallH*.8);
                }

                // 立柱
                color(pagodaDark);
                const pillarW = .014;
                rect(.5-wallW/2+pillarW, y+wallH/2, pillarW, wallH);
                rect(.5+wallW/2-pillarW, y+wallH/2, pillarW, wallH);
            }

            // 塔刹（顶部装饰）
            color(pagodaGold);
            rect(.5, .05, .025, .05);
            circle(.5, .025, .03);
            circle(.5, .015, .015);

            // 基座
            color(pagodaDark);
            rect(.5, .91, .38, .05);
            color(pagodaWarmRed);
            rect(.5, .88, .34, .04);
            color(pagodaGold);
            rect(.5, .86, .3, .012);
        }
        else
        {
            // city building
            color(BLACK);
            rect(.5,.57,.3,1);
            for(let i=19; i--;)
                rect(.5+random.floatSign(.15),random.float(.5,.6),i/2e3,1);

            for(let j=30; j--;)
            for(let i=9; i--;)
            {
                const w = .03;
                const x = .38+i*w;
                const y = .1+j*w;
                color(hsl(random.float(.07,.15),random.float(.5,1),(i&j)%2?0:random.float(.3,1)**3));
                rect(x,y,w*.7,w*.7);
            }
        }
        
        /*setupContext(5,6);
        {
            // green mountains
            random.setSeed(43);
            drawRock(.5,.1,.35,.03,.4,1, 1,undefined,undefined,undefined,vec3(.35,.4,.5),.3);
            drawRock(.5,.1,.08,.2,.4,1, 1,-.05,undefined,undefined,vec3(.1,.4,.5),.3);
            //messyRect(.5,1,.1,1,PI/2,hsl(.6,1,.7));
        }*/
        setupContext(6,6);
        {
            // 喀斯特山峰 (Karst mountains) - 高品质版
            random.setSeed(9);
            for(let k=9; k--;)
            {
                const kx = .1 + k*.09;
                const kh = random.float(.25, .5);
                const kw = random.float(.02, .06);
                drawRock(kx, kw, kh, .008, .25, .8, .5, -.06, .015, 600, vec3(.15,.18,.52), .5);
            }
            // 前景岩石细节
            for(let k=4; k--;)
            {
                const kx = .2 + k*.18;
                drawRock(kx, .03, .12, .02, .15, 1, .6, -.02, .01, 300, vec3(.1,.15,.4), .4);
            }
        }
        setupContext(7,6);
        {
            // 远山层叠 (Distant layered mountains) - 高品质版
            const mountainHue = .55;
            for(let i=4; i--;)
            {
                const py = i*.025;
                const hue = mountainHue + i*.04;
                const lit = .55 + i*.18;
                drawRock(.5, .5+py, .22, .03, .25, .6, .6, -.04-py, .008, 1000, vec3(hue,.22,lit), .3);
            }
        }
        /*setupContext(1,6);
        {
            // road noise
            for(let i=9; i--;)
            for(let j=200; j--;)
            {
                color(hsl(0,0,random.float(.9,1)));
                rect(i/9,j/200,.3,.02);
            }
        }*/

        //setupContext(0,6);
        //drawGirders();
        //setupContext(1,6);
        //drawGirders(-.05,1);

        /*function drawGirders(o=.01,lit=.8)
        {
            // girders
            for(let i=3; i--;)
            {
                lineColor(hsl(0,0,lit-i/3));
                const x = .5+i*.01;
                const lw = .02;
                const w = .1;
                for(let i=9; i--;)
                for(let j=2; j--;)
                {
                    const k = j?1:-1;
                    const x1 = x-k*w;
                    const y1 = i*.2;
                    const x2 = x+k*w;
                    const y2 = (i+1)*.2;
                    line(x1,y1,x2,y2,lw);
                }
                const w2 = w+o;
                line(x-w2,0,x-w2,1,lw);
                line(x+w2,0,x+w2,1,lw);
            }
        }*/

        /*function drawRoadSignBackground()
        {
            const y = .28;
            color(hsl(0,0,.1));
            rect(.51,.9,.04,1);
            color(GRAY);
            rect(.5,.9,.04,1);
            color(warningColor);
            rect(.5,y,.36,.36,PI/4);
            color(BLACK);
            rect(.5,y,.33,.33,PI/4);
            color(warningColor);
            rect(.5,y,.3,.3,PI/4);
        }*/
    }
    if (hardAlpha)
    {
        // make hard alpha
        const minAlpha = 99;
        const s = generativeCanvasSize;
        const imageData = context.getImageData(0, generativeTileSize, s, s);
        const data = imageData.data;
        for (let i=3; i<data.length; i+=4)
            data[i] = data[i] < minAlpha ? 0 : 255;
        context.putImageData(imageData, 0, generativeTileSize);
    }

    function setupContext(x,y,test)
    {
        if (debug&&test)
        {
            debugTile = vec3(x,y);
            debugGenerativeCanvas = 1
        }
        // set context transform to go from 0-1 to 0-size
        const b = bleedPixels;
        const w = generativeTileSize;
        context.restore();
        context.save();
        context.setTransform(w-2*b,0,0,w-2*b,w*x+b,w*y+b);
        context.beginPath();
        context.rect(0,0,1,1);
        context.clip();
    }

    function circle(x,y,r,a1=0,a2=9) { ellipse(x,y,r,r,0,a1,a2); }
    function rect(x=.5,y=.5,w=1,h=1,angle=0)
    {
        context.save()
        context.translate(x,y);
        context.rotate(angle);
        context.fillRect(-w/2,-h/2,w,h);
        context.restore();
    }
    function color(c=WHITE,setLineColor=0)
    {
        ASSERT(isColor(c));
        context.fillStyle = c; if (setLineColor) lineColor(c);
    }
    function lineColor(c=WHITE)
    {
        ASSERT(isColor(c));
        context.strokeStyle = c;
    }
    function ellipse(x=.5,y=.5,w=.5,h=.5,a=0,a1=0,a2=9)
    {
        context.beginPath();
        context.ellipse(x,y,max(0,w),max(0,h),a,a1,a2);
        context.fill();
    }
    function rectLine(x1,y1,x2,y2,w=.1,density=200)
    {
        const d = vec3(x2-x1,y2-y1).length()*density+1|0;
        for(let i=d;i--;)
            rect(lerp(i/d,x1,x2),lerp(i/d,y1,y2),w,w);
    }
    function rectOutline(x=.5,y=.5,w=1,h=1,l=.05)
    { context.lineWidth=l; context.strokeRect(x-w/2,y-h/2,w,h); }
    function line(x1,y1,x2,y2,w=.1)
    {
        context.lineWidth = w;
        context.beginPath();
        context.lineTo(x1,y1);
        context.lineTo(x2,y2);
        context.stroke();
    }
    function triangle(x=.5, y=.5, r=.5, ao=0)
    {
        context.beginPath();
        for(let i=3; i--;)
        {
            const a = i*2/3*PI;
            context.lineTo(x+r*Math.sin(a+ao), y-r*Math.cos(a+ao));
        }
        context.fill();
    }
    /*function polygon(x=.5, y=.5, r=.5, ao=0,sides=3)
    {
        context.beginPath();
        for(let i=sides; i--;)
        {
            const a = i/sides*PI*2;
            context.lineTo(x+r*Math.sin(a+ao), y-r*Math.cos(a+ao));
        }
        context.fill();
    }*/
    function text(s, x=.5, y=.5, size=1, width=.95, lineWidth=0, font='arial', textAlign='center', weight=400, style='')
    {
        if (fixFirefoxFontBug)
        {
            // fix firefox rendering big
            // it will not render fonts below minimum size
            context.save();
            const sizeFix = .05;
            context.scale(sizeFix,sizeFix);
            size      /= sizeFix;
            x         /= sizeFix;
            y         /= sizeFix;
            width     /= sizeFix;
            lineWidth /= sizeFix;
        }

        context.font = `${style} ${weight} ${size}px ${font}`;
        context.textBaseline = 'middle';
        context.textAlign = textAlign;
        context.lineWidth = lineWidth;
        context.lineCap = context.lineJoin = 'round';
        lineWidth && context.strokeText(s, x, y, width);
        context.fillText(s, x, y, width);

        if (fixFirefoxFontBug)
            context.restore();
    }

    function messyRect(x,y,w,h,angle,c,density=300,shardSize=.1)
    {
        color(c);
        rect(x,y,w,h,angle);
        const count = w*density;
        for(let i=count+1; i--;)
        {
            const w2 = random.float(w*shardSize);
            const ow = random.floatSign(w-w2);
            const d1 = vec3(1,0).rotateZ(angle).scale(ow/2);
            color(random.mutateColor(c,.05,.7));

            const h2 = random.float(h/4,h);
            const oh = random.floatSign(h-h2);
            const d2 = vec3(0,1).rotateZ(angle).scale(oh/2);
            const d = d1.add(d2);
            rect(x+d.x,y+d.y,w2,h2,angle);
        }
    }

    function drawRock(x=.5, w=.1, hstart=.7, wdelta=.01, 
        cornerX=.7, cornerY=.7, cornerAngle=.3, y=0, z=.03,density=520,colorVecHSL=vec3(0,0,1),addLit=0,randomness=.01)
    {
        for(let jcount=max(1,density*hstart*.1), j=jcount; j-->0; w+=random.float(wdelta))
        for(let icount=density*w, i=icount, dh=0, h=hstart; i-->0;)
        {
            const p = i/icount;
            const pj = j/jcount;
            let l = random.float(.2,.5);
            if (pj < abs(cornerX-p)/20)
                l = random.float(.2); // dark on bottom

            if (random.bool(.05))
                l = random.float(1); // random bright spot
            else if (pj > cornerY+abs(cornerX-p)*cornerAngle)
                l*=2; // bright on top
            else if (p > cornerX)
                l/=3; // darker on right side
            
            const zz = random.float(z,z*2)
            h += dh = -sign(dh)*random.float(randomness);

            const c2 = colorVecHSL.copy();
            c2.z = l*c2.z+addLit;
            const c = c2.getHSLColor(.3);

            color(c);
            rect(x+lerp(p,-w,w),1-pj*h-y-zz+random.floatSign(randomness),zz,zz,random.floatSign(2));
        }
    }

    function drawRedLantern(x=.5, y=.5, size=.1)
    {
        // 红灯笼 (Red Lantern)
        const lanternRed = hsl(0,.9,.45);
        const lanternGold = hsl(.13,.9,.5);
        const lanternDark = hsl(0,.8,.2);

        // tassel
        color(lanternGold);
        rect(x, y+size*.7, .005, size*.3);

        // lantern body
        for(let i=9; i--;)
        {
            const p = i/9;
            const w = size*.4 * (1-Math.abs(p-.5)*1.8);
            const ly = y - size*.2 + p*size*.5;
            color(lanternRed);
            rect(x, ly, max(.002, w), size*.06);
        }

        // top and bottom caps
        color(lanternGold);
        rect(x, y-size*.2, size*.35, .01);
        rect(x, y+size*.3, size*.35, .01);

        // golden loop on top
        color(lanternGold);
        circle(x, y-size*.25, size*.08);
        color(lanternDark);
        circle(x, y-size*.25, size*.04);

        // glow effect
        color(hsl(0,1,.5,.5));
        circle(x, y+size*.05, size*.35);
    }

    function drawPalmTree()
    {
        // 竹子 (Bamboo) - 高品质版
        const bambooHue = .22;
        const stalkCount = random.int(5,9);
        for(let s=stalkCount; s--;)
        {
            const sx = .35 + s*.035;
            const sway = random.floatSign(.04);
            for(let seg=12; seg--;)
            {
                const sp = seg/12;
                const y = .2 + sp*.78;
                const w = lerp(sp,.04,.012);
                const xo = Math.sin(sp*3.5)*sway*(1+sp);
                // 竹节主体
                color(hsl(bambooHue,.4,random.float(.35,.55)));
                rect(sx+xo, y, w, .1);
                // 竹节高光
                color(hsl(bambooHue,.3,random.float(.5,.7)));
                rect(sx+xo+w*.15, y, w*.3, .08);
                // 竹节环
                color(hsl(bambooHue,.55,random.float(.18,.3)));
                rect(sx+xo, y+.045, w+.006, .008);
            }
            // 竹叶 - 更多更密
            for(let l=12; l--;)
            {
                const la = l/12*PI*2 + random.floatSign(.4);
                const lx = sx + Math.sin(la)*.1;
                const ly = .18 + Math.cos(la)*.05;
                const leaf = new Particle(lx, ly, Math.sin(la)*.2, Math.cos(la)*.12-.06, .25, .015, .002);
                leaf.style = 1;
                leaf.iterations = 70;
                leaf.color = hsl(bambooHue+.06,.45,random.float(.28,.48));
                leaf.colorRandom = .12;
                leaf.draw();
            }
        }
    }

    function drawFlower(pos, flowerPetals, flowerSize, c=RED)
    {
        const flowerAngle = random.float(2*PI);
        const regularity = 1+random.floatSign(.08);
        flowerSize = random.float(flowerSize*.6,flowerSize);
        color(random.mutateColor(WHITE,.2));
        circle(pos.x,pos.y,flowerSize*random.float(.5,1));
        c = random.mutateColor(c,.3);
        for(let i=flowerPetals; i--;)
        {
            const a = i/flowerPetals*PI*2+flowerAngle;
            const pos2 = pos.add(vec3(flowerSize/.8,0).rotateZ(a));
            color(random.mutateColor(c,.2));
            ellipse(pos2.x,pos2.y,flowerSize, flowerSize/2,a**regularity);
        }
    }

    function drawGrass(h=0,s=0,l=.6,flowerChance=0,flowerColor)
    {
        const flowerPetals = random.int(5,9);
        const flowerSize = random.float(.03,.05);
        for(let i=70; i--;)
        {
            const x = .5+random.floatSign(.25);
            const p = new Particle(x,1,random.floatSign(.25),random.floatSign(-.6,-1),.5,.02);
            p.color = hsl(h,s,l+random.float(.4));
            p.iterations = 99;
            const pos = p.draw();
            if (random.bool(flowerChance))
                drawFlower(pos,flowerPetals,flowerSize,flowerColor);
        }
    }
    
    function drawSignBackground(w=1,h=.9,c=hsl(0,0,.1),outlineColor=WHITE,outline=.05,legColor=outlineColor, legSeparation=.2,yo=0,doubleOutline=0,legWidth=.1)
    {
        for(let i=2; i--;)
        {
            color(i?hsl(0,0,.1):legColor);
            rect(.5-legSeparation*w+.01*i,.5+yo,legWidth);
            rect(.5+legSeparation*w+.01*i,.5+yo,legWidth);
        }
        color(c);
        doubleOutline && rect(.5,h/2+yo,w+outline,h+outline);
        color(outlineColor);
        rect(.5,h/2+yo,w,h);
        color(c);
        rect(.5,h/2+yo,w-outline,h-outline);
    }

    // === 中国交通路牌 ===

    function drawSpeedSign()
    {
        // 限速牌 — 红圈白底黑字
        const r = .35, cx = .5, cy = .5;
        color(WHITE);
        circle(cx, cy, r);
        color(hsl(0,.85,.45));
        circle(cx, cy, r);
        color(WHITE);
        circle(cx, cy, r*.85);
        color(BLACK);
        text('120', cx, cy-.02, .38, 1, .03, undefined, undefined, 900);
        // 限速单位小字
        text('km/h', cx, cy+.13, .1, 1, .01);
        // 杆子
        color(hsl(.08,.3,.25));
        rect(cx, cy+r+.15, .04, .3);
    }

    function drawRouteSign()
    {
        // 高速编号牌 — 蓝底白字
        const c = hsl(.58,.85,.35);
        drawSignBackground(.85, .65, c, WHITE, .03, hsl(.08,.3,.25));
        color(WHITE);
        text('G75', .5, .28, .28, 1, .02, undefined, undefined, 900);
        text('高速', .5, .52, .16, 1, .01);
    }

    function drawDistanceSign()
    {
        // 出口距离牌 — 绿底白字
        const c = hsl(.33,.8,.25);
        drawSignBackground(.85, .7, c, WHITE, .03, hsl(.08,.3,.25));
        color(WHITE);
        text('出口', .5, .2, .18, 1, .015);
        text('2 km', .5, .43, .22, 1, .02, undefined, undefined, 900);
        // 箭头
        triangle(.7, .6, .06, 0);
        triangle(.3, .38, .04, PI);
    }

    function drawExitSign()
    {
        // 出口指示牌 — 绿底白箭头
        const c = hsl(.33,.8,.22);
        drawSignBackground(.85, .7, c, WHITE, .03, hsl(.08,.3,.25));
        color(WHITE);
        text('EXIT', .5, .22, .16, 1, .015);
        text('出口', .5, .43, .2, 1, .02);
        // 右上箭头
        triangle(.65, .55, .07, -PI/3);
    }

    function drawPicAd1()
    {
        // 图片广告牌 — 带简笔山景的车广告
        drawSignBackground(.9, .8, hsl(.58,.3,.9), hsl(.08,.3,.2), .04, hsl(.08,.3,.25));
        // 简笔山
        color(hsl(.5,.5,.6));
        triangle(.3, .3, .15);
        triangle(.55, .28, .13);
        triangle(.45, .35, .12);
        // 太阳
        color(hsl(.13,.8,.6));
        circle(.7, .15, .08);
        // 简笔车
        color(hsl(0,.8,.4));
        rect(.5, .58, .35, .12);
        rect(.4, .66, .18, .1);
        color(hsl(0,0,.7));
        rect(.38, .52, .15, .07);
        // 车轮
        color(BLACK);
        circle(.35, .72, .045);
        circle(.55, .72, .045);
    }

    function drawPicAd2()
    {
        // 图片广告牌 — 抽象图案牌
        const bg = hsl(.05,.7,.5);
        drawSignBackground(.85, .75, bg, hsl(.08,.3,.25), .04, hsl(.08,.3,.25));
        // 几何装饰
        color(hsl(.13,.9,.55));
        circle(.5, .25, .18);
        color(WHITE);
        triangle(.5, .25, .12);
        color(hsl(0,0,.95));
        rect(.5, .55, .55, .08);
        color(hsl(0,0,.15));
        text('DRIVE', .5, .65, .14, 1, .015);
    }

    // 保留旧函数名兼容
    function drawJS13kSign() { drawSpeedSign(); }
    function drawZZFXSign() { drawRouteSign(); }
    function drawDwitterSign() { drawDistanceSign(); }
    function drawAvalancheSign() { drawExitSign(); }
    function drawGitHubSign() { drawPicAd1(); }
    function drawOPSign() { drawPicAd2(); }
    function drawChineseSign1() { drawSpeedSign(); }
    function drawChineseSign2() { drawRouteSign(); }
    function drawChineseSign3() { drawDistanceSign(); }
    function drawChineseSign4() { drawPicAd1(); }
    function drawChineseSign5() { drawExitSign(); }
    function drawGenericSign()
    {
        drawSignBackground(1,size+.1,c2,c1,undefined,c3);
        color(c1,1);
        text(t,.5,(size+.15)/2,size,.8+lineWidth*10,lineWidth,font);
    }
    function drawDoubleLineSign(t1,t2,c,legSeparation=.5,y1=.24,y2=.46)
    {
        drawSignBackground(1,.6,c,WHITE,.05,BLACK,legSeparation);
        color(WHITE,1);
        text(t1,.5,y1,.31,.85,.01);
        text(t2,.5,y2,.2,.8,.01);
    }

    function drawLittleJSSign()
    {
        drawSignBackground(1,.7,WHITE,BLACK,.05,WHITE,.4,.2);
        ljsText('LittleJS',0.05,.45);
        ljsText('Engine',0.11,.67,2);
        function ljsText(t,x,y,o=0)
        {
            for(let i=0; i<t.length; ++i)
            {
                const weight=900, fontSize=.21, font='arial';
                context.font = `${weight} ${fontSize}px ${font}`;
                const w = context.measureText(t[i]).width;
                color(hsl([1,.3,.57,.14][(i+o)%4],.9,.5));
                text(t[i],x+w/2,y,fontSize,1,.03,font,undefined,weight);
                text(t[i],x+w/2,y,fontSize,1,0,font,undefined,weight);
                x += w;
            }
        }
    }

    function drawStartSign(t)
    {
        // 中文起终点标志
        const cnMap = { 'GOAL':'终点', 'START':'起点' };
        const cnText = cnMap[t] || t;
        rect(.5,.58,1,.16);
        const c = hsl(.08,.4,.2);
        const w = .06;
        messyRect(w/2,.75,w,.53,0,c);
        messyRect(1-w/2,.75,w,.53,0,c);
        color(RED);
        text(cnText,.5,.6,.13,1,.01,undefined,undefined,600);
    }

    function drawCheckpointSign(side)
    {
        color(BLACK);
        rect(.5-side*.45,.5,.1);
        color(hsl(0,0,.2));
        rect(.49-side*.45,.5,.1);
        color(WHITE);
        rect(.5,0,1,.5);
        color(hsl(0,.8,.5));
        text('检',.5,.14,.2,.95,.02,undefined,undefined,600);
    }

    function drawLicensePlate()
    {
        // 车牌 — 纯蓝底白字，像真实车牌
        color(hsl(.58,.8,.3));
        rect(.5,.5,1,.9);
        color(WHITE);
        rect(.5,.5,.94,.84);
        color(hsl(.58,.8,.3));
        rect(.5,.5,.9,.8);
        color(WHITE);
        text('A8888',.5,.49,.7,.85,.015,undefined,undefined,900);
    }
}