export class Model {
    constructor(gl, shProgram) {
        this.gl = gl;
        this.shProgram = shProgram;
        this.iVertexBuffer = gl.createBuffer();
        this.iNormalBuffer = gl.createBuffer();
        this.iIndexBuffer = gl.createBuffer();
        this.iTexCoordBuffer = gl.createBuffer();
        this.iTangentBuffer = gl.createBuffer();
        this.iBitangentBuffer = gl.createBuffer();
        this.numIndices = 0;
    }

    CreateSurfaceData(uResolution, vResolution) {
        let gl = this.gl;
        let a = 2;
        let c = 1.5;
        let theta = Math.PI / 8;
        let scale = 0.2;

        function X(u,t) {
            let x = scale * (a + t*Math.cos(theta) + c*t*t*Math.sin(theta))*Math.cos(u);
            let y = scale * (a + t*Math.cos(theta) + c*t*t*Math.sin(theta))*Math.sin(u);
            let z = scale * (-t*Math.sin(theta) + c*t*t*Math.cos(theta));
            return [x,y,z];
        }

        function Xu(u,t) {
            let common = (a + t*Math.cos(theta) + c*t*t*Math.sin(theta));
            let dux = scale * (-common*Math.sin(u));
            let duy = scale * (common*Math.cos(u));
            let duz = 0.0;
            return [dux, duy, duz];
        }

        function Xt(u,t) {
            let dCommon_dt = Math.cos(theta) + 2*c*t*Math.sin(theta);
            let dx = scale * (dCommon_dt*Math.cos(u));
            let dy = scale * (dCommon_dt*Math.sin(u));
            let dz = scale * (-Math.sin(theta) + 2*c*t*Math.cos(theta));
            return [dx,dy,dz];
        }

        let uMax = 2*Math.PI;
        let tMin = -2;
        let tMax = 2;

        let du = uMax / uResolution;
        let dt = (tMax - tMin)/vResolution;

        let vertices = [];
        let normals = [];
        let indices = [];
        let texCoords = [];
        let tangents = [];
        let bitangents = [];

        for (let i=0; i<=uResolution; i++){
            let U = i*du;
            let uTex = i / uResolution;
            for (let j=0; j<=vResolution; j++){
                let T = tMin + j*dt;
                let vTex = (T - tMin) / (tMax - tMin);

                let pos = X(U,T);
                vertices.push(pos[0], pos[1], pos[2]);

                let xu = Xu(U,T);
                let xt = Xt(U,T);
                let nx = xu[1]*xt[2]-xu[2]*xt[1];
                let ny = xu[2]*xt[0]-xu[0]*xt[2];
                let nz = xu[0]*xt[1]-xu[1]*xt[0];
                let len = Math.sqrt(nx*nx+ny*ny+nz*nz);
                nx/=len; ny/=len; nz/=len;
                normals.push(nx, ny, nz);


                let tLen = Math.sqrt(xu[0]*xu[0]+xu[1]*xu[1]+xu[2]*xu[2]);
                let Tn = [xu[0]/tLen, xu[1]/tLen, xu[2]/tLen];
                let bLen = Math.sqrt(xt[0]*xt[0]+xt[1]*xt[1]+xt[2]*xt[2]);
                let Bn = [xt[0]/bLen, xt[1]/bLen, xt[2]/bLen];

                tangents.push(Tn[0], Tn[1], Tn[2]);
                bitangents.push(Bn[0], Bn[1], Bn[2]);

                texCoords.push(uTex, vTex);
            }
        }

        for (let i=0; i<uResolution; i++){
            for (let j=0; j<vResolution; j++){
                let i0 = i*(vResolution+1)+j;
                let i1 = i0+1;
                let i2 = (i+1)*(vResolution+1)+j;
                let i3 = i2+1;
                indices.push(i0, i2, i1);
                indices.push(i1, i2, i3);
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tangents), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iBitangentBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bitangents), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        this.numIndices = indices.length;
    }

    Draw() {
        let gl = this.gl;
        let sh = this.shProgram;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.enableVertexAttribArray(sh.iAttribVertex);
        gl.vertexAttribPointer(sh.iAttribVertex, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.enableVertexAttribArray(sh.iAttribNormal);
        gl.vertexAttribPointer(sh.iAttribNormal, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
        gl.enableVertexAttribArray(sh.iAttribTexCoord);
        gl.vertexAttribPointer(sh.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
        gl.enableVertexAttribArray(sh.iAttribTangent);
        gl.vertexAttribPointer(sh.iAttribTangent, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iBitangentBuffer);
        gl.enableVertexAttribArray(sh.iAttribBitangent);
        gl.vertexAttribPointer(sh.iAttribBitangent, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
    }
}
