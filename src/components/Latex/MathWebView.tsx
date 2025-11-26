import React, { Component, createRef, RefObject } from 'react';
import { View, Platform, ActivityIndicator, Text } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

type Props = {
  html: string;
  css?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
    lineHeight?: string;
    fontWeight?: string;
  };
};

type State = {
  height: number;
  loading: boolean;
  error: boolean;
};

class MathWebView extends Component<Props, State> {
  webviewRef: RefObject<WebView>;

  constructor(props: Props) {
    super(props);
    this.webviewRef = createRef<WebView>();
    this.state = {
      height: 100, // Default height to prevent full collapse
      loading: true,
      error: false,
    };
  }

  handleMessage = (event: WebViewMessageEvent): void => {
    // We can receive a Height number OR a debug log string
    const data = event.nativeEvent.data;

    const height = Number(data);
    if (!isNaN(height) && height > 0) {
      this.setState({ height, loading: false });
    } else {
      // If it's a log message from the WebView console
      console.log('WebView Log:', data);
    }
  };

  wrapHtml = (content: string): string => {
    const { css } = this.props;

    // 1. Double escape backslashes so they survive HTML parsing
    // content = "\frac" -> becomes "\\frac" inside the JS string
    const safeContent = content.replace(/\\/g, '\\\\');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
          
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossorigin="anonymous">

          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" integrity="sha384-XjKyZS/nXd1VPagdy83+8+CwiChwYkmDIYAZeScBp3XjojFkIiDiae46RmQ2Kcw+" crossorigin="anonymous" onload="window.katexLoaded=true"></script>

          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" integrity="sha384-+VBxd3r6XgURycqtZ117nYw44OOcIax56Z4dCRWbxyPt0Koah1uHoK0o4+/RRE05" crossorigin="anonymous" onload="renderMath()"></script>
          
          <style>
            body {
                margin: 0;
                padding: 0;
                background-color: ${css?.backgroundColor || 'transparent'};
                color: ${css?.color || '#000000'};
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: ${css?.fontSize || '16px'};
                line-height: ${css?.lineHeight || '1.6'};
                overflow: hidden; 
            }
            #content {
                display: none; /* Hide raw text until render is done */
                padding: 2px;
            }
            /* Make math scrollable if too wide */
            .katex-display {
                overflow-x: auto;
                overflow-y: hidden;
            }
          </style>

          <script>
            function log(msg) {
                window.ReactNativeWebView.postMessage(msg);
            }

            function renderMath() {
                if (!window.renderMathInElement) {
                    setTimeout(renderMath, 100); // Retry if script not ready
                    return;
                }
                
                try {
                    var elem = document.getElementById("content");
                    
                    renderMathInElement(elem, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\(', right: '\\)', display: false},
                            {left: '\\[', right: '\\]', display: true}
                        ],
                        throwOnError: false
                    });

                    // Show content
                    elem.style.display = "block";
                    
                    // Send Height
                    var height = document.body.scrollHeight;
                    window.ReactNativeWebView.postMessage(String(height));
                } catch(e) {
                    log("Render Error: " + e.message);
                }
            }
          </script>
        </head>
        <body>
          <div id="content">
            ${safeContent}
          </div>
        </body>
      </html>
    `;
  };

  render() {
    const { html, css } = this.props;
    const { height, loading } = this.state;
    const wrappedHtml = this.wrapHtml(html);

    return (
      <View style={{ height, opacity: loading ? 0 : 1 }}>
        <WebView
          ref={this.webviewRef}
          originWhitelist={['*']}
          source={{
            html: wrappedHtml,
            baseUrl: Platform.OS === 'android' ? 'file:///android_asset/' : '',
          }}
          onMessage={this.handleMessage}
          javaScriptEnabled={true}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: css?.backgroundColor || 'transparent' }}
          // Debugging: If it fails to load
          onError={e => console.log('WebView Error: ', e.nativeEvent)}
        />
        {/* Simple loader */}
        {loading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
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

export default MathWebView;
