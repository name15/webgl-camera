"use strict";
// Fetch HTML elements
const canvas = document.getElementById("webgl-canvas");
const perspectiveCheckbox = document.getElementById("perspective");
const fieldOfViewSlider = document.getElementById("field_of_view");
const fieldOfViewSpan = document.getElementById("field_of_view_value");
function fetchFile(url) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    return new Promise((resolve) => {
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                let status = xhr.status;
                if (status === 0 || (status >= 200 && status < 400)) {
                    resolve(xhr.responseText); // The request has been completed successfully
                }
            }
        };
        xhr.send();
    });
}
async function main() {
    // Shader program data
    let programSource = {
        vertex: await fetchFile("shaders/vert.glsl"),
        fragment: await fetchFile("shaders/frag.glsl"),
    };
    // Camera data
    let cameraSettings = {
        projectionType: perspectiveCheckbox.checked
            ? "perspective"
            : "orthographic",
        fieldOfView: (parseFloat(fieldOfViewSlider.value) * Math.PI) / 180,
        nearClippingPlaneDistance: 1,
        farClippingPlaneDistance: 50,
        topPlaneDistance: 20,
    };
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
    // Spheres data
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
    const scene = new Scene(canvas, programSource, cameraSettings, [
        cubeSettings,
        sphereSettings,
    ]);
    console.dir(scene);
    scene.draw();
    perspectiveCheckbox.oninput = function () {
        scene.camera.projectionType = perspectiveCheckbox.checked
            ? "perspective"
            : "orthographic";
        fieldOfViewSlider.disabled = !perspectiveCheckbox.checked;
    };
    fieldOfViewSlider.oninput = function () {
        scene.camera.fieldOfView =
            (parseFloat(fieldOfViewSlider.value) * Math.PI) / 180;
        fieldOfViewSpan.textContent = fieldOfViewSlider.value + "°";
    };
    window.onresize = function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
}
main();
