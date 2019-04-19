import React from 'react';
import { inject, observer } from 'mobx-react';
import ver from './vertexShader.glsl';
import fra from './fragmentShader.glsl';
import mus from './musicShader.glsl';

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

const fsHeader = `#version 300 es
precision highp float;
uniform float iTime;
uniform vec2  iResolution;
out vec4 fragColor;
`;

const fsMain = `
void main( void ){
  vec4 color = vec4(0.0,0.0,0.0,1.0);
  mainImage( color, gl_FragCoord.xy );
  color.w = 1.0;
  fragColor = color;
}`;

const msHeader = `#version 300 es
uniform float phase;
uniform float bufferSize;
uniform float sampleRate;    
out vec2 music; 
`;

const msMain = `
void main( void ) {
  float time = (bufferSize * phase + float(gl_VertexID)) / sampleRate;
  music = mainSound(time);
}`;

const voidFs = `#version 300 es
void main() {}
`;

const create_program = (gl, vs, fs, fv) => {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  if (fv.length > 0)
    gl.transformFeedbackVaryings(program, fv, gl.SEPARATE_ATTRIBS);
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

const initRenderProgram = (gl, vs, fs) => {
  const prg = create_program(
    gl,
    create_shader(gl, vs, gl.VERTEX_SHADER),
    create_shader(gl, fs, gl.FRAGMENT_SHADER),
    []
  );

  const uniLocation = [];
  uniLocation[0] = gl.getUniformLocation(prg, 'iTime');
  uniLocation[1] = gl.getUniformLocation(prg, 'iResolution');

  const attLocation = gl.getAttribLocation(prg, 'position');
  const attStride = 3;

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attLocation);
  gl.vertexAttribPointer(attLocation, attStride, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(index), gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  return {
    renderPrg: prg,
    renderUniLocation: uniLocation,
    renderVao: vao
  };
};

const initMusicProgram = (gl, ms, bs, sr) => {
  const prg = create_program(
    gl,
    create_shader(gl, ms, gl.VERTEX_SHADER),
    create_shader(gl, voidFs, gl.FRAGMENT_SHADER),
    ['music']
  );

  const uniLocation = [];
  uniLocation[0] = gl.getUniformLocation(prg, 'bufferSize');
  uniLocation[1] = gl.getUniformLocation(prg, 'sampleRate');
  uniLocation[2] = gl.getUniformLocation(prg, 'phase');

  gl.uniform1f(gl.getUniformLocation(prg, 'bufferSize'), bs);
  gl.uniform1f(gl.getUniformLocation(prg, 'sampleRate'), sr);

  const VBOs = [gl.createBuffer(), gl.createBuffer()];
  for (let i = 0; i < 2; ++i) {
    gl.bindBuffer(gl.ARRAY_BUFFER, VBOs[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bs * 2), gl.STATIC_DRAW);
  }
  return {
    musicPrg: prg,
    musicUniLocation: uniLocation,
    VBOs: VBOs
  };
};

const renderStart = (vs, rc, rgl, fs, mgl, ms, audio, node) => {
  const { renderPrg, renderUniLocation, renderVao } = initRenderProgram(
    rgl,
    vs,
    fs
  );

  const bufferSize = node.bufferSize;
  const sampleRate = audio.sampleRate;

  const { musicPrg, musicUniLocation, VBOs } = initMusicProgram(
    mgl,
    ms,
    bufferSize,
    sampleRate
  );

  let idx = 0;
  let phase = 0;

  const audioProcess = event => {
    mgl.useProgram(musicPrg);
    mgl.uniform1f(musicUniLocation[2], phase);
    mgl.bindBufferBase(mgl.TRANSFORM_FEEDBACK_BUFFER, 0, VBOs[idx]);
    mgl.enable(mgl.RASTERIZER_DISCARD);
    mgl.beginTransformFeedback(mgl.POINTS);
    mgl.drawArrays(mgl.POINTS, 0, bufferSize);
    mgl.endTransformFeedback();
    mgl.disable(mgl.RASTERIZER_DISCARD);
    mgl.bindBufferBase(mgl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    mgl.bindBuffer(mgl.ARRAY_BUFFER, VBOs[idx]);
    const aryBuffer = new ArrayBuffer(bufferSize * 4 * 2);
    const dataView = new DataView(aryBuffer);
    mgl.getBufferSubData(mgl.ARRAY_BUFFER, 0, dataView);
    const buf = new Float32Array(aryBuffer);
    const data0 = event.outputBuffer.getChannelData(0);
    const data1 = event.outputBuffer.getChannelData(1);
    for (let i = 0; i < bufferSize; i++) {
      data0[i] = buf[i * 2];
      data1[i] = buf[i * 2 + 1];
    }
    idx = 1 - idx;
    phase++;
  };

  rgl.clearColor(0.0, 0.0, 0.0, 1.0);

  const startTime = new Date().getTime();

  const render = () => {
    const time = (new Date().getTime() - startTime) * 0.001;
    rgl.useProgram(renderPrg);
    rgl.clear(rgl.COLOR_BUFFER_BIT);
    rgl.bindVertexArray(renderVao);
    rgl.uniform1f(renderUniLocation[0], time);
    rgl.uniform2fv(renderUniLocation[1], [rc.width, rc.height]);
    rgl.drawElements(rgl.TRIANGLES, index.length, rgl.UNSIGNED_SHORT, 0);
    rgl.flush();
  };
  return { render: render, audioProcess: audioProcess };
};

@inject(({ state }) => ({
  windowWidth: state.windowWidth,
  windowHeight: state.windowHeight,
  updateWindowSize: state.updateWindowSize,
  renderCanvas: state.renderCanvas,
  renderGl: state.renderGl,
  updateRenderCanvas: state.updateRenderCanvas,
  updateRenderGl: state.updateRenderGl
}))
@observer
export default class CreateCanvas extends React.Component {
  componentDidMount() {
    const renderCanvas = this.renderCanvas;
    renderCanvas.width = this.props.windowWidth;
    renderCanvas.height = this.props.windowHeight;
    const renderGl = renderCanvas.getContext('webgl2');

    const musicCanvas = this.musicCanvas;
    const musicGl = musicCanvas.getContext('webgl2');
    this.audioContext = new AudioContext();
    this.node = this.audioContext.createScriptProcessor();

    this.props.updateRenderCanvas(renderCanvas);
    this.props.updateRenderGl(renderGl);    
    window.addEventListener('resize', this.handleResize);
    this.start(renderCanvas, renderGl, musicGl);
  }
  componentWillUnmount() {
    cancelAnimationFrame(this.requestId);
    this.node.disconnect();
    window.removeEventListener('resize', this.handleResize);
  }
  handleResize = e => {
    const width = e.target.innerWidth;
    const height = e.target.innerHeight;
    this.props.updateWindowSize(width, height);
  };
  musicStart = () => {    
    this.audioContext.resume().then(() => {
      this.node.onaudioprocess = this.audioProcess;
      this.node.connect(this.audioContext.destination);
    });
  };
  start = (renderCanvas, renderGl, musicGl) => {
    const { render, audioProcess } = renderStart(
      ver(),
      renderCanvas,
      renderGl,
      fsHeader + fra() + fsMain,
      musicGl,
      msHeader + mus() + msMain,
      this.audioContext,
      this.node
    );
    this.audioProcess = audioProcess;
    const renderLoop = () => {
      render();
      this.requestId = requestAnimationFrame(renderLoop);
    };
    this.musicStart();    
    renderLoop();
  };
  render() {
    return (
      <React.Fragment>
        <canvas
          style={{
            width: this.props.windowWidth,
            height: this.props.windowHeight
          }}
          ref={e => {
            this.renderCanvas = e;
          }}
        />
        <canvas
          style={{
            visibility: 'hidden'
          }}
          ref={e => {
            this.musicCanvas = e;
          }}
        />        
      </React.Fragment>
    );
  }
}
