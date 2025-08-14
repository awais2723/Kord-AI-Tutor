// TextProvider.tsx
import React, { Component, ReactNode } from 'react';

import TextContext from '../context/TextContext';

type Props = { children: ReactNode };
type State = { text: string };

class TextProvider extends Component<Props, State> {
  setText = (newText: string) => {
    this.setState({ text: newText });
  };

  state: State = {
    text: '',
  };

  render() {
    const contextValue = {
      text: this.state.text,
      setText: this.setText,
    };

    return <TextContext.Provider value={contextValue}>{this.props.children}</TextContext.Provider>;
  }
}

export default TextProvider;
