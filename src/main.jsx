import React from 'react';
import CreateCanvas from './createCanvas';
import style from './style.scss';
import ReactDOM from 'react-dom';
import { Provider, inject, observer } from 'mobx-react';
import State from './store';

const stores = {
  state: new State()
};

class ShadertoyStart extends React.Component {
  componentDidMount() {
    style.use();
  }
  componentWillUnmount() {
    style.unuse();
  }
  render() {
    return (
      <Provider {...stores}>
        <React.Fragment>
          <CreateCanvas />
        </React.Fragment>
      </Provider>
    );
  }
}

ReactDOM.render(<ShadertoyStart />, document.getElementById('root'));
