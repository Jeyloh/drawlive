import React from "react";
import CanvasDraw from "./RCD";
import { ReactComponent as QRSvg } from "./drawliveQR.svg";
import { clone } from "./App"; 

class LiveStream extends React.Component {
    state = {
        currentLines: null,
    }


    componentWillUnmount() {
        this.timeout1 && clearTimeout(this.timeout1);
        this.timeout2 && clearTimeout(this.timeout2);
    }

    componentDidMount() {
        this.createCanvasFromIndex();
    }

    // componentDidUpdate(prevProps, prevState) {
    //     //     if (this.props.index !== prevProps.index) {
    //     //         this.createCanvasFromIndex();
    //     //     }

    //     if (!this.state.updatedQueueFromRaw && this.props.rawQueue.length !== prevProps.rawQueue.length) {
    //         this.parseAndSetCanvasQueue(this.props.rawQueue)
    //     }
    //     if (!this.state.updatedQueueFromRaw && this.state.canvasQueue.length > 1 && this.props.index + 1 === this.state.canvasQueue.length) {
    //         this.parseAndSetCanvasQueue(this.props.rawQueue);
    //         this.setState({
    //             updatedQueueFromRaw: true
    //         })
    //     } else if (this.state.updatedQueueFromRaw && !this.props.index) {
    //         this.setState({
    //             updatedQueueFromRaw: false
    //         })
    //     }

    //     if (prevState.canvasQueue.length !== this.state.canvasQueue.length) {
    //         this.createCanvasFromIndex();
    //     }
    // }

    // parseAndSetCanvasQueue = (rawQueue) => {
    //     const canvasQueue = rawQueue.map(canvas => {
    //         const parsed = JSON.parse(canvas.data);
    //         if (canvas.data && parsed && parsed.lines) return {
    //             ...canvas,
    //             data: parsed
    //         };
    //     })

    //     this.setState({
    //         canvasQueue: canvasQueue,
    //     })
    // }


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

        this.timeout2 = setTimeout(() => {
            this.drawingCompleteCallback()
        }, 12000)

    }

    render() {
        return (
            <>
                <QRSvg className="qr-svg" />
                <div id="stream-wrapper">
                    <CanvasDraw
                        key={`index-${this.props.index}`}
                        ref={canvas => this.canvasRef = canvas}
                        className={"stream-canvas"}
                        hideGrid={true}
                        disabled={true}
                        lazyRadius={8}
                        loadTimeOffset={12}
                        canvasBackground={"transparent"}
                    />
                </div>
            </>
        )
    }
}

export default LiveStream;