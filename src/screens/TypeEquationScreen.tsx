import { Component } from 'react';
import { View, KeyboardAvoidingView } from 'react-native';

import { LatexEditor } from '@/src/components';

type Props = { latex?: string };

class TypeEquationScreen extends Component<Props> {
  render() {
    return (
      <View className="bg-gray-100 flex flex-col flex-1 justify-start items-center">
        <KeyboardAvoidingView>
          <LatexEditor latex={this.props.latex} />
        </KeyboardAvoidingView>
      </View>
    );
  }
}

export default TypeEquationScreen;
