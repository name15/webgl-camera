"use strict";
class Scene {
    constructor(canvas, programSource, cameraSettings, objectSettings) {
        this.canvas = canvas;
        this.objects = [];
        // Prepare the canvas
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Get a rendering context
        let gl2, gl1;
        gl2 = canvas.getContext("webgl2");
        if (!gl2) {
            gl1 = canvas.getContext("webgl");
            if (!gl1)
                throw "Could not initialize WebGL rendering context. Does your browser support it?";
            else
                this.gl = gl1;
        }
        else {
            this.gl = gl2;
        }
        // Create a shader program
        this.program = new ShaderProgram(this.gl, programSource, ["position", "color", "offset"], ["model", "view", "projection"], [this.gl.DEPTH_TEST, this.gl.CULL_FACE]);
        // Create the camera
        this.camera = new Camera(cameraSettings);
        // Setup the objects
        for (let settings of objectSettings) {
            // Create model transform matrices and
            // setup buffers of all 3d objects
            let object = new Object3D(this.gl, settings);
            this.objects.push(object);
        }
    }
    draw() {
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.useProgram(this.program.webglProgram);
        this.camera.updateAttributesAndUniforms(gl, this.program, Date.now(), this.canvas.width / this.canvas.height);
        // Draw all objects
        for (let object of this.objects) {
            object.updateAttributesAndUniforms(gl, this.program);
            // Finally, perform the actual rendering
            if (gl instanceof WebGL2RenderingContext) {
                // If WebGL2 rendering context is available,
                // batch the draw calls
                gl.drawElementsInstanced(gl.TRIANGLES, object.mesh.elements.length, gl.UNSIGNED_SHORT, 0, object.instanceCount);
            }
            else if (gl instanceof WebGLRenderingContext) {
                // If running WebGl version 1,
                // do the draw calls separately (slower)
                for (let i = 0; i < object.instanceCount; i++) {
                    let model = object.instanceModelMatricies[i];
                    // TODO
                    gl.uniformMatrix4fv(this.program.uniforms.model, false, new Float32Array(model));
                    gl.drawElements(gl.TRIANGLES, object.mesh.elements.length, gl.UNSIGNED_SHORT, 0);
                }
            }
        }
        // Run the draw as a loop
        requestAnimationFrame(this.draw.bind(this));
    }
}
class ShaderProgram {
    constructor(gl, source, attributes, uniforms, enable = []) {
        this.source = source;
        let vertexShader = ShaderProgram.compileShader(gl, gl.VERTEX_SHADER, source.vertex);
        let fragmentShader = ShaderProgram.compileShader(gl, gl.FRAGMENT_SHADER, source.fragment);
        this.webglProgram = ShaderProgram.linkProgram(gl, vertexShader, fragmentShader);
        // Save tha attribute locations
        this.attributes = {};
        for (let name of attributes) {
            this.attributes[name] = gl.getAttribLocation(this.webglProgram, name);
        }
        // Save the uniform locations
        this.uniforms = {};
        for (let name of uniforms) {
            this.uniforms[name] = gl.getUniformLocation(this.webglProgram, name);
        }
        // Enable features such as depth desting or face culling
        for (let cap of enable) {
            gl.enable(cap);
        }
    }
    static compileShader(gl, type, source) {
        let shader = gl.createShader(type);
        if (!shader)
            throw "Could not create shader.";
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success)
            return shader;
        let infoLog = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw "Could not compile shader: \n\n" + infoLog;
    }
    static linkProgram(gl, vertexShader, fragmentShader) {
        let program = gl.createProgram();
        if (!program)
            throw "Could not create program.";
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        let success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success)
            return program;
        let infoLog = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw "Could not link shaders into a program. \n\n" + infoLog;
    }
}
class Camera {
    constructor(settings) {
        this.settings = settings;
        this.matrices = {
            // TODO
            projectionMatrix: [],
            viewMatrix: [],
        };
    }
    updateAttributesAndUniforms(gl, program, time, aspectRatio) {
        // Step 1: Compute the view matrix
        let zoomInAndOut = 2 * Math.sin(time * 0.002);
        // Move slightly down
        let distance = -25;
        let position = Math3D.translateMatrix(0, 0, distance + zoomInAndOut);
        // Rotate a slightly
        let rotateY = Math3D.rotateYMatrix(-0.3);
        // Rotate according to time
        let rotateZWithTime = Math3D.rotateZMatrix(time * 0.0007);
        let rotateXWithTime = Math3D.rotateXMatrix(time * 0.0003);
        // Multiply together, make sure and read them in opposite order
        this.matrices.viewMatrix = Math3D.multiplyArrayOfMatrices([
            position,
            rotateY,
            rotateXWithTime,
            rotateZWithTime, // step 1
        ]);
        // Set the view matrix
        gl.uniformMatrix4fv(program.uniforms.view, false, new Float32Array(this.matrices.viewMatrix));
        // Step 2: Compute the projection matrix
        let top = this.settings.orthographicDistance;
        let right = this.settings.orthographicDistance * aspectRatio;
        if (this.settings.projectionType === "perspective") {
            this.matrices.projectionMatrix = Math3D.perspectiveMatrix((this.settings.fieldOfView * Math.PI) / 180, aspectRatio, this.settings.nearClippingPlaneDistance, this.settings.farClippingPlaneDistance);
        }
        else if (this.settings.projectionType === "orthographic") {
            this.matrices.projectionMatrix = Math3D.orthographicMatrix(-right, right, -top, top, this.settings.nearClippingPlaneDistance, this.settings.farClippingPlaneDistance);
        }
        else {
            throw `Unsupported projection type '${this.settings.projectionType}'`;
        }
        // Set the projection matrix
        gl.uniformMatrix4fv(program.uniforms.projection, false, new Float32Array(this.matrices.projectionMatrix));
    }
}
class Object3D {
    constructor(gl, settings) {
        this.mesh = settings.mesh;
        this.instanceCount = settings.instanceCount;
        this.instanceOffsets = settings.instanceOffsets;
        // Create transform matrices
        this.modelMatrix = Math3D.scaleMatrix(5, 5, 5); // Scale up by a certain factor
        // If running WebGL version 1, perform the
        // matrix multiplication here
        if (gl instanceof WebGLRenderingContext) {
            this.instanceModelMatricies = Array.from({ length: this.instanceCount }, (_, i) => Math3D.multiplyMatrices(Math3D.translateMatrix(this.instanceOffsets[i * 3], this.instanceOffsets[i * 3 + 1], this.instanceOffsets[i * 3 + 2]), this.modelMatrix));
        }
        // Create position, element, color and offset buffers
        let positions = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positions);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.positions), gl.STATIC_DRAW);
        let colors = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colors);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.colors), gl.STATIC_DRAW);
        let elements = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.mesh.elements), gl.STATIC_DRAW);
        this.buffers = {
            positions: positions,
            colors: colors,
            elements: elements,
        };
        if (gl instanceof WebGL2RenderingContext) {
            let offsets = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, offsets);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.instanceOffsets), gl.STATIC_DRAW);
            this.buffers.offsets = offsets;
        }
    }
    updateAttributesAndUniforms(gl, program) {
        // Setup the model matrix if using webgl2
        // With WebGL version 1 the matrix multiplication will be performed with JS
        if (gl instanceof WebGL2RenderingContext) {
            gl.uniformMatrix4fv(program.uniforms.model, false, new Float32Array(this.modelMatrix));
        }
        // Set the positions attribute
        gl.enableVertexAttribArray(program.attributes.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positions);
        gl.vertexAttribPointer(program.attributes.position, 3, gl.FLOAT, false, 0, 0);
        // Set the colors attribute
        gl.enableVertexAttribArray(program.attributes.color);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.colors);
        gl.vertexAttribPointer(program.attributes.color, 4, gl.FLOAT, false, 0, 0);
        if (gl instanceof WebGL2RenderingContext) {
            // Set the offset attribute
            gl.enableVertexAttribArray(program.attributes.offset);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.offsets);
            gl.vertexAttribPointer(program.attributes.offset, 3, gl.FLOAT, false, 0, 0);
            gl.vertexAttribDivisor(program.attributes.offset, 1); // IMPORTANT
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.elements);
    }
}
