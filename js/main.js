"use strict";
// Query HTML elements
const canvas = document.getElementById("webgl-canvas");
const settingsContainer = document.getElementById("settings");
// Camera data
let cameraSettings = {
    projectionType: "perspective",
    fieldOfView: 90,
    nearClippingPlaneDistance: 1,
    farClippingPlaneDistance: 50,
    orthographicDistance: 20,
};
let fieldset = new GUI.CustomFieldset("Camera settings", cameraSettings, {
    projectionType: { options: ["perspective", "orthographic"] },
    fieldOfView: { min: 0, max: 180, format: (n) => n.toFixed(0) + "°" },
    nearClippingPlaneDistance: { min: 1, max: 100 },
    farClippingPlaneDistance: { min: 1, max: 100 },
    orthographicDistance: { min: 1, max: 100 },
});
settingsContainer.append(fieldset);
// Cube data
let cubeMesh = Mesh.createCubeMesh();
let cubeInstances = 5;
let cubePositions = Array.from({ length: cubeInstances }, (_, i) => [
    (Math.random() - 0.5) * 50,
    (Math.random() - 0.5) * 50,
    (Math.random() - 0.5) * 50,
]).flat();
let cubeSettings = {
    mesh: cubeMesh,
    instanceCount: cubeInstances,
    instanceOffsets: cubePositions,
};
// Sphere data
let sphereMesh = Mesh.createSphereMesh(3, 6);
let sphereInstances = 10;
let spherePositions = Array.from({ length: sphereInstances }, (_, i) => [
    (Math.random() - 0.5) * 50,
    (Math.random() - 0.5) * 50,
    (Math.random() - 0.5) * 50,
]).flat();
let sphereSettings = {
    mesh: sphereMesh,
    instanceCount: sphereInstances,
    instanceOffsets: spherePositions,
};
let scene;
async function main() {
    // Shader program data
    let programSource = {
        vertex: await (await fetch("shaders/vert.glsl")).text(),
        fragment: await (await fetch("shaders/frag.glsl")).text(),
    };
    // Create scene
    scene = new Scene(canvas, programSource, cameraSettings, [
        cubeSettings,
        sphereSettings,
    ]);
    console.dir(scene);
    // Start the animation
    scene.draw();
    window.onresize = function () {
        if (Math.abs(canvas.width - window.innerWidth) > 30)
            canvas.width = window.innerWidth;
        if (Math.abs(canvas.height - window.innerHeight) > 30)
            canvas.height = window.innerHeight;
    };
}
main();
