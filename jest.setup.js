// Setup file to provide browser APIs needed by undici (used by cheerio)
// This fixes the "File is not defined" error in tests

// Mock File API
global.File = class File {
  constructor(bits, name, options) {
    this.bits = bits;
    this.name = name;
    this.options = options;
  }
};

// Mock FormData if needed
if (!global.FormData) {
  global.FormData = class FormData {
    constructor() {
      this.data = {};
    }
    append(key, value) {
      this.data[key] = value;
    }
  };
}

// Mock Headers if needed
if (!global.Headers) {
  global.Headers = class Headers {
    constructor(init) {
      this.map = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.map.set(key.toLowerCase(), value);
        });
      }
    }
    append(key, value) {
      this.map.set(key.toLowerCase(), value);
    }
    get(key) {
      return this.map.get(key.toLowerCase());
    }
    has(key) {
      return this.map.has(key.toLowerCase());
    }
  };
}

