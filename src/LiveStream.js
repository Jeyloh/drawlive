import React from "react";
import CanvasDraw from "./RCD";
import { clone } from "./App"; 

class LiveStream extends React.Component {
    state = {
        currentLines: null,
    }


    componentWillUnmount() {
        this.timeout && clearTimeout(this.timeout);
    }

    componentDidMount() {
        this.createCanvasFromIndex();
    }

    drawingCompleteCallback = () => {
        const { incrementIndex } = this.props;
        console.log("drawingCompleteCallback")
        if (this.canvasRef) {
            const data = this.canvasRef.getSaveData()
            const parsedData = JSON.parse(data)
            const newData = {
                ...parsedData,
                lines: []
            }
            const newCanvas = JSON.stringify(newData)
            this.canvasRef.loadSaveData(newCanvas)
            incrementIndex();
            this.createCanvasFromIndex();
        }
    }

    createCanvasFromIndex = () => {
        const { index } = this.props;
        const queue = clone(this.props.canvasQueue);
        if (!queue.length) return console.log("no stream");
    
        const data = clone(queue[index].data);
        if (!data || !data.lines || !data.lines[0].points.length) {
            return console.log("No data in ");
        }

        const lines = clone(data.lines);
        this.draw(lines);
    }

    draw = (lines) => {
        console.log("START DRAWING LINES", lines)
        this.canvasRef.simulateDrawingLines({
            lines: lines,
        })

        this.timeout = setTimeout(() => {
            this.drawingCompleteCallback()
        }, 18000)

    }

    render() {
        return (
            <>
                <div id="stream-wrapper">
                    <CanvasDraw
                        key={`index-${this.props.index}`}
                        ref={canvas => this.canvasRef = canvas}
                        className={"stream-canvas"}
                        hideGrid={true}
                        disabled={true}
                            canvasWidth={this.props.canvasQueue[this.props.index].data.width}
                        canvasHeight={this.props.canvasQueue[this.props.index].data.height}
                        lazyRadius={8}
                        loadTimeOffset={18}
                        canvasBackground={"transparent"}
                    />
                </div>
            </>
        )
    }
}

export default LiveStream;