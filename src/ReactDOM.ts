import {VirtualDOM} from "ez-react";

export default class ReactDOM {
  public static render(vDom: VirtualDOM | string | number | boolean, container: HTMLElement) {
    // console.log(vDom);
    //  if you want to erase container when call ReactDOM.render, please uncomment the next line.
    container.innerHTML = '';
    const recordRenderSpendTimeKey = 'ez-ReactDOM._render spend time: ';
    console.time(recordRenderSpendTimeKey);
    this._render(vDom, container);
    console.timeEnd(recordRenderSpendTimeKey);
  }

  private static _render(vDom: VirtualDOM | string | number | boolean, container: HTMLElement) {
    // console.count('call ez-ReactDOM._render count: ');
    switch (typeof vDom) {
      case "string":
      case "number":
      case "boolean": {
        // console.debug('start: ', '_renderText');
        return this._renderText(vDom, container);
      }
      case 'object':
      default: {
        const {tagName, attributes, children} = vDom;
        switch (typeof tagName) {
          case 'function':
          case 'object': {
            // console.debug('start: ', '_renderComponent');
            return this._renderComponent(vDom, container);
          }
          case 'string':
          default: {
            // console.debug('start: ', '_renderHtmlTag');
            return this._renderHtmlTag(vDom, container);
          }
        }
      }
    }
  }

  private static _renderText(vDom: string | number | boolean, container: HTMLElement) {
    const element = document.createTextNode(String(vDom));
    return container.appendChild(element);
  }

  private static _renderHtmlTag(vDom: VirtualDOM, container: HTMLElement) {
    const {tagName, attributes, children} = vDom;
    const element = document.createElement(tagName as string);
    if (attributes) {
      Object.keys(attributes).forEach((key, index) => {
        this._setDomAttribute(element, attributes[key], key);
      });
    }
    if (children) {
      children.forEach((child) => {
        this._render(child, element)
      });
    }
    return container.appendChild(element);
  }

  private static _renderComponent(vDom: VirtualDOM, container: HTMLElement) {
    const {tagName, attributes, children} = vDom;
    if (typeof tagName === "function") {
      const attributesWithChildren = {...attributes, children};
      const component = tagName(attributesWithChildren);
      return container.appendChild(this._render(component, container));
    }
  }

  private static _setDomAttribute(element: HTMLElement, attribute: any, key: string) {
    /**
     * reference: https://reactjs.org/docs/dom-elements.html
     */
    //    convert className to class
    if (key === 'className') {
      element.setAttribute('class', attribute);
      //    process style, for example: style={{width: 200, height: 300}}, should convert 200 to '200px'
      //    and set element.style
    } else if (key === 'htmlFor') {
      element.setAttribute('for', attribute);
      //    process tag 'tabindex'
    } else if (key === 'tabIndex') {
      element.setAttribute('tabindex', attribute);
      //    process event name, convert onClick to onclick
    } else if (key === 'style') {
      switch (typeof attribute) {
        case 'string': {
          // element.setAttribute('style', attribute);
          // use element.style.cssText but not element.setAttribute
          // because browser render engine will check style key
          // if style key is invalid, browser render engine will not set the style attribute
          element.style.cssText = attribute;
          break;
        }
        case 'object': {
          Object.keys(attribute).forEach((styleName) => {
            const rawStyleValue = attribute[styleName];
            const styleValue = typeof rawStyleValue === 'number' ? `${rawStyleValue}px` : rawStyleValue;
            element.style[styleName] = styleValue;
          });
          break;
        }
        default: {
          break;
        }
      }
      //    process tag 'for'
    } else if (/^on[A-Z][A-Za-z]+$/.test(key)) {
      const htmlEventName = key.toLowerCase();
      element[htmlEventName] = attribute;
      //    otherwise
    } else {
      element.setAttribute(key, attribute);
    }
  }
}
