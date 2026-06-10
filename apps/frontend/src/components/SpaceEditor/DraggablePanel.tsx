import React, { useState, useRef, useEffect } from 'react';

interface DraggablePanelProps {
  children: React.ReactNode;
  defaultPosition?: { x?: number; y?: number; right?: number };
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

const DraggablePanel: React.FC<DraggablePanelProps> = ({
  children,
  defaultPosition = { x: 16, y: 16 },
  title,
  className,
  style,
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, panelStartX: 0, panelStartY: 0, usingRight: false });

  // 构建样式
  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 100,
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    top: position.y ?? 16,
    ...style,
  };
  
  // 根据是否设置了 right 来决定使用 left 还是 right
  if (position.right !== undefined) {
    panelStyle.right = position.right;
  } else {
    panelStyle.left = position.x ?? 16;
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    
    // 记录开始拖动时的状态
    const rect = panelRef.current.getBoundingClientRect();
    const parent = panelRef.current.offsetParent as HTMLElement;
    const parentRect = parent?.getBoundingClientRect();
    
    // 计算相对于父容器的位置
    const startLeft = parentRect ? rect.left - parentRect.left : rect.left;
    const startTop = parentRect ? rect.top - parentRect.top : rect.top;
    
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panelStartX: startLeft,
      panelStartY: startTop,
      usingRight: position.right !== undefined,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !panelRef.current) return;
      
      const { startX, startY, panelStartX, panelStartY } = dragStartRef.current;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // 拖动时统一使用 left 定位，便于计算
      setPosition({
        x: panelStartX + deltaX,
        y: panelStartY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={panelRef}
      className={className}
      style={panelStyle}
    >
      {title && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            padding: '8px 12px',
            background: '#fafafa',
            borderBottom: '1px solid #e8e8e8',
            borderRadius: '8px 8px 0 0',
            cursor: 'move',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            userSelect: 'none',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>::</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
        </div>
      )}
      <div onMouseDown={title ? undefined : handleMouseDown}>
        {children}
      </div>
    </div>
  );
};

export default DraggablePanel;
