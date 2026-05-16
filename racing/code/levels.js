'use strict';

let levelInfoList;

function initLevelInfos()
{
    levelInfoList = [];
    let LI, level=0;

    // 第1关 - 贵阳·花溪 (Guiyang Huaxi) — 河畔竹林，平缓起步
    LI = new LevelInfo(level++, [
        spriteList.grass_plain,
        spriteList.tree_palm,
        spriteList.tree_bush,
        spriteList.grass_flower1,
        spriteList.rock_huge2,
        spriteList.rock_big,
    ], spriteList.tree_palm);
    LI.horizonSpriteSize = .7;
    LI.waterSide = -1;
    LI.billboardChance = .3
    LI.skyColorTop = hsl(.58,.4,.85);
    LI.skyColorBottom = hsl(.55,.6,.7);
    LI.groundColor = hsl(.2,.35,.5);
    LI.roadColor = hsl(.08,.2,.3);

    LI.turnChance = .6;
    LI.turnMin = .2;
    LI.bumpFreqMin = .2;
    LI.bumpFreqMax = .4;
    LI.bumpScaleMin = 10;
    LI.bumpScaleMax = 20;

    // 第2关 - 赤水·竹海 (Chishui Bamboo Sea) — 茂密竹林，蜿蜒小径
    LI = new LevelInfo(level++, [
        spriteList.tree_oak,
        spriteList.tree_palm,
        spriteList.grass_plain,
        spriteList.tree_bush,
        spriteList.tree_stump,
        spriteList.grass_flower1,
        spriteList.grass_flower3,
        spriteList.rock_huge,
        spriteList.rock_big,
    ], spriteList.tree_bush, spriteList.horizon_smallMountains);
    LI.horizonSpriteSize = 10;
    LI.trackSideRate = 10;
    LI.sceneryListBias = 9;
    LI.skyColorTop = hsl(.35,.3,.8);
    LI.skyColorBottom = hsl(.4,.4,.6);
    LI.roadColor = hsl(.08,.3,.18);
    LI.groundColor = hsl(.25,.35,.35);
    LI.cloudColor = hsl(0,0,.9,.3);
    LI.cloudHeight = .15;
    LI.sunHeight = .7;
    LI.billboardChance = .1

    LI.turnChance = .7;
    LI.bumpChance = .8;
    LI.bumpFreqMin = .4;
    LI.bumpScaleMax = 140;

    // 第3关 - 黔灵·秀峰 (Qianling Mountains) — 山间隧道，石壁夹道
    LI = new LevelInfo(level++, [
        spriteList.grass_dead,
        spriteList.rock_big,
        spriteList.tree_stump,
        spriteList.rock_tall,
        spriteList.grass_plain,
    ], spriteList.telephonePole, spriteList.horizon_brownMountains);
    LI.trackSideRate = 50;
    LI.trackSideChance = 1;
    LI.skyColorTop = hsl(.13,.6,.8);
    LI.skyColorBottom = hsl(.25,.3,.5);
    LI.roadColor = hsl(.08,.15,.15);
    LI.lineColor = hsl(0,0,1,.5);
    LI.groundColor = hsl(.1,.15,.4);
    LI.cloudHeight = .05;
    LI.sunHeight = .85;
    LI.sideStreets = 1;
    LI.laneCount = 2;
    LI.hazardType = spriteList.hazard_rocks;
    LI.hazardChance = .004;
    LI.tunnel = spriteList.tunnel2;
    LI.trafficDensity = .7;

    LI.turnMin = .2;
    LI.turnMax = .6;
    LI.bumpChance = 1;
    LI.bumpFreqMax = .2;
    LI.bumpScaleMin = 30;
    LI.bumpScaleMax = 60;

    // 第4关 - 西江·苗寨 (Xijiang Miao Village) — 雾中山寨，红白相间
    LI = new LevelInfo(level++, [
        spriteList.grass_snow,
        spriteList.tree_dead,
        spriteList.tree_snow,
        spriteList.rock_big,
        spriteList.rock_huge2,
        spriteList.tree_stump,
        spriteList.tree_pink,
    ], spriteList.tree_snow, spriteList.horizon_snow);
    LI.sceneryListBias = 9;
    LI.trackSideRate = 21;
    LI.skyColorTop = hsl(.55,.15,.55);
    LI.skyColorBottom = hsl(0,0,.85);
    LI.roadColor = hsl(0,0,.45,.5);
    LI.groundColor = hsl(.6,.2,.8);
    LI.lineColor = hsl(0,.8,.4,.5);
    LI.cloudColor = hsl(0,0,.75,.5);
    LI.horizonSpriteSize = 2;
    LI.sunHeight = .7;
    LI.hazardType = spriteList.hazard_rocks;
    LI.hazardChance = .002;
    LI.trafficDensity = 1.2;
    LI.billboardChance = .15;

    LI.turnMin = .4;
    LI.bumpChance = .8;
    LI.bumpFreqMin = .2;
    LI.bumpFreqMax = .6;
    LI.bumpScaleMin = 50;
    LI.bumpScaleMax = 100;

    // 第5关 - 喀斯特·峡谷 (Karst Canyon) — 峭壁深谷，盘山险路
    LI = new LevelInfo(level++, [
        spriteList.rock_huge,
        spriteList.rock_huge2,
        spriteList.grass_dead,
        spriteList.tree_fall,
        spriteList.grass_flower2,
        spriteList.tree_dead,
        spriteList.tree_stump,
        spriteList.rock_big,
    ], spriteList.tree_fall, spriteList.horizon_brownMountains);
    LI.sceneryListBias = 2;
    LI.trackSideRate = 31;
    LI.skyColorTop = hsl(.55,.8,.7);
    LI.skyColorBottom = hsl(.15,.6,.8);
    LI.roadColor = hsl(0,0,.12);
    LI.groundColor = hsl(.12,.3,.4);
    LI.cloudColor = hsl(0,0,.9,.3);
    LI.cloudHeight = .08;
    LI.sunColor = hsl(.08,1,.6);
    LI.billboardChance = .1
    LI.trafficDensity = .7;

    LI.turnChance = 1;
    LI.turnMin = .2;
    LI.turnMax = .8;
    LI.bumpChance = .9;
    LI.bumpFreqMin = .4;
    LI.bumpScaleMax = 120;

    // 第6关 - 贵阳·新城 (Guiyang New City) — 现代都市，宽阔大道
    LI = new LevelInfo(level++, [
        spriteList.grass_red,
        spriteList.tree_yellow,
        spriteList.rock_big,
        spriteList.rock_huge3,
        spriteList.tree_stump,
    ], spriteList.tree_yellow, spriteList.horizon_city);
    LI.trackSideRate = 31;
    LI.skyColorTop = hsl(.13,.8,.65);
    LI.skyColorBottom = hsl(.05,.7,.5);
    LI.roadColor = hsl(0,0,.08);
    LI.lineColor = hsl(.12,.9,.55);
    LI.groundColor = hsl(.04,.4,.3);
    LI.cloudColor = hsl(.12,1,.5,.5);
    LI.billboardRate = 23;
    LI.billboardChance = .5
    LI.horizonSpriteSize = 1.5;
    if (!js13kBuildLevel2)
        LI.horizonFlipChance = .3;
    LI.sunHeight = .5;
    LI.sunColor = hsl(.12,1,.75);
    LI.sideStreets = 1;
    LI.laneCount = 5;
    LI.trafficDensity = 2;

    LI.turnChance = .3;
    LI.turnMin = .5
    LI.turnMax = .9;
    LI.bumpFreqMin = .3;
    LI.bumpFreqMax = .6;
    LI.bumpScaleMin = 80;
    LI.bumpScaleMax = 200;

    // 第7关 - 镇远·古镇 (Zhenyuan Ancient Town) — 老街石路，古建夹道
    LI = new LevelInfo(level++, [
        spriteList.grass_dead,
        spriteList.grass_plain,
        spriteList.grave_stone,
        spriteList.tree_oak,
        spriteList.tree_stump,
        spriteList.rock_big,
        spriteList.rock_huge,
        spriteList.rock_tall,
    ], spriteList.tree_oak, spriteList.horizon_graveyard);
    LI.sceneryListBias = 2;
    LI.trackSideRate = 50;
    LI.skyColorTop = hsl(.4,.8,.55);
    LI.skyColorBottom = hsl(.08,.7,.7);
    LI.roadColor = hsl(.5,.25,.15);
    LI.groundColor = hsl(.15,.25,.45);
    LI.lineColor = hsl(0,0,.85,.5);
    LI.billboardChance = 0.05;
    LI.cloudColor = hsl(.12,.8,.8,.3);
    LI.horizonSpriteSize = 4;
    LI.sunHeight = 1.2;
    LI.trackSideChance = 1;

    LI.turnMax = .6;
    LI.bumpChance = .6;
    LI.bumpFreqMin = LI.bumpFreqMax = .7;
    LI.bumpScaleMin = 80;

    // 第8关 - 黄果树·瀑布 (Huangguoshu Waterfall) — 水雾弥漫，热带雨林
    LI = new LevelInfo(level++, [
        spriteList.grass_large,
        spriteList.tree_palm,
        spriteList.grass_flower1,
        spriteList.rock_tall,
        spriteList.rock_big,
        spriteList.rock_huge2,
        spriteList.rock_huge,
    ], spriteList.rock_big, spriteList.horizon_redMountains);
    LI.sceneryListBias = 5;
    LI.trackSideRate = 25;
    LI.skyColorTop = hsl(.57,.6,.8);
    LI.skyColorBottom = hsl(.58,.8,.65);
    LI.lineColor = hsl(0,0,.3,0);
    LI.roadColor = hsl(.08,.5,.18,.8);
    LI.groundColor = hsl(.12,.4,.35);
    LI.waterSide = 1;
    LI.cloudColor = hsl(.58,1,.9,.85);
    LI.cloudWidth = .6;
    LI.sunHeight = .7;
    LI.sunColor = hsl(.12,.9,.6);
    LI.hazardType = spriteList.rock_big;
    LI.hazardChance = .15;
    LI.trafficDensity = 0;

    LI.turnChance = .8;
    LI.turnMax = .3;
    LI.bumpChance = 1;
    LI.bumpFreqMin = .4;
    LI.bumpFreqMax = .6;
    LI.bumpScaleMin = 10;
    LI.bumpScaleMax = 80;

    // 第9关 - 加榜·梯田 (Jiabang Terraces) — 层叠梯田，金色稻浪
    LI = new LevelInfo(level++, [
        spriteList.grass_red,
        spriteList.rock_weird,
        spriteList.tree_huge,
        spriteList.grass_flower2,
    ], spriteList.rock_weird2, spriteList.horizon_weird);
    LI.trackSideRate = 50;
    LI.skyColorTop = hsl(.12,.9,.75);
    LI.skyColorBottom = hsl(.13,.8,.6);
    LI.lineColor = hsl(.14,.9,.7);
    LI.roadColor = hsl(.08,.4,.15);
    LI.groundColor = hsl(.1,.5,.45);
    LI.cloudColor = hsl(.08,.8,.5,.25);
    LI.cloudHeight = .2;
    LI.sunColor = hsl(.14,.9,.5);
    LI.laneCount = 4;
    LI.trafficDensity = 1.5;

    LI.turnChance = .7;
    LI.turnMin = .3;
    LI.turnMax = .8;
    LI.bumpChance = 1;
    LI.bumpFreqMin = .5;
    LI.bumpFreqMax = .9;
    LI.bumpScaleMin = 100;
    LI.bumpScaleMax = 200;

    // 第10关 - 黔东南·秘境 (Qiandongnan) — 崇山峻岭，最难关卡
    LI = new LevelInfo(level++, [
        spriteList.grass_plain,
        spriteList.rock_huge3,
        spriteList.grass_flower1,
        spriteList.rock_huge2,
        spriteList.rock_huge,
        spriteList.tree_pink,
    ], spriteList.tree_pink);
    LI.trackSideRate = 21;
    LI.skyColorTop = hsl(.15,.8,.8);
    LI.skyColorBottom = hsl(.5,.7,.5);
    LI.roadColor = hsl(0,0,.08);
    LI.groundColor = hsl(.08,.4,.6);
    LI.cloudColor = hsl(0,0,.9,.5);
    LI.tunnel = spriteList.tunnel1;
    if (js13kBuildLevel2)
        LI.horizonSpriteSize = 0;
    else
    {
        LI.sunHeight = .6;
        LI.horizonSprite = spriteList.horizon_mountains
        LI.horizonSpriteSize = 1;
    }

    LI.turnChance = LI.turnMax = .8;
    LI.bumpChance = 1;
    LI.bumpFreqMin = .3;
    LI.bumpFreqMax = .9;
    LI.bumpScaleMax = 80;

    // 第11关 - 甲秀楼·凯旋 (Jiaxiu Triumph) — 胜利之路，花团锦簇
    LI = new LevelInfo(level++, [
        spriteList.grass_flower1,
        spriteList.grass_flower2,
        spriteList.grass_flower3,
        spriteList.grass_plain,
        spriteList.tree_oak,
        spriteList.tree_bush,
        spriteList.tree_pink,
    ], spriteList.tree_oak);
    LI.sceneryListBias = 1;
    LI.skyColorTop = hsl(.15,.8,.85);
    LI.skyColorBottom = hsl(.55,.6,.7);
    LI.groundColor = hsl(.18,.35,.5);
    LI.roadColor = hsl(.08,.2,.2);
    LI.trackSideRate = LI.billboardChance = 0;
    LI.bumpScaleMin = 1e3;
    LI.billboardScale = 5;

    if (js13kBuildLevel2)
        LI.horizonSpriteSize = 0;
    else
    {
        LI.sunHeight = .6;
        LI.horizonSprite = spriteList.horizon_mountains
        LI.horizonSpriteSize = 1;
    }
}

