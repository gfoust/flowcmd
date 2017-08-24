export type Maybe<T> = T | undefined;

export type Dictionary<T> = { [key: string]: T };

/**
 * Array which keeps track of the top (last) element.
 */
export interface Stack<T> extends Array<T> {
  top?: T;
}

export var Stack = {

  /**
   * Create new stack
   */
   create<T>(...init: T[]): Stack<T> {
     return init;
   },

  /**
   * Add new element to top of stack.
   */
  push<T>(ts: Stack<T>, t: T) {
    ts.push(t);
    ts.top = t;
    return ts;
  },

  /**
   * Remove element from top of stack.
   * @returns the element removed
   */
  pop<T>(ts: Stack<T>): T {
    let t = ts.pop();
    if (! t) {
      throw new Error("Precondition violation: pop() called on non-empty stack");
    }
    let l = ts.length;
    if (l) {
      ts.top = ts[l - 1];
    }
    else {
      ts.top = undefined;
    }
    return t;
  },
}
