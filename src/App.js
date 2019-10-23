import React from "react";

import './App.css';
import Canvas from "./Canvas";
import { ReactComponent as QRSvg } from "./drawliveQR.svg";

import { API, graphqlOperation } from 'aws-amplify'
import { onCreateCanvas, onDeleteCanvas } from './graphql/subscriptions'
import { listCanvass } from './graphql/queries'
import LiveStream from "./LiveStream";
import AdminPage from "./AdminPage";

export function clone(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (null == obj || "object" != typeof obj) return obj;

  // Handle Date
  if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
      copy = [];
      for (var i = 0, len = obj.length; i < len; i++) {
          copy[i] = clone(obj[i]);
      }
      return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
      copy = {};
      for (var attr in obj) {
          if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
      }
      return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}

class App extends React.Component {

  state = {
    displayAdminModal: false,
    displayAddCanvasModal: false,
    qrScaled: false,
    index: 0,
    canvasQueue: []
  }


  incrementIndex = () => {
    const { index, canvasQueue } = this.state;

    if (index + 1 >= canvasQueue.length) {
      this.setState({ index: 0 })
    } else {
      this.setState({ index: index + 1 })
    }
  }




  addToQueue = (canvas) => {
    const { index, canvasQueue } = this.state;

    const newQueue = clone(canvasQueue);
    newQueue.splice(index + 1, 0, canvas);

    this.setState({
      canvasQueue: newQueue,
    })
  }

  parseAndSetCanvasQueue = (canvasQueue) => {
    return  canvasQueue.map(canvas => {
      const parsed = JSON.parse(canvas.data);
      if (canvas.data && parsed && parsed.lines) return {
        ...canvas,
        data: parsed
      };
    })
  }

  componentDidMount() {
    const { addToQueue } = this;

    API.graphql(graphqlOperation(listCanvass, { limit: 50 }))
      .then(({ data }) => {

        const canvasQueue = this.parseAndSetCanvasQueue(data.listCanvass.items)

        this.setState({
          canvasQueue: canvasQueue,
        })
      })
      .catch(err => {
        console.error(err);
      })

      API.graphql(graphqlOperation(onCreateCanvas))
      .subscribe({
        next: (d) => {
          try {
            const newCanvas = d.value.data.onCreateCanvas
            if (!newCanvas.data) return;
            const parsed = JSON.parse(newCanvas.data);

            const updatedObject = {
              ...newCanvas,
              data: parsed
            }

            addToQueue(updatedObject);

          } catch (err) {
            console.log(err)
          }

        }
      })
      API.graphql(graphqlOperation(onDeleteCanvas))
        .subscribe({
          next: (d) => {
            try {
              const removedCanvas = d.value.data.onDeleteCanvas
              const queue = clone(this.state.canvasQueue)
              const lists = queue.filter(x => {
                return x.id !== removedCanvas.id;
              })
              this.setState({
                canvasQueue: lists
              })
  
            } catch (err) {
              console.log(err)
            }
  
          }
        })
  }

  toggleModal = () => {
    this.setState({ displayAddCanvasModal: !this.state.displayAddCanvasModal })
  }

  toggleAdmin = () => {
    this.setState({ displayAdminModal: !this.state.displayAdminModal })
  }
  render() {
    const { displayAddCanvasModal, qrScaled, displayAdminModal, canvasQueue, index } = this.state;
    const { toggleModal, toggleAdmin, incrementIndex } = this;

    return (
      <div className="app-wrapper" style={{ height: "100vh", width: "100vw" }}>
        <div className="buttonbar left bottom">
          Display #{canvasQueue.length ? index + 1 : 0} of {canvasQueue.length} drawings in queue
          </div>

        <div className="buttonbar right top">
          <button onClick={toggleModal}>+ Drawing</button>
        </div>
        <button className="top left admin-btn" onClick={toggleAdmin}></button>

        {!!canvasQueue.length && <LiveStream index={index} canvasQueue={canvasQueue} incrementIndex={incrementIndex} />}
        <div className={displayAddCanvasModal ? "modal slide-in" : "modal"}>
          <Canvas toggleModal={toggleModal} />
        </div>
        <div className={displayAdminModal ? "modal slide-in" : "modal"}>
          <AdminPage canvasQueue={canvasQueue} toggleAdmin={toggleAdmin} />
        </div>
        <QRSvg className={qrScaled ? "qr-svg scale" : "qr-svg" } onClick={ () => this.setState({qrScaled: !this.state.qrScaled})} />

      </div>
    );
  }
}

export default App