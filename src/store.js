import { observable, computed, action } from 'mobx';

export default class State {
  @observable windowWidth = window.innerWidth;
  @observable windowHeight = window.innerHeight;
  @action.bound
  updateWindowSize(width,height) {
    this.windowWidth = width;
    this.canvas.width = width;
    this.windowHeight = height;
    this.canvas.height = height;
    this.glContext.viewport(0, 0, width, height);
  }  
  @observable canvas = null;
  @action.bound
  updateCanvas(element) {
    this.canvas = element;
  }
  @observable glContext = null;
  @action.bound
  updateGlContext(context) {
    this.glContext = context;
  }
}
