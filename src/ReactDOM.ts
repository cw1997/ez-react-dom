import {
  VirtualNode, VirtualTextNode, VirtualHTMLDOM, VirtualComponentDOM,
  ReactElement, ReactHTMLElement, ReactTextElement, ReactComponentElement,
  create, setProps, unmount
} from "ez-react";


export default class ReactDOM {
  public static render(virtualDom: VirtualNode, container: HTMLElement, clearBeforeRender: boolean = true) {
    // console.log('virtualDOM', vDom);
    //  if you want to erase container when call ReactDOM.render, please uncomment the next line.
    if (clearBeforeRender) {
      container.innerHTML = '';
    }
    // const recordRenderSpendTimeKey = `${virtualDom} _render spent time: `;
    // console.time(recordRenderSpendTimeKey);
    // const realDOM = this._directRender(vDom);
    const emptyNode = document.createElement('div');
    const oldTrueDom = container.appendChild(emptyNode);
    const realDOM = this._diffRender(oldTrueDom, virtualDom);
    // console.timeEnd(recordRenderSpendTimeKey);
    if (realDOM) container.appendChild(realDOM);
  }

  // public static _directRender(vDom: VirtualNode): ReactElement {
  //   // console.count('call _render count: ');
  //   switch (typeof vDom) {
  //     case 'string':
  //     case 'number':
  //     case 'boolean': {
  //       return this._renderText(vDom);
  //     }
  //     case 'object':
  //     default: {
  //       const {tagName, attributes, children} = vDom;
  //       switch (typeof tagName) {
  //         case 'string': {
  //           return this._renderHtmlTag(vDom);
  //         }
  //         case 'function':
  //         case 'object':
  //         default: {
  //           return this._renderComponent(vDom);
  //         }
  //       }
  //     }
  //   }
  // }

  // private static _renderText(vDom: VirtualTextNode): ReactTextElement {
  //   return document.createTextNode(String(vDom));
  // }
  //
  // private static _renderHtmlTag(vDom: VirtualHTMLDOM): ReactHTMLElement {
  //   const {tagName, attributes, children} = vDom;
  //   const element = document.createElement(tagName as string);
  //   if (attributes) {
  //     Object.keys(attributes).forEach((key, index) => {
  //       this._setDomAttribute(element, attributes[key], key);
  //     });
  //   }
  //   children?.forEach((child) => {
  //     if (Array.isArray(child)) {
  //       child.forEach((subChild) => {
  //         this.render(subChild, element, false);
  //       });
  //     } else {
  //       this.render(child, element, false);
  //     }
  //   });
  //   return element;
  // }
  //
  // private static _renderComponent(vDom: VirtualComponentDOM): ReactComponentElement<any, any> {
  //   const {tagName, attributes, children} = vDom;
  //   const properties = {...attributes, children};
  //   const componentInstance = create(tagName as Function, properties);
  //   setProps(componentInstance, properties);
  //   const componentRenderVirtualDOM = componentInstance.render();
  //   const node = this._directRender(componentRenderVirtualDOM);
  //   componentInstance.node = node;
  //   return node;
  // }

