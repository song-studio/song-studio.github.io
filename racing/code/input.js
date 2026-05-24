'use strict';

const gamepadsEnable = enhancedMode;
const inputWASDEmulateDirection = enhancedMode;
const allowTouch = enhancedMode;
const isTouchDevice = allowTouch && window.ontouchstart !== undefined;
const touchGamepadEnable = enhancedMode;
const touchGamepadAlpha = .3;

///////////////////////////////////////////////////////////////////////////////
// Input user functions

const keyIsDown      = (key) => inputData[key] & 1; 
const keyWasPressed  = (key) => inputData[key] & 2 ? 1 : 0;
const keyWasReleased = (key) => inputData[key] & 4 ? 1 : 0;
const clearInput = () => inputData = [];

let mousePos = vec3();
const mouseIsDown      = keyIsDown;
const mouseWasPressed  = keyWasPressed;
const mouseWasReleased = keyWasReleased;

let isUsingGamepad;
const gamepadIsDown      = (key, gamepad=0) => !!(gamepadData[gamepad][key] & 1); 
const gamepadWasPressed  = (key, gamepad=0) => !!(gamepadData[gamepad][key] & 2); 
const gamepadWasReleased = (key, gamepad=0) => !!(gamepadData[gamepad][key] & 4); 
const gamepadStick       = (stick, gamepad=0) =>
    gamepadStickData[gamepad] ? gamepadStickData[gamepad][stick] || vec3() : vec3();
const gamepadGetValue    = (key, gamepad=0) => gamepadDataValues[gamepad][key]; 

///////////////////////////////////////////////////////////////////////////////
// Input event handlers

let inputData = []; // track what keys are down

function inputInit()
{
    if (gamepadsEnable)
    {
        gamepadData = [];
        gamepadStickData = [];
        gamepadDataValues = [];
        gamepadData[0] = [];
        gamepadDataValues[0] = [];
    }

    onkeydown = (e)=>
    {
        isUsingGamepad = 0;
        if (!e.repeat)
        {
            inputData[e.code] = 3;
            if (inputWASDEmulateDirection)
                inputData[remapKey(e.code)] = 3;
        }
    }

    onkeyup = (e)=>
    {
        inputData[e.code] = 4;
        if (inputWASDEmulateDirection)
            inputData[remapKey(e.code)] = 4;
    }
    
    // mouse event handlers
    onmousedown   = (e)=>
    {
        isUsingGamepad = 0;
        inputData[e.button] = 3; 
        mousePos = mouseToScreen(vec3(e.x,e.y)); 
    }
    onmouseup     = (e)=> inputData[e.button] = inputData[e.button] & 2 | 4;
    onmousemove   = (e)=>
    {
        mousePos = mouseToScreen(vec3(e.x,e.y));
        if (freeCamMode)
        {
            mouseDelta.x += e.movementX/mainCanvasSize.x;
            mouseDelta.y += e.movementY/mainCanvasSize.y;
        }
    }
    oncontextmenu = (e)=> false; // prevent right click menu

    // handle remapping wasd keys to directions
    const remapKey = (c) => inputWASDEmulateDirection ? 
        c == 'KeyW' ? 'ArrowUp' : 
        c == 'KeyS' ? 'ArrowDown' : 
        c == 'KeyA' ? 'ArrowLeft' : 
        c == 'KeyD' ? 'ArrowRight' : c : c;

    // init touch input
    isTouchDevice && touchInputInit();
}

function inputUpdate()
{
    // clear input when lost focus (prevent stuck keys)
    isTouchDevice || document.hasFocus() || clearInput();
    gamepadsEnable && gamepadsUpdate();
}

function inputUpdatePost()
{
    // clear input to prepare for next frame
    for (const i in inputData)
        inputData[i] &= 1;
}
    
// convert a mouse position to screen space
const mouseToScreen = (mousePos) =>
{
    if (rotatedMode)
        {
            // universal fallback: left half steers, right half accelerates
            if (touch.clientX < innerWidth * .5)
            {
                const steer = clamp((touch.clientX / (innerWidth * .5)) * 2 - 1, -1, 1);
                touchGamepadStick = vec3(steer, 0);
            }
            else
            {
                touchGamepadButtons[0] = 1;
            }
            return;

        let touchPos = mouseToScreen(vec3(touch.clientX, touch.clientY));
        touchPos = touchPos.multiply(mainCanvasSize);
        if (touchPos.distance(stickCenter) < gs)
        {
            // virtual analog stick
            touchGamepadStick = touchPos.subtract(stickCenter).scale(3/gs); // 3/gs = full steering at ~67% of circle
            touchGamepadStick.x = clamp(touchGamepadStick.x,-1,1);
            touchGamepadStick.y = clamp(touchGamepadStick.y,-1,1);
            if (rotatedMode)
                // rotate stick from canvas space to screen space
                // screen-up→canvas(-X) should be gas(Y-); screen-right→canvas(-Y) should be steer right(X+)
                touchGamepadStick = vec3(-touchGamepadStick.y, touchGamepadStick.x);
        }
        else if (touchPos.distance(buttonCenter) < gs)
        {
            // virtual face buttons
            const button = rotatedMode
                ? (touchPos.x < buttonCenter.x ? 0 : 1)
                : (touchPos.y > buttonCenter.y ? 1 : 0);
            touchGamepadButtons[button] = 1;
        }
        else if (touchPos.distance(startCenter) < gs)
        {
            // hidden virtual start button in center
            touchGamepadButtons[9] = 1;
        }
    }

    // call default touch handler so normal touch events still work
    //handleTouchDefault(e);

    // prevent default handling like copy and magnifier lens
    if (document.hasFocus()) // allow document to get focus
        e.preventDefault();
    
    // must return true so the document will get focus
    return true;
}

