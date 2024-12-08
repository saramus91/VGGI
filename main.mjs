'use strict';

import { TrackballRotator } from './Utils/trackball-rotator.mjs';
import { Model } from './model.mjs';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

let uResolution = 24;
let vResolution = 20;

// Constructor
class ShaderProgram {
    constructor(name, program) {
        this.name = name;
        this.prog = program;

        // Location of the attribute variable in the shader program.
        this.iAttribVertex = -1;
        this.iAttribNormal = -1;
        this.iModelViewProjectionMatrix = -1;
        this.iModelViewMatrix = -1;
        this.iNormalMatrix = -1;
        this.iLightPos = -1;
    }
    Use() {
        gl.useProgram(this.prog);
    }
}

function mat3FromMat4(m) {
    return [
        m[0], m[1], m[2],
        m[4], m[5], m[6],
        m[8], m[9], m[10]
    ];
}

/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }

    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh,fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }

    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog,fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI/8, 1, 8, 12);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let translateToPointZero = m4.translation(0,0,-10);
    let mv = m4.multiply(translateToPointZero, m4.multiply(rotateToPointZero, modelView));
    let mvp = m4.multiply(projection, mv);

    let normalMatrix = m4.inverse(mv);
    normalMatrix = m4.transpose(normalMatrix);
    let nMat3 = mat3FromMat4(normalMatrix);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, mvp);
    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, mv);
    gl.uniformMatrix3fv(shProgram.iNormalMatrix, false, nMat3);

    let time = performance.now() * 0.001;
    let lightPos = [5*Math.cos(time), 5*Math.sin(time), 5];
    gl.uniform3fv(shProgram.iLightPos, lightPos);

    surface.Draw();
}

function initGL() {
    // vertexShaderSource та fragmentShaderSource визначені в shader.gpu як глобальні змінні
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    shProgram = new ShaderProgram('Gouraud', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "aVertexPosition");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "aVertexNormal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "uMVPMatrix");
    shProgram.iModelViewMatrix = gl.getUniformLocation(prog, "uMVMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "uNormalMatrix");
    shProgram.iLightPos = gl.getUniformLocation(prog, "uLightPos");

    surface = new Model(gl, shProgram);
    surface.CreateSurfaceData(uResolution, vResolution);

    gl.enable(gl.DEPTH_TEST);
}

function updateSliders() {
    let uVal = document.getElementById("uRes").value;
    let vVal = document.getElementById("vRes").value;
    uResolution = parseInt(uVal);
    vResolution = parseInt(vVal);
    update();
}

function update(){
    surface.CreateSurfaceData(uResolution, vResolution);
    draw();
}

/**
 * initialization function that will be called when the page has loaded
 */
export function init() {
    let canvas = document.getElementById("webglcanvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Could not get a WebGL context.</p>";
        return;
    }

    initGL();
    spaceball = new TrackballRotator(canvas, draw, 0);

    document.getElementById("uRes").oninput = updateSliders;
    document.getElementById("vRes").oninput = updateSliders;

    draw();
}
