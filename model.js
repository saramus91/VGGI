function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();

    this.BufferData = function(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    };

    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        for (let i = 0; i < this.uLineCount; i++) {
            gl.drawArrays(gl.LINE_STRIP, i * this.pointsPerULine, this.pointsPerULine);
        }

        for (let i = 0; i < this.vLineCount; i++) {
            gl.drawArrays(gl.LINE_STRIP, (this.uLineCount * this.pointsPerULine) + i * this.pointsPerVLine, this.pointsPerVLine);
        }
    };

    this.CreateSurfaceData = function() {
        const a = 2;
        const c = 1.5;
        const theta = Math.PI / 8;
        const scale = 0.2;
        this.vertexList = [];

        this.uLineCount = Math.floor((2 * Math.PI) / (Math.PI / 24)) + 1;
        this.pointsPerULine = Math.floor(4 / 0.2) + 1;
        
        for (let u = 0; u <= 2 * Math.PI; u += Math.PI / 24) {
            for (let t = -2; t <= 2; t += 0.2) {
                const x = scale * (a + t * Math.cos(theta) + c * t * t * Math.sin(theta)) * Math.cos(u);
                const y = scale * (a + t * Math.cos(theta) + c * t * t * Math.sin(theta)) * Math.sin(u);
                const z = scale * (-t * Math.sin(theta) + c * t * t * Math.cos(theta));
                this.vertexList.push(x, y, z);
            }
        }

        this.vLineCount = Math.floor(4 / 0.2) + 1;
        this.pointsPerVLine = Math.floor((2 * Math.PI) / (Math.PI / 24)) + 1;
        
        for (let t = -2; t <= 2; t += 0.2) {
            for (let u = 0; u <= 2 * Math.PI; u += Math.PI / 24) {
                const x = scale * (a + t * Math.cos(theta) + c * t * t * Math.sin(theta)) * Math.cos(u);
                const y = scale * (a + t * Math.cos(theta) + c * t * t * Math.sin(theta)) * Math.sin(u);
                const z = scale * (-t * Math.sin(theta) + c * t * t * Math.cos(theta));
                this.vertexList.push(x, y, z);
            }
        }

        this.BufferData(this.vertexList);
    };
}
