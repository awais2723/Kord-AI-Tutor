import React, { Component, createRef, RefObject } from 'react';
import { View, Platform, ActivityIndicator } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

type Props = {
  html: string;
  css?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
    lineHeight?: string;
    fontWeight?: string;
    fontFamily?: string;
  };
};

type State = {
  height: number;
  loading: boolean;
};

class MathJax extends Component<Props, State> {
  webviewRef: RefObject<WebView>;

  constructor(props: Props) {
    super(props);
    this.webviewRef = createRef<WebView>();
    this.state = {
      height: 100, // Initial placeholder height
      loading: true,
    };
  }

  handleMessage = (event: WebViewMessageEvent): void => {
    const data = Number(event.nativeEvent.data);
    if (!isNaN(data) && data > 0) {
      this.setState({ height: data, loading: false });
    }
  };

  wrapMathjax = (content: string): string => {
    const { css } = this.props;

    // 1. Sanitize/Escape backslashes for the HTML string context
    // This ensures \frac doesn't disappear before MathJax sees it.
    const safeContent = content.replace(/\\/g, '\\\\');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: ${css?.backgroundColor || 'transparent'};
              color: ${css?.color || '#000000'};
              font-family: ${css?.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
              font-size: ${css?.fontSize || '16px'};
              line-height: ${css?.lineHeight || '1.6'};
              font-weight: ${css?.fontWeight || 'normal'};
              overflow: hidden; /* Hide scrollbars so we calculate exact height */
            }
            #math-content {
              display: none; /* Hide until rendered to prevent jump */
              padding: 1px; /* Prevent collapse */
            }
          </style>
          
          <script>
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
              },
              startup: {
                pageReady: () => {
                  return MathJax.startup.defaultPageReady().then(() => {
                    // 1. Math is rendered, show the div
                    const content = document.getElementById("math-content");
                    content.style.display = "block";
                    
                    // 2. Calculate height
                    const height = content.scrollHeight;
                    
                    // 3. Send to React Native
                    window.ReactNativeWebView.postMessage(String(height));
                  });
                }
              }
            };
          </script>
          <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script" async></script>
        </head>
        <body>
          <div id="math-content">
            ${safeContent}
          </div>
        </body>
      </html>
    `;
  };

  render() {
    const { html, css } = this.props;
    const { height, loading } = this.state;
    const wrappedHtml = this.wrapMathjax(html);

    return (
      <View style={{ height, opacity: loading ? 0 : 1 }}>
        <WebView
          ref={this.webviewRef}
          originWhitelist={['*']}
          source={{
            html: wrappedHtml,
            // Crucial for Android to load the CDN script
            baseUrl: Platform.OS === 'android' ? 'file:///android_asset/' : '',
          }}
          onMessage={this.handleMessage}
          javaScriptEnabled={true}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: css?.backgroundColor || 'transparent' }}
        />
        {/* Optional: Placeholder while loading */}
        {loading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <ActivityIndicator color={css?.color || 'gray'} />
          </View>
        )}
      </View>
    );
  }
}

export default MathJax;
