import { Dictionary } from "./util";

export type Primitive = number | string | boolean;

export type Context = Dictionary<Primitive>;

export interface Expression {
  eval(context: Context): Primitive;
}

export class Number {
  constructor(public value: number) {
  }

  eval(context: Context): Primitive {
    return this.value;
  }
}

export class String {
  constructor(public value: string) {
  }

  eval(context: Context): Primitive {
    return this.value;
  }
}

export class Boolean {
  constructor(public value: boolean) {
  }

  eval(context: Context): Primitive {
    return this.value ? "True" : "False";
  }
}

export class Variable {
  constructor(public value: string) {
  }

  eval(context: Context): Primitive {
    return context[this.value];
  }
}

export class UnOp {
  op: string;
  right: Expression;

  constructor(op: string) {
    this.op = op;
  }

  eval(context: Context): Primitive {
    let right = this.right.eval(context);

    switch (this.op) {
      case '+':
        return right;

      case '-':
        return -right;

      case 'NOT':
        return !right;

      case 'FLOOR':
        return Math.floor(right as number);
    }
  }
}

const precedence = {
  "*":   9,
  "/":   9,
  "DIV": 9,
  "%":   9,
  "+":   7,
  "-":   7,
  "<":   5,
  "<=":  5,
  ">":   5,
  ">=":  5,
  "==":  3,
  "!=":  3,
  "AND": 2,
  "OR":  1
}

export type BinOpToken = keyof (typeof precedence);

export class BinOp {
  op: string;
  left: Expression;
  right: Expression;
  precedence: number;

  constructor(op: BinOpToken) {
    this.op = op;
    this.precedence = precedence[op];
  }

  eval(context: Context): Primitive {
    let left = this.left.eval(context);
    let right = this.right.eval(context);

    switch (this.op) {
      case '+':
        return (left as number) + (right as number);

      case '-':
        return (left as number) - (right as number);

      case '*':
        return (left as number) * (right as number);

      case '/':
        return (left as number) / (right as number);

      case 'DIV':
        return Math.floor((left as number) / (right as number));

      case '%':
        return (left as number) % (right as number);

      case '==':
        return left == right;

      case '!=':
        return left != right;

      case '<':
        return left < right;

      case '<=':
        return left <= right;

      case '>':
        return left > right;

      case '>=':
        return left >= right;

      case 'AND':
        return left && right;

      case 'OR':
        return left || right;
    }
  }
}