'use client';

import { useEffect, useState } from 'react';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  // Renderizado consistente sin diferencias entre servidor y cliente
  return <>{children}</>;
};

export default LayoutWrapper;