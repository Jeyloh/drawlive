import React, { Component } from "react";

import CanvasDraw from "./RCD";
import uuid from 'uuid/v4'
import { SliderPicker } from 'react-color';

import { API, graphqlOperation } from 'aws-amplify'
import { createCanvas } from './graphql/mutations'
import { deleteCanvas } from "./graphql/mutations";



class AdminPage extends Component {
  
  state = {
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

  render() {
    return (
     <div className="admin-wrapper">
       <button name='closebutton' className="top right" onClick={this.props.toggleAdmin}>Close</button>
       <button className="top left">Delete all</button>
       { this.props.canvasQueue.map( canvas => {
         return (
           <>
              <p>{canvas.id}</p>
              <button onClick={() => this.deleteCanvas(canvas)}>X</button>
           </>
         )
       })}

     </div>
    );
  }
}

export default AdminPage