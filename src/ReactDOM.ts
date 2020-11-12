import {
  create,
  ReactComponentElement,
  ReactElement,
  setProps,
  unmount,
  VirtualComponentDOM,
  VirtualHTMLDOM,
  VirtualNode,
  VirtualTextNode
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
    if (realDOM) {
      container.innerHTML = null;
      container.appendChild(realDOM);
    }
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
  public static _setDomAttribute(element: HTMLElement, key: string, value: any): void {
    /**
     * reference: https://reactjs.org/docs/dom-elements.html
     */
    //    convert className to class
    if (key === 'className') {
      element.setAttribute('class', value);
      //    process style, for example: style={{width: 200, height: 300}}, should convert 200 to '200px'
      //    and set element.style
      //    process tag 'for'
    } else if (key === 'htmlFor') {
      element.setAttribute('for', value);
      //    process tag 'tabindex'
    } else if (key === 'tabIndex') {
      element.setAttribute('tabindex', value);
    } else if (key === 'style') {
      switch (typeof value) {
        case 'string': {
          // element.setAttribute('style', attribute);
          // use element.style.cssText but not element.setAttribute
          // because browser render engine will check style key
          // if style key is invalid, browser render engine will not set the style attribute
          element.style.cssText = value;
          break;
        }
        case 'object': {
          Object.keys(value).forEach((styleName) => {
            const rawStyleValue = value[styleName];
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
      element[htmlEventName] = value;
      //    otherwise
    } else {
      element.setAttribute(key, value);
    }
  }

  public static _diffRender(oldTrueDom: any, newVirtualDom: VirtualNode): any {
    // console.count('call _render count: ');
    // console.log('_diffRender')
    // console.log('oldTrueDom', oldTrueDom)
    // console.log('newVirtualDom', newVirtualDom)
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
            return this._diffRenderComponent(oldTrueDom as ReactComponentElement<any, any>, newVirtualDom as VirtualComponentDOM)
          }
        }
      }
    }
  }

  private static _diffRenderText(oldTrueDom: any, newVirtualDom: VirtualTextNode): Node {
    const newText = String(newVirtualDom);
    let newTrueDom = oldTrueDom;
    if (oldTrueDom?.nodeType === 3) {
      if (oldTrueDom.textContent !== newText) {
        oldTrueDom.textContent = newText
      }
    } else {
      // first render or node type is not Text
      newTrueDom = document.createTextNode(newText);
    }
    return newTrueDom;
  }

  private static _diffRenderHTML(oldTrueDom: any, newVirtualDom: VirtualHTMLDOM): ReactElement {
    const newHTMLTag = newVirtualDom.tagName;
    let newTrueDom;

    const isSameNodeType = this._isSameNodeType(oldTrueDom, newVirtualDom)
    // console.log('this._isSameNodeType(oldTrueDom, newVirtualDom)', isSameNodeType)
    if (isSameNodeType) {
      // console.log('isSameNodeType is true, _diffChildren', oldTrueDom, newVirtualDom)
      newTrueDom = this._diffChildren(oldTrueDom, newVirtualDom);
    } else {
      // console.log('isSameNodeType is false', oldTrueDom, newVirtualDom)
      newTrueDom = document.createElement(newHTMLTag);
      newVirtualDom.children.forEach(newChild => {
        if (Array.isArray(newChild)) {
          newChild.forEach(subChild => {
            const diffChild = this._diffRender(null, subChild);
            newTrueDom.appendChild(diffChild)
          })
        } else {
          const diffChild = this._diffRender(null, newChild);
          newTrueDom.appendChild(diffChild)
        }
      });
    }

    this._diffAttribute(newTrueDom as HTMLElement, newVirtualDom);

    return newTrueDom;
  }

  private static _diffRenderComponent(oldTrueDom: ReactElement, newVirtualDom: VirtualComponentDOM): ReactElement {
    const oldInstance = oldTrueDom?._instance;
    const newClass = newVirtualDom.tagName;
    let instance;
    console.warn('newClass.isPrototypeOf(oldInstance)', newClass.isPrototypeOf(oldInstance))
    console.warn('oldInstance', oldInstance)
    console.warn('newClass', newClass)

    const attributes = newVirtualDom.attributes ?? {}
    console.log('newVirtualDom.children', newVirtualDom.children)
    const children = newVirtualDom.children[0]
    // if (newVirtualDom.children.length > 0 && Array.isArray(newVirtualDom.children[0])) {
    //   newVirtualDom.children.forEach(child => {
    //     if (Array.isArray(child)) {
    //       children.push(...child)
    //     } else {
    //       children.push(child)
    //     }
    //   })
    // } else {
    //   children.push(...newVirtualDom.children)
    // }
    const props = {children, ...attributes}

    if (newClass.isPrototypeOf(oldInstance)) {
      instance = oldInstance;
    } else {
      if (oldInstance) {
        unmount(oldInstance)
      }
      instance = create(newClass as (Function | ObjectConstructor), newVirtualDom.attributes);
    }
    setProps(instance, props);
    return instance._node;
  }

  private static _diffAttribute(oldTrueDom: ReactElement, newVirtualDom: VirtualHTMLDOM) {
    const oldAttributes = oldTrueDom?.attributes ?? {};
    const newAttributes = newVirtualDom.attributes ?? {};

    for (const oldAttributeIndex of Object.keys(oldAttributes)) {
      const oldAttribute = oldAttributes[oldAttributeIndex];
      const oldAttributeKey = oldAttribute.name;
      // const oldAttributeValue = oldAttribute.value;
      if (!(oldAttributeKey in newAttributes)) {
        this._setDomAttribute(oldTrueDom as HTMLElement, oldAttributeKey, undefined);
      }
    }

    const newAttributesKeys = Object.keys(newAttributes) ?? [];
    for (const newAttributeKey of newAttributesKeys) {
      const newAttributeValue = newAttributes[newAttributeKey];
      this._setDomAttribute(oldTrueDom as HTMLElement, newAttributeKey, newAttributeValue);
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
              return oldTrueDom?._instance?.constructor === newVirtualDom.tagName
          }
      }
    }

    return false;
  }

  private static _diffChildren(oldTrueDom: any, newVirtualDom: VirtualHTMLDOM): ReactElement {
    let oldChildKeyed = {}
    let oldChildren = []

    oldTrueDom.childNodes.forEach(child => {
      if (child.key) {
        oldChildKeyed[child.key] = child
      } else {
        oldChildren.push(child)
      }
    })

    newVirtualDom.children.forEach(newChild => {
      const newChildKey = newChild.key

      let oldChild;
      if (newChildKey && oldChildKeyed[newChildKey]) {
        oldChild = oldChildKeyed[newChildKey]
        delete oldChildKeyed[newChildKey]
      } else {
        // oldChildren may be empty, so oldChildren.shift() is null
        oldChild = oldChildren.shift()
      }

      const diffChild = this._diffRender(oldChild, newChild);
      if (diffChild !== oldChild) {
        if (oldChild) {
          console.warn('oldChild.parentNode', oldChild.parentNode, oldTrueDom, oldChild.parentNode === oldTrueDom)
          oldChild.parentNode?.replaceChild(diffChild, oldChild);
        } else {
          oldTrueDom.appendChild(diffChild)
        }
      }
    });

    oldChildren.forEach(child => {
      oldTrueDom.removeChild(child);
    })
    for (const childKey of Object.keys(oldChildKeyed)) {
      oldTrueDom.removeChild(oldChildKeyed[childKey]);
    }

    return oldTrueDom;
  }



}
