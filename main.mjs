'use strict';

import { TrackballRotator } from './Utils/trackball-rotator.mjs';
import { Model } from './model.mjs';
import { LightModel } from './lightModel.mjs';


let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let lightSphere;

let uResolution = 24;
let vResolution = 20;

let lightRadiusVal = 10.0;
let lightAzimuthDeg = 45.0;
let lightElevationDeg = 30.0;

class ShaderProgram {
    constructor(name, program) {
        this.name = name;
        this.prog = program;
        this.iAttribVertex = -1;
        this.iAttribNormal = -1;

        this.iModelMatrix = -1;
        this.iViewMatrix = -1;
        this.iProjectionMatrix = -1;
        this.iNormalMatrix = -1;
        this.iLightPosWorld = -1;
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

function getLightPosition() {
    let azimuthRad = lightAzimuthDeg * Math.PI/180.0;
    let elevationRad = lightElevationDeg * Math.PI/180.0;

    let x = lightRadiusVal * Math.cos(elevationRad)*Math.cos(azimuthRad);
    let y = lightRadiusVal * Math.cos(elevationRad)*Math.sin(azimuthRad);
    let z = lightRadiusVal * Math.sin(elevationRad);
    return [x,y,z];
}

function draw() {
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let projection = m4.perspective(Math.PI/6, 1, 1, 50);
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection);

    let viewMatrix = m4.translation(0,0,-15);
    gl.uniformMatrix4fv(shProgram.iViewMatrix, false, viewMatrix);

    let modelRotation = spaceball.getViewMatrix();
    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let modelMatrix = m4.multiply(rotateToPointZero, modelRotation);
    gl.uniformMatrix4fv(shProgram.iModelMatrix, false, modelMatrix);

    let normalMatrix = m4.inverse(modelMatrix);
    normalMatrix = m4.transpose(normalMatrix);
    let nMat3 = mat3FromMat4(normalMatrix);
    gl.uniformMatrix3fv(shProgram.iNormalMatrix, false, nMat3);

    let lightPosWorld = getLightPosition();
    gl.uniform3fv(shProgram.iLightPosWorld, lightPosWorld);

    surface.Draw();

    let lightSphereModelMatrix = m4.translation(lightPosWorld[0], lightPosWorld[1], lightPosWorld[2]);
    gl.uniformMatrix4fv(shProgram.iModelMatrix, false, lightSphereModelMatrix);

    let nMat3_sphere = mat3FromMat4(m4.transpose(m4.inverse(lightSphereModelMatrix)));
    gl.uniformMatrix3fv(shProgram.iNormalMatrix, false, nMat3_sphere);

    lightSphere.Draw();

    gl.uniformMatrix4fv(shProgram.iModelMatrix, false, modelMatrix);
    gl.uniformMatrix3fv(shProgram.iNormalMatrix, false, nMat3);
}

function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    shProgram = new ShaderProgram('Gouraud', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "aVertexPosition");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "aVertexNormal");
    shProgram.iModelMatrix = gl.getUniformLocation(prog, "uModelMatrix");
    shProgram.iViewMatrix = gl.getUniformLocation(prog, "uViewMatrix");
    shProgram.iProjectionMatrix = gl.getUniformLocation(prog, "uProjectionMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "uNormalMatrix");
    shProgram.iLightPosWorld = gl.getUniformLocation(prog, "uLightPosWorld");

    surface = new Model(gl, shProgram);
    surface.CreateSurfaceData(uResolution, vResolution);

    lightSphere = new LightModel(gl, shProgram);
    lightSphere.CreateSphereData(0.1, 16, 16);

    gl.enable(gl.DEPTH_TEST);
}

function updateSliders() {
    let uVal = document.getElementById("uRes").value;
    let vVal = document.getElementById("vRes").value;
    uResolution = parseInt(uVal);
    vResolution = parseInt(vVal);
    surface.CreateSurfaceData(uResolution, vResolution);
    draw();
}

function updateLightParams() {
    lightRadiusVal = parseFloat(document.getElementById("lightRadius").value);
    lightAzimuthDeg = parseFloat(document.getElementById("lightAzimuth").value);
    lightElevationDeg = parseFloat(document.getElementById("lightElevation").value);
    draw();
}

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

    document.getElementById("lightRadius").oninput = updateLightParams;
    document.getElementById("lightAzimuth").oninput = updateLightParams;
    document.getElementById("lightElevation").oninput = updateLightParams;

    draw();
}
