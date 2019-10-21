import React from "react";
import ReactDOM from "react-dom"

import './App.css';
import CanvasDraw from "./RCD";

const LiveStream = ({incrementIndex, canvasQueue, index}) => {
    const [currentLines, setCurrentLines] = React.useState(null);

    const canvasRef = React.useRef();

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

      return (
        <div id="stream-wrapper" />
      )
}

export default LiveStream;