import React from 'react';

export function GlassSurface({ children, className = '', ...props }) {
  return (
    <div className={`glass-surface ${className}`} {...props}>
      {children}
    </div>
  );
}

export default GlassSurface;
