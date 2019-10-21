import React from "react";
import ReactDOM from "react-dom"

import './App.css';
import Canvas from "./Canvas";

import CanvasDraw from "./RCD";
import { API, graphqlOperation } from 'aws-amplify'
import { onCreateCanvas } from './graphql/subscriptions'
import { listCanvass } from './graphql/queries'
import { deleteCanvas } from "./graphql/mutations";
import LiveStream from "./LiveStream";
import { ReactComponent as QRSvg } from "./drawliveQR.svg";


const App = () => {

  const [displayStream, setDisplayStream] = React.useState(true);
  const [canvasQueue, setCanvasQueue] = React.useState([]);
  const [index, setIndex] = React.useState(0);
  const [currentLines, setCurrentLines] = React.useState(null);

  const canvasRef = React.useRef();

  const incrementIndex = () => {

    if (index + 1 >= canvasQueue.length) {
      setIndex(0)
    } else {
      setIndex(index + 1)
    }
  }

  const drawingCompleteCallback = () => {
    console.log("drawingCompleteCallback")
    if ( canvasRef.current) {
      const data = canvasRef.current.getSaveData()
      const parsedData = JSON.parse(data)
      const newData = {
        ...parsedData,
        lines: []
      }
      const newCanvas = JSON.stringify(newData)
      canvasRef.current.loadSaveData(newCanvas)
      incrementIndex();
    }
  }
  let i = 0;

  React.useEffect(() => {
    if (canvasRef.current) {

      canvasRef.current.simulateDrawingLines({
        lines: currentLines,
      })
      
      setTimeout( () => {
        drawingCompleteCallback()
      }, 12000)
    }

  }, [currentLines, canvasRef])

  React.useEffect(() => {
    renderIndexFromQueue()
  }, [canvasQueue, index])

  const renderIndexFromQueue = () => {
    if (!displayStream) return;
    if (!canvasQueue.length) return console.log("no stream");
    const queue = [
      ...canvasQueue
    ]
    const data = queue[index];
    if (!data || !data.lines || !data.lines[0].points.length) {
      console.log("No data in ");
      return incrementIndex();
    }

    const lines = data.lines;

    i += i + 1;
    const CanvasDrawElem = React.createElement(
      CanvasDraw,
      {
        key: `index-${index}-${i}`,
        ref: canvasRef,
        className: "stream-canvas",
        hideGrid: true,
        disabled: true,
        lazyRadius: 8,
        loadTimeOffset: 12,
        canvasBackground: "transparent",
      },
      null
    )

    console.log("RENDER CANVAS TO STREAM")
    ReactDOM.render(
      CanvasDrawElem,
      document.getElementById("stream-wrapper")
    );

    console.log("START DRAWING LINES", lines)
    setCurrentLines(lines);

  }


  const addToQueue = (canvas) => {
    const oldQueue = canvasQueue;
    oldQueue.splice(index, 0, canvas);
    setCanvasQueue(oldQueue)
  }


  const deleteAll = () => {
    canvasQueue.forEach(dbData => {
      API.graphql(graphqlOperation(deleteCanvas, { input: { id: dbData.id } })).then(() => {
        console.log("All drawings deleted");
      }).catch(err => {
        console.error(err);
      })

    })
  }

  const parseAndReturnCanvas = (canvas) => {

    let parsed = null;
    if (canvas.data) {
      parsed = JSON.parse(canvas.data);
    }
    return {
      ...canvas,
      data: parsed
    }
  }

  React.useEffect(() => {
    // Create the canvas. If canvas is already created, retrieve the data & draw previous canvas
    API.graphql(graphqlOperation(listCanvass, { limit: 50 }))
      .then(({ data }) => {
        const parsedCanvasList = data.listCanvass.items.filter(dbCanvas => parseAndReturnCanvas(dbCanvas).data)
        setCanvasQueue(parsedCanvasList)
      })
      .catch(err => {
        console.error(err);
      })

    API.graphql(graphqlOperation(onCreateCanvas))
      .subscribe({
        next: (d) => {
          // const data = JSON.parse(d.value.data.onCreateCanvas.data)
          const parsedCanvas = parseAndReturnCanvas(d.value.data.onCreateCanvas);
          if (!parsedCanvas.data) return 
          const {length} = parsedCanvas.data.lines
          if (length === Number(0)) return
          console.log(canvasQueue);
          addToQueue(parsedCanvas);
          renderIndexFromQueue()

        }
      })
  }, [])

  const toggleStream = () => setDisplayStream(!displayStream);

  return (
    <div className="app-wrapper">
      {displayStream && <div className="buttonbar left">
        Display #{index ? index + 1 : 0} of {canvasQueue.length} drawings in queue
          </div>
      }
        <QRSvg className="qr-svg" />

      <div className="buttonbar right">
        <button onClick={deleteAll}>Delete all</button>
        <button onClick={toggleStream}>{!displayStream ? "Stream" : "+ Drawing"}</button>
      </div>
      {displayStream && <LiveStream index={index} canvasQueue={canvasQueue} incrementIndex={incrementIndex} />}
      {!displayStream && <Canvas />}
    </div>
  );
}

export default App