const getLevelInfo = (level) => testLevelInfo || levelInfoList[level|0] || levelInfoList[0];

// info about how to build and draw each level
class LevelInfo
{
    constructor(level, scenery, trackSideSprite,horizonSprite=spriteList.horizon_islands)
    {
        // add self to list
        levelInfoList[level] = this;

        if (debug)
        {
            for(const s of scenery)
                ASSERT(s, 'missing scenery!');
        }

        this.level = level;
        this.scenery = scenery;
        this.trackSideSprite = trackSideSprite;
        this.sceneryListBias = 29;
        this.waterSide = 0;

        this.billboardChance = .2;
        this.billboardRate = 45;
        this.billboardScale = 1;
        this.trackSideRate = 5;
        this.trackSideForce = 0;
        this.trackSideChance = .5;

        this.groundColor = hsl(.08,.2, .7);
        this.skyColorTop = WHITE;
        this.skyColorBottom = hsl(.57,1,.5);
        this.lineColor = WHITE;
        this.roadColor = hsl(0, 0, .5);

        // horizon stuff
        this.cloudColor = hsl(.15,1,.95,.7);
        this.cloudWidth = 1;
        this.cloudHeight = .3;
        this.horizonSprite = horizonSprite;
        this.horizonSpriteSize = 2;
        this.sunHeight = .8;
        this.sunColor = hsl(.15,1,.95);

        // track generation
        this.laneCount = 3;
        this.trafficDensity = 1;

        // default turns and bumps
        this.turnChance = .5;
        this.turnMin = 0;
        this.turnMax = .6;
        this.bumpChance = .5;
        this.bumpFreqMin = 0;    // no bumps
        this.bumpFreqMax = .7;   // more often bumps
        this.bumpScaleMin = 50;  // rapid bumps
        this.bumpScaleMax = 150; // largest hills
    }

    randomize()
    {
        shuffle(this.scenery);
        this.sceneryListBias = random.float(5,30);
        this.groundColor = random.mutateColor(this.groundColor);
        this.skyColorTop = random.mutateColor(this.skyColorTop);
        this.skyColorBottom = random.mutateColor(this.skyColorBottom);
        this.lineColor = random.mutateColor(this.lineColor);
        this.roadColor = random.mutateColor(this.roadColor);
        this.cloudColor = random.mutateColor(this.cloudColor);
        this.sunColor = random.mutateColor(this.sunColor);

        // track generation
        this.laneCount = random.int(2,5);
        this.trafficDensity = random.float(.5,1.5);

        // default turns and bumps
        this.turnChance = random.float();
        this.turnMin = random.float();
        this.turnMax = random.float();
        this.bumpChance = random.float();
        this.bumpFreqMin = random.float(.5);    // no bumps
        this.bumpFreqMax = random.float();   // more often bumps
        this.bumpScaleMin = random.float(20,50);  // rapid bumps
        this.bumpScaleMax = random.float(50,150); // largest hills
        this.hazardChance = 0;
    }
}