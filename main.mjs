'use strict';

import { TrackballRotator } from './Utils/trackball-rotator.mjs';
import { Model } from './model.mjs';
import { LightModel } from './lightModel.mjs';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let lightSphere;

let pivotProgram;
let pivotSphere;

let uResolution = 24;
let vResolution = 20;

let lightRadiusVal = 10.0;
let lightAzimuthDeg = 45.0;
let lightElevationDeg = 30.0;

let diffuseTexture;
let specularTexture;
let normalTexture;

let pivotU = 0.5;
let pivotV = 0.5;
let texScale = 1.0;

class ShaderProgram {
    constructor(name, program) {
        this.name = name;
        this.prog = program;
        this.iAttribVertex = -1;
        this.iAttribNormal = -1;
        this.iAttribTexCoord = -1;
        this.iAttribTangent = -1;
        this.iAttribBitangent = -1;

        this.iModelMatrix = -1;
        this.iViewMatrix = -1;
        this.iProjectionMatrix = -1;
        this.iNormalMatrix = -1;
        this.iLightPosWorld = -1;

        this.iDiffuseMap = -1;
        this.iSpecularMap = -1;
        this.iNormalMap = -1;

        this.iTexScale = -1;
        this.iTexPivot = -1;
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

function getSurfacePoint(uParam, vParam) {
    let U = uParam * 2.0 * Math.PI;
    let tMin = -2.0;
    let tMax = 2.0;
    let T = tMin + vParam * (tMax - tMin);

    let a = 2.0;
    let c = 1.5;
    let theta = Math.PI / 8;
    let scaleVal = 0.2;

    let x = scaleVal * (a + T*Math.cos(theta) + c*T*T*Math.sin(theta)) * Math.cos(U);
    let y = scaleVal * (a + T*Math.cos(theta) + c*T*T*Math.sin(theta)) * Math.sin(U);
    let z = scaleVal * (-T*Math.sin(theta) + c*T*T*Math.cos(theta));
    return [x,y,z];
}

function draw() {
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shProgram.Use();

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

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);
    gl.uniform1i(shProgram.iDiffuseMap, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, specularTexture);
    gl.uniform1i(shProgram.iSpecularMap, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, normalTexture);
    gl.uniform1i(shProgram.iNormalMap, 2);

    gl.uniform1f(shProgram.iTexScale, texScale);
    gl.uniform2f(shProgram.iTexPivot, pivotU, pivotV);

    surface.Draw();

    let lightSphereModelMatrix = m4.translation(lightPosWorld[0], lightPosWorld[1], lightPosWorld[2]);
    gl.uniformMatrix4fv(shProgram.iModelMatrix, false, lightSphereModelMatrix);

    let nMat3_sphere = mat3FromMat4(m4.transpose(m4.inverse(lightSphereModelMatrix)));
    gl.uniformMatrix3fv(shProgram.iNormalMatrix, false, nMat3_sphere);

    lightSphere.Draw();

    gl.uniformMatrix4fv(shProgram.iModelMatrix, false, modelMatrix);
    gl.uniformMatrix3fv(shProgram.iNormalMatrix, false, nMat3);

    pivotProgram.Use();

    gl.uniformMatrix4fv(pivotProgram.iProjectionMatrix, false, projection);
    gl.uniformMatrix4fv(pivotProgram.iViewMatrix, false, viewMatrix);

    let pivotXYZ = getSurfacePoint(pivotU, pivotV);
    let pivotMatrix = m4.translation(pivotXYZ[0], pivotXYZ[1], pivotXYZ[2]);
    gl.uniformMatrix4fv(pivotProgram.iModelMatrix, false, pivotMatrix);

    pivotSphere.Draw();
}

function initTextures() {
    function loadTexture(url) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([255, 255, 255, 255]);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            width, height, border, srcFormat, srcType,
            pixel);

