import React from "react";

import './App.css';
import Canvas from "./Canvas";

import { API, graphqlOperation } from 'aws-amplify'
import { onCreateCanvas } from './graphql/subscriptions'
import { listCanvass } from './graphql/queries'
import { deleteCanvas } from "./graphql/mutations";
import LiveStream from "./LiveStream";


class App extends React.Component {

    state = {
      displayAddCanvasModal: false,
      index: 0,
      rawQueue: []
    }

    // componentDidUpdate(prevProps, prevState) {
    //   if (prevState.index > prevState.rawQueue.length - 2) {
    //     this.setState({
    //       rawQueue: this.state.rawQueue
    //     })
    //   }
    // }

  incrementIndex = () => {
    const { index, rawQueue } = this.state;

    if (index + 1 >= rawQueue.length) {
      this.setState({index: 0})
    } else {
      this.setState({index: index +1})
    }
  }

  addToQueue = (canvas) => {
    const { index, rawQueue } = this.state;

    const newQueue = rawQueue;
    newQueue.splice(index, 0, canvas);

    this.setState({
      rawQueue:rawQueue,
    })
  }

  deleteAll = () => {
    const { rawQueue } = this.state;

    rawQueue.forEach(dbData => {
      API.graphql(graphqlOperation(deleteCanvas, { input: { id: dbData.id } })).then(() => {
        console.log("All drawings deleted");
      }).catch(err => {
        console.error(err);
      })

    })
  }



  componentDidMount() {
    const { addToQueue } = this;

    API.graphql(graphqlOperation(listCanvass, { limit: 50 }))
    .then(({ data }) => {
      
      this.setState({
        rawQueue:data.listCanvass.items,
      })
    })
    .catch(err => {
      console.error(err);
    })

  API.graphql(graphqlOperation(onCreateCanvas))
    .subscribe({
      next: (d) => {
        // const data = JSON.parse(d.value.data.onCreateCanvas.data)
        
        addToQueue(d.value.data.onCreateCanvas);

      }
    })
  }
 
  toggleModal = () => {
    this.setState({displayAddCanvasModal: !this.state.displayAddCanvasModal})
  }
  render () {
    const { displayAddCanvasModal, rawQueue, index } = this.state;
    const { deleteAll, toggleModal, incrementIndex } = this;

  return (
    <div className="app-wrapper">
      <div className="buttonbar left">
        Display #{rawQueue.length ? index + 1 : 0} of {rawQueue.length} drawings in queue
          </div>

      <div className="buttonbar right">
        <button onClick={deleteAll}>Delete all</button>
        <button onClick={toggleModal}>+ Drawing</button>
      </div>
      {rawQueue.length && <LiveStream index={index} rawQueue={rawQueue} incrementIndex={incrementIndex} />}
      <div className={displayAddCanvasModal ? "modal slide-in":"modal" }>
        <Canvas toggleModal={toggleModal} />
      </div>
    </div>
  );
}
}

export default App