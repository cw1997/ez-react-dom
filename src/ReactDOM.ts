import {VirtualDOM} from "ez-react";
import {create, setProps} from "../../ez-react/src/Component";

export default class ReactDOM {
  public static render(vDom: VirtualDOM | string | number | boolean, container: HTMLElement, clearBeforeRender: boolean = true) {
    // console.log('virtualDOM', vDom);
    //  if you want to erase container when call ReactDOM.render, please uncomment the next line.
    if (clearBeforeRender) {
      container.innerHTML = '';
    }
    const recordRenderSpendTimeKey = `${vDom} _render spent time: `;
    console.time(recordRenderSpendTimeKey);
    const realDOM = this._render(vDom);
    console.timeEnd(recordRenderSpendTimeKey);
    if (realDOM) container.appendChild(realDOM);
  }

  public static _render(vDom: VirtualDOM | string | number | boolean): HTMLElement | Text {
    // console.count('call _render count: ');
    switch (typeof vDom) {
      case 'string':
      case 'number':
      case 'boolean': {
        return this._renderText(vDom);
      }
      case 'object':
      default: {
        const {tagName, attributes, children} = vDom;
        switch (typeof tagName) {
          case 'string': {
            return this._renderHtmlTag(vDom);
          }
          case 'function':
          case 'object':
          default: {
            return this._renderComponent(vDom);
          }
        }
      }
    }
  }

  private static _renderText(vDom: string | number | boolean): Text {
    return document.createTextNode(String(vDom));
  }

  private static _renderHtmlTag(vDom: VirtualDOM) {
    const {tagName, attributes, children} = vDom;
    const element = document.createElement(tagName as string);
    if (attributes) {
      Object.keys(attributes).forEach((key, index) => {
        this._setDomAttribute(element, attributes[key], key);
      });
    }
    children?.forEach((child) => {
      if (Array.isArray(child)) {
        child.forEach((subChild) => {
          this.render(subChild, element, false);
        });
      } else {
        this.render(child, element, false);
      }
    });
    return element;
  }

  private static _renderComponent(vDom: VirtualDOM): HTMLElement| Text {
    const {tagName, attributes, children} = vDom;
    if (typeof tagName === "function") {
      const properties = {...attributes, children};
      const componentInstance = create(tagName, properties);
      setProps(componentInstance, properties);
      const componentRenderVirtualDOM = componentInstance.render();
      const node = this._render(componentRenderVirtualDOM);
      componentInstance.node = node;
      return node;
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
      //    process tag 'for'
    } else if (key === 'htmlFor') {
      element.setAttribute('for', attribute);
      //    process tag 'tabindex'
    } else if (key === 'tabIndex') {
      element.setAttribute('tabindex', attribute);
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
            element.style[styleName] = typeof rawStyleValue === 'number' ? `${rawStyleValue}px` : rawStyleValue;
          });
          break;
        }
        default: {
          break;
        }
      }
      //    process event name, convert onClick to onclick
    } else if (/^on[A-Z][A-Za-z]+$/.test(key)) {
      const htmlEventName = key.toLowerCase();
      element[htmlEventName] = attribute;
      //    otherwise
    } else {
      element.setAttribute(key, attribute);
    }
  }
}