// update the touch gamepad, called automatically by the engine
function touchGamepadUpdate()
{
    if (!touchGamepadEnable)
        return;

    if (rotatedMode)
    {
        // physical screen is portrait — size buttons for the narrow screen
        const physW = innerWidth, physH = innerHeight;
        touchGamepadSize = clamp(min(physW, physH)/4.8, 88, 136);
        touchGamepadPadXMult = 1.0;
        touchGamepadPadYMult = 1.0;
        touchGamepadGSMult = 1.35;
    }
    else
    {
        // adjust size for orientation — prevent button overlap in portrait
        const portrait = mainCanvasSize.x < mainCanvasSize.y;
        const maxSize = portrait ? mainCanvasSize.x / 4.4 : mainCanvasSize.x / 2;
        touchGamepadSize = clamp(mainCanvasSize.y/7.2, 112, maxSize);
        // smaller multipliers in portrait so buttons fit side by side
        touchGamepadPadXMult = portrait ? 1.2 : 1.8;
        touchGamepadPadYMult = portrait ? 1.2 : 1.4;
        touchGamepadGSMult = portrait ? 1.3 : 1.8;
    }

    ASSERT(touchGamepadButtons, 'set touchGamepadEnable before calling init!');
    if (!touchGamepadTimer.isSet())
        return;
    
    // read virtual analog stick
    const sticks = gamepadStickData[0] || (gamepadStickData[0] = []);
    sticks[0] = touchGamepadStick.copy();

    // read virtual gamepad buttons
    const data = gamepadData[0];
    for (let i=10; i--;)
    {
        const wasDown = gamepadIsDown(i,0);
        data[i] = touchGamepadButtons[i] ? wasDown ? 1 : 3 : wasDown ? 4 : 0;
    }
}

// render the touch gamepad, called automatically by the engine
function touchGamepadRender()
{
    if (!touchGamepadEnable || !touchGamepadTimer.isSet())
        return;

    // fade off when not touching or paused
    const alpha = percent(touchGamepadTimer.get(), 4, 3);
    if (!alpha || paused)
        return;

    // setup the canvas
    const context = mainContext;
    context.save();
    context.globalAlpha = alpha*touchGamepadAlpha;
    context.strokeStyle = '#fff';
    context.lineWidth = 3;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // move buttons inward from edges (avoid notch, more comfortable reach)
    const padX = touchGamepadSize * touchGamepadPadXMult;
    const padY = touchGamepadSize * touchGamepadPadYMult;
    const btnSize = touchGamepadSize * touchGamepadGSMult;

    // draw left analog stick
    let leftCenter, rightCenter;
    if (rotatedMode)
    {
        leftCenter = vec3(mainCanvasSize.x - padY, mainCanvasSize.y - padX);
        rightCenter = vec3(mainCanvasSize.x - padY, padX);
    }
    else
    {
        leftCenter = vec3(padX, mainCanvasSize.y-padY);
        rightCenter = vec3(mainCanvasSize.x-padX, mainCanvasSize.y-padY);
    }
    context.fillStyle = touchGamepadStick.lengthSquared() > 0 ? '#fff' : '#000';
    context.beginPath();
    context.arc(leftCenter.x, leftCenter.y, btnSize/2, 0, 9);
    context.fill();
    context.stroke();

    // draw left/right arrows inside the stick area
    context.fillStyle = touchGamepadStick.lengthSquared() > 0 ? '#000' : '#fff';
    context.font = '900 '+(btnSize/3)+'px arial';
    context.fillText('◀', leftCenter.x-btnSize/4, leftCenter.y);
    context.fillText('▶', leftCenter.x+btnSize/4, leftCenter.y);

    // draw right gas button
    const gasRadius = btnSize/3;
    context.fillStyle = touchGamepadButtons[0] ? '#fff' : '#000';
    context.beginPath();
    context.arc(rightCenter.x, rightCenter.y-gasRadius, gasRadius, 0, 9);
    context.fill();
    context.stroke();
    context.fillStyle = touchGamepadButtons[0] ? '#000' : '#fff';
    context.font = '900 '+(btnSize/4)+'px arial';
    context.fillText('油', rightCenter.x, rightCenter.y-gasRadius);

    // set canvas back to normal
    context.restore();
}