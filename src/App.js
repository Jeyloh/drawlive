import React from "react";

import './App.css';
import Canvas from "./Canvas";

import { API, graphqlOperation } from 'aws-amplify'
import { onCreateCanvas } from './graphql/subscriptions'
import { listCanvass } from './graphql/queries'
import { deleteCanvas } from "./graphql/mutations";
import LiveStream from "./LiveStream";

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
    displayAddCanvasModal: false,
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



  deleteAll = () => {
    const { canvasQueue } = this.state;

    const prompt = window.prompt(
      'Are you sure you want to delete drawings?',
    );
    if (prompt !== "qwer") return null;

    canvasQueue.forEach(dbData => {
      API.graphql(graphqlOperation(deleteCanvas, { input: { id: dbData.id } })).then(() => {
        console.log("All drawings deleted");
      }).catch(err => {
        console.error(err);
      })

    })
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
  }

  toggleModal = () => {
    this.setState({ displayAddCanvasModal: !this.state.displayAddCanvasModal })
  }
  render() {
    const { displayAddCanvasModal, canvasQueue, index } = this.state;
    const { deleteAll, toggleModal, incrementIndex } = this;

    return (
      <div className="app-wrapper" style={{ height: "100vh", width: "100vw" }}>
        <div className="buttonbar left bottom">
          Display #{canvasQueue.length ? index + 1 : 0} of {canvasQueue.length} drawings in queue
          </div>

        <div className="buttonbar right top">
          <button onClick={toggleModal}>+ Drawing</button>
        </div>
        <button className="bottom left" onClick={deleteAll}>Delete all</button>

        {!!canvasQueue.length && <LiveStream index={index} canvasQueue={canvasQueue} incrementIndex={incrementIndex} />}
        <div className={displayAddCanvasModal ? "modal slide-in" : "modal"}>
          <Canvas toggleModal={toggleModal} />
        </div>
      </div>
    );
  }
}

export default App