  // TODO: require correct type of parameter 'key' (keyof HTMLElement and React special attribute key)
  public static _setDomAttribute(element: HTMLElement, key: string, attribute: any): void {
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

  public static _diffRender(oldTrueDom: ReactElement, newVirtualDom: VirtualNode): ReactElement {
    // console.count('call _render count: ');
    console.log('_diffRender')
    console.log('oldTrueDom', oldTrueDom)
    console.log('newVirtualDom', newVirtualDom)
    switch (typeof newVirtualDom) {
      case 'string':
      case 'number':
      case 'boolean': {
        return this._diffRenderText(oldTrueDom, newVirtualDom as VirtualTextNode);
      }
      case 'object':
      default: {
        const {tagName, attributes, children} = newVirtualDom;
        switch (typeof tagName) {
          case 'string': {
            return this._diffRenderHTML(oldTrueDom, newVirtualDom as VirtualHTMLDOM);
          }
          case 'function':
          case 'object':
          default: {
            // return this._renderComponent(newVirtualDom);
            return this._diffRenderComponent(oldTrueDom as ReactComponentElement<any, any>, newVirtualDom as VirtualComponentDOM)
          }
        }
      }
    }
  }

  private static _diffRenderText(oldTrueDom: Node, newVirtualDom: VirtualTextNode): HTMLElement {
    const newText = String(newVirtualDom);
    let newTrueDom;
    if (oldTrueDom?.nodeType === 3) {
      if (oldTrueDom.textContent !== newText) {
        oldTrueDom.textContent = newText
        newTrueDom = oldTrueDom
      }
    } else {
      // first render or node type is not Text
      const parentNode = oldTrueDom?.parentNode;
      newTrueDom = document.createTextNode(newText);
      parentNode?.replaceChild(newTrueDom, oldTrueDom)
    }
    return newTrueDom;
  }

  private static _diffRenderHTML(oldTrueDom: ReactElement, newVirtualDom: VirtualHTMLDOM): ReactElement {
    const newHTMLTag = newVirtualDom.tagName;
    let newTrueDom = oldTrueDom;

    const isSameNodeType = this._isSameNodeType(oldTrueDom, newVirtualDom)
    if (isSameNodeType) {
      let oldChildKeyed = {}
      let oldChildren = []

      oldTrueDom?.childNodes?.forEach(child => {
        newTrueDom.appendChild(child)
        if (child['key']) {
          oldChildKeyed[child['key']] = child
        } else {
          oldChildren.push(child)
        }
      })

      newVirtualDom.children.forEach(newChild => {
        const newChildKey = newChild['key']

        let oldChild;
        if (newChildKey && oldChildKeyed[newChildKey]) {
          oldChild = oldChildKeyed[newChildKey]
        } else {
          // oldChildren may be empty, so oldChildren.shift() is null
          oldChild = oldChildren.shift()
        }

        const diffChild = this._diffRender(oldChild, newChild);
        oldTrueDom?.appendChild(diffChild)
      });
      oldTrueDom.parentNode.replaceChild(newTrueDom, oldTrueDom as Node);
    } else {
      newTrueDom = document.createElement(newHTMLTag);
      newVirtualDom.children.forEach(newChild => {
        const diffChild = this._diffRender(null, newChild);
        console.log('diffChild', diffChild)
        newTrueDom.appendChild(diffChild)
      });
    }

    this._diffAttribute(oldTrueDom as HTMLElement, newVirtualDom, newTrueDom);

    return newTrueDom;
  }

  private static _diffRenderComponent(oldTrueDom: ReactElement, newVirtualDom: VirtualComponentDOM): ReactElement {
    const oldInstance = oldTrueDom?._instance;
    const newClass = newVirtualDom.tagName;
    console.log('oldInstance', oldInstance)
    console.log('newClass', newClass)
    console.log('newClass.constructor', newClass.constructor)
    // console.log('oldInstance.constructor', oldInstance.constructor)
    let instance = oldInstance;

    console.log('newClass.isPrototypeOf(instance)', newClass.isPrototypeOf(oldInstance), instance)
    if (newClass.isPrototypeOf(instance)) {
      setProps(oldInstance, newVirtualDom.attributes)
    } else {
      if (oldInstance) {
        unmount(oldInstance)
      }
      const newInstance = create(newClass as (Function | ObjectConstructor), newVirtualDom.attributes);
      setProps(newInstance, newVirtualDom.attributes);
      instance = newInstance;
    }
    console.log('instance', instance)
    return instance._node;
  }

  private static _diffAttribute(oldTrueDom: ReactElement, newVirtualDom: VirtualHTMLDOM, newTrueDom: ReactElement) {
    const newAttributes = newVirtualDom.attributes;

    if (oldTrueDom) {
      const oldAttributes = oldTrueDom.attributes;
      for (const oldAttributeKey of Object.keys(oldAttributes)) {
        if (!(oldAttributeKey in newAttributes)) {
          this._setDomAttribute(newTrueDom as HTMLElement, oldAttributeKey, undefined);
        }
      }
    }

    if (newAttributes) {
      for (const newAttributeKey of Object.keys(newAttributes)) {
        const newAttributeValue = newAttributes[newAttributeKey];
        this._setDomAttribute(newTrueDom as HTMLElement, newAttributeKey, newAttributeValue);
      }
    }
  }

  private static _isSameNodeType(oldTrueDom: ReactElement, newVirtualDom: VirtualNode): boolean {
    if (oldTrueDom) {
      switch (typeof newVirtualDom) {
        case "string":
        case "number":
        case "boolean":
          return oldTrueDom.nodeType === 3;
        default:
          switch (typeof newVirtualDom.tagName) {
            case "string":
              return oldTrueDom.nodeName.toLowerCase() === newVirtualDom.tagName.toLowerCase();
            default:
              return oldTrueDom && oldTrueDom?._instance?.constructor === newVirtualDom.tagName
          }
      }
    }

    return false;
  }

}
