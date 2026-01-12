import React, { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

function Whiteboard({ meetingId }) {
  const canvasRef = useRef(null);
  const connectionRef = useRef(null);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5000/hubs/whiteboard")
      .build();

    connection.start().then(() => {
      connection.invoke("JoinBoard", meetingId);
    });

    connection.on("ReceiveDraw", data => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    });

    connectionRef.current = connection;
  }, [meetingId]);

  const draw = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const data = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(data.x, data.y);
    ctx.stroke();

    connectionRef.current.invoke("Draw", meetingId, data);
  };

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      onMouseMove={draw}
      style={{ border: "1px solid black" }}
    />
  );
}

export default Whiteboard;
