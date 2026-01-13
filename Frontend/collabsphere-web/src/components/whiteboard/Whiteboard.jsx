import React, { useRef, useState, useEffect } from 'react';
import io from 'socket.io-client';
import './Whiteboard.css';

const Whiteboard = ({ boardId, userId, userName }) => {
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [elements, setElements] = useState([]);
  const [users, setUsers] = useState([]);
  const [lastPoint, setLastPoint] = useState(null);

  // Khởi tạo canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Cài đặt kích thước canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Kết nối WebSocket
    const newSocket = io(`${process.env.REACT_APP_API_URL}/whiteboard`, {
      auth: {
        token: localStorage.getItem('token')
      },
      query: {
        boardId,
        userId,
        userName
      }
    });

    newSocket.on('connect', () => {
      console.log('Đã kết nối whiteboard');
    });

    newSocket.on('elementAdded', (element) => {
      drawElement(element);
      setElements(prev => [...prev, element]);
    });

    newSocket.on('elementUpdated', (element) => {
      redrawCanvas();
      setElements(prev => prev.map(el => 
        el.id === element.id ? element : el
      ));
    });

    newSocket.on('boardCleared', () => {
      clearCanvas();
      setElements([]);
    });

    newSocket.on('usersUpdate', (userList) => {
      setUsers(userList);
    });

    // Load elements hiện có
    newSocket.emit('getElements', boardId);

    setSocket(newSocket);

    // Responsive canvas
    window.addEventListener('resize', handleResize);

    return () => {
      newSocket.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [boardId, userId, userName]);

  const handleResize = () => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    redrawCanvas();
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    elements.forEach(drawElement);
  };

  const drawElement = (element) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = element.color;
    ctx.fillStyle = element.fill || 'transparent';
    ctx.lineWidth = element.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (element.type) {
      case 'line':
        ctx.beginPath();
        ctx.moveTo(element.x1, element.y1);
        ctx.lineTo(element.x2, element.y2);
        ctx.stroke();
        break;

      case 'rectangle':
        ctx.beginPath();
        ctx.rect(element.x, element.y, element.width, element.height);
        ctx.stroke();
        if (element.fill !== 'transparent') ctx.fill();
        break;

      case 'circle':
        ctx.beginPath();
        ctx.arc(element.x, element.y, element.radius, 0, Math.PI * 2);
        ctx.stroke();
        if (element.fill !== 'transparent') ctx.fill();
        break;

      case 'text':
        ctx.font = `${element.fontSize}px Arial`;
        ctx.fillStyle = element.color;
        ctx.fillText(element.text, element.x, element.y);
        break;

      case 'pen':
        if (element.points && element.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y);
          }
          ctx.stroke();
        }
        break;
    }
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setLastPoint({ x, y });

    if (tool === 'text') {
      const text = prompt('Nhập văn bản:', '');
      if (text) {
        const element = {
          id: Date.now().toString(),
          type: 'text',
          x,
          y,
          text,
          color,
          fontSize: strokeWidth * 5,
          userId,
          userName
        };
        
        drawElement(element);
        socket.emit('addElement', { boardId, element });
      }
    }
  };

  const draw = (e) => {
    if (!isDrawing || tool === 'text') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let element;
    
    if (tool === 'pen') {
      const points = [{ x: lastPoint.x, y: lastPoint.y }, { x, y }];
      element = {
        id: Date.now().toString(),
        type: 'pen',
        points,
        color,
        strokeWidth,
        userId,
        userName
      };
      
      // Vẽ tạm thời
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
      
    } else if (tool === 'line') {
      element = {
        id: Date.now().toString(),
        type: 'line',
        x1: lastPoint.x,
        y1: lastPoint.y,
        x2: x,
        y2: y,
        color,
        strokeWidth,
        userId,
        userName
      };
      
      // Vẽ tạm thời
      redrawCanvas();
      drawElement(element);
      
    } else if (tool === 'rectangle') {
      const width = x - lastPoint.x;
      const height = y - lastPoint.y;
      element = {
        id: Date.now().toString(),
        type: 'rectangle',
        x: lastPoint.x,
        y: lastPoint.y,
        width,
        height,
        color,
        strokeWidth,
        fill: 'transparent',
        userId,
        userName
      };
      
      redrawCanvas();
      drawElement(element);
      
    } else if (tool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2)
      );
      element = {
        id: Date.now().toString(),
        type: 'circle',
        x: lastPoint.x,
        y: lastPoint.y,
        radius,
        color,
        strokeWidth,
        fill: 'transparent',
        userId,
        userName
      };
      
      redrawCanvas();
      drawElement(element);
    }

    setLastPoint({ x, y });
    if (element && socket) {
      socket.emit('addElement', { boardId, element });
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearBoard = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ bảng?')) {
      if (socket) {
        socket.emit('clearBoard', boardId);
      }
      clearCanvas();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const changeTool = (newTool) => {
    setTool(newTool);
  };

  const changeColor = (newColor) => {
    setColor(newColor);
  };

  return (
    <div className="whiteboard">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="tool-section">
          <h4>Công cụ</h4>
          <div className="tools">
            <button 
              className={`tool-button ${tool === 'pen' ? 'active' : ''}`}
              onClick={() => changeTool('pen')}
              title="Bút vẽ"
            >
              ✏️
            </button>
            <button 
              className={`tool-button ${tool === 'line' ? 'active' : ''}`}
              onClick={() => changeTool('line')}
              title="Đường thẳng"
            >
              📏
            </button>
            <button 
              className={`tool-button ${tool === 'rectangle' ? 'active' : ''}`}
              onClick={() => changeTool('rectangle')}
              title="Hình chữ nhật"
            >
              ⬜
            </button>
            <button 
              className={`tool-button ${tool === 'circle' ? 'active' : ''}`}
              onClick={() => changeTool('circle')}
              title="Hình tròn"
            >
              ⭕
            </button>
            <button 
              className={`tool-button ${tool === 'text' ? 'active' : ''}`}
              onClick={() => changeTool('text')}
              title="Văn bản"
            >
              🔤
            </button>
          </div>
        </div>

        <div className="tool-section">
          <h4>Màu sắc</h4>
          <div className="colors">
            <input 
              type="color" 
              value={color}
              onChange={(e) => changeColor(e.target.value)}
            />
            <div className="color-presets">
              {['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(c => (
                <button
                  key={c}
                  className="color-preset"
                  style={{ backgroundColor: c }}
                  onClick={() => changeColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="tool-section">
          <h4>Độ dày</h4>
          <div className="stroke-control">
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            />
            <span>{strokeWidth}px</span>
          </div>
        </div>

        <div className="tool-section">
          <h4>Hành động</h4>
          <div className="actions">
            <button className="action-button" onClick={clearBoard}>
              🗑️ Xóa bảng
            </button>
            <button className="action-button" onClick={() => window.print()}>
              🖨️ In
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {/* Users Panel */}
      <div className="users-panel">
        <h4>👥 Người đang vẽ ({users.length})</h4>
        <div className="users-list">
          <div className="user-item current">
            <div className="user-color" style={{ backgroundColor: color }} />
            <span>{userName} (Bạn)</span>
          </div>
          {users
            .filter(u => u.id !== userId)
            .map(user => (
              <div key={user.id} className="user-item">
                <div className="user-color" style={{ backgroundColor: user.color || '#666' }} />
                <span>{user.name}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;