import React, { Component } from "react";

import CanvasDraw from "./RCD";
import uuid from 'uuid/v4'
import { SliderPicker } from 'react-color';

import { API, graphqlOperation } from 'aws-amplify'
import { createCanvas } from './graphql/mutations'

const colors = [
  '#D50000',
  '#AA00FF',
  '#2962FF',
  '#18FFFF',
  '#00C853',
  '#FFD600',
  '#FF6D00',
  '#000000'
]

function rand() {
  return colors[~~(colors.length * Math.random())];
}

class Canvas extends Component {
  docHeight = document.body.clientHeight;
  docWidth = document.body.clientWidth;


  state = {
    brushColor: rand(),
    canvasHeight: 400,
    canvasWidth: 400,
    brushRadius: 4,
    lazyRadius: 8,
    canvas: null
  }

  lineLength = 0
  id = uuid()
  clientId = uuid()
  canvasInfo = 'tempcanvas'
  componentDidMount() {

    this.eventListener = window.addEventListener('mouseup', (e) => {
      // If we are clicking on a button, do not update anything
      if (e.target.name === 'clearbutton') return

      const data = this.drawCanvas.getSaveData()
      const p = JSON.parse(data)
      const length = p.lines.length
      this.lineLength = length

      this.setState({
        canvas: {
          id: this.id,
          clientId: this.clientId,
          data
        }
      })
    })
  }
  componentWillUnmount() {
    this.eventListener && window.removeEventListener('mouseup', this.eventListener);
  }
  clear = () => {
    const data = this.drawCanvas.getSaveData()
    const parsedData = JSON.parse(data)
    const newData = {
      ...parsedData,
      lines: []
    }
    const newCanvas = JSON.stringify(newData)
    this.drawCanvas.loadSaveData(newCanvas)
  }
  undo = () => {
    this.drawCanvas.undo()
  }

  submitCanvas = () => {
    if (!this.state.canvas) return alert("draw something");
    const parsedData = JSON.parse(this.state.canvas.data);
    if (!parsedData.lines.length) return alert("draw something");
    // Save updated canvas in the database
    API.graphql(graphqlOperation(createCanvas, { input: this.state.canvas }))
      .then(c => {
        alert("Drawing added to queue");
        this.clear();
        this.id = uuid();
        this.clientId = uuid();
      })
      .catch(err => console.log('error creating: ', err))
  }

  increaseThickness = () => {
    this.setState({
      brushRadius: this.state.brushRadius + 2
    })
  }
  decreaseThickness = () => {
    this.setState({
      brushRadius: this.state.brushRadius - 2
    })
  }
  handleColorChangeComplete = (color) => {
    this.setState({ brushColor: color.hex });
  };
  render() {
    return (
      <>
        <div className="buttonbar right top">
          <button name='closebutton' onClick={this.props.toggleModal}>Close</button>
        </div>
        <div className="wrapper">
        <div className="tool-wrapper">
          <button name='clearbutton' className="clear-btn" onClick={this.clear}>Clear</button>
          <button name='undobutton' className="undo-btn" onClick={this.undo}>Undo</button>
          <CanvasDraw
            {...this.state}
            ref={canvas => this.drawCanvas = canvas}
          />

          
            <SliderPicker
              onChangeComplete={this.handleColorChangeComplete}
              color={this.state.brushColor}
            />
            <div className="brush-thickness-wrapper">
              <label >Brush thickness ({this.state.brushRadius})</label>
              <button className="decrease-thickness-button" disabled={this.state.brushRadius < 3} onClick={this.decreaseThickness}>-</button>
              <button className="increase-thickness-btn" disabled={this.state.brushRadius > 19} onClick={this.increaseThickness}>+</button>
            </div>
            <button name='submitbtn' className="submit-btn green" onClick={this.submitCanvas}>Submit</button>

          </div>
        </div>


      </>
    );
  }
}

export default Canvas