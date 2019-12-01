import React, { Component } from "react";

import CanvasDraw from "./RCD";
import uuid from 'uuid/v4'
import { SliderPicker, HuePicker } from 'react-color';

import { API, graphqlOperation } from 'aws-amplify'
import { createCanvas } from './graphql/mutations'
import * as Icon from "./assets"

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

const win = window,
    doc = document,
    docElem = doc.documentElement,
    body = doc.getElementsByTagName('body')[0],
    _w = win.innerWidth || docElem.clientWidth || body.clientWidth,
    _h = win.innerHeight|| docElem.clientHeight|| body.clientHeight;

class Canvas extends Component {
  docHeight = document.body.clientHeight;
  docWidth = document.body.clientWidth;


  state = {
    brushColor: rand(),
    canvasHeight: _h,
    canvasWidth: _w,
    brushRadius: 4,
    lazyRadius: 0,
    canvas: null
  }

  lineLength = 0
  id = uuid()
  clientId = uuid()
  canvasInfo = 'tempcanvas'

  componentDidMount() {

    this.eventListener = window.addEventListener('mouseup', (e) => {
      // If we are clicking on a button, do not update anything
      if (e.target.name === 'button' || e.target.name === "slider") return
      if (!this.drawCanvas) return;
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
    window.removeEventListener('mouseup', this.eventListener);
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
      .catch(err => alert('error: ', err))
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
      <div className="z-index canvas-wrapper">
        <div className="buttonbar right top">
        </div>


        <CanvasDraw
          className="canvas-draw"
          {...this.state}
          ref={canvas => this.drawCanvas = canvas}
        >
          <Icon.MinusPen name='button' className="decrease-thickness-btn z-index canvas-button" onClick={this.state.brushRadius > 3 && this.decreaseThickness}/>
          <Icon.PlusPen name='button' className="increase-thickness-btn z-index canvas-button" onClick={this.state.brushRadius < 50 && this.increaseThickness}/>
          <Icon.RedCross name='button' className="clear-btn z-index canvas-button" onClick={this.clear} />
          <Icon.Eraser name='button' className="undo-btn z-index canvas-button" onClick={this.undo}/>
          <Icon.Exit name='button' className="exit-drawing-btn z-index canvas-button" onClick={this.props.toggleModal} />

          <div
          name="slider"
            className="color-picker-abs z-index"
          >
            <HuePicker
              height={"316px"} width={"16px"}
              direction={"vertical"}
              onChangeComplete={this.handleColorChangeComplete}
              color={this.state.brushColor}
            />
          </div>
          <Icon.Submit name='button' className="z-index canvas-button submit-btn " onClick={this.submitCanvas} />

        </CanvasDraw>





      </div>
    );
  }
}

export default Canvas