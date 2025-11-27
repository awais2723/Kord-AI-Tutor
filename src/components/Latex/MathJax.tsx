import React, { Component, createRef, RefObject } from 'react';
import { View, Platform, ActivityIndicator } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

type Props = {
  html: string;
  display?: boolean; // New Prop: Force display mode ($$ ... $$)
  css?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
    lineHeight?: string;
    fontWeight?: string;
    fontFamily?: string;
    textAlign?: string;
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
      height: 40,
      loading: true,
    };
  }

  handleMessage = (event: WebViewMessageEvent): void => {
    const data = Number(event.nativeEvent.data);
    if (!isNaN(data) && data > 0) {
      this.setState({ height: data + 8, loading: false });
    }
  };

  wrapMathjax = (content: string): string => {
    const { css, display } = this.props;

    // 1. Force Display Mode if requested
    // If the content is "x=5", making it "$$ x=5 $$" forces MathJax to render it big and centered.
    let finalContent = content;
    if (display) {
      // Strip existing delimiters just in case, then wrap
      finalContent = `$$ ${content.replace(/^\$\$|\$\$$/g, '')} $$`;
    }

    // 2. Prepare for Injection
    const safeJsonString = JSON.stringify(finalContent);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              background-color: ${css?.backgroundColor || 'transparent'};
              color: ${css?.color || '#000000'};
              font-family: ${css?.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
              font-size: ${css?.fontSize || '16px'};
              line-height: ${css?.lineHeight || '1.5'};
              font-weight: ${css?.fontWeight || 'normal'};
              text-align: ${css?.textAlign || 'left'};
              overflow: hidden; 
            }
            #math-content {
              display: none; 
              padding-top: 2px;
              padding-bottom: 2px;
            }
            .mjx-block { margin: 0.2em 0 !important; }
          </style>
          
          <script>
            window.MathJax = {
              loader: {load: ['[tex]/ams']},
              tex: {
                packages: {'[+]': ['ams']},
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
              },
              startup: {
                typeset: false // Manual typeset trigger
              }
            };
          </script>
          <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script" async></script>
        </head>
        <body>
          <div id="math-content"></div>
          
          <script>
            // INJECTION STRATEGY
            var raw = ${safeJsonString};
            var div = document.getElementById('math-content');
            
            // Double-escape backslashes if they were stripped
            // This turns "frac" back into "\frac" if the context implies it, 
            // but primarily we trust JSON.stringify. 
            // If previous issues persisted, we might need to manually re-insert slash for common keywords.
            // For now, let's trust raw injection.
            div.innerText = raw; 

            var checkMathJax = setInterval(function() {
              if (window.MathJax && window.MathJax.typesetPromise) {
                clearInterval(checkMathJax);
                div.style.display = 'block';
                window.MathJax.typesetPromise([div]).then(function() {
                   var height = div.scrollHeight;
                   window.ReactNativeWebView.postMessage(String(height));
                });
              }
            }, 50);
          </script>
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
            baseUrl: Platform.OS === 'android' ? 'file:///android_asset/' : '',
          }}
          onMessage={this.handleMessage}
          javaScriptEnabled={true}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: css?.backgroundColor || 'transparent' }}
        />
      </View>
    );
  }
}

export default MathJax;
