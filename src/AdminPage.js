import React, { Component } from "react";

import CanvasDraw from "./RCD";
import uuid from 'uuid/v4'
import { SliderPicker } from 'react-color';

import { API, graphqlOperation } from 'aws-amplify'
import { createCanvas } from './graphql/mutations'
import { deleteCanvas } from "./graphql/mutations";



class AdminPage extends Component {
  


  
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

  deleteCanvas = (canvas) => {
    API.graphql(graphqlOperation(deleteCanvas, { input: { id: canvas.id } })).then(() => {
      console.log("canvas deleted");
    }).catch(err => {
      console.error(err);
    })
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

  componentDidMount() {
    setTimeout ( () => {
      this.props.canvasQueue.map( canvas => {
        const stringData = JSON.stringify(canvas.data);
        this[canvas.id].loadSaveData(stringData, true)
        return canvas.id
      })
    }, 1000)
  
  }

  render() {
    return (
     <div className="admin-wrapper">
       <button name='closebutton' className="top right" onClick={this.props.toggleAdmin}>Close</button>
       <button className="top left">Delete all</button>
       <div className="admin-canvas-wrapper">
       { this.props.canvasQueue.map( canvas => {
         return (
           <div key={canvas.id} style={{margin: 10}} onClick={() => this.deleteCanvas(canvas)}>
              <CanvasDraw ref={c => this[canvas.id] = c}
                        hideGrid={true}
                        disabled={true}
                        canvasWidth={100}
                        
                        canvasHeight={100}
                        lazyRadius={8}
                        loadTimeOffset={12}
              />
           </div>
         )
       })}
       </div>
     

     </div>
    );
  }
}

export default AdminPage