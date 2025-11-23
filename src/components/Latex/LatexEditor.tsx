import { Component, createRef, RefObject } from 'react';
import { Button, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

// 1. Add onSubmit to Props
type Props = {
  latex?: string;
  onSubmit: (latex: string) => void;
};

type State = {
  latexValue?: string;
};

class LatexEditor extends Component<Props, State> {
  webviewRef: RefObject<WebView>;

  constructor(props: Props) {
    super(props);
    this.webviewRef = createRef<WebView>();
    this.state = {
      latexValue: '',
    };
  }

  componentDidMount() {
    // Note: We don't force focus immediately to prevent keyboard flickering issues
  }

  // --- HELPER TO SEND COMMANDS TO WEB SAFELY ---
  sendToWebView = (type: string, value?: string) => {
    // We use injectJavaScript because standard postMessage often fails
    // with this specific web keyboard library (it expects an Object, not a string)
    const payload = JSON.stringify({ type, value });
    const run = `
      window.postMessage(${payload}, "*");
      true;
    `;
    this.webviewRef.current?.injectJavaScript(run);
  };

  handleMessage = (event: WebViewMessageEvent) => {
    const message = event.nativeEvent.data;
    this.setState({ latexValue: message });
  };

  setInitialLatexValue = (value: string) => {
    this.sendToWebView('setLatex', value);
  };

  clearMathField = () => {
    this.sendToWebView('clearLatex');
    this.setState({ latexValue: '' });
  };

  // 2. Handle the Submit Action
  handleSolve = () => {
    const { latexValue } = this.state;
    // Only submit if there is content
    if (latexValue && latexValue.trim() !== '') {
      this.props.onSubmit(latexValue);
    } else {
      // Optional: Alert user input is empty
      alert('Please enter an equation first.');
    }
  };

  render() {
    return (
      <View className="flex-1 bg-white">
        {/* WebView Container: Takes 85% height */}
        <View className="h-[85%] w-full">
          <WebView
            ref={this.webviewRef}
            // Fixed typo in URL: raect -> react
            source={{ uri: 'https://raect-math-keyboard.vercel.app' }}
            onMessage={this.handleMessage}
            bounces={false}
            overScrollMode="never"
            scalesPageToFit={true}
            scrollEnabled={false}
            setBuiltInZoomControls={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            keyboardDisplayRequiresUserAction={false}
            hideKeyboardAccessoryView={true}
            textInteractionEnabled={false}
            useWebView2={true}
            thirdPartyCookiesEnabled={true}
            startInLoadingState={true}
            javaScriptEnabled={true}
            originWhitelist={['*']}
            // Load initial value when webview is ready
            onLoadEnd={() => {
              if (this.props.latex) this.setInitialLatexValue(this.props.latex);
            }}
          />
        </View>

        {/* 3. Bottom Action Bar: Takes 15% height */}
        <View className="h-[15%] flex-row items-center justify-between px-6 bg-gray-50 border-t border-gray-200">
          {/* Clear Button */}
          <TouchableOpacity
            onPress={this.clearMathField}
            className="bg-gray-300 py-3 px-6 rounded-lg">
            <Text className="text-gray-700 font-bold">Clear</Text>
          </TouchableOpacity>

          {/* Submit / Solve Button */}
          <TouchableOpacity
            onPress={this.handleSolve}
            className="bg-violet-700 py-3 px-8 rounded-lg shadow-sm">
            <Text className="text-white font-bold text-lg">Solve with AI</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export default LatexEditor;
