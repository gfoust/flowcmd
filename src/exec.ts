import { Dictionary } from "./util";
import * as ast from "./ast";
import { parse } from "./parse";
import { ReadLine } from "./readline";
import xml = require("xmldom");

export function exec(flowchart: Element) {
  const stdout = process.stdout;
  const stdin = process.stdin;
  const readline = new ReadLine();
  stdin.pipe(readline);

  const env = {
    types: { } as Dictionary<string>,
    context: { } as Dictionary<ast.Primitive>
  }

  const environment = findFirstChild(flowchart, "environment");
  const variables = findAllChildren(environment, "variable");
  for (const variable of variables) {
    env.types[variable.firstChild.nodeValue] = variable.getAttribute("type");
  }


  const callbacks: Function[] = [];

  function queue(f: Function) {
    callbacks.push(f);
  }

  function next() {
    if (callbacks.length > 0) {
      setTimeout(callbacks.pop(), 0);
    }
  }

  queue((stdin as any).destroy.bind(stdin))
  execSequence(findFirstChild(flowchart, "sequence"));

  return;


  function execOutput(output: Element) {
    const value = findFirstChild(output, "value");
    const exprs = parse(value.firstChild.nodeValue);
    for (const expr of exprs) {
      process.stdout.write(String(expr.eval(env.context)));
    }

    if (output.getAttribute("endl") == "true") {
      stdout.write("\n");
    }

    next();
  }

  function execInput(input: Element) {
    const prompt = findFirstChild(input, "prompt");
    const exprs = parse(prompt.firstChild.nodeValue);
    for (const expr of exprs) {
      stdout.write(String(expr.eval(env.context)));
    }

    readline.next(line => {
      const variable = findFirstChild(input, "variable");
      const name = variable.firstChild.nodeValue;
      if (env.types[name] === "double") {
        env.context[name] = Number(line);
      }
      else if (env.types[name] === "bool") {
        env.context[name] = Boolean(line);
      }
      else {
        env.context[name] = line;
      }
      next();
    })
  }

  function execAssignment(assignment: Element) {
    const lvalue = findFirstChild(assignment, "lvalue");
    const name = lvalue.firstChild.nodeValue;

    const rvalue = findFirstChild(assignment, "rvalue");
    const exprs = parse(rvalue.firstChild.nodeValue);

    env.context[name] = exprs[0].eval(env.context);

    next();
  }

  function execCommand(command: Element) {
    switch (command.getAttribute("type")) {
      case "output":
        execOutput(command);
        break;

      case "input":
        execInput(command);
        break;

      case "assignment":
        execAssignment(command);
        break;

      default:
        next();
    }
  }

  function execBranch(branch: Element) {
    const test = findFirstChild(branch, "test");
    const testexpr = parse(test.firstChild.nodeValue)[0];
    const sequences = findAllChildren(branch, "sequence");
    if (testexpr.eval(env.context)) {
      execSequence(sequences[0]);
    }
    else if (sequences[1]) {
      execSequence(sequences[1]);
    }
    else {
      next();
    }
  }

  function execLoop(loop: Element) {
    const test = findFirstChild(loop, "test");
    const testexpr = parse(test.firstChild.nodeValue)[0];
    const sequence = findFirstChild(loop, "sequence");

    function dotest() {
      if (testexpr.eval(env.context)) {
        queue(dotest);
        execSequence(sequence);
      }
      else {
        next();
      }
    }

    if (loop.nodeName == "postloop") {
      queue(dotest);
      execSequence(sequence);
    }
    else {
      dotest();
    }
  }

  function execSequence(sequence: Element) {
    let i = 0;
    const l = sequence.childNodes.length;
    function nextInSequence() {
      if (i < l) {
        if (sequence.childNodes[i].nodeType == 1) {
          queue(nextInSequence);
          execElement(sequence.childNodes[i++] as Element);
        }
        else {
          ++i;
          queue(nextInSequence);
          next();
        }
      }
      else {
        next();
      }
    }
    nextInSequence();
  }

  function execElement(el: Element) {
    switch (el.nodeName) {
      case "command":
        return execCommand(el);

      case "branch":
        return execBranch(el);

      case "preloop":
      case "postloop":
        return execLoop(el);

      case "sequence":
        return execSequence(el);
    }
  }

  function findFirstChild(el: Document | Element, name: string): Element {
    const l = el.childNodes ? el.childNodes.length : 0;
    for (let i = 0; i < l; ++i) {
      const child = el.childNodes[i];
      if (child.nodeType == 1 && child.nodeName == name) {
        return child as Element;
      }
    }
    throw new Error("Could not find expected tag: " + name);
  }

  function findAllChildren(el: Element, name: string): Element[] {
    const children: Element[] = [];
    const l = el.childNodes.length;
    for (let i = 0; i < l; ++i) {
      const child = el.childNodes[i];
      if (child.nodeType == 1 && child.nodeName == name) {
        children.push(child as Element);
      }
    }
    return children;
  }
}