import React from 'ez-react'
import ReactDOM from './index'

const testReactDom = (jsx, expectedInnerHtml) => {
  const container = document.createElement('div');
  ReactDOM.render(jsx, container);
  const {innerHTML} = container;
  expect(innerHTML).toBe(expectedInnerHtml);
};

describe('test ez-react-dom', () => {
  test('StrJsx', () => {
    const StrJsx = 'hello ez-react-dom !';
    const expectedInnerHtml = 'hello ez-react-dom !';
    testReactDom(StrJsx, expectedInnerHtml);
  });

  test('StrJsxWithHtmlTagAndSpecialChar', () => {
    const StrJsxWithHtmlTagAndSpecialChar = 'author: cw1997<867597730@qq.com> \\ <a href="http://www.changwei.me"></a>';
    const expectedInnerHtml = 'author: cw1997&lt;867597730@qq.com&gt; \\ &lt;a href="http://www.changwei.me"&gt;&lt;/a&gt;';
    testReactDom(StrJsxWithHtmlTagAndSpecialChar, expectedInnerHtml);
  });

  test('NumJsx', () => {
    const StrJsx = 1997;
    const expectedInnerHtml = '1997';
    testReactDom(StrJsx, expectedInnerHtml);
  });

  test('BoolJsx', () => {
    const BoolJsx = true;
    const expectedInnerHtml = 'true';
    testReactDom(BoolJsx, expectedInnerHtml);
  });

  test('StrJsx', () => {
    const StrJsx = 'str';
    const expectedInnerHtml = 'str';
    testReactDom(StrJsx, expectedInnerHtml);
  });

  test('SimpleJsx', () => {
    const SimpleJsx = <span>world</span>;
    const expectedInnerHtml = '<span>world</span>';
    testReactDom(SimpleJsx, expectedInnerHtml);
  });

  test('SimpleJsxWithAttributes', () => {
    const SimpleJsxWithAttributes = <span id="name">cw1997</span>;
    const expectedInnerHtml = '<span id="name">cw1997</span>';
    testReactDom(SimpleJsxWithAttributes, expectedInnerHtml);
  });

  test('ComplicatedJsxWithProperties', () => {
    const ComplicatedJsxWithProperties = (
      <div
        id="my-div"
        data-info="my-data-info"
      >
        hello{' '}{(<span>world</span>)}!
      </div>
    );
    const expectedInnerHtml = '<div id="my-div" data-info="my-data-info">hello <span>world</span>!</div>';
    testReactDom(ComplicatedJsxWithProperties, expectedInnerHtml);
  });

  test('FunctionComponentWithProperties', () => {
    const FunctionComponentWithProperties = (props: { name: string }) => <span id="name">{props.name}</span>;
    const expectedInnerHtml = '<span id="name">cw1997</span>';
    testReactDom(<FunctionComponentWithProperties name={'cw1997'} />, expectedInnerHtml);
  });

  test('ComplicatedJsxWithFunctionComponent', () => {
    const FunctionComponentWithProperties = (props: { name: string }) => <span id="name">{props.name}</span>;
    const ComplicatedJsxWithFunctionComponent = (props: { name: string }) => (
      <div
        id="my-div"
        data-info="my-data-info"
      >
        hello{' '}<FunctionComponentWithProperties name={name}/>!
      </div>
    );
    const expectedInnerHtml = '<div id="my-div" data-info="my-data-info">hello <span id="name"></span>!</div>';
    testReactDom(<ComplicatedJsxWithFunctionComponent name={'cw1997'} />, expectedInnerHtml);
  });

  test('ComplicatedJsxWithFunctionComponentAndEventHandler', () => {
    const FunctionComponentWithProperties = (props: { name: string }) => <span id="name">{props.name}</span>;
    const MouseMoveEventHandler = (event: MouseEvent, action: 'enter' | 'out') => {
      console.info(`mouse move ${action} the NameComponent`);
    };
    const ComplicatedJsxWithFunctionComponentAndEventHandler = (props: { name: string }) => (
      <div
        style={{backgroundColor: 'lightblue'}}
        onClick={() => alert('hello world')}
        onMouseEnter={(event) => MouseMoveEventHandler(event, 'enter')}
        onMouseOut={(event) => MouseMoveEventHandler(event, 'out')}
      >
        hello <FunctionComponentWithProperties name={name}/>!
      </div>
    );
    const expectedInnerHtml = '<div style="background-color: lightblue;" onclick="function onClick() {\n' +
      '          return alert(\'hello world\');\n' +
      '        }" onmouseenter="function onMouseEnter(event) {\n' +
      '          return MouseMoveEventHandler(event, \'enter\');\n' +
      '        }" onmouseout="function onMouseOut(event) {\n' +
      '          return MouseMoveEventHandler(event, \'out\');\n' +
      '        }">hello <span id="name"></span>!</div>';
    testReactDom(<ComplicatedJsxWithFunctionComponentAndEventHandler name={'cw1997'} />, expectedInnerHtml);
  });

  test('ComplicatedJsxWithFunctionComponentAndSpecialProperties', () => {
    const FunctionComponentWithProperties = (props: { name: string }) => <span id="name">{props.name}</span>;
    const ComplicatedJsxWithFunctionComponentAndSpecialProperties = (props: { name: string }) => (
      <div
        style={{backgroundColor: 'lightblue'}}
        // onclick={() => alert('hello world')}
        className="my-class"
      >
        hello <FunctionComponentWithProperties name={name}/>!
        <hr/>
        <label htmlFor="name-input">
          <input id="name-input" tabIndex={0}/>
        </label>
      </div>
    );
    const expectedInnerHtml = '<div style="background-color: lightblue;" class="my-class">hello <span id="name"></span>!<hr><label for="name-input"><input id="name-input" tabindex="0"></label></div>';
    testReactDom(<ComplicatedJsxWithFunctionComponentAndSpecialProperties name={'cw1997'} />, expectedInnerHtml);
  });

  test('ComplicatedJsxWithFunctionComponentAndStyleProperties', () => {
    const FunctionComponentWithProperties = (props: { name: string }) => <span id="name">{props.name}</span>;
    const ComplicatedJsxWithFunctionComponentAndSpecialProperties = (props: { name: string }) => (
      <div
        style="background-color: lightblue;"
        // onclick={() => alert('hello world')}
        className="my-class"
      >
        hello <FunctionComponentWithProperties name={name}/>!
        <hr/>
        <label htmlFor="name-input">
          <input id="name-input" tabIndex={0}/>
        </label>
      </div>
    );
    const expectedInnerHtml = '<div style="background-color: lightblue;" class="my-class">hello <span id="name"></span>!<hr><label for="name-input"><input id="name-input" tabindex="0"></label></div>';
    testReactDom(<ComplicatedJsxWithFunctionComponentAndSpecialProperties name={'cw1997'} />, expectedInnerHtml);
  });

  test('ComplicatedJsxWithFunctionComponentAndEmptyStyleProperties', () => {
    const FunctionComponentWithProperties = (props: { name: string }) => <span id="name">{props.name}</span>;
    const ComplicatedJsxWithFunctionComponentAndEmptyStyleProperties = (props: { name: string }) => (
      <div
        style={false}
        className="my-class"
      >
        hello <FunctionComponentWithProperties name={name}/>!
        <hr/>
        <label htmlFor="name-input">
          <input id="name-input" tabIndex={0}/>
        </label>
      </div>
    );
    const expectedInnerHtml = '<div class="my-class">hello <span id="name"></span>!<hr><label for="name-input"><input id="name-input" tabindex="0"></label></div>';
    testReactDom(<ComplicatedJsxWithFunctionComponentAndEmptyStyleProperties name={'cw1997'} />, expectedInnerHtml);
  });

});
