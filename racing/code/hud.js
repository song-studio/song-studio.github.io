'use strict';

const showTitle = 1;

function drawHUD()
{
    if (freeCamMode)
        return;

    if (enhancedMode && paused)
    {
        // paused
        drawHUDText('– 暂停 –', vec3(.5,.9), .08, undefined, 'monospace',undefined,900,undefined,undefined,undefined,3);
    }

    if (titleScreenMode)
    {
        if (showTitle)
        for(let j=2;j--;)
        {
            // draw logo
            const text = j?'极速':'狂飙';
            const pos = vec3(.5,.3-j*.15).multiply(mainCanvasSize);
            let size = mainCanvasSize.y/9;
            const weight = 900;
            const style = 'italic';
            const font = 'arial';
            if (enhancedMode && getAspect() < .6)
                size = mainCanvasSize.x/5;
                    
            const context = mainContext;
            context.strokeStyle = BLACK;
            context.textAlign = 'center';

            let totalWidth = 0;
            for(let k=2;k--;)
            for(let i=0;i<text.length;i++)
            {
                const p = Math.sin(i-time*2-j*2);
                let size2 = (size + p*mainCanvasSize.y/20);
                if (enhancedMode)
                    size2 *= lerp(time*2-2+j,0,1)
                context.font = `${style} ${weight} ${size2}px ${font}`;
                const c = text[i];
                const w = context.measureText(c).width;
                if (k)
                {
                    totalWidth += w;
                    continue;
                }

                const x = pos.x+w/3-totalWidth/2;
                for(let f = 2;f--;)
                {
                    const o = f*mainCanvasSize.y/99;
                    context.fillStyle = hsl(.15-p/9,1,f?0:.75-p*.25);
                    context.fillText(c, x+o, pos.y+o);
                }
                pos.x += w;
            }
        }

        // show difficulty on title screen - 两个大字直接点选
        {
            const easyColor = gameDifficulty==0?hsl(.35,1,.6):hsl(0,0,.4);
            const hardColor = gameDifficulty==1?hsl(0,1,.5):hsl(0,0,.4);
            drawHUDText('简单', vec3(.25,.82), .07, easyColor, 'arial',undefined,900,'italic',undefined,.03,3);
            drawHUDText('困难', vec3(.75,.82), .07, hardColor, 'arial',undefined,900,'italic',undefined,.03,3);
            const hint = isTouchDevice ? '点击上方选择难度' : '点击选择难度，空格开始';
            drawHUDText(hint, vec3(.5,.92), .03, hsl(0,0,.6), 'arial',undefined,400,'italic',undefined,undefined,0);
        }

        if (!enhancedMode || time > 5)
        {
            if (bestTime && (!enhancedMode || time%20<10))
            {
                const timeString = formatTimeString(bestTime);
                if (!js13kBuildLevel2)
                    drawHUDText('最佳成绩', vec3(.5,.9), .07, undefined, 'arial',undefined,900,'italic',undefined,undefined,3);
                drawHUDText(timeString, vec3(.5,.97), .07, undefined, 'arial',undefined,900,'italic',undefined,undefined,3);
            }
            else if (enhancedMode && !isTouchDevice)
            {
                drawHUDText('点击开始', vec3(.5,.97), .07, undefined, 'arial',undefined,900,'italic',undefined,undefined,3);
            }
        }
    }
    else if (startCountdownTimer.active() || startCountdown)
    {
        // count down
        const a = 1-time%1;
        const t = !startCountdown && startCountdownTimer.active() ? '出发！' : startCountdown|0;
        const c = (startCountdown?RED:GREEN).copy();
        c.a = a;
        drawHUDText(t, vec3(.5,.2), .25-a*.1, c, undefined,undefined,900,undefined,undefined,.03);
    }
    else
    {
        const wave1 = .04*(1 - abs(Math.sin(time*2)));
        if (gameOverTimer.isSet())
        {
            // win screen
            const c = playerWin?YELLOW:WHITE;
            const wave2 = .04*(1 - abs(Math.sin(time*2+PI/2)));
            drawHUDText(playerWin?'你':'结束', vec3(.5,.2), .1+wave1, c, undefined,undefined,900,'italic',.5,undefined,4);
            drawHUDText(playerWin?'赢了！':'再接再厉', vec3(.5,.3), .1+wave2, c, undefined,undefined,900,'italic',.5,undefined,4);

            if (playerNewRecord || playerNewDistanceRecord && !bestTime)
                drawHUDText('新纪录！', vec3(.5,.6), .08+wave1/4, RED, 'monospace',undefined,900,undefined,undefined,undefined,3);
        }
        else if (!startCountdownTimer.active() && !freeRide)
        {
            // big center checkpoint time
            const c = checkpointTimeLeft < 4 ? RED : checkpointTimeLeft < 11 ? YELLOW : WHITE;
            const t = checkpointTimeLeft|0;
        
            let y=.13, s=.14;
            if (enhancedMode && getAspect() < .6)
                y=.14, s=.1;

            drawHUDText(t, vec3(.5,y), s, c, undefined,undefined,900,undefined,undefined,.04);
        }

        if (!freeRide)
        {
            if (playerWin)
            {
                // current time
                const timeString = formatTimeString(raceTime);
                if (!js13kBuildLevel2)
                    drawHUDText('用时', vec3(.5,.43), .08, undefined, 'monospace',undefined,900,undefined,undefined,undefined,3);
                drawHUDText(timeString, vec3(.5), .08, undefined, 'monospace',undefined,900,undefined,undefined,undefined,3);
            }
            else
            {
                // current time
                const timeString = formatTimeString(raceTime);
                drawHUDText(timeString, vec3(.01,.05), .05, undefined, 'monospace','left');

                // current stage
                const level = debug&&testLevelInfo ? testLevelInfo.level+1 :playerLevel+1;
                drawHUDText('第'+level+'关', vec3(.90,.05), .035, undefined, 'monospace','right');
            }
        }
    }

    if (debugInfo&&!titleScreenMode) // mph
    {
        const mph = playerVehicle.velocity.z|0;
        const mphPos = vec3(.01,.95);
        drawHUDText(mph+' MPH', mphPos, .08, undefined,undefined,'left',900,'italic');
    }
}

///////////////////////////////////////////////////////////////////////////////

function drawHUDText(text, pos, size=.1, color=WHITE, font='arial', textAlign='center', weight=400, style='', width, shadowScale=.07, outline)
{
    size *= mainCanvasSize.y;
    if (width)
        width *= mainCanvasSize.y;
    pos = pos.multiply(mainCanvasSize);
    
    const context = mainContext;
    context.lineCap = context.lineJoin = 'round';
    context.font = `${style} ${weight} ${size}px ${font}`;
    context.textAlign = textAlign;

    const shadowOffset = size*shadowScale;
    context.fillStyle = rgb(0,0,0,color.a);
    if (shadowOffset)
        context.fillText(text, pos.x+shadowOffset, pos.y+shadowOffset, width);

    context.lineWidth = outline;
    outline && context.strokeText(text, pos.x, pos.y, width);
    context.fillStyle = color;
    context.fillText(text, pos.x, pos.y, width);
}