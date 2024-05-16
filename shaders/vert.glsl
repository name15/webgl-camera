// Each point has a position and color
attribute vec3 position;
attribute vec4 color;
attribute vec3 offset;

// The transformation matrices
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

// Pass the color attribute down to the fragment shader
varying vec4 vColor;
void main() {

  //Pass the color down to the fragment shader
  vColor = color;

  // Apply model, view and projection matrices
  // and offset the position
  vec4 model_position = model * vec4(position, 1.0);
  model_position += vec4(offset, 1.0);
  gl_Position = projection * view * model_position;
}