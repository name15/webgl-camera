interface Mesh {
  positions: number[];
  elements: number[];
  colors: number[];
}

namespace Mesh {
  export const colorPalette = [
    [0.3, 1.0, 1.0, 1.0], // Front face: cyan
    [1.0, 0.3, 0.3, 1.0], // Back face: red
    [0.3, 1.0, 0.3, 1.0], // Top face: green
    [0.3, 0.3, 1.0, 1.0], // Bottom face: blue
    [1.0, 1.0, 0.3, 1.0], // Right face: yellow
    [1.0, 0.3, 1.0, 1.0], // Left face: purple
  ];

  export function getColor(i: number): number[] {
    return Mesh.colorPalette[i % Mesh.colorPalette.length];
  }

  export function createCubeMesh(): Mesh {
    let positions = [
        -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, // Front face
        -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, // Back face
        -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1, // Top face
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, // Bottom face
        1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, // Right face
        -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, // Left face
      ]; // prettier-ignore

    let colors: number[] = [];

    for (let j = 0; j < 6; j++) {
      let polygonColor = Mesh.getColor(j);

      for (let i = 0; i < 4; i++) {
        colors = colors.concat(polygonColor);
      }
    }

    let elements = [
        0, 1, 2, 0, 2, 3, // front
        4, 5, 6, 4, 6, 7, // back
        8, 9, 10, 8, 10, 11, // top
        12, 13, 14, 12, 14, 15, // bottom
        16, 17, 18, 16, 18, 19, // right
        20, 21, 22, 20, 22, 23, // left
      ]; // prettier-ignore

    return {
      positions: positions,
      elements: elements,
      colors: colors,
    };
  }

  export function createSphereMesh(parallels: number, meridians: number) {
    let vertices = [];

    let firstVertex = [0, 0, 1];
    let lastVertex = [0, 0, -1];

    let vertexGroup;
    let previousVertexGroup = [firstVertex];

    for (let p = 0; p <= parallels; p++) {
      let lat = ((p + 1) / (parallels + 1)) * Math.PI;

      if (p != parallels) {
        vertexGroup = [];
        for (let m = 0; m < meridians; m++) {
          let long = ((2 * m) / meridians - 1) * Math.PI;
          let vertex = Math3D.sphericalToCartesian(1, lat, long);
          vertexGroup.push(vertex);
        }
      } else {
        if (!vertexGroup) throw "Error creating sphere mesh";

        previousVertexGroup = vertexGroup;
        vertexGroup = [lastVertex];
      }

      for (let m = 0; m <= meridians; m++) {
        let ul = m % previousVertexGroup.length, // Upper-left vertex index
          ur = (m + 1) % previousVertexGroup.length, // Upper-right vertex index
          bl = m % vertexGroup.length, // Bottom-left vertex index
          br = (m + 1) % vertexGroup.length; // Bottom-right vertex index

        let upper_left = previousVertexGroup[ul]; // Upper-left vertex
        let upper_right = previousVertexGroup[ur]; // Upper-right vertex
        let bottom_left = vertexGroup[bl]; // Bottom-left vertex
        let bottom_right = vertexGroup[br]; // Bottom-right vertex

        if (p > 0)
          vertices.push(...bottom_right, ...upper_right, ...upper_left);
        if (p < parallels)
          vertices.push(...upper_left, ...bottom_left, ...bottom_right);
      }

      previousVertexGroup = vertexGroup;
    }

    let colors: number[] = [];
    for (let i = 0; i < vertices.length / 3; i++) {
      let color = Mesh.getColor(i);

      for (let j = 0; j < 3; j++) {
        colors = colors.concat(color);
      }
    }

    let triangles = Array.from(vertices, (_, i) => i);

    return {
      positions: vertices,
      elements: triangles,
      colors: colors,
    };
  }
}
