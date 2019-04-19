
import { observable, computed, action } from 'mobx';

export default class State {  
  @observable windowWidth = window.innerWidth;
  @observable windowHeight = window.innerHeight;
  @action.bound
  updateWindowSize(width, height) {
    this.windowWidth = width;
    this.renderCanvas.width = width;    
    this.windowHeight = height;
    this.renderCanvas.height = height;    
    this.renderGl.viewport(0, 0, width, height);    
  }
  @observable renderCanvas = null;
  @action.bound
  updateRenderCanvas(element) {
    this.renderCanvas = element;
  }
  @observable renderGl = null;
  @action.bound
  updateRenderGl(context) {
    this.renderGl = context;
  }    
}