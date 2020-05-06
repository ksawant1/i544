// -*- mode: JavaScript; -*-

export default class BlogError {
  constructor(code, msg, name) {
    this.code = code;
    this.message = msg;
    this.name = name;
  }

  toString() { return `${this.code}: ${this.name}: ${this.message}`; }
}
