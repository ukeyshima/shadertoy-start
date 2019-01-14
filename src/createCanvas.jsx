import React from 'react';
import { inject, observer } from 'mobx-react';
import vert from './vertexShader.glsl';
import frag from './fragmentShader.glsl';

const create_program = (gl, vs, fs) => {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.useProgram(program);
    return program;
  } else {
    return null;
  }
};

const create_shader = (gl, text, type) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, text);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  } else {
    alert(gl.getShaderInfoLog(shader));
    console.log(gl.getShaderInfoLog(shader));
  }
};

const create_vbo = (gl, data) => {
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return vbo;
};

const create_ibo = (gl, data) => {
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  return ibo;
};

const set_attribute = (gl, vbo, attL, attS) => {
  vbo.forEach((e, i, a) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, e);
    gl.enableVertexAttribArray(attL[i]);
    gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
  });
};

const webGLStart = (canvas, gl, vs, fs) => { 
  const prg = create_program(
    gl,
    create_shader(gl, vs, gl.VERTEX_SHADER),
    create_shader(gl, fs, gl.FRAGMENT_SHADER)
  );

  const uniLocation = [];
  uniLocation[0] = gl.getUniformLocation(prg, 'iTime');
  uniLocation[1] = gl.getUniformLocation(prg, 'iResolution');

  const position = [
    -1.0,
    1.0,
    0.0,
    1.0,
    1.0,
    0.0,
    -1.0,
    -1.0,
    0.0,
    1.0,
    -1.0,
    0.0
  ];
  const index = [0, 2, 1, 1, 2, 3];
  const attLocation = [];
  const attStride = [];

  const vPosition = create_vbo(gl, position);
  attLocation[0] = gl.getAttribLocation(prg, 'position');
  attStride[0] = 3;

  const vIndex = create_ibo(gl, index);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  const startTime = new Date().getTime();

  const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    const time = (new Date().getTime() - startTime) * 0.001;
    gl.uniform1f(uniLocation[0], time);
    gl.uniform2fv(uniLocation[1], [canvas.width, canvas.height]);
    set_attribute(gl, [vPosition], attLocation, attStride);
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
    gl.flush();
  };

  return render;
};

@inject(({ state }) => ({
  windowWidth: state.windowWidth,
  windowHeight: state.windowHeight,
  updateWindowSize: state.updateWindowSize,
  canvas: state.canvas,
  glContext: state.glContext,
  updateCanvas: state.updateCanvas,
  updateGlContext: state.updateGlContext
}))
@observer
export default class CreateCanvas extends React.Component {
  componentDidMount() {
    const canvas = this.canvas;
    const glContext = canvas.getContext('webgl');
    this.props.updateCanvas(canvas);
    this.props.updateGlContext(glContext);
    this.updateCanvas(canvas, glContext);
    window.addEventListener('resize', this.handleResize);
  }
  componentWillUnmount() {
    cancelAnimationFrame(this.requestId);
    window.removeEventListener('resize', this.handleResize);
  }
  handleResize = e => {
    const width = e.target.innerWidth;
    const height = e.target.innerHeight;
    this.props.updateWindowSize(width, height);
  };
  updateCanvas = (canvas, glContext) => {
    const render = webGLStart(canvas, glContext, vert(), frag());
    const renderLoop = () => {
      render();
      this.requestId = requestAnimationFrame(renderLoop);
    };
    renderLoop();
  };
  render() {    
    return (
      <canvas
        style={{
          width: this.props.windowWidth,
          height: this.props.windowHeight
        }}
        ref={e => {
          this.canvas = e;
        }}
      />
    );
  }
}
