import React from 'react';
import { inject, observer } from 'mobx-react';
import ver from './vertexShader.glsl';
import fra from './fragmentShader.glsl';

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

const fsMain = `
void main( void ){
  vec4 color = vec4(0.0,0.0,0.0,1.0);
  mainImage( color, gl_FragCoord.xy );
  color.w = 1.0;
  gl_FragColor = color;
}`;

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

const initMainProgram = (gl, ex, vs, fs) => {
  const mainPrg = create_program(
    gl,
    create_shader(gl, vs, gl.VERTEX_SHADER),
    create_shader(gl, fs, gl.FRAGMENT_SHADER)
  );

  const mainUniLocation = [];
  mainUniLocation[0] = gl.getUniformLocation(mainPrg, 'iTime');
  mainUniLocation[1] = gl.getUniformLocation(mainPrg, 'iResolution');

  const mainAttLocation = gl.getAttribLocation(mainPrg, 'position');
  const mainAttStride = 3;

  const mainVao = ex.createVertexArrayOES();
  ex.bindVertexArrayOES(mainVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(mainAttLocation);
  gl.vertexAttribPointer(mainAttLocation, mainAttStride, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(index), gl.STATIC_DRAW);
  ex.bindVertexArrayOES(null);

  return {
    mainPrg: mainPrg,
    mainUniLocation: mainUniLocation,
    mainVao: mainVao
  };
};

const webGLStart = (vs, rc, rgl, fs) => {
  const re =
    rgl.getExtension('OES_vertex_array_object') ||
    rgl.getExtension('MOZ_OES_vertex_array_object') ||
    rgl.getExtension('WEBKIT_OES_vertex_array_object');
  if (!re) {
    alert('vertex array object not supported');
    null;
  }

  const { mainPrg, mainUniLocation, mainVao } = initMainProgram(
    rgl,
    re,
    vs,
    fs
  );

  rgl.clearColor(0.0, 0.0, 0.0, 1.0);

  const startTime = new Date().getTime();

  const render = () => {
    rgl.clear(rgl.COLOR_BUFFER_BIT);
    const time = (new Date().getTime() - startTime) * 0.001;
    rgl.useProgram(mainPrg);
    re.bindVertexArrayOES(mainVao);
    rgl.uniform1f(mainUniLocation[0], time);
    rgl.uniform2fv(mainUniLocation[1], [rc.width, rc.height]);
    rgl.drawElements(rgl.TRIANGLES, index.length, rgl.UNSIGNED_SHORT, 0);
    rgl.flush();
  };
  return { render: render};
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
    const renderGl = renderCanvas.getContext('webgl');    
    this.props.updateRenderCanvas(renderCanvas);
    this.props.updateRenderGl(renderGl);    
    this.updateGl(renderCanvas, renderGl);
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
  updateGl = (renderCanvas, renderGl) => {
    const { render} = webGLStart(
      ver(),
      renderCanvas,
      renderGl,
      fra() + fsMain      
    );
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
            this.renderCanvas = e;
          }}
        />      
    );
  }
}