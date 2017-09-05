import stream = require('stream');

export type Callback = (line: string) => void;

export class ReadLine extends stream.Writable {
  pending: string = "";
  lines: string[] = [];
  callbacks: Callback[] = [];
  final = false;

  constructor() {
    super()
  }

  next(callback: Callback) {
    this.callbacks.push(callback);
    this.check();
  }

  private check() {
    while (this.lines.length && this.callbacks.length) {
      this.callbacks.shift()(this.lines.shift());
    }
    if (this.final) {
      while (this.callbacks) {
        this.callbacks.shift()("");
      }
    }
  }

  _write(chunk: Buffer, encoding: string, callback: Function) {
    let text = chunk.toString(encoding === "buffer" ? "" : encoding);
    let lines = text.split(/\r?\n/);
    if (this.pending.length > 0) {
      lines[0] = this.pending + lines[0];
    }
    this.pending = lines.pop();
    if (lines.length) {
      this.lines.push(...lines);
    }
    this.check();
    callback(null);
  }

  _final(callback: Function) {
    if (this.pending.length) {
      this.lines.push(this.pending);
      this.final = true;
      this.check();
    }
    callback(null);
  }
}