export class LightModel {
    constructor(gl, shProgram) {
        this.gl = gl;
        this.shProgram = shProgram;
        this.iVertexBuffer = gl.createBuffer();
        this.iNormalBuffer = gl.createBuffer();
        this.iIndexBuffer = gl.createBuffer();
        this.numIndices = 0;
    }

    CreateSphereData(radius, uResolution, vResolution) {
        let gl = this.gl;

        let vertices = [];
        let normals = [];
        let indices = [];

        for (let i = 0; i <= uResolution; i++) {
            let theta = i * Math.PI / uResolution;
            for (let j = 0; j <= vResolution; j++) {
                let phi = j * 2 * Math.PI / vResolution;

                let x = radius * Math.sin(theta) * Math.cos(phi);
                let y = radius * Math.sin(theta) * Math.sin(phi);
                let z = radius * Math.cos(theta);

                vertices.push(x,y,z);
                let len = Math.sqrt(x*x+y*y+z*z);
                normals.push(x/len, y/len, z/len);
            }
        }

        for (let i = 0; i < uResolution; i++) {
            for (let j = 0; j < vResolution; j++) {
                let i0 = i*(vResolution+1)+j;
                let i1 = i0+1;
                let i2 = (i+1)*(vResolution+1)+j;
                let i3 = i2+1;
                indices.push(i0,i2,i1);
                indices.push(i1,i2,i3);
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        this.numIndices = indices.length;
    }

    Draw() {
        let gl = this.gl;
        let sh = this.shProgram;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.enableVertexAttribArray(sh.iAttribVertex);
        gl.vertexAttribPointer(sh.iAttribVertex,3,gl.FLOAT,false,0,0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.enableVertexAttribArray(sh.iAttribNormal);
        gl.vertexAttribPointer(sh.iAttribNormal,3,gl.FLOAT,false,0,0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT,0);
    }
}
