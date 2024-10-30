function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    };

    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    };

    this.CreateSurfaceData = function() {
        let vertexList = [];
        const a = 2;
        const c = 1.5;
        const theta = Math.PI / 8;
        const scale = 0.2;

        for (let u = 0; u <= 2 * Math.PI; u += Math.PI / 24) {
            for (let t = -2; t <= 2; t += 0.2) {
                const x = scale * (a + t * Math.cos(theta) + c * t * t * Math.sin(theta)) * Math.cos(u);
                const y = scale * (a + t * Math.cos(theta) + c * t * t * Math.sin(theta)) * Math.sin(u);
                const z = scale * (-t * Math.sin(theta) + c * t * t * Math.cos(theta));
                vertexList.push(x, y, z);
            }
        }

        for (let t = -2; t <= 2; t += 0.2) {
            for (let u = 0; u <= 2 * Math.PI; u += Math.PI / 24) {
                const x = scale * (a + t * Math.cos(theta) + c * t * t * Math.sin(theta)) * Math.cos(u);
                const y = scale * (a + t * Math.cos(theta) + c * t * t * Math.sin(theta)) * Math.sin(u);
                const z = scale * (-t * Math.sin(theta) + c * t * t * Math.cos(theta));
                vertexList.push(x, y, z);
            }
        }

        this.BufferData(vertexList);
    };
}
