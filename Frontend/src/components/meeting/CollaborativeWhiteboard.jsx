import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  PenTool, Square, Circle, Type, Undo, Redo,
  Trash2, Save, Download, Minus, Plus
} from 'lucide-react';
import './CollaborativeWhiteboard.css';

const CollaborativeWhiteboard = ({ roomId, userId }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [tempCanvas, setTempCanvas] = useState(null);
  const socketRef = useRef(null);

  // Khởi tạo temp canvas cho vẽ tạm thời
  useEffect(() => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1000;
    tempCanvas.height = 1000;
    setTempCanvas(tempCanvas);
  }, []);

  // Định nghĩa các hàm với useCallback để tránh dependency cycle
  const clearCanvas = useCallback(() => {
    if (!contextRef.current || !canvasRef.current) return;
    
    const context = contextRef.current;
    const canvas = canvasRef.current;
    context.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
    
    // Lưu vào history
    const imageData = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    if (socketRef.current) {
      socketRef.current.emit('clear-canvas', { roomId });
    }
  }, [roomId, history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousState = history[newIndex];
      
      // Khôi phục canvas từ history
      const img = new Image();
      img.onload = () => {
        if (contextRef.current) {
          const context = contextRef.current;
          context.clearRect(0, 0, canvasRef.current.width / 2, canvasRef.current.height / 2);
          context.drawImage(img, 0, 0);
        }
      };
      img.src = previousState;
      
      if (socketRef.current) {
        socketRef.current.emit('undo', { roomId });
      }
    }
  }, [history, historyIndex, roomId]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextState = history[newIndex];
      
      // Khôi phục canvas từ history
      const img = new Image();
      img.onload = () => {
        if (contextRef.current) {
          const context = contextRef.current;
          context.clearRect(0, 0, canvasRef.current.width / 2, canvasRef.current.height / 2);
          context.drawImage(img, 0, 0);
        }
      };
      img.src = nextState;
      
      if (socketRef.current) {
        socketRef.current.emit('redo', { roomId });
      }
    }
  }, [history, historyIndex, roomId]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imageData = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const drawOnCanvas = useCallback((data) => {
    if (!contextRef.current) return;
    
    const context = contextRef.current;
    context.save();
    
    if (data.tool === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
      context.strokeStyle = 'rgba(255, 255, 255, 1)';
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = data.color;
    }
    
    context.lineWidth = data.lineWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    // Vẽ đường thẳng
    context.beginPath();
    context.moveTo(data.points.prevX, data.points.prevY);
    context.lineTo(data.points.x, data.points.y);
    context.stroke();
    
    context.restore();
  }, []);

  // Hàm vẽ hình chữ nhật cuối cùng
  const drawFinalRectangle = useCallback((startX, startY, endX, endY) => {
    if (!contextRef.current) return;
    
    const context = contextRef.current;
    context.save();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    
    const width = endX - startX;
    const height = endY - startY;
    
    context.beginPath();
    context.rect(startX, startY, width, height);
    context.stroke();
    context.restore();
    
    // Gửi qua socket
    if (socketRef.current) {
      const drawingData = {
        tool: 'rectangle',
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        color,
        lineWidth,
        userId,
        roomId
      };
      socketRef.current.emit('drawing', drawingData);
    }
  }, [color, lineWidth, userId, roomId]);

  // Hàm vẽ hình tròn cuối cùng
  const drawFinalCircle = useCallback((centerX, centerY, radius) => {
    if (!contextRef.current) return;
    
    const context = contextRef.current;
    context.save();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.stroke();
    context.restore();
    
    // Gửi qua socket
    if (socketRef.current) {
      const drawingData = {
        tool: 'circle',
        center: { x: centerX, y: centerY },
        radius,
        color,
        lineWidth,
        userId,
        roomId
      };
      socketRef.current.emit('drawing', drawingData);
    }
  }, [color, lineWidth, userId, roomId]);

  useEffect(() => {
    // Khởi tạo canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const container = canvas.parentElement;
    
    const updateCanvasSize = () => {
      if (container) {
        canvas.width = container.clientWidth * 2;
        canvas.height = container.clientHeight * 2;
        canvas.style.width = `${container.clientWidth}px`;
        canvas.style.height = `${container.clientHeight}px`;
        
        // Cập nhật temp canvas size
        if (tempCanvas) {
          tempCanvas.width = container.clientWidth * 2;
          tempCanvas.height = container.clientHeight * 2;
        }
      }
    };

    updateCanvasSize();
    
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    contextRef.current = context;

    // Khởi tạo Socket.IO
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    console.log('Connecting to socket server:', socketUrl);

    // Tham gia phòng whiteboard
    socketRef.current.emit('join-whiteboard', {
      roomId,
      userId,
      color,
      userName: `User-${userId.substring(0, 4)}`
    });

    // Lắng nghe các sự kiện từ server
    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current.on('drawing', (data) => {
      if (data.userId !== userId) { // Không vẽ lại đường của chính mình
        if (data.tool === 'rectangle') {
          const context = contextRef.current;
          if (!context) return;
          
          context.save();
          context.strokeStyle = data.color;
          context.lineWidth = data.lineWidth;
          
          const width = data.end.x - data.start.x;
          const height = data.end.y - data.start.y;
          
          context.beginPath();
          context.rect(data.start.x, data.start.y, width, height);
          context.stroke();
          context.restore();
        } else if (data.tool === 'circle') {
          const context = contextRef.current;
          if (!context) return;
          
          context.save();
          context.strokeStyle = data.color;
          context.lineWidth = data.lineWidth;
          
          context.beginPath();
          context.arc(data.center.x, data.center.y, data.radius, 0, Math.PI * 2);
          context.stroke();
          context.restore();
        } else {
          drawOnCanvas(data);
        }
      }
    });

    socketRef.current.on('users-update', (usersList) => {
      setUsers(usersList);
    });

    socketRef.current.on('clear-canvas', () => {
      clearCanvas();
    });

    socketRef.current.on('undo', () => {
      undo();
    });

    socketRef.current.on('redo', () => {
      redo();
    });

    socketRef.current.on('initial-state', (data) => {
      // Khôi phục trạng thái canvas từ server
      if (data.canvasData) {
        const img = new Image();
        img.onload = () => {
          if (contextRef.current) {
            context.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
            context.drawImage(img, 0, 0);
          }
        };
        img.src = data.canvasData;
      }
    });

    // Xử lý resize window
    window.addEventListener('resize', updateCanvasSize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (socketRef.current) {
        console.log('Disconnecting socket');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId, userId, color, lineWidth, drawOnCanvas, clearCanvas, undo, redo, tempCanvas]);

  const startDrawing = ({ nativeEvent }) => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (2 * rect.width);
    const scaleY = canvas.height / (2 * rect.height);
    
    const x = (nativeEvent.clientX - rect.left) * scaleX;
    const y = (nativeEvent.clientY - rect.top) * scaleY;
    
    setStartPoint({ x, y });
    setLastPoint({ x, y });
    
    if (tool === 'pen' || tool === 'line' || tool === 'eraser') {
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
    }
    
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (2 * rect.width);
    const scaleY = canvas.height / (2 * rect.height);
    
    const currentX = (nativeEvent.clientX - rect.left) * scaleX;
    const currentY = (nativeEvent.clientY - rect.top) * scaleY;
    
    const context = contextRef.current;
    
    switch (tool) {
      case 'pen':
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.lineTo(currentX, currentY);
        context.stroke();
        
        // Gửi drawing data qua socket cho pen tool
        const drawingData = {
          tool,
          points: { 
            prevX: lastPoint.x, 
            prevY: lastPoint.y,
            x: currentX, 
            y: currentY 
          },
          color,
          lineWidth,
          userId,
          roomId
        };
        
        if (socketRef.current) {
          socketRef.current.emit('drawing', drawingData);
        }
        break;
        
      case 'line':
        // Vẽ đường thẳng tạm thời
        const tempContext = canvas.getContext('2d');
        tempContext.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
        tempContext.drawImage(context.canvas, 0, 0);
        
        tempContext.save();
        tempContext.strokeStyle = color;
        tempContext.lineWidth = lineWidth;
        tempContext.beginPath();
        tempContext.moveTo(startPoint.x, startPoint.y);
        tempContext.lineTo(currentX, currentY);
        tempContext.stroke();
        tempContext.restore();
        break;
        
      case 'rectangle':
        // Vẽ hình chữ nhật tạm thời
        const rectContext = canvas.getContext('2d');
        rectContext.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
        rectContext.drawImage(context.canvas, 0, 0);
        
        rectContext.save();
        rectContext.strokeStyle = color;
        rectContext.lineWidth = lineWidth;
        const rectWidth = currentX - startPoint.x;
        const rectHeight = currentY - startPoint.y;
        rectContext.strokeRect(startPoint.x, startPoint.y, rectWidth, rectHeight);
        rectContext.restore();
        break;
        
      case 'circle':
        // Vẽ hình tròn tạm thời
        const circleContext = canvas.getContext('2d');
        circleContext.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
        circleContext.drawImage(context.canvas, 0, 0);
        
        circleContext.save();
        circleContext.strokeStyle = color;
        circleContext.lineWidth = lineWidth;
        const radius = Math.sqrt(
          Math.pow(currentX - startPoint.x, 2) + 
          Math.pow(currentY - startPoint.y, 2)
        );
        circleContext.beginPath();
        circleContext.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
        circleContext.stroke();
        circleContext.restore();
        break;
        
      case 'eraser':
        context.save();
        context.globalCompositeOperation = 'destination-out';
        context.lineWidth = lineWidth * 2;
        context.lineTo(currentX, currentY);
        context.stroke();
        context.restore();
        
        // Gửi drawing data qua socket cho eraser
        const eraserData = {
          tool: 'eraser',
          points: { 
            prevX: lastPoint.x, 
            prevY: lastPoint.y,
            x: currentX, 
            y: currentY 
          },
          color: '#FFFFFF',
          lineWidth: lineWidth * 2,
          userId,
          roomId
        };
        
        if (socketRef.current) {
          socketRef.current.emit('drawing', eraserData);
        }
        break;
        
      default:
        context.lineTo(currentX, currentY);
        context.stroke();
    }
    
    setLastPoint({ x: currentX, y: currentY });
  };

  const stopDrawing = () => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Xóa canvas tạm thời
    context.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
    
    // Vẽ lại từ canvas chính
    const mainContext = contextRef.current;
    context.drawImage(mainContext.canvas, 0, 0);
    
    // Vẽ hình dạng cuối cùng dựa trên tool
    if (tool === 'line') {
      drawFinalLine(startPoint.x, startPoint.y, lastPoint.x, lastPoint.y);
    } else if (tool === 'rectangle') {
      drawFinalRectangle(startPoint.x, startPoint.y, lastPoint.x, lastPoint.y);
    } else if (tool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(lastPoint.x - startPoint.x, 2) + 
        Math.pow(lastPoint.y - startPoint.y, 2)
      );
      drawFinalCircle(startPoint.x, startPoint.y, radius);
    }
    
    if (tool === 'pen' || tool === 'line' || tool === 'eraser') {
      contextRef.current.closePath();
    }
    
    setIsDrawing(false);
    
    // Lưu vào history khi kết thúc vẽ
    saveToHistory();
  };

  // Hàm vẽ đường thẳng cuối cùng
  const drawFinalLine = useCallback((startX, startY, endX, endY) => {
    if (!contextRef.current) return;
    
    const context = contextRef.current;
    context.save();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
    context.restore();
    
    // Gửi qua socket
    if (socketRef.current) {
      const drawingData = {
        tool: 'line',
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        color,
        lineWidth,
        userId,
        roomId
      };
      socketRef.current.emit('drawing', drawingData);
    }
  }, [color, lineWidth, userId, roomId]);

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const colors = [
    '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#800000',
    '#008000', '#000080', '#808000', '#800080',
    '#008080', '#c0c0c0', '#808080', '#ffffff'
  ];

  const tools = [
    { id: 'pen', icon: <PenTool size={20} />, name: 'Bút' },
    { id: 'line', icon: <Minus size={20} />, name: 'Đường thẳng' },
    { id: 'rectangle', icon: <Square size={20} />, name: 'Hình chữ nhật' },
    { id: 'circle', icon: <Circle size={20} />, name: 'Hình tròn' },
    { id: 'text', icon: <Type size={20} />, name: 'Văn bản' },
    { id: 'eraser', icon: <Trash2 size={20} />, name: 'Tẩy' }
  ];

  // Thêm helper function cho touch events
  const getTouchPosition = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { clientX: 0, clientY: 0, offsetX: 0, offsetY: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / (2 * rect.width);
    const scaleY = canvas.height / (2 * rect.height);
    
    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
      offsetX: (touch.clientX - rect.left) * scaleX,
      offsetY: (touch.clientY - rect.top) * scaleY
    };
  };

  return (
    <div className="whiteboard-container">
      {/* Toolbar */}
      <div className="whiteboard-toolbar">
        <div className="tool-group">
          {tools.map(t => (
            <button
              key={t.id}
              className={`tool-btn ${tool === t.id ? 'active' : ''}`}
              onClick={() => setTool(t.id)}
              title={t.name}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="tool-group">
          <div className="color-picker">
            {colors.map(c => (
              <button
                key={c}
                className={`color-btn ${color === c ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => {
                  setColor(c);
                  if (contextRef.current) {
                    contextRef.current.strokeStyle = c;
                  }
                }}
                title={c}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                if (contextRef.current) {
                  contextRef.current.strokeStyle = e.target.value;
                }
              }}
              className="color-input"
            />
          </div>
        </div>

        <div className="tool-group">
          <div className="line-width-control">
            <button
              className="width-btn"
              onClick={() => {
                const newWidth = Math.max(1, lineWidth - 1);
                setLineWidth(newWidth);
                if (contextRef.current) {
                  contextRef.current.lineWidth = newWidth;
                }
              }}
              disabled={lineWidth <= 1}
            >
              <Minus size={16} />
            </button>
            <span className="width-display">{lineWidth}px</span>
            <button
              className="width-btn"
              onClick={() => {
                const newWidth = Math.min(50, lineWidth + 1);
                setLineWidth(newWidth);
                if (contextRef.current) {
                  contextRef.current.lineWidth = newWidth;
                }
              }}
              disabled={lineWidth >= 50}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="tool-group">
          <button
            className="tool-btn"
            onClick={undo}
            title="Hoàn tác"
            disabled={historyIndex <= 0}
          >
            <Undo size={20} />
          </button>
          <button
            className="tool-btn"
            onClick={redo}
            title="Làm lại"
            disabled={historyIndex >= history.length - 1}
          >
            <Redo size={20} />
          </button>
          <button
            className="tool-btn"
            onClick={clearCanvas}
            title="Xóa tất cả"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="tool-group">
          <button
            className="tool-btn"
            onClick={downloadCanvas}
            title="Tải xuống"
          >
            <Download size={20} />
          </button>
          <button
            className="tool-btn"
            onClick={saveToHistory}
            title="Lưu"
          >
            <Save size={20} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => {
            e.preventDefault();
            const touchPos = getTouchPosition(e);
            startDrawing({ nativeEvent: touchPos });
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const touchPos = getTouchPosition(e);
            draw({ nativeEvent: touchPos });
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopDrawing();
          }}
          className="whiteboard-canvas"
        />
        
        {/* Hiển thị thông báo khi không kết nối được socket */}
        {socketRef.current && !socketRef.current.connected && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid red',
            padding: '10px',
            borderRadius: '5px',
            color: 'red',
            fontSize: '12px'
          }}>
            ⚠️ Không thể kết nối tới Socket server. Vui lòng chạy server trước.
            <div style={{ fontSize: '10px', marginTop: '5px' }}>
              Chạy: <code>npm run server</code> hoặc <code>node server.js</code>
            </div>
          </div>
        )}
      </div>

      {/* Users Panel */}
      <div className="whiteboard-users">
        <h3>Đang vẽ ({users.length})</h3>
        <div className="users-list">
          {users.map(user => (
            <div key={user.id} className="user-item">
              <div
                className="user-color"
                style={{ backgroundColor: user.color || '#000000' }}
              />
              <span className="user-name">
                {user.name || `User-${user.id.substring(0, 4)}`} 
                {user.id === userId && ' (Bạn)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="whiteboard-status">
        <span>Công cụ: {tools.find(t => t.id === tool)?.name}</span>
        <span>Màu sắc: {color}</span>
        <span>Độ dày: {lineWidth}px</span>
        <span>Room: {roomId}</span>
        <span>Trạng thái: {socketRef.current?.connected ? 'Đã kết nối' : 'Đang kết nối...'}</span>
      </div>
    </div>
  );
};

export default CollaborativeWhiteboard;