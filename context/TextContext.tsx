// TextContext.tsx
import React from 'react';

type TextContextType = {
  text: string;
  setText: (newText: string) => void;
};

const TextContext = React.createContext<TextContextType>({
  text: '',
  setText: () => {},
});

export default TextContext;