        const image = new Image();
        image.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                srcFormat, srcType, image);

            gl.generateMipmap(gl.TEXTURE_2D);
        };
        image.src = url;
        return texture;
    }

    diffuseTexture = loadTexture('/textures/diffuse.jpg');
    specularTexture = loadTexture('/textures/specular.jpg');
    normalTexture = loadTexture('/textures/normal.jpg');
}

function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    shProgram = new ShaderProgram('Main', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "aVertexPosition");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "aVertexNormal");
    shProgram.iAttribTexCoord = gl.getAttribLocation(prog, "aTexCoord");
    shProgram.iAttribTangent = gl.getAttribLocation(prog, "aTangent");
    shProgram.iAttribBitangent = gl.getAttribLocation(prog, "aBitangent");

    shProgram.iModelMatrix = gl.getUniformLocation(prog, "uModelMatrix");
    shProgram.iViewMatrix = gl.getUniformLocation(prog, "uViewMatrix");
    shProgram.iProjectionMatrix = gl.getUniformLocation(prog, "uProjectionMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "uNormalMatrix");
    shProgram.iLightPosWorld = gl.getUniformLocation(prog, "uLightPosWorld");

    shProgram.iDiffuseMap = gl.getUniformLocation(prog, "uDiffuseMap");
    shProgram.iSpecularMap = gl.getUniformLocation(prog, "uSpecularMap");
    shProgram.iNormalMap = gl.getUniformLocation(prog, "uNormalMap");

    shProgram.iTexScale = gl.getUniformLocation(prog, "uTexScale");
    shProgram.iTexPivot = gl.getUniformLocation(prog, "uTexPivot");

    surface = new Model(gl, shProgram);
    surface.CreateSurfaceData(uResolution, vResolution);

    lightSphere = new LightModel(gl, shProgram);
    lightSphere.CreateSphereData(0.1, 16, 16);

    gl.enable(gl.DEPTH_TEST);

    initTextures();
}

function initPivotProgram() {
    let prog = createProgram(gl, pivotVertexShaderSource, pivotFragmentShaderSource);
    pivotProgram = new ShaderProgram('Pivot', prog);
    pivotProgram.Use();

    pivotProgram.iAttribVertex = gl.getAttribLocation(prog, "aVertexPosition");

    pivotProgram.iModelMatrix = gl.getUniformLocation(prog, "uModelMatrix");
    pivotProgram.iViewMatrix = gl.getUniformLocation(prog, "uViewMatrix");
    pivotProgram.iProjectionMatrix = gl.getUniformLocation(prog, "uProjectionMatrix");

    pivotSphere = new LightModel(gl, pivotProgram);
    pivotSphere.CreateSphereData(0.1, 16, 16);
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

function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'KeyA':
                pivotU -= 0.01;
                break;
            case 'KeyD':
                pivotU += 0.01;
                break;
            case 'KeyW':
                pivotV += 0.01;
                break;
            case 'KeyS':
                pivotV -= 0.01;
                break;
            case 'KeyQ':
                texScale -= 0.05;
                break;
            case 'KeyE':
                texScale += 0.05;
                break;
        }
        if (pivotU < 0) pivotU = 0; if (pivotU>1) pivotU = 1;
        if (pivotV < 0) pivotV = 0; if (pivotV>1) pivotV = 1;
        if (texScale < 0.1) texScale = 0.1;
        if (texScale > 5.0)  texScale = 5.0;

        draw();
    });
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
    initPivotProgram();

    spaceball = new TrackballRotator(canvas, draw, 0);

    document.getElementById("uRes").oninput = updateSliders;
    document.getElementById("vRes").oninput = updateSliders;

    document.getElementById("lightRadius").oninput = updateLightParams;
    document.getElementById("lightAzimuth").oninput = updateLightParams;
    document.getElementById("lightElevation").oninput = updateLightParams;

    initKeyboard();
    draw();
}
