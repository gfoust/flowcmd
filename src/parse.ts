import { Maybe,
         Stack  } from "./util";
import * as ast   from "./ast";

export function parse(text: string): ast.Expression[] {
  let curPos = 0;

  let endPos = text.length;

  let lastSkip = -1;

  let exprs = parseSequence();
  if (! exprs) {
    throw new Error("Expected expression!");
  }
  return exprs;

  /**
   */
  function match(regexp: RegExp): RegExpMatchArray|null {
    if (! regexp.sticky) {
      throw new Error("Precondition violation: match called on non-sticky regexp");
    }
    regexp.lastIndex = curPos;
    let m = regexp.exec(text);
    if (m) {
      curPos = regexp.lastIndex;
    }
    return m;
  }

  /**
   */
  function skipWs() {
    if (lastSkip != curPos) {
      match(/\s+/y);
      lastSkip = curPos;
    }
  }

  /**
   */
  function parseNumber(): Maybe<ast.Number> {
    skipWs();
    let num = match(/(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?/y);
    if (num) {
      return new ast.Number(Number(num[0]));
    }
  }

  /**
   */
  function parseString(): Maybe<ast.String> {
    skipWs();
    let str = match(/"((?:[^"\\\n]|\\(?:.|\n))*)"/y);
    if (str) {
      let unescaped = str[1].replace(/\\(.|\n)/g, (s, c) => {
        switch (c) {
          case 'n': return '\n';
          case 't': return '\t';
          default:  return c;
        }
      })
      return new ast.String(unescaped);
    }
  }

  /**
   */
  function parseBoolean(): Maybe<ast.Boolean> {
    skipWs();
    let bool = match(/True|False/y);
    if (bool) {
      return new ast.Boolean(bool[0].toLowerCase() == "true");
    }
  }

  /**
   */
  function parseVariable(): Maybe<ast.Variable> {
    skipWs();
    let id = match(/\w+/y);
    if (id) {
      return new ast.Variable(id[0]);
    }
  }

  /**
   */
  function parseUnary(): Maybe<ast.UnOp> {
    skipWs();
    let unop = match(/[+-]|NOT|FLOOR/y);
    if (unop) {
      return new ast.UnOp(unop[0]);
    }
  }

  /**
   */
  function parseBinary(): Maybe<ast.BinOp> {
    skipWs();
    let binop = match(/[<>!=]=|[+\-*/%<>]|AND|OR/y);
    if (binop) {
      return new ast.BinOp(binop[0] as ast.BinOpToken);
    }
  }

  /**
   */
  function parseNested(): Maybe<ast.Expression> {
    skipWs();
    if (match(/\(/y)) {
      let expr = parseExpression();
      if (expr) {
        if (match(/\)/y)) {
          return expr;
        }
        else {
          throw new Error("Expected closing parenthesis after nested expression");
        }
      }
      else {
        throw new Error("Expected expression after opening parenthesis");
      }
    }
  }

  /**
   */
  function parsePrimary(): Maybe<ast.Expression> {
    let unop = parseUnary();
    if (unop) {
      if (! (unop.right = parsePrimary())) {
        throw new Error("Expected primary after unary operator");
      }
      return unop;
    }
    else if (parseBinary()) {
      throw new Error("Expected primary; found operator");
    }
    else {
      return parseNumber() || parseString() || parseBoolean() || parseVariable() || parseNested();
    }
  }

  /**
   */
  function parseExpression(): Maybe<ast.Expression> {
    let valStack = Stack.create<ast.Expression>();
    let opStack = Stack.create<ast.BinOp>();

    let primary = parsePrimary();
    if (primary) {
      Stack.push(valStack, primary);
      let op = parseBinary();
      while (op) {
        primary = parsePrimary();
        if (primary) {
          while (opStack.top && opStack.top.precedence >= op.precedence) {
            opStack.top.right = Stack.pop(valStack);
            opStack.top.left = Stack.pop(valStack);
            Stack.push(valStack, Stack.pop(opStack));
          }

          Stack.push(opStack, op);
          Stack.push(valStack, primary);
        }
        else {
          throw new Error("Expected right-hand operand");
        }

        op = parseBinary();
      }

      while (opStack.top) {
        opStack.top.right = Stack.pop(valStack);
        opStack.top.left = Stack.pop(valStack);
        Stack.push(valStack, Stack.pop(opStack));
      }

      return Stack.pop(valStack);
    }
  }

  /**
   */
  function parseSequence(): Maybe<ast.Expression[]> {
    let next = parseExpression();
    if (next) {
      let all = [next];
      while (match(/,/y)) {
        next = parseExpression();
        if (! next) {
          throw new Error("Expected expression following comma");
        }
        all.push(next);
      }
      return all;
    }
  }
}