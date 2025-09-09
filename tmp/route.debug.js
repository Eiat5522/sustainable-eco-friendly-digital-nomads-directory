"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from2, except, desc) => {
  if (from2 && typeof from2 === "object" || typeof from2 === "function") {
    for (let key of __getOwnPropNames(from2))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../node_modules/.pnpm/mimic-response@3.1.0/node_modules/mimic-response/index.js
var require_mimic_response = __commonJS({
  "../node_modules/.pnpm/mimic-response@3.1.0/node_modules/mimic-response/index.js"(exports2, module2) {
    "use strict";
    var knownProperties = [
      "aborted",
      "complete",
      "headers",
      "httpVersion",
      "httpVersionMinor",
      "httpVersionMajor",
      "method",
      "rawHeaders",
      "rawTrailers",
      "setTimeout",
      "socket",
      "statusCode",
      "statusMessage",
      "trailers",
      "url"
    ];
    module2.exports = (fromStream, toStream) => {
      if (toStream._readableState.autoDestroy) {
        throw new Error("The second stream must have the `autoDestroy` option set to `false`");
      }
      const fromProperties = new Set(Object.keys(fromStream).concat(knownProperties));
      const properties = {};
      for (const property of fromProperties) {
        if (property in toStream) {
          continue;
        }
        properties[property] = {
          get() {
            const value = fromStream[property];
            const isFunction = typeof value === "function";
            return isFunction ? value.bind(fromStream) : value;
          },
          set(value) {
            fromStream[property] = value;
          },
          enumerable: true,
          configurable: false
        };
      }
      Object.defineProperties(toStream, properties);
      fromStream.once("aborted", () => {
        toStream.destroy();
        toStream.emit("aborted");
      });
      fromStream.once("close", () => {
        if (fromStream.complete) {
          if (toStream.readable) {
            toStream.once("end", () => {
              toStream.emit("close");
            });
          } else {
            toStream.emit("close");
          }
        } else {
          toStream.emit("close");
        }
      });
      return toStream;
    };
  }
});

// ../node_modules/.pnpm/decompress-response@7.0.0/node_modules/decompress-response/index.js
var require_decompress_response = __commonJS({
  "../node_modules/.pnpm/decompress-response@7.0.0/node_modules/decompress-response/index.js"(exports2, module2) {
    "use strict";
    var { Transform, PassThrough } = require("stream");
    var zlib = require("zlib");
    var mimicResponse = require_mimic_response();
    module2.exports = (response) => {
      const contentEncoding = (response.headers["content-encoding"] || "").toLowerCase();
      delete response.headers["content-encoding"];
      if (!["gzip", "deflate", "br"].includes(contentEncoding)) {
        return response;
      }
      const isBrotli = contentEncoding === "br";
      if (isBrotli && typeof zlib.createBrotliDecompress !== "function") {
        response.destroy(new Error("Brotli is not supported on Node.js < 12"));
        return response;
      }
      let isEmpty = true;
      const checker = new Transform({
        transform(data, _encoding, callback) {
          isEmpty = false;
          callback(null, data);
        },
        flush(callback) {
          callback();
        }
      });
      const finalStream = new PassThrough({
        autoDestroy: false,
        destroy(error, callback) {
          response.destroy();
          callback(error);
        }
      });
      const decompressStream = isBrotli ? zlib.createBrotliDecompress() : zlib.createUnzip();
      decompressStream.once("error", (error) => {
        if (isEmpty && !response.readable) {
          finalStream.end();
          return;
        }
        finalStream.destroy(error);
      });
      mimicResponse(response, finalStream);
      response.pipe(checker).pipe(decompressStream).pipe(finalStream);
      return finalStream;
    };
  }
});

// ../node_modules/.pnpm/ms@2.0.0/node_modules/ms/index.js
var require_ms = __commonJS({
  "../node_modules/.pnpm/ms@2.0.0/node_modules/ms/index.js"(exports2, module2) {
    var s4 = 1e3;
    var m2 = s4 * 60;
    var h3 = m2 * 60;
    var d2 = h3 * 24;
    var y3 = d2 * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isNaN(val) === false) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n5 = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n5 * y3;
        case "days":
        case "day":
        case "d":
          return n5 * d2;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n5 * h3;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n5 * m2;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n5 * s4;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n5;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      if (ms >= d2) {
        return Math.round(ms / d2) + "d";
      }
      if (ms >= h3) {
        return Math.round(ms / h3) + "h";
      }
      if (ms >= m2) {
        return Math.round(ms / m2) + "m";
      }
      if (ms >= s4) {
        return Math.round(ms / s4) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      return plural(ms, d2, "day") || plural(ms, h3, "hour") || plural(ms, m2, "minute") || plural(ms, s4, "second") || ms + " ms";
    }
    function plural(ms, n5, name2) {
      if (ms < n5) {
        return;
      }
      if (ms < n5 * 1.5) {
        return Math.floor(ms / n5) + " " + name2;
      }
      return Math.ceil(ms / n5) + " " + name2 + "s";
    }
  }
});

// ../node_modules/.pnpm/debug@2.6.9/node_modules/debug/src/debug.js
var require_debug = __commonJS({
  "../node_modules/.pnpm/debug@2.6.9/node_modules/debug/src/debug.js"(exports2, module2) {
    exports2 = module2.exports = createDebug.debug = createDebug["default"] = createDebug;
    exports2.coerce = coerce;
    exports2.disable = disable;
    exports2.enable = enable;
    exports2.enabled = enabled;
    exports2.humanize = require_ms();
    exports2.names = [];
    exports2.skips = [];
    exports2.formatters = {};
    var prevTime;
    function selectColor(namespace) {
      var hash = 0, i2;
      for (i2 in namespace) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i2);
        hash |= 0;
      }
      return exports2.colors[Math.abs(hash) % exports2.colors.length];
    }
    function createDebug(namespace) {
      function debug() {
        if (!debug.enabled) return;
        var self2 = debug;
        var curr = +/* @__PURE__ */ new Date();
        var ms = curr - (prevTime || curr);
        self2.diff = ms;
        self2.prev = prevTime;
        self2.curr = curr;
        prevTime = curr;
        var args = new Array(arguments.length);
        for (var i2 = 0; i2 < args.length; i2++) {
          args[i2] = arguments[i2];
        }
        args[0] = exports2.coerce(args[0]);
        if ("string" !== typeof args[0]) {
          args.unshift("%O");
        }
        var index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
          if (match === "%%") return match;
          index++;
          var formatter = exports2.formatters[format];
          if ("function" === typeof formatter) {
            var val = args[index];
            match = formatter.call(self2, val);
            args.splice(index, 1);
            index--;
          }
          return match;
        });
        exports2.formatArgs.call(self2, args);
        var logFn = debug.log || exports2.log || console.log.bind(console);
        logFn.apply(self2, args);
      }
      debug.namespace = namespace;
      debug.enabled = exports2.enabled(namespace);
      debug.useColors = exports2.useColors();
      debug.color = selectColor(namespace);
      if ("function" === typeof exports2.init) {
        exports2.init(debug);
      }
      return debug;
    }
    function enable(namespaces) {
      exports2.save(namespaces);
      exports2.names = [];
      exports2.skips = [];
      var split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
      var len = split.length;
      for (var i2 = 0; i2 < len; i2++) {
        if (!split[i2]) continue;
        namespaces = split[i2].replace(/\*/g, ".*?");
        if (namespaces[0] === "-") {
          exports2.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
        } else {
          exports2.names.push(new RegExp("^" + namespaces + "$"));
        }
      }
    }
    function disable() {
      exports2.enable("");
    }
    function enabled(name2) {
      var i2, len;
      for (i2 = 0, len = exports2.skips.length; i2 < len; i2++) {
        if (exports2.skips[i2].test(name2)) {
          return false;
        }
      }
      for (i2 = 0, len = exports2.names.length; i2 < len; i2++) {
        if (exports2.names[i2].test(name2)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error) return val.stack || val.message;
      return val;
    }
  }
});

// ../node_modules/.pnpm/debug@2.6.9/node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "../node_modules/.pnpm/debug@2.6.9/node_modules/debug/src/browser.js"(exports2, module2) {
    exports2 = module2.exports = require_debug();
    exports2.log = log;
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.storage = "undefined" != typeof chrome && "undefined" != typeof chrome.storage ? chrome.storage.local : localstorage();
    exports2.colors = [
      "lightseagreen",
      "forestgreen",
      "goldenrod",
      "dodgerblue",
      "darkorchid",
      "crimson"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && window.process.type === "renderer") {
        return true;
      }
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    exports2.formatters.j = function(v3) {
      try {
        return JSON.stringify(v3);
      } catch (err) {
        return "[UnexpectedJSONParseError]: " + err.message;
      }
    };
    function formatArgs(args) {
      var useColors2 = this.useColors;
      args[0] = (useColors2 ? "%c" : "") + this.namespace + (useColors2 ? " %c" : " ") + args[0] + (useColors2 ? "%c " : " ") + "+" + exports2.humanize(this.diff);
      if (!useColors2) return;
      var c4 = "color: " + this.color;
      args.splice(1, 0, c4, "color: inherit");
      var index = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function(match) {
        if ("%%" === match) return;
        index++;
        if ("%c" === match) {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c4);
    }
    function log() {
      return "object" === typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
    }
    function save(namespaces) {
      try {
        if (null == namespaces) {
          exports2.storage.removeItem("debug");
        } else {
          exports2.storage.debug = namespaces;
        }
      } catch (e5) {
      }
    }
    function load() {
      var r5;
      try {
        r5 = exports2.storage.debug;
      } catch (e5) {
      }
      if (!r5 && typeof process !== "undefined" && "env" in process) {
        r5 = process.env.DEBUG;
      }
      return r5;
    }
    exports2.enable(load());
    function localstorage() {
      try {
        return window.localStorage;
      } catch (e5) {
      }
    }
  }
});

// ../node_modules/.pnpm/debug@2.6.9/node_modules/debug/src/node.js
var require_node = __commonJS({
  "../node_modules/.pnpm/debug@2.6.9/node_modules/debug/src/node.js"(exports2, module2) {
    var tty = require("tty");
    var util = require("util");
    exports2 = module2.exports = require_debug();
    exports2.init = init;
    exports2.log = log;
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.colors = [6, 2, 3, 4, 5, 1];
    exports2.inspectOpts = Object.keys(process.env).filter(function(key) {
      return /^debug_/i.test(key);
    }).reduce(function(obj, key) {
      var prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, function(_2, k2) {
        return k2.toUpperCase();
      });
      var val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
      else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
      else if (val === "null") val = null;
      else val = Number(val);
      obj[prop] = val;
      return obj;
    }, {});
    var fd = parseInt(process.env.DEBUG_FD, 10) || 2;
    if (1 !== fd && 2 !== fd) {
      util.deprecate(function() {
      }, "except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)")();
    }
    var stream = 1 === fd ? process.stdout : 2 === fd ? process.stderr : createWritableStdioStream(fd);
    function useColors() {
      return "colors" in exports2.inspectOpts ? Boolean(exports2.inspectOpts.colors) : tty.isatty(fd);
    }
    exports2.formatters.o = function(v3) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v3, this.inspectOpts).split("\n").map(function(str) {
        return str.trim();
      }).join(" ");
    };
    exports2.formatters.O = function(v3) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v3, this.inspectOpts);
    };
    function formatArgs(args) {
      var name2 = this.namespace;
      var useColors2 = this.useColors;
      if (useColors2) {
        var c4 = this.color;
        var prefix = "  \x1B[3" + c4 + ";1m" + name2 + " \x1B[0m";
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push("\x1B[3" + c4 + "m+" + exports2.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = (/* @__PURE__ */ new Date()).toUTCString() + " " + name2 + " " + args[0];
      }
    }
    function log() {
      return stream.write(util.format.apply(util, arguments) + "\n");
    }
    function save(namespaces) {
      if (null == namespaces) {
        delete process.env.DEBUG;
      } else {
        process.env.DEBUG = namespaces;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function createWritableStdioStream(fd2) {
      var stream2;
      var tty_wrap = process.binding("tty_wrap");
      switch (tty_wrap.guessHandleType(fd2)) {
        case "TTY":
          stream2 = new tty.WriteStream(fd2);
          stream2._type = "tty";
          if (stream2._handle && stream2._handle.unref) {
            stream2._handle.unref();
          }
          break;
        case "FILE":
          var fs = require("fs");
          stream2 = new fs.SyncWriteStream(fd2, { autoClose: false });
          stream2._type = "fs";
          break;
        case "PIPE":
        case "TCP":
          var net = require("net");
          stream2 = new net.Socket({
            fd: fd2,
            readable: false,
            writable: true
          });
          stream2.readable = false;
          stream2.read = null;
          stream2._type = "pipe";
          if (stream2._handle && stream2._handle.unref) {
            stream2._handle.unref();
          }
          break;
        default:
          throw new Error("Implement me. Unknown stream file type!");
      }
      stream2.fd = fd2;
      stream2._isStdio = true;
      return stream2;
    }
    function init(debug) {
      debug.inspectOpts = {};
      var keys = Object.keys(exports2.inspectOpts);
      for (var i2 = 0; i2 < keys.length; i2++) {
        debug.inspectOpts[keys[i2]] = exports2.inspectOpts[keys[i2]];
      }
    }
    exports2.enable(load());
  }
});

// ../node_modules/.pnpm/debug@2.6.9/node_modules/debug/src/index.js
var require_src = __commonJS({
  "../node_modules/.pnpm/debug@2.6.9/node_modules/debug/src/index.js"(exports2, module2) {
    if (typeof process !== "undefined" && process.type === "renderer") {
      module2.exports = require_browser();
    } else {
      module2.exports = require_node();
    }
  }
});

// ../node_modules/.pnpm/follow-redirects@1.15.11_debug@2.6.9/node_modules/follow-redirects/debug.js
var require_debug2 = __commonJS({
  "../node_modules/.pnpm/follow-redirects@1.15.11_debug@2.6.9/node_modules/follow-redirects/debug.js"(exports2, module2) {
    var debug;
    module2.exports = function() {
      if (!debug) {
        try {
          debug = require_src()("follow-redirects");
        } catch (error) {
        }
        if (typeof debug !== "function") {
          debug = function() {
          };
        }
      }
      debug.apply(null, arguments);
    };
  }
});

// ../node_modules/.pnpm/follow-redirects@1.15.11_debug@2.6.9/node_modules/follow-redirects/index.js
var require_follow_redirects = __commonJS({
  "../node_modules/.pnpm/follow-redirects@1.15.11_debug@2.6.9/node_modules/follow-redirects/index.js"(exports2, module2) {
    var url = require("url");
    var URL2 = url.URL;
    var http = require("http");
    var https = require("https");
    var Writable = require("stream").Writable;
    var assert = require("assert");
    var debug = require_debug2();
    (function detectUnsupportedEnvironment() {
      var looksLikeNode = typeof process !== "undefined";
      var looksLikeBrowser = typeof window !== "undefined" && typeof document !== "undefined";
      var looksLikeV8 = isFunction(Error.captureStackTrace);
      if (!looksLikeNode && (looksLikeBrowser || !looksLikeV8)) {
        console.warn("The follow-redirects package should be excluded from browser builds.");
      }
    })();
    var useNativeURL = false;
    try {
      assert(new URL2(""));
    } catch (error) {
      useNativeURL = error.code === "ERR_INVALID_URL";
    }
    var preservedUrlFields = [
      "auth",
      "host",
      "hostname",
      "href",
      "path",
      "pathname",
      "port",
      "protocol",
      "query",
      "search",
      "hash"
    ];
    var events = ["abort", "aborted", "connect", "error", "socket", "timeout"];
    var eventHandlers = /* @__PURE__ */ Object.create(null);
    events.forEach(function(event) {
      eventHandlers[event] = function(arg1, arg2, arg3) {
        this._redirectable.emit(event, arg1, arg2, arg3);
      };
    });
    var InvalidUrlError = createErrorType(
      "ERR_INVALID_URL",
      "Invalid URL",
      TypeError
    );
    var RedirectionError = createErrorType(
      "ERR_FR_REDIRECTION_FAILURE",
      "Redirected request failed"
    );
    var TooManyRedirectsError = createErrorType(
      "ERR_FR_TOO_MANY_REDIRECTS",
      "Maximum number of redirects exceeded",
      RedirectionError
    );
    var MaxBodyLengthExceededError = createErrorType(
      "ERR_FR_MAX_BODY_LENGTH_EXCEEDED",
      "Request body larger than maxBodyLength limit"
    );
    var WriteAfterEndError = createErrorType(
      "ERR_STREAM_WRITE_AFTER_END",
      "write after end"
    );
    var destroy = Writable.prototype.destroy || noop;
    function RedirectableRequest(options, responseCallback) {
      Writable.call(this);
      this._sanitizeOptions(options);
      this._options = options;
      this._ended = false;
      this._ending = false;
      this._redirectCount = 0;
      this._redirects = [];
      this._requestBodyLength = 0;
      this._requestBodyBuffers = [];
      if (responseCallback) {
        this.on("response", responseCallback);
      }
      var self2 = this;
      this._onNativeResponse = function(response) {
        try {
          self2._processResponse(response);
        } catch (cause) {
          self2.emit("error", cause instanceof RedirectionError ? cause : new RedirectionError({ cause }));
        }
      };
      this._performRequest();
    }
    RedirectableRequest.prototype = Object.create(Writable.prototype);
    RedirectableRequest.prototype.abort = function() {
      destroyRequest(this._currentRequest);
      this._currentRequest.abort();
      this.emit("abort");
    };
    RedirectableRequest.prototype.destroy = function(error) {
      destroyRequest(this._currentRequest, error);
      destroy.call(this, error);
      return this;
    };
    RedirectableRequest.prototype.write = function(data, encoding, callback) {
      if (this._ending) {
        throw new WriteAfterEndError();
      }
      if (!isString(data) && !isBuffer(data)) {
        throw new TypeError("data should be a string, Buffer or Uint8Array");
      }
      if (isFunction(encoding)) {
        callback = encoding;
        encoding = null;
      }
      if (data.length === 0) {
        if (callback) {
          callback();
        }
        return;
      }
      if (this._requestBodyLength + data.length <= this._options.maxBodyLength) {
        this._requestBodyLength += data.length;
        this._requestBodyBuffers.push({ data, encoding });
        this._currentRequest.write(data, encoding, callback);
      } else {
        this.emit("error", new MaxBodyLengthExceededError());
        this.abort();
      }
    };
    RedirectableRequest.prototype.end = function(data, encoding, callback) {
      if (isFunction(data)) {
        callback = data;
        data = encoding = null;
      } else if (isFunction(encoding)) {
        callback = encoding;
        encoding = null;
      }
      if (!data) {
        this._ended = this._ending = true;
        this._currentRequest.end(null, null, callback);
      } else {
        var self2 = this;
        var currentRequest = this._currentRequest;
        this.write(data, encoding, function() {
          self2._ended = true;
          currentRequest.end(null, null, callback);
        });
        this._ending = true;
      }
    };
    RedirectableRequest.prototype.setHeader = function(name2, value) {
      this._options.headers[name2] = value;
      this._currentRequest.setHeader(name2, value);
    };
    RedirectableRequest.prototype.removeHeader = function(name2) {
      delete this._options.headers[name2];
      this._currentRequest.removeHeader(name2);
    };
    RedirectableRequest.prototype.setTimeout = function(msecs, callback) {
      var self2 = this;
      function destroyOnTimeout(socket) {
        socket.setTimeout(msecs);
        socket.removeListener("timeout", socket.destroy);
        socket.addListener("timeout", socket.destroy);
      }
      function startTimer(socket) {
        if (self2._timeout) {
          clearTimeout(self2._timeout);
        }
        self2._timeout = setTimeout(function() {
          self2.emit("timeout");
          clearTimer();
        }, msecs);
        destroyOnTimeout(socket);
      }
      function clearTimer() {
        if (self2._timeout) {
          clearTimeout(self2._timeout);
          self2._timeout = null;
        }
        self2.removeListener("abort", clearTimer);
        self2.removeListener("error", clearTimer);
        self2.removeListener("response", clearTimer);
        self2.removeListener("close", clearTimer);
        if (callback) {
          self2.removeListener("timeout", callback);
        }
        if (!self2.socket) {
          self2._currentRequest.removeListener("socket", startTimer);
        }
      }
      if (callback) {
        this.on("timeout", callback);
      }
      if (this.socket) {
        startTimer(this.socket);
      } else {
        this._currentRequest.once("socket", startTimer);
      }
      this.on("socket", destroyOnTimeout);
      this.on("abort", clearTimer);
      this.on("error", clearTimer);
      this.on("response", clearTimer);
      this.on("close", clearTimer);
      return this;
    };
    [
      "flushHeaders",
      "getHeader",
      "setNoDelay",
      "setSocketKeepAlive"
    ].forEach(function(method) {
      RedirectableRequest.prototype[method] = function(a3, b3) {
        return this._currentRequest[method](a3, b3);
      };
    });
    ["aborted", "connection", "socket"].forEach(function(property) {
      Object.defineProperty(RedirectableRequest.prototype, property, {
        get: function() {
          return this._currentRequest[property];
        }
      });
    });
    RedirectableRequest.prototype._sanitizeOptions = function(options) {
      if (!options.headers) {
        options.headers = {};
      }
      if (options.host) {
        if (!options.hostname) {
          options.hostname = options.host;
        }
        delete options.host;
      }
      if (!options.pathname && options.path) {
        var searchPos = options.path.indexOf("?");
        if (searchPos < 0) {
          options.pathname = options.path;
        } else {
          options.pathname = options.path.substring(0, searchPos);
          options.search = options.path.substring(searchPos);
        }
      }
    };
    RedirectableRequest.prototype._performRequest = function() {
      var protocol = this._options.protocol;
      var nativeProtocol = this._options.nativeProtocols[protocol];
      if (!nativeProtocol) {
        throw new TypeError("Unsupported protocol " + protocol);
      }
      if (this._options.agents) {
        var scheme = protocol.slice(0, -1);
        this._options.agent = this._options.agents[scheme];
      }
      var request = this._currentRequest = nativeProtocol.request(this._options, this._onNativeResponse);
      request._redirectable = this;
      for (var event of events) {
        request.on(event, eventHandlers[event]);
      }
      this._currentUrl = /^\//.test(this._options.path) ? url.format(this._options) : (
        // When making a request to a proxy, […]
        // a client MUST send the target URI in absolute-form […].
        this._options.path
      );
      if (this._isRedirect) {
        var i2 = 0;
        var self2 = this;
        var buffers = this._requestBodyBuffers;
        (function writeNext(error) {
          if (request === self2._currentRequest) {
            if (error) {
              self2.emit("error", error);
            } else if (i2 < buffers.length) {
              var buffer = buffers[i2++];
              if (!request.finished) {
                request.write(buffer.data, buffer.encoding, writeNext);
              }
            } else if (self2._ended) {
              request.end();
            }
          }
        })();
      }
    };
    RedirectableRequest.prototype._processResponse = function(response) {
      var statusCode = response.statusCode;
      if (this._options.trackRedirects) {
        this._redirects.push({
          url: this._currentUrl,
          headers: response.headers,
          statusCode
        });
      }
      var location2 = response.headers.location;
      if (!location2 || this._options.followRedirects === false || statusCode < 300 || statusCode >= 400) {
        response.responseUrl = this._currentUrl;
        response.redirects = this._redirects;
        this.emit("response", response);
        this._requestBodyBuffers = [];
        return;
      }
      destroyRequest(this._currentRequest);
      response.destroy();
      if (++this._redirectCount > this._options.maxRedirects) {
        throw new TooManyRedirectsError();
      }
      var requestHeaders;
      var beforeRedirect = this._options.beforeRedirect;
      if (beforeRedirect) {
        requestHeaders = Object.assign({
          // The Host header was set by nativeProtocol.request
          Host: response.req.getHeader("host")
        }, this._options.headers);
      }
      var method = this._options.method;
      if ((statusCode === 301 || statusCode === 302) && this._options.method === "POST" || // RFC7231§6.4.4: The 303 (See Other) status code indicates that
      // the server is redirecting the user agent to a different resource […]
      // A user agent can perform a retrieval request targeting that URI
      // (a GET or HEAD request if using HTTP) […]
      statusCode === 303 && !/^(?:GET|HEAD)$/.test(this._options.method)) {
        this._options.method = "GET";
        this._requestBodyBuffers = [];
        removeMatchingHeaders(/^content-/i, this._options.headers);
      }
      var currentHostHeader = removeMatchingHeaders(/^host$/i, this._options.headers);
      var currentUrlParts = parseUrl(this._currentUrl);
      var currentHost = currentHostHeader || currentUrlParts.host;
      var currentUrl = /^\w+:/.test(location2) ? this._currentUrl : url.format(Object.assign(currentUrlParts, { host: currentHost }));
      var redirectUrl = resolveUrl(location2, currentUrl);
      debug("redirecting to", redirectUrl.href);
      this._isRedirect = true;
      spreadUrlObject(redirectUrl, this._options);
      if (redirectUrl.protocol !== currentUrlParts.protocol && redirectUrl.protocol !== "https:" || redirectUrl.host !== currentHost && !isSubdomain(redirectUrl.host, currentHost)) {
        removeMatchingHeaders(/^(?:(?:proxy-)?authorization|cookie)$/i, this._options.headers);
      }
      if (isFunction(beforeRedirect)) {
        var responseDetails = {
          headers: response.headers,
          statusCode
        };
        var requestDetails = {
          url: currentUrl,
          method,
          headers: requestHeaders
        };
        beforeRedirect(this._options, responseDetails, requestDetails);
        this._sanitizeOptions(this._options);
      }
      this._performRequest();
    };
    function wrap(protocols) {
      var exports3 = {
        maxRedirects: 21,
        maxBodyLength: 10 * 1024 * 1024
      };
      var nativeProtocols = {};
      Object.keys(protocols).forEach(function(scheme) {
        var protocol = scheme + ":";
        var nativeProtocol = nativeProtocols[protocol] = protocols[scheme];
        var wrappedProtocol = exports3[scheme] = Object.create(nativeProtocol);
        function request(input, options, callback) {
          if (isURL(input)) {
            input = spreadUrlObject(input);
          } else if (isString(input)) {
            input = spreadUrlObject(parseUrl(input));
          } else {
            callback = options;
            options = validateUrl(input);
            input = { protocol };
          }
          if (isFunction(options)) {
            callback = options;
            options = null;
          }
          options = Object.assign({
            maxRedirects: exports3.maxRedirects,
            maxBodyLength: exports3.maxBodyLength
          }, input, options);
          options.nativeProtocols = nativeProtocols;
          if (!isString(options.host) && !isString(options.hostname)) {
            options.hostname = "::1";
          }
          assert.equal(options.protocol, protocol, "protocol mismatch");
          debug("options", options);
          return new RedirectableRequest(options, callback);
        }
        function get2(input, options, callback) {
          var wrappedRequest = wrappedProtocol.request(input, options, callback);
          wrappedRequest.end();
          return wrappedRequest;
        }
        Object.defineProperties(wrappedProtocol, {
          request: { value: request, configurable: true, enumerable: true, writable: true },
          get: { value: get2, configurable: true, enumerable: true, writable: true }
        });
      });
      return exports3;
    }
    function noop() {
    }
    function parseUrl(input) {
      var parsed;
      if (useNativeURL) {
        parsed = new URL2(input);
      } else {
        parsed = validateUrl(url.parse(input));
        if (!isString(parsed.protocol)) {
          throw new InvalidUrlError({ input });
        }
      }
      return parsed;
    }
    function resolveUrl(relative, base) {
      return useNativeURL ? new URL2(relative, base) : parseUrl(url.resolve(base, relative));
    }
    function validateUrl(input) {
      if (/^\[/.test(input.hostname) && !/^\[[:0-9a-f]+\]$/i.test(input.hostname)) {
        throw new InvalidUrlError({ input: input.href || input });
      }
      if (/^\[/.test(input.host) && !/^\[[:0-9a-f]+\](:\d+)?$/i.test(input.host)) {
        throw new InvalidUrlError({ input: input.href || input });
      }
      return input;
    }
    function spreadUrlObject(urlObject, target) {
      var spread = target || {};
      for (var key of preservedUrlFields) {
        spread[key] = urlObject[key];
      }
      if (spread.hostname.startsWith("[")) {
        spread.hostname = spread.hostname.slice(1, -1);
      }
      if (spread.port !== "") {
        spread.port = Number(spread.port);
      }
      spread.path = spread.search ? spread.pathname + spread.search : spread.pathname;
      return spread;
    }
    function removeMatchingHeaders(regex, headers) {
      var lastValue;
      for (var header in headers) {
        if (regex.test(header)) {
          lastValue = headers[header];
          delete headers[header];
        }
      }
      return lastValue === null || typeof lastValue === "undefined" ? void 0 : String(lastValue).trim();
    }
    function createErrorType(code, message, baseClass) {
      function CustomError(properties) {
        if (isFunction(Error.captureStackTrace)) {
          Error.captureStackTrace(this, this.constructor);
        }
        Object.assign(this, properties || {});
        this.code = code;
        this.message = this.cause ? message + ": " + this.cause.message : message;
      }
      CustomError.prototype = new (baseClass || Error)();
      Object.defineProperties(CustomError.prototype, {
        constructor: {
          value: CustomError,
          enumerable: false
        },
        name: {
          value: "Error [" + code + "]",
          enumerable: false
        }
      });
      return CustomError;
    }
    function destroyRequest(request, error) {
      for (var event of events) {
        request.removeListener(event, eventHandlers[event]);
      }
      request.on("error", noop);
      request.destroy(error);
    }
    function isSubdomain(subdomain, domain) {
      assert(isString(subdomain) && isString(domain));
      var dot = subdomain.length - domain.length - 1;
      return dot > 0 && subdomain[dot] === "." && subdomain.endsWith(domain);
    }
    function isString(value) {
      return typeof value === "string" || value instanceof String;
    }
    function isFunction(value) {
      return typeof value === "function";
    }
    function isBuffer(value) {
      return typeof value === "object" && "length" in value;
    }
    function isURL(value) {
      return URL2 && value instanceof URL2;
    }
    module2.exports = wrap({ http, https });
    module2.exports.wrap = wrap;
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/stream.js
var require_stream = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/stream.js"(exports2, module2) {
    module2.exports = require("stream");
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/buffer_list.js
var require_buffer_list = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/buffer_list.js"(exports2, module2) {
    "use strict";
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function _objectSpread(target) {
      for (var i2 = 1; i2 < arguments.length; i2++) {
        var source = null != arguments[i2] ? arguments[i2] : {};
        i2 % 2 ? ownKeys(Object(source), true).forEach(function(key) {
          _defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    function _defineProperty(obj, key, value) {
      key = _toPropertyKey(key);
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function _defineProperties(target, props) {
      for (var i2 = 0; i2 < props.length; i2++) {
        var descriptor = props[i2];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
      }
    }
    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    var _require = require("buffer");
    var Buffer2 = _require.Buffer;
    var _require2 = require("util");
    var inspect = _require2.inspect;
    var custom = inspect && inspect.custom || "inspect";
    function copyBuffer(src, target, offset) {
      Buffer2.prototype.copy.call(src, target, offset);
    }
    module2.exports = /* @__PURE__ */ (function() {
      function BufferList() {
        _classCallCheck(this, BufferList);
        this.head = null;
        this.tail = null;
        this.length = 0;
      }
      _createClass(BufferList, [{
        key: "push",
        value: function push(v3) {
          var entry = {
            data: v3,
            next: null
          };
          if (this.length > 0) this.tail.next = entry;
          else this.head = entry;
          this.tail = entry;
          ++this.length;
        }
      }, {
        key: "unshift",
        value: function unshift(v3) {
          var entry = {
            data: v3,
            next: this.head
          };
          if (this.length === 0) this.tail = entry;
          this.head = entry;
          ++this.length;
        }
      }, {
        key: "shift",
        value: function shift() {
          if (this.length === 0) return;
          var ret = this.head.data;
          if (this.length === 1) this.head = this.tail = null;
          else this.head = this.head.next;
          --this.length;
          return ret;
        }
      }, {
        key: "clear",
        value: function clear() {
          this.head = this.tail = null;
          this.length = 0;
        }
      }, {
        key: "join",
        value: function join(s4) {
          if (this.length === 0) return "";
          var p3 = this.head;
          var ret = "" + p3.data;
          while (p3 = p3.next) ret += s4 + p3.data;
          return ret;
        }
      }, {
        key: "concat",
        value: function concat2(n5) {
          if (this.length === 0) return Buffer2.alloc(0);
          var ret = Buffer2.allocUnsafe(n5 >>> 0);
          var p3 = this.head;
          var i2 = 0;
          while (p3) {
            copyBuffer(p3.data, ret, i2);
            i2 += p3.data.length;
            p3 = p3.next;
          }
          return ret;
        }
        // Consumes a specified amount of bytes or characters from the buffered data.
      }, {
        key: "consume",
        value: function consume(n5, hasStrings) {
          var ret;
          if (n5 < this.head.data.length) {
            ret = this.head.data.slice(0, n5);
            this.head.data = this.head.data.slice(n5);
          } else if (n5 === this.head.data.length) {
            ret = this.shift();
          } else {
            ret = hasStrings ? this._getString(n5) : this._getBuffer(n5);
          }
          return ret;
        }
      }, {
        key: "first",
        value: function first() {
          return this.head.data;
        }
        // Consumes a specified amount of characters from the buffered data.
      }, {
        key: "_getString",
        value: function _getString(n5) {
          var p3 = this.head;
          var c4 = 1;
          var ret = p3.data;
          n5 -= ret.length;
          while (p3 = p3.next) {
            var str = p3.data;
            var nb = n5 > str.length ? str.length : n5;
            if (nb === str.length) ret += str;
            else ret += str.slice(0, n5);
            n5 -= nb;
            if (n5 === 0) {
              if (nb === str.length) {
                ++c4;
                if (p3.next) this.head = p3.next;
                else this.head = this.tail = null;
              } else {
                this.head = p3;
                p3.data = str.slice(nb);
              }
              break;
            }
            ++c4;
          }
          this.length -= c4;
          return ret;
        }
        // Consumes a specified amount of bytes from the buffered data.
      }, {
        key: "_getBuffer",
        value: function _getBuffer(n5) {
          var ret = Buffer2.allocUnsafe(n5);
          var p3 = this.head;
          var c4 = 1;
          p3.data.copy(ret);
          n5 -= p3.data.length;
          while (p3 = p3.next) {
            var buf = p3.data;
            var nb = n5 > buf.length ? buf.length : n5;
            buf.copy(ret, ret.length - n5, 0, nb);
            n5 -= nb;
            if (n5 === 0) {
              if (nb === buf.length) {
                ++c4;
                if (p3.next) this.head = p3.next;
                else this.head = this.tail = null;
              } else {
                this.head = p3;
                p3.data = buf.slice(nb);
              }
              break;
            }
            ++c4;
          }
          this.length -= c4;
          return ret;
        }
        // Make sure the linked list only shows the minimal necessary information.
      }, {
        key: custom,
        value: function value(_2, options) {
          return inspect(this, _objectSpread(_objectSpread({}, options), {}, {
            // Only inspect one level.
            depth: 0,
            // It should not recurse.
            customInspect: false
          }));
        }
      }]);
      return BufferList;
    })();
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/destroy.js
var require_destroy = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/destroy.js"(exports2, module2) {
    "use strict";
    function destroy(err, cb) {
      var _this = this;
      var readableDestroyed = this._readableState && this._readableState.destroyed;
      var writableDestroyed = this._writableState && this._writableState.destroyed;
      if (readableDestroyed || writableDestroyed) {
        if (cb) {
          cb(err);
        } else if (err) {
          if (!this._writableState) {
            process.nextTick(emitErrorNT, this, err);
          } else if (!this._writableState.errorEmitted) {
            this._writableState.errorEmitted = true;
            process.nextTick(emitErrorNT, this, err);
          }
        }
        return this;
      }
      if (this._readableState) {
        this._readableState.destroyed = true;
      }
      if (this._writableState) {
        this._writableState.destroyed = true;
      }
      this._destroy(err || null, function(err2) {
        if (!cb && err2) {
          if (!_this._writableState) {
            process.nextTick(emitErrorAndCloseNT, _this, err2);
          } else if (!_this._writableState.errorEmitted) {
            _this._writableState.errorEmitted = true;
            process.nextTick(emitErrorAndCloseNT, _this, err2);
          } else {
            process.nextTick(emitCloseNT, _this);
          }
        } else if (cb) {
          process.nextTick(emitCloseNT, _this);
          cb(err2);
        } else {
          process.nextTick(emitCloseNT, _this);
        }
      });
      return this;
    }
    function emitErrorAndCloseNT(self2, err) {
      emitErrorNT(self2, err);
      emitCloseNT(self2);
    }
    function emitCloseNT(self2) {
      if (self2._writableState && !self2._writableState.emitClose) return;
      if (self2._readableState && !self2._readableState.emitClose) return;
      self2.emit("close");
    }
    function undestroy() {
      if (this._readableState) {
        this._readableState.destroyed = false;
        this._readableState.reading = false;
        this._readableState.ended = false;
        this._readableState.endEmitted = false;
      }
      if (this._writableState) {
        this._writableState.destroyed = false;
        this._writableState.ended = false;
        this._writableState.ending = false;
        this._writableState.finalCalled = false;
        this._writableState.prefinished = false;
        this._writableState.finished = false;
        this._writableState.errorEmitted = false;
      }
    }
    function emitErrorNT(self2, err) {
      self2.emit("error", err);
    }
    function errorOrDestroy(stream, err) {
      var rState = stream._readableState;
      var wState = stream._writableState;
      if (rState && rState.autoDestroy || wState && wState.autoDestroy) stream.destroy(err);
      else stream.emit("error", err);
    }
    module2.exports = {
      destroy,
      undestroy,
      errorOrDestroy
    };
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/errors.js
var require_errors = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/errors.js"(exports2, module2) {
    "use strict";
    var codes = {};
    function createErrorType(code, message, Base) {
      if (!Base) {
        Base = Error;
      }
      function getMessage(arg1, arg2, arg3) {
        if (typeof message === "string") {
          return message;
        } else {
          return message(arg1, arg2, arg3);
        }
      }
      class NodeError extends Base {
        constructor(arg1, arg2, arg3) {
          super(getMessage(arg1, arg2, arg3));
        }
      }
      NodeError.prototype.name = Base.name;
      NodeError.prototype.code = code;
      codes[code] = NodeError;
    }
    function oneOf(expected, thing) {
      if (Array.isArray(expected)) {
        const len = expected.length;
        expected = expected.map((i2) => String(i2));
        if (len > 2) {
          return `one of ${thing} ${expected.slice(0, len - 1).join(", ")}, or ` + expected[len - 1];
        } else if (len === 2) {
          return `one of ${thing} ${expected[0]} or ${expected[1]}`;
        } else {
          return `of ${thing} ${expected[0]}`;
        }
      } else {
        return `of ${thing} ${String(expected)}`;
      }
    }
    function startsWith(str, search, pos) {
      return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
    }
    function endsWith(str, search, this_len) {
      if (this_len === void 0 || this_len > str.length) {
        this_len = str.length;
      }
      return str.substring(this_len - search.length, this_len) === search;
    }
    function includes(str, search, start) {
      if (typeof start !== "number") {
        start = 0;
      }
      if (start + search.length > str.length) {
        return false;
      } else {
        return str.indexOf(search, start) !== -1;
      }
    }
    createErrorType("ERR_INVALID_OPT_VALUE", function(name2, value) {
      return 'The value "' + value + '" is invalid for option "' + name2 + '"';
    }, TypeError);
    createErrorType("ERR_INVALID_ARG_TYPE", function(name2, expected, actual) {
      let determiner;
      if (typeof expected === "string" && startsWith(expected, "not ")) {
        determiner = "must not be";
        expected = expected.replace(/^not /, "");
      } else {
        determiner = "must be";
      }
      let msg;
      if (endsWith(name2, " argument")) {
        msg = `The ${name2} ${determiner} ${oneOf(expected, "type")}`;
      } else {
        const type = includes(name2, ".") ? "property" : "argument";
        msg = `The "${name2}" ${type} ${determiner} ${oneOf(expected, "type")}`;
      }
      msg += `. Received type ${typeof actual}`;
      return msg;
    }, TypeError);
    createErrorType("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF");
    createErrorType("ERR_METHOD_NOT_IMPLEMENTED", function(name2) {
      return "The " + name2 + " method is not implemented";
    });
    createErrorType("ERR_STREAM_PREMATURE_CLOSE", "Premature close");
    createErrorType("ERR_STREAM_DESTROYED", function(name2) {
      return "Cannot call " + name2 + " after a stream was destroyed";
    });
    createErrorType("ERR_MULTIPLE_CALLBACK", "Callback called multiple times");
    createErrorType("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable");
    createErrorType("ERR_STREAM_WRITE_AFTER_END", "write after end");
    createErrorType("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError);
    createErrorType("ERR_UNKNOWN_ENCODING", function(arg) {
      return "Unknown encoding: " + arg;
    }, TypeError);
    createErrorType("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event");
    module2.exports.codes = codes;
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/state.js
var require_state = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/state.js"(exports2, module2) {
    "use strict";
    var ERR_INVALID_OPT_VALUE = require_errors().codes.ERR_INVALID_OPT_VALUE;
    function highWaterMarkFrom(options, isDuplex, duplexKey) {
      return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
    }
    function getHighWaterMark(state, options, duplexKey, isDuplex) {
      var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);
      if (hwm != null) {
        if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
          var name2 = isDuplex ? duplexKey : "highWaterMark";
          throw new ERR_INVALID_OPT_VALUE(name2, hwm);
        }
        return Math.floor(hwm);
      }
      return state.objectMode ? 16 : 16 * 1024;
    }
    module2.exports = {
      getHighWaterMark
    };
  }
});

// ../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits_browser.js
var require_inherits_browser = __commonJS({
  "../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits_browser.js"(exports2, module2) {
    if (typeof Object.create === "function") {
      module2.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        }
      };
    } else {
      module2.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function() {
          };
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
      };
    }
  }
});

// ../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits.js
var require_inherits = __commonJS({
  "../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits.js"(exports2, module2) {
    try {
      util = require("util");
      if (typeof util.inherits !== "function") throw "";
      module2.exports = util.inherits;
    } catch (e5) {
      module2.exports = require_inherits_browser();
    }
    var util;
  }
});

// ../node_modules/.pnpm/util-deprecate@1.0.2/node_modules/util-deprecate/node.js
var require_node2 = __commonJS({
  "../node_modules/.pnpm/util-deprecate@1.0.2/node_modules/util-deprecate/node.js"(exports2, module2) {
    module2.exports = require("util").deprecate;
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_writable.js
var require_stream_writable = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_writable.js"(exports2, module2) {
    "use strict";
    module2.exports = Writable;
    function CorkedRequest(state) {
      var _this = this;
      this.next = null;
      this.entry = null;
      this.finish = function() {
        onCorkedFinish(_this, state);
      };
    }
    var Duplex;
    Writable.WritableState = WritableState;
    var internalUtil = {
      deprecate: require_node2()
    };
    var Stream = require_stream();
    var Buffer2 = require("buffer").Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    var destroyImpl = require_destroy();
    var _require = require_state();
    var getHighWaterMark = _require.getHighWaterMark;
    var _require$codes = require_errors().codes;
    var ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE;
    var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
    var ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK;
    var ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE;
    var ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
    var ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES;
    var ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END;
    var ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;
    var errorOrDestroy = destroyImpl.errorOrDestroy;
    require_inherits()(Writable, Stream);
    function nop() {
    }
    function WritableState(options, stream, isDuplex) {
      Duplex = Duplex || require_stream_duplex();
      options = options || {};
      if (typeof isDuplex !== "boolean") isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
      this.highWaterMark = getHighWaterMark(this, options, "writableHighWaterMark", isDuplex);
      this.finalCalled = false;
      this.needDrain = false;
      this.ending = false;
      this.ended = false;
      this.finished = false;
      this.destroyed = false;
      var noDecode = options.decodeStrings === false;
      this.decodeStrings = !noDecode;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.length = 0;
      this.writing = false;
      this.corked = 0;
      this.sync = true;
      this.bufferProcessing = false;
      this.onwrite = function(er) {
        onwrite(stream, er);
      };
      this.writecb = null;
      this.writelen = 0;
      this.bufferedRequest = null;
      this.lastBufferedRequest = null;
      this.pendingcb = 0;
      this.prefinished = false;
      this.errorEmitted = false;
      this.emitClose = options.emitClose !== false;
      this.autoDestroy = !!options.autoDestroy;
      this.bufferedRequestCount = 0;
      this.corkedRequestsFree = new CorkedRequest(this);
    }
    WritableState.prototype.getBuffer = function getBuffer() {
      var current = this.bufferedRequest;
      var out = [];
      while (current) {
        out.push(current);
        current = current.next;
      }
      return out;
    };
    (function() {
      try {
        Object.defineProperty(WritableState.prototype, "buffer", {
          get: internalUtil.deprecate(function writableStateBufferGetter() {
            return this.getBuffer();
          }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
        });
      } catch (_2) {
      }
    })();
    var realHasInstance;
    if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
      realHasInstance = Function.prototype[Symbol.hasInstance];
      Object.defineProperty(Writable, Symbol.hasInstance, {
        value: function value(object) {
          if (realHasInstance.call(this, object)) return true;
          if (this !== Writable) return false;
          return object && object._writableState instanceof WritableState;
        }
      });
    } else {
      realHasInstance = function realHasInstance2(object) {
        return object instanceof this;
      };
    }
    function Writable(options) {
      Duplex = Duplex || require_stream_duplex();
      var isDuplex = this instanceof Duplex;
      if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options);
      this._writableState = new WritableState(options, this, isDuplex);
      this.writable = true;
      if (options) {
        if (typeof options.write === "function") this._write = options.write;
        if (typeof options.writev === "function") this._writev = options.writev;
        if (typeof options.destroy === "function") this._destroy = options.destroy;
        if (typeof options.final === "function") this._final = options.final;
      }
      Stream.call(this);
    }
    Writable.prototype.pipe = function() {
      errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
    };
    function writeAfterEnd(stream, cb) {
      var er = new ERR_STREAM_WRITE_AFTER_END();
      errorOrDestroy(stream, er);
      process.nextTick(cb, er);
    }
    function validChunk(stream, state, chunk, cb) {
      var er;
      if (chunk === null) {
        er = new ERR_STREAM_NULL_VALUES();
      } else if (typeof chunk !== "string" && !state.objectMode) {
        er = new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer"], chunk);
      }
      if (er) {
        errorOrDestroy(stream, er);
        process.nextTick(cb, er);
        return false;
      }
      return true;
    }
    Writable.prototype.write = function(chunk, encoding, cb) {
      var state = this._writableState;
      var ret = false;
      var isBuf = !state.objectMode && _isUint8Array(chunk);
      if (isBuf && !Buffer2.isBuffer(chunk)) {
        chunk = _uint8ArrayToBuffer(chunk);
      }
      if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (isBuf) encoding = "buffer";
      else if (!encoding) encoding = state.defaultEncoding;
      if (typeof cb !== "function") cb = nop;
      if (state.ending) writeAfterEnd(this, cb);
      else if (isBuf || validChunk(this, state, chunk, cb)) {
        state.pendingcb++;
        ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
      }
      return ret;
    };
    Writable.prototype.cork = function() {
      this._writableState.corked++;
    };
    Writable.prototype.uncork = function() {
      var state = this._writableState;
      if (state.corked) {
        state.corked--;
        if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
      }
    };
    Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
      if (typeof encoding === "string") encoding = encoding.toLowerCase();
      if (!(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((encoding + "").toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
      this._writableState.defaultEncoding = encoding;
      return this;
    };
    Object.defineProperty(Writable.prototype, "writableBuffer", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get2() {
        return this._writableState && this._writableState.getBuffer();
      }
    });
    function decodeChunk(state, chunk, encoding) {
      if (!state.objectMode && state.decodeStrings !== false && typeof chunk === "string") {
        chunk = Buffer2.from(chunk, encoding);
      }
      return chunk;
    }
    Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get2() {
        return this._writableState.highWaterMark;
      }
    });
    function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
      if (!isBuf) {
        var newChunk = decodeChunk(state, chunk, encoding);
        if (chunk !== newChunk) {
          isBuf = true;
          encoding = "buffer";
          chunk = newChunk;
        }
      }
      var len = state.objectMode ? 1 : chunk.length;
      state.length += len;
      var ret = state.length < state.highWaterMark;
      if (!ret) state.needDrain = true;
      if (state.writing || state.corked) {
        var last = state.lastBufferedRequest;
        state.lastBufferedRequest = {
          chunk,
          encoding,
          isBuf,
          callback: cb,
          next: null
        };
        if (last) {
          last.next = state.lastBufferedRequest;
        } else {
          state.bufferedRequest = state.lastBufferedRequest;
        }
        state.bufferedRequestCount += 1;
      } else {
        doWrite(stream, state, false, len, chunk, encoding, cb);
      }
      return ret;
    }
    function doWrite(stream, state, writev, len, chunk, encoding, cb) {
      state.writelen = len;
      state.writecb = cb;
      state.writing = true;
      state.sync = true;
      if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED("write"));
      else if (writev) stream._writev(chunk, state.onwrite);
      else stream._write(chunk, encoding, state.onwrite);
      state.sync = false;
    }
    function onwriteError(stream, state, sync, er, cb) {
      --state.pendingcb;
      if (sync) {
        process.nextTick(cb, er);
        process.nextTick(finishMaybe, stream, state);
        stream._writableState.errorEmitted = true;
        errorOrDestroy(stream, er);
      } else {
        cb(er);
        stream._writableState.errorEmitted = true;
        errorOrDestroy(stream, er);
        finishMaybe(stream, state);
      }
    }
    function onwriteStateUpdate(state) {
      state.writing = false;
      state.writecb = null;
      state.length -= state.writelen;
      state.writelen = 0;
    }
    function onwrite(stream, er) {
      var state = stream._writableState;
      var sync = state.sync;
      var cb = state.writecb;
      if (typeof cb !== "function") throw new ERR_MULTIPLE_CALLBACK();
      onwriteStateUpdate(state);
      if (er) onwriteError(stream, state, sync, er, cb);
      else {
        var finished = needFinish(state) || stream.destroyed;
        if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
          clearBuffer(stream, state);
        }
        if (sync) {
          process.nextTick(afterWrite, stream, state, finished, cb);
        } else {
          afterWrite(stream, state, finished, cb);
        }
      }
    }
    function afterWrite(stream, state, finished, cb) {
      if (!finished) onwriteDrain(stream, state);
      state.pendingcb--;
      cb();
      finishMaybe(stream, state);
    }
    function onwriteDrain(stream, state) {
      if (state.length === 0 && state.needDrain) {
        state.needDrain = false;
        stream.emit("drain");
      }
    }
    function clearBuffer(stream, state) {
      state.bufferProcessing = true;
      var entry = state.bufferedRequest;
      if (stream._writev && entry && entry.next) {
        var l3 = state.bufferedRequestCount;
        var buffer = new Array(l3);
        var holder = state.corkedRequestsFree;
        holder.entry = entry;
        var count = 0;
        var allBuffers = true;
        while (entry) {
          buffer[count] = entry;
          if (!entry.isBuf) allBuffers = false;
          entry = entry.next;
          count += 1;
        }
        buffer.allBuffers = allBuffers;
        doWrite(stream, state, true, state.length, buffer, "", holder.finish);
        state.pendingcb++;
        state.lastBufferedRequest = null;
        if (holder.next) {
          state.corkedRequestsFree = holder.next;
          holder.next = null;
        } else {
          state.corkedRequestsFree = new CorkedRequest(state);
        }
        state.bufferedRequestCount = 0;
      } else {
        while (entry) {
          var chunk = entry.chunk;
          var encoding = entry.encoding;
          var cb = entry.callback;
          var len = state.objectMode ? 1 : chunk.length;
          doWrite(stream, state, false, len, chunk, encoding, cb);
          entry = entry.next;
          state.bufferedRequestCount--;
          if (state.writing) {
            break;
          }
        }
        if (entry === null) state.lastBufferedRequest = null;
      }
      state.bufferedRequest = entry;
      state.bufferProcessing = false;
    }
    Writable.prototype._write = function(chunk, encoding, cb) {
      cb(new ERR_METHOD_NOT_IMPLEMENTED("_write()"));
    };
    Writable.prototype._writev = null;
    Writable.prototype.end = function(chunk, encoding, cb) {
      var state = this._writableState;
      if (typeof chunk === "function") {
        cb = chunk;
        chunk = null;
        encoding = null;
      } else if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (chunk !== null && chunk !== void 0) this.write(chunk, encoding);
      if (state.corked) {
        state.corked = 1;
        this.uncork();
      }
      if (!state.ending) endWritable(this, state, cb);
      return this;
    };
    Object.defineProperty(Writable.prototype, "writableLength", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get2() {
        return this._writableState.length;
      }
    });
    function needFinish(state) {
      return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
    }
    function callFinal(stream, state) {
      stream._final(function(err) {
        state.pendingcb--;
        if (err) {
          errorOrDestroy(stream, err);
        }
        state.prefinished = true;
        stream.emit("prefinish");
        finishMaybe(stream, state);
      });
    }
    function prefinish(stream, state) {
      if (!state.prefinished && !state.finalCalled) {
        if (typeof stream._final === "function" && !state.destroyed) {
          state.pendingcb++;
          state.finalCalled = true;
          process.nextTick(callFinal, stream, state);
        } else {
          state.prefinished = true;
          stream.emit("prefinish");
        }
      }
    }
    function finishMaybe(stream, state) {
      var need = needFinish(state);
      if (need) {
        prefinish(stream, state);
        if (state.pendingcb === 0) {
          state.finished = true;
          stream.emit("finish");
          if (state.autoDestroy) {
            var rState = stream._readableState;
            if (!rState || rState.autoDestroy && rState.endEmitted) {
              stream.destroy();
            }
          }
        }
      }
      return need;
    }
    function endWritable(stream, state, cb) {
      state.ending = true;
      finishMaybe(stream, state);
      if (cb) {
        if (state.finished) process.nextTick(cb);
        else stream.once("finish", cb);
      }
      state.ended = true;
      stream.writable = false;
    }
    function onCorkedFinish(corkReq, state, err) {
      var entry = corkReq.entry;
      corkReq.entry = null;
      while (entry) {
        var cb = entry.callback;
        state.pendingcb--;
        cb(err);
        entry = entry.next;
      }
      state.corkedRequestsFree.next = corkReq;
    }
    Object.defineProperty(Writable.prototype, "destroyed", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get2() {
        if (this._writableState === void 0) {
          return false;
        }
        return this._writableState.destroyed;
      },
      set: function set(value) {
        if (!this._writableState) {
          return;
        }
        this._writableState.destroyed = value;
      }
    });
    Writable.prototype.destroy = destroyImpl.destroy;
    Writable.prototype._undestroy = destroyImpl.undestroy;
    Writable.prototype._destroy = function(err, cb) {
      cb(err);
    };
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_duplex.js
var require_stream_duplex = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_duplex.js"(exports2, module2) {
    "use strict";
    var objectKeys = Object.keys || function(obj) {
      var keys2 = [];
      for (var key in obj) keys2.push(key);
      return keys2;
    };
    module2.exports = Duplex;
    var Readable = require_stream_readable();
    var Writable = require_stream_writable();
    require_inherits()(Duplex, Readable);
    {
      keys = objectKeys(Writable.prototype);
      for (v3 = 0; v3 < keys.length; v3++) {
        method = keys[v3];
        if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
      }
    }
    var keys;
    var method;
    var v3;
    function Duplex(options) {
      if (!(this instanceof Duplex)) return new Duplex(options);
      Readable.call(this, options);
      Writable.call(this, options);
      this.allowHalfOpen = true;
      if (options) {
        if (options.readable === false) this.readable = false;
        if (options.writable === false) this.writable = false;
        if (options.allowHalfOpen === false) {
          this.allowHalfOpen = false;
          this.once("end", onend);
        }
      }
    }
    Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get2() {
        return this._writableState.highWaterMark;
      }
    });
    Object.defineProperty(Duplex.prototype, "writableBuffer", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get2() {
        return this._writableState && this._writableState.getBuffer();
      }
    });
    Object.defineProperty(Duplex.prototype, "writableLength", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get2() {
        return this._writableState.length;
      }
    });
    function onend() {
      if (this._writableState.ended) return;
      process.nextTick(onEndNT, this);
    }
    function onEndNT(self2) {
      self2.end();
    }
    Object.defineProperty(Duplex.prototype, "destroyed", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get2() {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return false;
        }
        return this._readableState.destroyed && this._writableState.destroyed;
      },
      set: function set(value) {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return;
        }
        this._readableState.destroyed = value;
        this._writableState.destroyed = value;
      }
    });
  }
});

// ../node_modules/.pnpm/safe-buffer@5.2.1/node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "../node_modules/.pnpm/safe-buffer@5.2.1/node_modules/safe-buffer/index.js"(exports2, module2) {
    var buffer = require("buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module2.exports = buffer;
    } else {
      copyProps(buffer, exports2);
      exports2.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    SafeBuffer.prototype = Object.create(Buffer2.prototype);
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// ../node_modules/.pnpm/string_decoder@1.3.0/node_modules/string_decoder/lib/string_decoder.js
var require_string_decoder = __commonJS({
  "../node_modules/.pnpm/string_decoder@1.3.0/node_modules/string_decoder/lib/string_decoder.js"(exports2) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var isEncoding = Buffer2.isEncoding || function(encoding) {
      encoding = "" + encoding;
      switch (encoding && encoding.toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
        case "raw":
          return true;
        default:
          return false;
      }
    };
    function _normalizeEncoding(enc) {
      if (!enc) return "utf8";
      var retried;
      while (true) {
        switch (enc) {
          case "utf8":
          case "utf-8":
            return "utf8";
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return "utf16le";
          case "latin1":
          case "binary":
            return "latin1";
          case "base64":
          case "ascii":
          case "hex":
            return enc;
          default:
            if (retried) return;
            enc = ("" + enc).toLowerCase();
            retried = true;
        }
      }
    }
    function normalizeEncoding(enc) {
      var nenc = _normalizeEncoding(enc);
      if (typeof nenc !== "string" && (Buffer2.isEncoding === isEncoding || !isEncoding(enc))) throw new Error("Unknown encoding: " + enc);
      return nenc || enc;
    }
    exports2.StringDecoder = StringDecoder;
    function StringDecoder(encoding) {
      this.encoding = normalizeEncoding(encoding);
      var nb;
      switch (this.encoding) {
        case "utf16le":
          this.text = utf16Text;
          this.end = utf16End;
          nb = 4;
          break;
        case "utf8":
          this.fillLast = utf8FillLast;
          nb = 4;
          break;
        case "base64":
          this.text = base64Text;
          this.end = base64End;
          nb = 3;
          break;
        default:
          this.write = simpleWrite;
          this.end = simpleEnd;
          return;
      }
      this.lastNeed = 0;
      this.lastTotal = 0;
      this.lastChar = Buffer2.allocUnsafe(nb);
    }
    StringDecoder.prototype.write = function(buf) {
      if (buf.length === 0) return "";
      var r5;
      var i2;
      if (this.lastNeed) {
        r5 = this.fillLast(buf);
        if (r5 === void 0) return "";
        i2 = this.lastNeed;
        this.lastNeed = 0;
      } else {
        i2 = 0;
      }
      if (i2 < buf.length) return r5 ? r5 + this.text(buf, i2) : this.text(buf, i2);
      return r5 || "";
    };
    StringDecoder.prototype.end = utf8End;
    StringDecoder.prototype.text = utf8Text;
    StringDecoder.prototype.fillLast = function(buf) {
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
      this.lastNeed -= buf.length;
    };
    function utf8CheckByte(byte) {
      if (byte <= 127) return 0;
      else if (byte >> 5 === 6) return 2;
      else if (byte >> 4 === 14) return 3;
      else if (byte >> 3 === 30) return 4;
      return byte >> 6 === 2 ? -1 : -2;
    }
    function utf8CheckIncomplete(self2, buf, i2) {
      var j2 = buf.length - 1;
      if (j2 < i2) return 0;
      var nb = utf8CheckByte(buf[j2]);
      if (nb >= 0) {
        if (nb > 0) self2.lastNeed = nb - 1;
        return nb;
      }
      if (--j2 < i2 || nb === -2) return 0;
      nb = utf8CheckByte(buf[j2]);
      if (nb >= 0) {
        if (nb > 0) self2.lastNeed = nb - 2;
        return nb;
      }
      if (--j2 < i2 || nb === -2) return 0;
      nb = utf8CheckByte(buf[j2]);
      if (nb >= 0) {
        if (nb > 0) {
          if (nb === 2) nb = 0;
          else self2.lastNeed = nb - 3;
        }
        return nb;
      }
      return 0;
    }
    function utf8CheckExtraBytes(self2, buf, p3) {
      if ((buf[0] & 192) !== 128) {
        self2.lastNeed = 0;
        return "\uFFFD";
      }
      if (self2.lastNeed > 1 && buf.length > 1) {
        if ((buf[1] & 192) !== 128) {
          self2.lastNeed = 1;
          return "\uFFFD";
        }
        if (self2.lastNeed > 2 && buf.length > 2) {
          if ((buf[2] & 192) !== 128) {
            self2.lastNeed = 2;
            return "\uFFFD";
          }
        }
      }
    }
    function utf8FillLast(buf) {
      var p3 = this.lastTotal - this.lastNeed;
      var r5 = utf8CheckExtraBytes(this, buf, p3);
      if (r5 !== void 0) return r5;
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, p3, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, p3, 0, buf.length);
      this.lastNeed -= buf.length;
    }
    function utf8Text(buf, i2) {
      var total = utf8CheckIncomplete(this, buf, i2);
      if (!this.lastNeed) return buf.toString("utf8", i2);
      this.lastTotal = total;
      var end = buf.length - (total - this.lastNeed);
      buf.copy(this.lastChar, 0, end);
      return buf.toString("utf8", i2, end);
    }
    function utf8End(buf) {
      var r5 = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) return r5 + "\uFFFD";
      return r5;
    }
    function utf16Text(buf, i2) {
      if ((buf.length - i2) % 2 === 0) {
        var r5 = buf.toString("utf16le", i2);
        if (r5) {
          var c4 = r5.charCodeAt(r5.length - 1);
          if (c4 >= 55296 && c4 <= 56319) {
            this.lastNeed = 2;
            this.lastTotal = 4;
            this.lastChar[0] = buf[buf.length - 2];
            this.lastChar[1] = buf[buf.length - 1];
            return r5.slice(0, -1);
          }
        }
        return r5;
      }
      this.lastNeed = 1;
      this.lastTotal = 2;
      this.lastChar[0] = buf[buf.length - 1];
      return buf.toString("utf16le", i2, buf.length - 1);
    }
    function utf16End(buf) {
      var r5 = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) {
        var end = this.lastTotal - this.lastNeed;
        return r5 + this.lastChar.toString("utf16le", 0, end);
      }
      return r5;
    }
    function base64Text(buf, i2) {
      var n5 = (buf.length - i2) % 3;
      if (n5 === 0) return buf.toString("base64", i2);
      this.lastNeed = 3 - n5;
      this.lastTotal = 3;
      if (n5 === 1) {
        this.lastChar[0] = buf[buf.length - 1];
      } else {
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
      }
      return buf.toString("base64", i2, buf.length - n5);
    }
    function base64End(buf) {
      var r5 = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) return r5 + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
      return r5;
    }
    function simpleWrite(buf) {
      return buf.toString(this.encoding);
    }
    function simpleEnd(buf) {
      return buf && buf.length ? this.write(buf) : "";
    }
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/end-of-stream.js
var require_end_of_stream = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/end-of-stream.js"(exports2, module2) {
    "use strict";
    var ERR_STREAM_PREMATURE_CLOSE = require_errors().codes.ERR_STREAM_PREMATURE_CLOSE;
    function once2(callback) {
      var called = false;
      return function() {
        if (called) return;
        called = true;
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        callback.apply(this, args);
      };
    }
    function noop() {
    }
    function isRequest(stream) {
      return stream.setHeader && typeof stream.abort === "function";
    }
    function eos(stream, opts, callback) {
      if (typeof opts === "function") return eos(stream, null, opts);
      if (!opts) opts = {};
      callback = once2(callback || noop);
      var readable = opts.readable || opts.readable !== false && stream.readable;
      var writable = opts.writable || opts.writable !== false && stream.writable;
      var onlegacyfinish = function onlegacyfinish2() {
        if (!stream.writable) onfinish();
      };
      var writableEnded = stream._writableState && stream._writableState.finished;
      var onfinish = function onfinish2() {
        writable = false;
        writableEnded = true;
        if (!readable) callback.call(stream);
      };
      var readableEnded = stream._readableState && stream._readableState.endEmitted;
      var onend = function onend2() {
        readable = false;
        readableEnded = true;
        if (!writable) callback.call(stream);
      };
      var onerror = function onerror2(err) {
        callback.call(stream, err);
      };
      var onclose = function onclose2() {
        var err;
        if (readable && !readableEnded) {
          if (!stream._readableState || !stream._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
          return callback.call(stream, err);
        }
        if (writable && !writableEnded) {
          if (!stream._writableState || !stream._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
          return callback.call(stream, err);
        }
      };
      var onrequest = function onrequest2() {
        stream.req.on("finish", onfinish);
      };
      if (isRequest(stream)) {
        stream.on("complete", onfinish);
        stream.on("abort", onclose);
        if (stream.req) onrequest();
        else stream.on("request", onrequest);
      } else if (writable && !stream._writableState) {
        stream.on("end", onlegacyfinish);
        stream.on("close", onlegacyfinish);
      }
      stream.on("end", onend);
      stream.on("finish", onfinish);
      if (opts.error !== false) stream.on("error", onerror);
      stream.on("close", onclose);
      return function() {
        stream.removeListener("complete", onfinish);
        stream.removeListener("abort", onclose);
        stream.removeListener("request", onrequest);
        if (stream.req) stream.req.removeListener("finish", onfinish);
        stream.removeListener("end", onlegacyfinish);
        stream.removeListener("close", onlegacyfinish);
        stream.removeListener("finish", onfinish);
        stream.removeListener("end", onend);
        stream.removeListener("error", onerror);
        stream.removeListener("close", onclose);
      };
    }
    module2.exports = eos;
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/async_iterator.js
var require_async_iterator = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/async_iterator.js"(exports2, module2) {
    "use strict";
    var _Object$setPrototypeO;
    function _defineProperty(obj, key, value) {
      key = _toPropertyKey(key);
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    var finished = require_end_of_stream();
    var kLastResolve = Symbol("lastResolve");
    var kLastReject = Symbol("lastReject");
    var kError = Symbol("error");
    var kEnded = Symbol("ended");
    var kLastPromise = Symbol("lastPromise");
    var kHandlePromise = Symbol("handlePromise");
    var kStream = Symbol("stream");
    function createIterResult(value, done) {
      return {
        value,
        done
      };
    }
    function readAndResolve(iter) {
      var resolve = iter[kLastResolve];
      if (resolve !== null) {
        var data = iter[kStream].read();
        if (data !== null) {
          iter[kLastPromise] = null;
          iter[kLastResolve] = null;
          iter[kLastReject] = null;
          resolve(createIterResult(data, false));
        }
      }
    }
    function onReadable(iter) {
      process.nextTick(readAndResolve, iter);
    }
    function wrapForNext(lastPromise, iter) {
      return function(resolve, reject) {
        lastPromise.then(function() {
          if (iter[kEnded]) {
            resolve(createIterResult(void 0, true));
            return;
          }
          iter[kHandlePromise](resolve, reject);
        }, reject);
      };
    }
    var AsyncIteratorPrototype = Object.getPrototypeOf(function() {
    });
    var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
      get stream() {
        return this[kStream];
      },
      next: function next() {
        var _this = this;
        var error = this[kError];
        if (error !== null) {
          return Promise.reject(error);
        }
        if (this[kEnded]) {
          return Promise.resolve(createIterResult(void 0, true));
        }
        if (this[kStream].destroyed) {
          return new Promise(function(resolve, reject) {
            process.nextTick(function() {
              if (_this[kError]) {
                reject(_this[kError]);
              } else {
                resolve(createIterResult(void 0, true));
              }
            });
          });
        }
        var lastPromise = this[kLastPromise];
        var promise;
        if (lastPromise) {
          promise = new Promise(wrapForNext(lastPromise, this));
        } else {
          var data = this[kStream].read();
          if (data !== null) {
            return Promise.resolve(createIterResult(data, false));
          }
          promise = new Promise(this[kHandlePromise]);
        }
        this[kLastPromise] = promise;
        return promise;
      }
    }, _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function() {
      return this;
    }), _defineProperty(_Object$setPrototypeO, "return", function _return() {
      var _this2 = this;
      return new Promise(function(resolve, reject) {
        _this2[kStream].destroy(null, function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(createIterResult(void 0, true));
        });
      });
    }), _Object$setPrototypeO), AsyncIteratorPrototype);
    var createReadableStreamAsyncIterator = function createReadableStreamAsyncIterator2(stream) {
      var _Object$create;
      var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty(_Object$create, kStream, {
        value: stream,
        writable: true
      }), _defineProperty(_Object$create, kLastResolve, {
        value: null,
        writable: true
      }), _defineProperty(_Object$create, kLastReject, {
        value: null,
        writable: true
      }), _defineProperty(_Object$create, kError, {
        value: null,
        writable: true
      }), _defineProperty(_Object$create, kEnded, {
        value: stream._readableState.endEmitted,
        writable: true
      }), _defineProperty(_Object$create, kHandlePromise, {
        value: function value(resolve, reject) {
          var data = iterator[kStream].read();
          if (data) {
            iterator[kLastPromise] = null;
            iterator[kLastResolve] = null;
            iterator[kLastReject] = null;
            resolve(createIterResult(data, false));
          } else {
            iterator[kLastResolve] = resolve;
            iterator[kLastReject] = reject;
          }
        },
        writable: true
      }), _Object$create));
      iterator[kLastPromise] = null;
      finished(stream, function(err) {
        if (err && err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
          var reject = iterator[kLastReject];
          if (reject !== null) {
            iterator[kLastPromise] = null;
            iterator[kLastResolve] = null;
            iterator[kLastReject] = null;
            reject(err);
          }
          iterator[kError] = err;
          return;
        }
        var resolve = iterator[kLastResolve];
        if (resolve !== null) {
          iterator[kLastPromise] = null;
          iterator[kLastResolve] = null;
          iterator[kLastReject] = null;
          resolve(createIterResult(void 0, true));
        }
        iterator[kEnded] = true;
      });
      stream.on("readable", onReadable.bind(null, iterator));
      return iterator;
    };
    module2.exports = createReadableStreamAsyncIterator;
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/from.js
var require_from = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/from.js"(exports2, module2) {
    "use strict";
    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
      try {
        var info = gen[key](arg);
        var value = info.value;
      } catch (error) {
        reject(error);
        return;
      }
      if (info.done) {
        resolve(value);
      } else {
        Promise.resolve(value).then(_next, _throw);
      }
    }
    function _asyncToGenerator(fn) {
      return function() {
        var self2 = this, args = arguments;
        return new Promise(function(resolve, reject) {
          var gen = fn.apply(self2, args);
          function _next(value) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
          }
          function _throw(err) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
          }
          _next(void 0);
        });
      };
    }
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function _objectSpread(target) {
      for (var i2 = 1; i2 < arguments.length; i2++) {
        var source = null != arguments[i2] ? arguments[i2] : {};
        i2 % 2 ? ownKeys(Object(source), true).forEach(function(key) {
          _defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    function _defineProperty(obj, key, value) {
      key = _toPropertyKey(key);
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    var ERR_INVALID_ARG_TYPE = require_errors().codes.ERR_INVALID_ARG_TYPE;
    function from2(Readable, iterable, opts) {
      var iterator;
      if (iterable && typeof iterable.next === "function") {
        iterator = iterable;
      } else if (iterable && iterable[Symbol.asyncIterator]) iterator = iterable[Symbol.asyncIterator]();
      else if (iterable && iterable[Symbol.iterator]) iterator = iterable[Symbol.iterator]();
      else throw new ERR_INVALID_ARG_TYPE("iterable", ["Iterable"], iterable);
      var readable = new Readable(_objectSpread({
        objectMode: true
      }, opts));
      var reading = false;
      readable._read = function() {
        if (!reading) {
          reading = true;
          next();
        }
      };
      function next() {
        return _next2.apply(this, arguments);
      }
      function _next2() {
        _next2 = _asyncToGenerator(function* () {
          try {
            var _yield$iterator$next = yield iterator.next(), value = _yield$iterator$next.value, done = _yield$iterator$next.done;
            if (done) {
              readable.push(null);
            } else if (readable.push(yield value)) {
              next();
            } else {
              reading = false;
            }
          } catch (err) {
            readable.destroy(err);
          }
        });
        return _next2.apply(this, arguments);
      }
      return readable;
    }
    module2.exports = from2;
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_readable.js
var require_stream_readable = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_readable.js"(exports2, module2) {
    "use strict";
    module2.exports = Readable;
    var Duplex;
    Readable.ReadableState = ReadableState;
    var EE = require("events").EventEmitter;
    var EElistenerCount = function EElistenerCount2(emitter, type) {
      return emitter.listeners(type).length;
    };
    var Stream = require_stream();
    var Buffer2 = require("buffer").Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    var debugUtil = require("util");
    var debug;
    if (debugUtil && debugUtil.debuglog) {
      debug = debugUtil.debuglog("stream");
    } else {
      debug = function debug2() {
      };
    }
    var BufferList = require_buffer_list();
    var destroyImpl = require_destroy();
    var _require = require_state();
    var getHighWaterMark = _require.getHighWaterMark;
    var _require$codes = require_errors().codes;
    var ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE;
    var ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF;
    var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
    var ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
    var StringDecoder;
    var createReadableStreamAsyncIterator;
    var from2;
    require_inherits()(Readable, Stream);
    var errorOrDestroy = destroyImpl.errorOrDestroy;
    var kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
    function prependListener(emitter, event, fn) {
      if (typeof emitter.prependListener === "function") return emitter.prependListener(event, fn);
      if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
      else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);
      else emitter._events[event] = [fn, emitter._events[event]];
    }
    function ReadableState(options, stream, isDuplex) {
      Duplex = Duplex || require_stream_duplex();
      options = options || {};
      if (typeof isDuplex !== "boolean") isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
      this.highWaterMark = getHighWaterMark(this, options, "readableHighWaterMark", isDuplex);
      this.buffer = new BufferList();
      this.length = 0;
      this.pipes = null;
      this.pipesCount = 0;
      this.flowing = null;
      this.ended = false;
      this.endEmitted = false;
      this.reading = false;
      this.sync = true;
      this.needReadable = false;
      this.emittedReadable = false;
      this.readableListening = false;
      this.resumeScheduled = false;
      this.paused = true;
      this.emitClose = options.emitClose !== false;
      this.autoDestroy = !!options.autoDestroy;
      this.destroyed = false;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.awaitDrain = 0;
      this.readingMore = false;
      this.decoder = null;
      this.encoding = null;
      if (options.encoding) {
        if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
        this.decoder = new StringDecoder(options.encoding);
        this.encoding = options.encoding;
      }
    }
    function Readable(options) {
      Duplex = Duplex || require_stream_duplex();
      if (!(this instanceof Readable)) return new Readable(options);
      var isDuplex = this instanceof Duplex;
      this._readableState = new ReadableState(options, this, isDuplex);
      this.readable = true;
      if (options) {
        if (typeof options.read === "function") this._read = options.read;
        if (typeof options.destroy === "function") this._destroy = options.destroy;
      }
      Stream.call(this);
    }
    Object.defineProperty(Readable.prototype, "destroyed", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get2() {
        if (this._readableState === void 0) {
          return false;
        }
        return this._readableState.destroyed;
      },
      set: function set(value) {
        if (!this._readableState) {
          return;
        }
        this._readableState.destroyed = value;
      }
    });
    Readable.prototype.destroy = destroyImpl.destroy;
    Readable.prototype._undestroy = destroyImpl.undestroy;
    Readable.prototype._destroy = function(err, cb) {
      cb(err);
    };
    Readable.prototype.push = function(chunk, encoding) {
      var state = this._readableState;
      var skipChunkCheck;
      if (!state.objectMode) {
        if (typeof chunk === "string") {
          encoding = encoding || state.defaultEncoding;
          if (encoding !== state.encoding) {
            chunk = Buffer2.from(chunk, encoding);
            encoding = "";
          }
          skipChunkCheck = true;
        }
      } else {
        skipChunkCheck = true;
      }
      return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
    };
    Readable.prototype.unshift = function(chunk) {
      return readableAddChunk(this, chunk, null, true, false);
    };
    function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
      debug("readableAddChunk", chunk);
      var state = stream._readableState;
      if (chunk === null) {
        state.reading = false;
        onEofChunk(stream, state);
      } else {
        var er;
        if (!skipChunkCheck) er = chunkInvalid(state, chunk);
        if (er) {
          errorOrDestroy(stream, er);
        } else if (state.objectMode || chunk && chunk.length > 0) {
          if (typeof chunk !== "string" && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer2.prototype) {
            chunk = _uint8ArrayToBuffer(chunk);
          }
          if (addToFront) {
            if (state.endEmitted) errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());
            else addChunk(stream, state, chunk, true);
          } else if (state.ended) {
            errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
          } else if (state.destroyed) {
            return false;
          } else {
            state.reading = false;
            if (state.decoder && !encoding) {
              chunk = state.decoder.write(chunk);
              if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);
              else maybeReadMore(stream, state);
            } else {
              addChunk(stream, state, chunk, false);
            }
          }
        } else if (!addToFront) {
          state.reading = false;
          maybeReadMore(stream, state);
        }
      }
      return !state.ended && (state.length < state.highWaterMark || state.length === 0);
    }
    function addChunk(stream, state, chunk, addToFront) {
      if (state.flowing && state.length === 0 && !state.sync) {
        state.awaitDrain = 0;
        stream.emit("data", chunk);
      } else {
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront) state.buffer.unshift(chunk);
        else state.buffer.push(chunk);
        if (state.needReadable) emitReadable(stream);
      }
      maybeReadMore(stream, state);
    }
    function chunkInvalid(state, chunk) {
      var er;
      if (!_isUint8Array(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) {
        er = new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer", "Uint8Array"], chunk);
      }
      return er;
    }
    Readable.prototype.isPaused = function() {
      return this._readableState.flowing === false;
    };
    Readable.prototype.setEncoding = function(enc) {
      if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
      var decoder = new StringDecoder(enc);
      this._readableState.decoder = decoder;
      this._readableState.encoding = this._readableState.decoder.encoding;
      var p3 = this._readableState.buffer.head;
      var content = "";
      while (p3 !== null) {
        content += decoder.write(p3.data);
        p3 = p3.next;
      }
      this._readableState.buffer.clear();
      if (content !== "") this._readableState.buffer.push(content);
      this._readableState.length = content.length;
      return this;
    };
    var MAX_HWM = 1073741824;
    function computeNewHighWaterMark(n5) {
      if (n5 >= MAX_HWM) {
        n5 = MAX_HWM;
      } else {
        n5--;
        n5 |= n5 >>> 1;
        n5 |= n5 >>> 2;
        n5 |= n5 >>> 4;
        n5 |= n5 >>> 8;
        n5 |= n5 >>> 16;
        n5++;
      }
      return n5;
    }
    function howMuchToRead(n5, state) {
      if (n5 <= 0 || state.length === 0 && state.ended) return 0;
      if (state.objectMode) return 1;
      if (n5 !== n5) {
        if (state.flowing && state.length) return state.buffer.head.data.length;
        else return state.length;
      }
      if (n5 > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n5);
      if (n5 <= state.length) return n5;
      if (!state.ended) {
        state.needReadable = true;
        return 0;
      }
      return state.length;
    }
    Readable.prototype.read = function(n5) {
      debug("read", n5);
      n5 = parseInt(n5, 10);
      var state = this._readableState;
      var nOrig = n5;
      if (n5 !== 0) state.emittedReadable = false;
      if (n5 === 0 && state.needReadable && ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)) {
        debug("read: emitReadable", state.length, state.ended);
        if (state.length === 0 && state.ended) endReadable(this);
        else emitReadable(this);
        return null;
      }
      n5 = howMuchToRead(n5, state);
      if (n5 === 0 && state.ended) {
        if (state.length === 0) endReadable(this);
        return null;
      }
      var doRead = state.needReadable;
      debug("need readable", doRead);
      if (state.length === 0 || state.length - n5 < state.highWaterMark) {
        doRead = true;
        debug("length less than watermark", doRead);
      }
      if (state.ended || state.reading) {
        doRead = false;
        debug("reading or ended", doRead);
      } else if (doRead) {
        debug("do read");
        state.reading = true;
        state.sync = true;
        if (state.length === 0) state.needReadable = true;
        this._read(state.highWaterMark);
        state.sync = false;
        if (!state.reading) n5 = howMuchToRead(nOrig, state);
      }
      var ret;
      if (n5 > 0) ret = fromList(n5, state);
      else ret = null;
      if (ret === null) {
        state.needReadable = state.length <= state.highWaterMark;
        n5 = 0;
      } else {
        state.length -= n5;
        state.awaitDrain = 0;
      }
      if (state.length === 0) {
        if (!state.ended) state.needReadable = true;
        if (nOrig !== n5 && state.ended) endReadable(this);
      }
      if (ret !== null) this.emit("data", ret);
      return ret;
    };
    function onEofChunk(stream, state) {
      debug("onEofChunk");
      if (state.ended) return;
      if (state.decoder) {
        var chunk = state.decoder.end();
        if (chunk && chunk.length) {
          state.buffer.push(chunk);
          state.length += state.objectMode ? 1 : chunk.length;
        }
      }
      state.ended = true;
      if (state.sync) {
        emitReadable(stream);
      } else {
        state.needReadable = false;
        if (!state.emittedReadable) {
          state.emittedReadable = true;
          emitReadable_(stream);
        }
      }
    }
    function emitReadable(stream) {
      var state = stream._readableState;
      debug("emitReadable", state.needReadable, state.emittedReadable);
      state.needReadable = false;
      if (!state.emittedReadable) {
        debug("emitReadable", state.flowing);
        state.emittedReadable = true;
        process.nextTick(emitReadable_, stream);
      }
    }
    function emitReadable_(stream) {
      var state = stream._readableState;
      debug("emitReadable_", state.destroyed, state.length, state.ended);
      if (!state.destroyed && (state.length || state.ended)) {
        stream.emit("readable");
        state.emittedReadable = false;
      }
      state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
      flow(stream);
    }
    function maybeReadMore(stream, state) {
      if (!state.readingMore) {
        state.readingMore = true;
        process.nextTick(maybeReadMore_, stream, state);
      }
    }
    function maybeReadMore_(stream, state) {
      while (!state.reading && !state.ended && (state.length < state.highWaterMark || state.flowing && state.length === 0)) {
        var len = state.length;
        debug("maybeReadMore read 0");
        stream.read(0);
        if (len === state.length)
          break;
      }
      state.readingMore = false;
    }
    Readable.prototype._read = function(n5) {
      errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED("_read()"));
    };
    Readable.prototype.pipe = function(dest, pipeOpts) {
      var src = this;
      var state = this._readableState;
      switch (state.pipesCount) {
        case 0:
          state.pipes = dest;
          break;
        case 1:
          state.pipes = [state.pipes, dest];
          break;
        default:
          state.pipes.push(dest);
          break;
      }
      state.pipesCount += 1;
      debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
      var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
      var endFn = doEnd ? onend : unpipe;
      if (state.endEmitted) process.nextTick(endFn);
      else src.once("end", endFn);
      dest.on("unpipe", onunpipe);
      function onunpipe(readable, unpipeInfo) {
        debug("onunpipe");
        if (readable === src) {
          if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
            unpipeInfo.hasUnpiped = true;
            cleanup();
          }
        }
      }
      function onend() {
        debug("onend");
        dest.end();
      }
      var ondrain = pipeOnDrain(src);
      dest.on("drain", ondrain);
      var cleanedUp = false;
      function cleanup() {
        debug("cleanup");
        dest.removeListener("close", onclose);
        dest.removeListener("finish", onfinish);
        dest.removeListener("drain", ondrain);
        dest.removeListener("error", onerror);
        dest.removeListener("unpipe", onunpipe);
        src.removeListener("end", onend);
        src.removeListener("end", unpipe);
        src.removeListener("data", ondata);
        cleanedUp = true;
        if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
      }
      src.on("data", ondata);
      function ondata(chunk) {
        debug("ondata");
        var ret = dest.write(chunk);
        debug("dest.write", ret);
        if (ret === false) {
          if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
            debug("false write response, pause", state.awaitDrain);
            state.awaitDrain++;
          }
          src.pause();
        }
      }
      function onerror(er) {
        debug("onerror", er);
        unpipe();
        dest.removeListener("error", onerror);
        if (EElistenerCount(dest, "error") === 0) errorOrDestroy(dest, er);
      }
      prependListener(dest, "error", onerror);
      function onclose() {
        dest.removeListener("finish", onfinish);
        unpipe();
      }
      dest.once("close", onclose);
      function onfinish() {
        debug("onfinish");
        dest.removeListener("close", onclose);
        unpipe();
      }
      dest.once("finish", onfinish);
      function unpipe() {
        debug("unpipe");
        src.unpipe(dest);
      }
      dest.emit("pipe", src);
      if (!state.flowing) {
        debug("pipe resume");
        src.resume();
      }
      return dest;
    };
    function pipeOnDrain(src) {
      return function pipeOnDrainFunctionResult() {
        var state = src._readableState;
        debug("pipeOnDrain", state.awaitDrain);
        if (state.awaitDrain) state.awaitDrain--;
        if (state.awaitDrain === 0 && EElistenerCount(src, "data")) {
          state.flowing = true;
          flow(src);
        }
      };
    }
    Readable.prototype.unpipe = function(dest) {
      var state = this._readableState;
      var unpipeInfo = {
        hasUnpiped: false
      };
      if (state.pipesCount === 0) return this;
      if (state.pipesCount === 1) {
        if (dest && dest !== state.pipes) return this;
        if (!dest) dest = state.pipes;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        if (dest) dest.emit("unpipe", this, unpipeInfo);
        return this;
      }
      if (!dest) {
        var dests = state.pipes;
        var len = state.pipesCount;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        for (var i2 = 0; i2 < len; i2++) dests[i2].emit("unpipe", this, {
          hasUnpiped: false
        });
        return this;
      }
      var index = indexOf(state.pipes, dest);
      if (index === -1) return this;
      state.pipes.splice(index, 1);
      state.pipesCount -= 1;
      if (state.pipesCount === 1) state.pipes = state.pipes[0];
      dest.emit("unpipe", this, unpipeInfo);
      return this;
    };
    Readable.prototype.on = function(ev, fn) {
      var res = Stream.prototype.on.call(this, ev, fn);
      var state = this._readableState;
      if (ev === "data") {
        state.readableListening = this.listenerCount("readable") > 0;
        if (state.flowing !== false) this.resume();
      } else if (ev === "readable") {
        if (!state.endEmitted && !state.readableListening) {
          state.readableListening = state.needReadable = true;
          state.flowing = false;
          state.emittedReadable = false;
          debug("on readable", state.length, state.reading);
          if (state.length) {
            emitReadable(this);
          } else if (!state.reading) {
            process.nextTick(nReadingNextTick, this);
          }
        }
      }
      return res;
    };
    Readable.prototype.addListener = Readable.prototype.on;
    Readable.prototype.removeListener = function(ev, fn) {
      var res = Stream.prototype.removeListener.call(this, ev, fn);
      if (ev === "readable") {
        process.nextTick(updateReadableListening, this);
      }
      return res;
    };
    Readable.prototype.removeAllListeners = function(ev) {
      var res = Stream.prototype.removeAllListeners.apply(this, arguments);
      if (ev === "readable" || ev === void 0) {
        process.nextTick(updateReadableListening, this);
      }
      return res;
    };
    function updateReadableListening(self2) {
      var state = self2._readableState;
      state.readableListening = self2.listenerCount("readable") > 0;
      if (state.resumeScheduled && !state.paused) {
        state.flowing = true;
      } else if (self2.listenerCount("data") > 0) {
        self2.resume();
      }
    }
    function nReadingNextTick(self2) {
      debug("readable nexttick read 0");
      self2.read(0);
    }
    Readable.prototype.resume = function() {
      var state = this._readableState;
      if (!state.flowing) {
        debug("resume");
        state.flowing = !state.readableListening;
        resume(this, state);
      }
      state.paused = false;
      return this;
    };
    function resume(stream, state) {
      if (!state.resumeScheduled) {
        state.resumeScheduled = true;
        process.nextTick(resume_, stream, state);
      }
    }
    function resume_(stream, state) {
      debug("resume", state.reading);
      if (!state.reading) {
        stream.read(0);
      }
      state.resumeScheduled = false;
      stream.emit("resume");
      flow(stream);
      if (state.flowing && !state.reading) stream.read(0);
    }
    Readable.prototype.pause = function() {
      debug("call pause flowing=%j", this._readableState.flowing);
      if (this._readableState.flowing !== false) {
        debug("pause");
        this._readableState.flowing = false;
        this.emit("pause");
      }
      this._readableState.paused = true;
      return this;
    };
    function flow(stream) {
      var state = stream._readableState;
      debug("flow", state.flowing);
      while (state.flowing && stream.read() !== null) ;
    }
    Readable.prototype.wrap = function(stream) {
      var _this = this;
      var state = this._readableState;
      var paused = false;
      stream.on("end", function() {
        debug("wrapped end");
        if (state.decoder && !state.ended) {
          var chunk = state.decoder.end();
          if (chunk && chunk.length) _this.push(chunk);
        }
        _this.push(null);
      });
      stream.on("data", function(chunk) {
        debug("wrapped data");
        if (state.decoder) chunk = state.decoder.write(chunk);
        if (state.objectMode && (chunk === null || chunk === void 0)) return;
        else if (!state.objectMode && (!chunk || !chunk.length)) return;
        var ret = _this.push(chunk);
        if (!ret) {
          paused = true;
          stream.pause();
        }
      });
      for (var i2 in stream) {
        if (this[i2] === void 0 && typeof stream[i2] === "function") {
          this[i2] = /* @__PURE__ */ (function methodWrap(method) {
            return function methodWrapReturnFunction() {
              return stream[method].apply(stream, arguments);
            };
          })(i2);
        }
      }
      for (var n5 = 0; n5 < kProxyEvents.length; n5++) {
        stream.on(kProxyEvents[n5], this.emit.bind(this, kProxyEvents[n5]));
      }
      this._read = function(n6) {
        debug("wrapped _read", n6);
        if (paused) {
          paused = false;
          stream.resume();
        }
      };
      return this;
    };
    if (typeof Symbol === "function") {
      Readable.prototype[Symbol.asyncIterator] = function() {
        if (createReadableStreamAsyncIterator === void 0) {
          createReadableStreamAsyncIterator = require_async_iterator();
        }
        return createReadableStreamAsyncIterator(this);
      };
    }
    Object.defineProperty(Readable.prototype, "readableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get2() {
        return this._readableState.highWaterMark;
      }
    });
    Object.defineProperty(Readable.prototype, "readableBuffer", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get2() {
        return this._readableState && this._readableState.buffer;
      }
    });
    Object.defineProperty(Readable.prototype, "readableFlowing", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get2() {
        return this._readableState.flowing;
      },
      set: function set(state) {
        if (this._readableState) {
          this._readableState.flowing = state;
        }
      }
    });
    Readable._fromList = fromList;
    Object.defineProperty(Readable.prototype, "readableLength", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get2() {
        return this._readableState.length;
      }
    });
    function fromList(n5, state) {
      if (state.length === 0) return null;
      var ret;
      if (state.objectMode) ret = state.buffer.shift();
      else if (!n5 || n5 >= state.length) {
        if (state.decoder) ret = state.buffer.join("");
        else if (state.buffer.length === 1) ret = state.buffer.first();
        else ret = state.buffer.concat(state.length);
        state.buffer.clear();
      } else {
        ret = state.buffer.consume(n5, state.decoder);
      }
      return ret;
    }
    function endReadable(stream) {
      var state = stream._readableState;
      debug("endReadable", state.endEmitted);
      if (!state.endEmitted) {
        state.ended = true;
        process.nextTick(endReadableNT, state, stream);
      }
    }
    function endReadableNT(state, stream) {
      debug("endReadableNT", state.endEmitted, state.length);
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit("end");
        if (state.autoDestroy) {
          var wState = stream._writableState;
          if (!wState || wState.autoDestroy && wState.finished) {
            stream.destroy();
          }
        }
      }
    }
    if (typeof Symbol === "function") {
      Readable.from = function(iterable, opts) {
        if (from2 === void 0) {
          from2 = require_from();
        }
        return from2(Readable, iterable, opts);
      };
    }
    function indexOf(xs, x3) {
      for (var i2 = 0, l3 = xs.length; i2 < l3; i2++) {
        if (xs[i2] === x3) return i2;
      }
      return -1;
    }
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_transform.js
var require_stream_transform = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_transform.js"(exports2, module2) {
    "use strict";
    module2.exports = Transform;
    var _require$codes = require_errors().codes;
    var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
    var ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK;
    var ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING;
    var ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0;
    var Duplex = require_stream_duplex();
    require_inherits()(Transform, Duplex);
    function afterTransform(er, data) {
      var ts = this._transformState;
      ts.transforming = false;
      var cb = ts.writecb;
      if (cb === null) {
        return this.emit("error", new ERR_MULTIPLE_CALLBACK());
      }
      ts.writechunk = null;
      ts.writecb = null;
      if (data != null)
        this.push(data);
      cb(er);
      var rs = this._readableState;
      rs.reading = false;
      if (rs.needReadable || rs.length < rs.highWaterMark) {
        this._read(rs.highWaterMark);
      }
    }
    function Transform(options) {
      if (!(this instanceof Transform)) return new Transform(options);
      Duplex.call(this, options);
      this._transformState = {
        afterTransform: afterTransform.bind(this),
        needTransform: false,
        transforming: false,
        writecb: null,
        writechunk: null,
        writeencoding: null
      };
      this._readableState.needReadable = true;
      this._readableState.sync = false;
      if (options) {
        if (typeof options.transform === "function") this._transform = options.transform;
        if (typeof options.flush === "function") this._flush = options.flush;
      }
      this.on("prefinish", prefinish);
    }
    function prefinish() {
      var _this = this;
      if (typeof this._flush === "function" && !this._readableState.destroyed) {
        this._flush(function(er, data) {
          done(_this, er, data);
        });
      } else {
        done(this, null, null);
      }
    }
    Transform.prototype.push = function(chunk, encoding) {
      this._transformState.needTransform = false;
      return Duplex.prototype.push.call(this, chunk, encoding);
    };
    Transform.prototype._transform = function(chunk, encoding, cb) {
      cb(new ERR_METHOD_NOT_IMPLEMENTED("_transform()"));
    };
    Transform.prototype._write = function(chunk, encoding, cb) {
      var ts = this._transformState;
      ts.writecb = cb;
      ts.writechunk = chunk;
      ts.writeencoding = encoding;
      if (!ts.transforming) {
        var rs = this._readableState;
        if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
      }
    };
    Transform.prototype._read = function(n5) {
      var ts = this._transformState;
      if (ts.writechunk !== null && !ts.transforming) {
        ts.transforming = true;
        this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
      } else {
        ts.needTransform = true;
      }
    };
    Transform.prototype._destroy = function(err, cb) {
      Duplex.prototype._destroy.call(this, err, function(err2) {
        cb(err2);
      });
    };
    function done(stream, er, data) {
      if (er) return stream.emit("error", er);
      if (data != null)
        stream.push(data);
      if (stream._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0();
      if (stream._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
      return stream.push(null);
    }
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_passthrough.js
var require_stream_passthrough = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/_stream_passthrough.js"(exports2, module2) {
    "use strict";
    module2.exports = PassThrough;
    var Transform = require_stream_transform();
    require_inherits()(PassThrough, Transform);
    function PassThrough(options) {
      if (!(this instanceof PassThrough)) return new PassThrough(options);
      Transform.call(this, options);
    }
    PassThrough.prototype._transform = function(chunk, encoding, cb) {
      cb(null, chunk);
    };
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/pipeline.js
var require_pipeline = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/lib/internal/streams/pipeline.js"(exports2, module2) {
    "use strict";
    var eos;
    function once2(callback) {
      var called = false;
      return function() {
        if (called) return;
        called = true;
        callback.apply(void 0, arguments);
      };
    }
    var _require$codes = require_errors().codes;
    var ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS;
    var ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
    function noop(err) {
      if (err) throw err;
    }
    function isRequest(stream) {
      return stream.setHeader && typeof stream.abort === "function";
    }
    function destroyer(stream, reading, writing, callback) {
      callback = once2(callback);
      var closed = false;
      stream.on("close", function() {
        closed = true;
      });
      if (eos === void 0) eos = require_end_of_stream();
      eos(stream, {
        readable: reading,
        writable: writing
      }, function(err) {
        if (err) return callback(err);
        closed = true;
        callback();
      });
      var destroyed = false;
      return function(err) {
        if (closed) return;
        if (destroyed) return;
        destroyed = true;
        if (isRequest(stream)) return stream.abort();
        if (typeof stream.destroy === "function") return stream.destroy();
        callback(err || new ERR_STREAM_DESTROYED("pipe"));
      };
    }
    function call(fn) {
      fn();
    }
    function pipe(from2, to) {
      return from2.pipe(to);
    }
    function popCallback(streams) {
      if (!streams.length) return noop;
      if (typeof streams[streams.length - 1] !== "function") return noop;
      return streams.pop();
    }
    function pipeline() {
      for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
        streams[_key] = arguments[_key];
      }
      var callback = popCallback(streams);
      if (Array.isArray(streams[0])) streams = streams[0];
      if (streams.length < 2) {
        throw new ERR_MISSING_ARGS("streams");
      }
      var error;
      var destroys = streams.map(function(stream, i2) {
        var reading = i2 < streams.length - 1;
        var writing = i2 > 0;
        return destroyer(stream, reading, writing, function(err) {
          if (!error) error = err;
          if (err) destroys.forEach(call);
          if (reading) return;
          destroys.forEach(call);
          callback(error);
        });
      });
      return streams.reduce(pipe);
    }
    module2.exports = pipeline;
  }
});

// ../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/readable.js
var require_readable = __commonJS({
  "../node_modules/.pnpm/readable-stream@3.6.2/node_modules/readable-stream/readable.js"(exports2, module2) {
    var Stream = require("stream");
    if (process.env.READABLE_STREAM === "disable" && Stream) {
      module2.exports = Stream.Readable;
      Object.assign(module2.exports, Stream);
      module2.exports.Stream = Stream;
    } else {
      exports2 = module2.exports = require_stream_readable();
      exports2.Stream = Stream || exports2;
      exports2.Readable = exports2;
      exports2.Writable = require_stream_writable();
      exports2.Duplex = require_stream_duplex();
      exports2.Transform = require_stream_transform();
      exports2.PassThrough = require_stream_passthrough();
      exports2.finished = require_end_of_stream();
      exports2.pipeline = require_pipeline();
    }
  }
});

// ../node_modules/.pnpm/through2@4.0.2/node_modules/through2/through2.js
var require_through2 = __commonJS({
  "../node_modules/.pnpm/through2@4.0.2/node_modules/through2/through2.js"(exports2, module2) {
    var { Transform } = require_readable();
    function inherits(fn, sup) {
      fn.super_ = sup;
      fn.prototype = Object.create(sup.prototype, {
        constructor: { value: fn, enumerable: false, writable: true, configurable: true }
      });
    }
    function through2(construct) {
      return (options, transform, flush) => {
        if (typeof options === "function") {
          flush = transform;
          transform = options;
          options = {};
        }
        if (typeof transform !== "function") {
          transform = (chunk, enc, cb) => cb(null, chunk);
        }
        if (typeof flush !== "function") {
          flush = null;
        }
        return construct(options, transform, flush);
      };
    }
    var make = through2((options, transform, flush) => {
      const t22 = new Transform(options);
      t22._transform = transform;
      if (flush) {
        t22._flush = flush;
      }
      return t22;
    });
    var ctor = through2((options, transform, flush) => {
      function Through2(override) {
        if (!(this instanceof Through2)) {
          return new Through2(override);
        }
        this.options = Object.assign({}, options, override);
        Transform.call(this, this.options);
        this._transform = transform;
        if (flush) {
          this._flush = flush;
        }
      }
      inherits(Through2, Transform);
      return Through2;
    });
    var obj = through2(function(options, transform, flush) {
      const t22 = new Transform(Object.assign({ objectMode: true, highWaterMark: 16 }, options));
      t22._transform = transform;
      if (flush) {
        t22._flush = flush;
      }
      return t22;
    });
    module2.exports = make;
    module2.exports.ctor = ctor;
    module2.exports.obj = obj;
  }
});

// ../node_modules/.pnpm/tunnel-agent@0.6.0/node_modules/tunnel-agent/index.js
var require_tunnel_agent = __commonJS({
  "../node_modules/.pnpm/tunnel-agent@0.6.0/node_modules/tunnel-agent/index.js"(exports2) {
    "use strict";
    var net = require("net");
    var tls = require("tls");
    var http = require("http");
    var https = require("https");
    var events = require("events");
    var assert = require("assert");
    var util = require("util");
    var Buffer2 = require_safe_buffer().Buffer;
    exports2.httpOverHttp = httpOverHttp;
    exports2.httpsOverHttp = httpsOverHttp;
    exports2.httpOverHttps = httpOverHttps;
    exports2.httpsOverHttps = httpsOverHttps;
    function httpOverHttp(options) {
      var agent = new TunnelingAgent(options);
      agent.request = http.request;
      return agent;
    }
    function httpsOverHttp(options) {
      var agent = new TunnelingAgent(options);
      agent.request = http.request;
      agent.createSocket = createSecureSocket;
      agent.defaultPort = 443;
      return agent;
    }
    function httpOverHttps(options) {
      var agent = new TunnelingAgent(options);
      agent.request = https.request;
      return agent;
    }
    function httpsOverHttps(options) {
      var agent = new TunnelingAgent(options);
      agent.request = https.request;
      agent.createSocket = createSecureSocket;
      agent.defaultPort = 443;
      return agent;
    }
    function TunnelingAgent(options) {
      var self2 = this;
      self2.options = options || {};
      self2.proxyOptions = self2.options.proxy || {};
      self2.maxSockets = self2.options.maxSockets || http.Agent.defaultMaxSockets;
      self2.requests = [];
      self2.sockets = [];
      self2.on("free", function onFree(socket, host, port) {
        for (var i2 = 0, len = self2.requests.length; i2 < len; ++i2) {
          var pending = self2.requests[i2];
          if (pending.host === host && pending.port === port) {
            self2.requests.splice(i2, 1);
            pending.request.onSocket(socket);
            return;
          }
        }
        socket.destroy();
        self2.removeSocket(socket);
      });
    }
    util.inherits(TunnelingAgent, events.EventEmitter);
    TunnelingAgent.prototype.addRequest = function addRequest(req, options) {
      var self2 = this;
      if (typeof options === "string") {
        options = {
          host: options,
          port: arguments[2],
          path: arguments[3]
        };
      }
      if (self2.sockets.length >= this.maxSockets) {
        self2.requests.push({ host: options.host, port: options.port, request: req });
        return;
      }
      self2.createConnection({ host: options.host, port: options.port, request: req });
    };
    TunnelingAgent.prototype.createConnection = function createConnection(pending) {
      var self2 = this;
      self2.createSocket(pending, function(socket) {
        socket.on("free", onFree);
        socket.on("close", onCloseOrRemove);
        socket.on("agentRemove", onCloseOrRemove);
        pending.request.onSocket(socket);
        function onFree() {
          self2.emit("free", socket, pending.host, pending.port);
        }
        function onCloseOrRemove(err) {
          self2.removeSocket(socket);
          socket.removeListener("free", onFree);
          socket.removeListener("close", onCloseOrRemove);
          socket.removeListener("agentRemove", onCloseOrRemove);
        }
      });
    };
    TunnelingAgent.prototype.createSocket = function createSocket(options, cb) {
      var self2 = this;
      var placeholder = {};
      self2.sockets.push(placeholder);
      var connectOptions = mergeOptions(
        {},
        self2.proxyOptions,
        {
          method: "CONNECT",
          path: options.host + ":" + options.port,
          agent: false
        }
      );
      if (connectOptions.proxyAuth) {
        connectOptions.headers = connectOptions.headers || {};
        connectOptions.headers["Proxy-Authorization"] = "Basic " + Buffer2.from(connectOptions.proxyAuth).toString("base64");
      }
      debug("making CONNECT request");
      var connectReq = self2.request(connectOptions);
      connectReq.useChunkedEncodingByDefault = false;
      connectReq.once("response", onResponse);
      connectReq.once("upgrade", onUpgrade);
      connectReq.once("connect", onConnect);
      connectReq.once("error", onError);
      connectReq.end();
      function onResponse(res) {
        res.upgrade = true;
      }
      function onUpgrade(res, socket, head) {
        process.nextTick(function() {
          onConnect(res, socket, head);
        });
      }
      function onConnect(res, socket, head) {
        connectReq.removeAllListeners();
        socket.removeAllListeners();
        if (res.statusCode === 200) {
          assert.equal(head.length, 0);
          debug("tunneling connection has established");
          self2.sockets[self2.sockets.indexOf(placeholder)] = socket;
          cb(socket);
        } else {
          debug("tunneling socket could not be established, statusCode=%d", res.statusCode);
          var error = new Error("tunneling socket could not be established, statusCode=" + res.statusCode);
          error.code = "ECONNRESET";
          options.request.emit("error", error);
          self2.removeSocket(placeholder);
        }
      }
      function onError(cause) {
        connectReq.removeAllListeners();
        debug("tunneling socket could not be established, cause=%s\n", cause.message, cause.stack);
        var error = new Error("tunneling socket could not be established, cause=" + cause.message);
        error.code = "ECONNRESET";
        options.request.emit("error", error);
        self2.removeSocket(placeholder);
      }
    };
    TunnelingAgent.prototype.removeSocket = function removeSocket(socket) {
      var pos = this.sockets.indexOf(socket);
      if (pos === -1) return;
      this.sockets.splice(pos, 1);
      var pending = this.requests.shift();
      if (pending) {
        this.createConnection(pending);
      }
    };
    function createSecureSocket(options, cb) {
      var self2 = this;
      TunnelingAgent.prototype.createSocket.call(self2, options, function(socket) {
        var secureSocket = tls.connect(0, mergeOptions(
          {},
          self2.options,
          {
            servername: options.host,
            socket
          }
        ));
        self2.sockets[self2.sockets.indexOf(socket)] = secureSocket;
        cb(secureSocket);
      });
    }
    function mergeOptions(target) {
      for (var i2 = 1, len = arguments.length; i2 < len; ++i2) {
        var overrides = arguments[i2];
        if (typeof overrides === "object") {
          var keys = Object.keys(overrides);
          for (var j2 = 0, keyLen = keys.length; j2 < keyLen; ++j2) {
            var k2 = keys[j2];
            if (overrides[k2] !== void 0) {
              target[k2] = overrides[k2];
            }
          }
        }
      }
      return target;
    }
    var debug;
    if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) {
      debug = function() {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[0] === "string") {
          args[0] = "TUNNEL: " + args[0];
        } else {
          args.unshift("TUNNEL:");
        }
        console.error.apply(console, args);
      };
    } else {
      debug = function() {
      };
    }
    exports2.debug = debug;
  }
});

// ../node_modules/.pnpm/is-retry-allowed@2.2.0/node_modules/is-retry-allowed/index.js
var require_is_retry_allowed = __commonJS({
  "../node_modules/.pnpm/is-retry-allowed@2.2.0/node_modules/is-retry-allowed/index.js"(exports2, module2) {
    "use strict";
    var denyList = /* @__PURE__ */ new Set([
      "ENOTFOUND",
      "ENETUNREACH",
      // SSL errors from https://github.com/nodejs/node/blob/fc8e3e2cdc521978351de257030db0076d79e0ab/src/crypto/crypto_common.cc#L301-L328
      "UNABLE_TO_GET_ISSUER_CERT",
      "UNABLE_TO_GET_CRL",
      "UNABLE_TO_DECRYPT_CERT_SIGNATURE",
      "UNABLE_TO_DECRYPT_CRL_SIGNATURE",
      "UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY",
      "CERT_SIGNATURE_FAILURE",
      "CRL_SIGNATURE_FAILURE",
      "CERT_NOT_YET_VALID",
      "CERT_HAS_EXPIRED",
      "CRL_NOT_YET_VALID",
      "CRL_HAS_EXPIRED",
      "ERROR_IN_CERT_NOT_BEFORE_FIELD",
      "ERROR_IN_CERT_NOT_AFTER_FIELD",
      "ERROR_IN_CRL_LAST_UPDATE_FIELD",
      "ERROR_IN_CRL_NEXT_UPDATE_FIELD",
      "OUT_OF_MEM",
      "DEPTH_ZERO_SELF_SIGNED_CERT",
      "SELF_SIGNED_CERT_IN_CHAIN",
      "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
      "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
      "CERT_CHAIN_TOO_LONG",
      "CERT_REVOKED",
      "INVALID_CA",
      "PATH_LENGTH_EXCEEDED",
      "INVALID_PURPOSE",
      "CERT_UNTRUSTED",
      "CERT_REJECTED",
      "HOSTNAME_MISMATCH"
    ]);
    module2.exports = (error) => !denyList.has(error && error.code);
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isFunction.js
var require_isFunction = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isFunction.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isFunction = void 0;
    function isFunction(value) {
      return typeof value === "function";
    }
    exports2.isFunction = isFunction;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/createErrorClass.js
var require_createErrorClass = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/createErrorClass.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createErrorClass = void 0;
    function createErrorClass(createImpl) {
      var _super = function(instance) {
        Error.call(instance);
        instance.stack = new Error().stack;
      };
      var ctorFunc = createImpl(_super);
      ctorFunc.prototype = Object.create(Error.prototype);
      ctorFunc.prototype.constructor = ctorFunc;
      return ctorFunc;
    }
    exports2.createErrorClass = createErrorClass;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/UnsubscriptionError.js
var require_UnsubscriptionError = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/UnsubscriptionError.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.UnsubscriptionError = void 0;
    var createErrorClass_1 = require_createErrorClass();
    exports2.UnsubscriptionError = createErrorClass_1.createErrorClass(function(_super) {
      return function UnsubscriptionErrorImpl(errors) {
        _super(this);
        this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function(err, i2) {
          return i2 + 1 + ") " + err.toString();
        }).join("\n  ") : "";
        this.name = "UnsubscriptionError";
        this.errors = errors;
      };
    });
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/arrRemove.js
var require_arrRemove = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/arrRemove.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.arrRemove = void 0;
    function arrRemove(arr, item) {
      if (arr) {
        var index = arr.indexOf(item);
        0 <= index && arr.splice(index, 1);
      }
    }
    exports2.arrRemove = arrRemove;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/Subscription.js
var require_Subscription = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/Subscription.js"(exports2) {
    "use strict";
    var __values = exports2 && exports2.__values || function(o5) {
      var s4 = typeof Symbol === "function" && Symbol.iterator, m2 = s4 && o5[s4], i2 = 0;
      if (m2) return m2.call(o5);
      if (o5 && typeof o5.length === "number") return {
        next: function() {
          if (o5 && i2 >= o5.length) o5 = void 0;
          return { value: o5 && o5[i2++], done: !o5 };
        }
      };
      throw new TypeError(s4 ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isSubscription = exports2.EMPTY_SUBSCRIPTION = exports2.Subscription = void 0;
    var isFunction_1 = require_isFunction();
    var UnsubscriptionError_1 = require_UnsubscriptionError();
    var arrRemove_1 = require_arrRemove();
    var Subscription = (function() {
      function Subscription2(initialTeardown) {
        this.initialTeardown = initialTeardown;
        this.closed = false;
        this._parentage = null;
        this._finalizers = null;
      }
      Subscription2.prototype.unsubscribe = function() {
        var e_1, _a, e_2, _b;
        var errors;
        if (!this.closed) {
          this.closed = true;
          var _parentage = this._parentage;
          if (_parentage) {
            this._parentage = null;
            if (Array.isArray(_parentage)) {
              try {
                for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                  var parent_1 = _parentage_1_1.value;
                  parent_1.remove(this);
                }
              } catch (e_1_1) {
                e_1 = { error: e_1_1 };
              } finally {
                try {
                  if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
                } finally {
                  if (e_1) throw e_1.error;
                }
              }
            } else {
              _parentage.remove(this);
            }
          }
          var initialFinalizer = this.initialTeardown;
          if (isFunction_1.isFunction(initialFinalizer)) {
            try {
              initialFinalizer();
            } catch (e5) {
              errors = e5 instanceof UnsubscriptionError_1.UnsubscriptionError ? e5.errors : [e5];
            }
          }
          var _finalizers = this._finalizers;
          if (_finalizers) {
            this._finalizers = null;
            try {
              for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
                var finalizer = _finalizers_1_1.value;
                try {
                  execFinalizer(finalizer);
                } catch (err) {
                  errors = errors !== null && errors !== void 0 ? errors : [];
                  if (err instanceof UnsubscriptionError_1.UnsubscriptionError) {
                    errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
                  } else {
                    errors.push(err);
                  }
                }
              }
            } catch (e_2_1) {
              e_2 = { error: e_2_1 };
            } finally {
              try {
                if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
              } finally {
                if (e_2) throw e_2.error;
              }
            }
          }
          if (errors) {
            throw new UnsubscriptionError_1.UnsubscriptionError(errors);
          }
        }
      };
      Subscription2.prototype.add = function(teardown) {
        var _a;
        if (teardown && teardown !== this) {
          if (this.closed) {
            execFinalizer(teardown);
          } else {
            if (teardown instanceof Subscription2) {
              if (teardown.closed || teardown._hasParent(this)) {
                return;
              }
              teardown._addParent(this);
            }
            (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
          }
        }
      };
      Subscription2.prototype._hasParent = function(parent) {
        var _parentage = this._parentage;
        return _parentage === parent || Array.isArray(_parentage) && _parentage.includes(parent);
      };
      Subscription2.prototype._addParent = function(parent) {
        var _parentage = this._parentage;
        this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
      };
      Subscription2.prototype._removeParent = function(parent) {
        var _parentage = this._parentage;
        if (_parentage === parent) {
          this._parentage = null;
        } else if (Array.isArray(_parentage)) {
          arrRemove_1.arrRemove(_parentage, parent);
        }
      };
      Subscription2.prototype.remove = function(teardown) {
        var _finalizers = this._finalizers;
        _finalizers && arrRemove_1.arrRemove(_finalizers, teardown);
        if (teardown instanceof Subscription2) {
          teardown._removeParent(this);
        }
      };
      Subscription2.EMPTY = (function() {
        var empty = new Subscription2();
        empty.closed = true;
        return empty;
      })();
      return Subscription2;
    })();
    exports2.Subscription = Subscription;
    exports2.EMPTY_SUBSCRIPTION = Subscription.EMPTY;
    function isSubscription(value) {
      return value instanceof Subscription || value && "closed" in value && isFunction_1.isFunction(value.remove) && isFunction_1.isFunction(value.add) && isFunction_1.isFunction(value.unsubscribe);
    }
    exports2.isSubscription = isSubscription;
    function execFinalizer(finalizer) {
      if (isFunction_1.isFunction(finalizer)) {
        finalizer();
      } else {
        finalizer.unsubscribe();
      }
    }
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/config.js
var require_config = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/config.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.config = void 0;
    exports2.config = {
      onUnhandledError: null,
      onStoppedNotification: null,
      Promise: void 0,
      useDeprecatedSynchronousErrorHandling: false,
      useDeprecatedNextContext: false
    };
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/timeoutProvider.js
var require_timeoutProvider = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/timeoutProvider.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.timeoutProvider = void 0;
    exports2.timeoutProvider = {
      setTimeout: function(handler, timeout) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
          args[_i - 2] = arguments[_i];
        }
        var delegate = exports2.timeoutProvider.delegate;
        if (delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) {
          return delegate.setTimeout.apply(delegate, __spreadArray([handler, timeout], __read(args)));
        }
        return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
      },
      clearTimeout: function(handle) {
        var delegate = exports2.timeoutProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearTimeout) || clearTimeout)(handle);
      },
      delegate: void 0
    };
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/reportUnhandledError.js
var require_reportUnhandledError = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/reportUnhandledError.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.reportUnhandledError = void 0;
    var config_1 = require_config();
    var timeoutProvider_1 = require_timeoutProvider();
    function reportUnhandledError(err) {
      timeoutProvider_1.timeoutProvider.setTimeout(function() {
        var onUnhandledError = config_1.config.onUnhandledError;
        if (onUnhandledError) {
          onUnhandledError(err);
        } else {
          throw err;
        }
      });
    }
    exports2.reportUnhandledError = reportUnhandledError;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/noop.js
var require_noop = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/noop.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.noop = void 0;
    function noop() {
    }
    exports2.noop = noop;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/NotificationFactories.js
var require_NotificationFactories = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/NotificationFactories.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createNotification = exports2.nextNotification = exports2.errorNotification = exports2.COMPLETE_NOTIFICATION = void 0;
    exports2.COMPLETE_NOTIFICATION = (function() {
      return createNotification("C", void 0, void 0);
    })();
    function errorNotification(error) {
      return createNotification("E", void 0, error);
    }
    exports2.errorNotification = errorNotification;
    function nextNotification(value) {
      return createNotification("N", value, void 0);
    }
    exports2.nextNotification = nextNotification;
    function createNotification(kind, value, error) {
      return {
        kind,
        value,
        error
      };
    }
    exports2.createNotification = createNotification;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/errorContext.js
var require_errorContext = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/errorContext.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.captureError = exports2.errorContext = void 0;
    var config_1 = require_config();
    var context = null;
    function errorContext(cb) {
      if (config_1.config.useDeprecatedSynchronousErrorHandling) {
        var isRoot = !context;
        if (isRoot) {
          context = { errorThrown: false, error: null };
        }
        cb();
        if (isRoot) {
          var _a = context, errorThrown = _a.errorThrown, error = _a.error;
          context = null;
          if (errorThrown) {
            throw error;
          }
        }
      } else {
        cb();
      }
    }
    exports2.errorContext = errorContext;
    function captureError(err) {
      if (config_1.config.useDeprecatedSynchronousErrorHandling && context) {
        context.errorThrown = true;
        context.error = err;
      }
    }
    exports2.captureError = captureError;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/Subscriber.js
var require_Subscriber = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/Subscriber.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.EMPTY_OBSERVER = exports2.SafeSubscriber = exports2.Subscriber = void 0;
    var isFunction_1 = require_isFunction();
    var Subscription_1 = require_Subscription();
    var config_1 = require_config();
    var reportUnhandledError_1 = require_reportUnhandledError();
    var noop_1 = require_noop();
    var NotificationFactories_1 = require_NotificationFactories();
    var timeoutProvider_1 = require_timeoutProvider();
    var errorContext_1 = require_errorContext();
    var Subscriber = (function(_super) {
      __extends(Subscriber2, _super);
      function Subscriber2(destination) {
        var _this = _super.call(this) || this;
        _this.isStopped = false;
        if (destination) {
          _this.destination = destination;
          if (Subscription_1.isSubscription(destination)) {
            destination.add(_this);
          }
        } else {
          _this.destination = exports2.EMPTY_OBSERVER;
        }
        return _this;
      }
      Subscriber2.create = function(next, error, complete) {
        return new SafeSubscriber(next, error, complete);
      };
      Subscriber2.prototype.next = function(value) {
        if (this.isStopped) {
          handleStoppedNotification(NotificationFactories_1.nextNotification(value), this);
        } else {
          this._next(value);
        }
      };
      Subscriber2.prototype.error = function(err) {
        if (this.isStopped) {
          handleStoppedNotification(NotificationFactories_1.errorNotification(err), this);
        } else {
          this.isStopped = true;
          this._error(err);
        }
      };
      Subscriber2.prototype.complete = function() {
        if (this.isStopped) {
          handleStoppedNotification(NotificationFactories_1.COMPLETE_NOTIFICATION, this);
        } else {
          this.isStopped = true;
          this._complete();
        }
      };
      Subscriber2.prototype.unsubscribe = function() {
        if (!this.closed) {
          this.isStopped = true;
          _super.prototype.unsubscribe.call(this);
          this.destination = null;
        }
      };
      Subscriber2.prototype._next = function(value) {
        this.destination.next(value);
      };
      Subscriber2.prototype._error = function(err) {
        try {
          this.destination.error(err);
        } finally {
          this.unsubscribe();
        }
      };
      Subscriber2.prototype._complete = function() {
        try {
          this.destination.complete();
        } finally {
          this.unsubscribe();
        }
      };
      return Subscriber2;
    })(Subscription_1.Subscription);
    exports2.Subscriber = Subscriber;
    var _bind = Function.prototype.bind;
    function bind(fn, thisArg) {
      return _bind.call(fn, thisArg);
    }
    var ConsumerObserver = (function() {
      function ConsumerObserver2(partialObserver) {
        this.partialObserver = partialObserver;
      }
      ConsumerObserver2.prototype.next = function(value) {
        var partialObserver = this.partialObserver;
        if (partialObserver.next) {
          try {
            partialObserver.next(value);
          } catch (error) {
            handleUnhandledError(error);
          }
        }
      };
      ConsumerObserver2.prototype.error = function(err) {
        var partialObserver = this.partialObserver;
        if (partialObserver.error) {
          try {
            partialObserver.error(err);
          } catch (error) {
            handleUnhandledError(error);
          }
        } else {
          handleUnhandledError(err);
        }
      };
      ConsumerObserver2.prototype.complete = function() {
        var partialObserver = this.partialObserver;
        if (partialObserver.complete) {
          try {
            partialObserver.complete();
          } catch (error) {
            handleUnhandledError(error);
          }
        }
      };
      return ConsumerObserver2;
    })();
    var SafeSubscriber = (function(_super) {
      __extends(SafeSubscriber2, _super);
      function SafeSubscriber2(observerOrNext, error, complete) {
        var _this = _super.call(this) || this;
        var partialObserver;
        if (isFunction_1.isFunction(observerOrNext) || !observerOrNext) {
          partialObserver = {
            next: observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : void 0,
            error: error !== null && error !== void 0 ? error : void 0,
            complete: complete !== null && complete !== void 0 ? complete : void 0
          };
        } else {
          var context_1;
          if (_this && config_1.config.useDeprecatedNextContext) {
            context_1 = Object.create(observerOrNext);
            context_1.unsubscribe = function() {
              return _this.unsubscribe();
            };
            partialObserver = {
              next: observerOrNext.next && bind(observerOrNext.next, context_1),
              error: observerOrNext.error && bind(observerOrNext.error, context_1),
              complete: observerOrNext.complete && bind(observerOrNext.complete, context_1)
            };
          } else {
            partialObserver = observerOrNext;
          }
        }
        _this.destination = new ConsumerObserver(partialObserver);
        return _this;
      }
      return SafeSubscriber2;
    })(Subscriber);
    exports2.SafeSubscriber = SafeSubscriber;
    function handleUnhandledError(error) {
      if (config_1.config.useDeprecatedSynchronousErrorHandling) {
        errorContext_1.captureError(error);
      } else {
        reportUnhandledError_1.reportUnhandledError(error);
      }
    }
    function defaultErrorHandler(err) {
      throw err;
    }
    function handleStoppedNotification(notification, subscriber) {
      var onStoppedNotification = config_1.config.onStoppedNotification;
      onStoppedNotification && timeoutProvider_1.timeoutProvider.setTimeout(function() {
        return onStoppedNotification(notification, subscriber);
      });
    }
    exports2.EMPTY_OBSERVER = {
      closed: true,
      next: noop_1.noop,
      error: defaultErrorHandler,
      complete: noop_1.noop
    };
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/symbol/observable.js
var require_observable = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/symbol/observable.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.observable = void 0;
    exports2.observable = (function() {
      return typeof Symbol === "function" && Symbol.observable || "@@observable";
    })();
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/identity.js
var require_identity = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/identity.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.identity = void 0;
    function identity(x3) {
      return x3;
    }
    exports2.identity = identity;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/pipe.js
var require_pipe = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/pipe.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.pipeFromArray = exports2.pipe = void 0;
    var identity_1 = require_identity();
    function pipe() {
      var fns = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i] = arguments[_i];
      }
      return pipeFromArray(fns);
    }
    exports2.pipe = pipe;
    function pipeFromArray(fns) {
      if (fns.length === 0) {
        return identity_1.identity;
      }
      if (fns.length === 1) {
        return fns[0];
      }
      return function piped(input) {
        return fns.reduce(function(prev, fn) {
          return fn(prev);
        }, input);
      };
    }
    exports2.pipeFromArray = pipeFromArray;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/Observable.js
var require_Observable = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/Observable.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Observable = void 0;
    var Subscriber_1 = require_Subscriber();
    var Subscription_1 = require_Subscription();
    var observable_1 = require_observable();
    var pipe_1 = require_pipe();
    var config_1 = require_config();
    var isFunction_1 = require_isFunction();
    var errorContext_1 = require_errorContext();
    var Observable2 = (function() {
      function Observable3(subscribe) {
        if (subscribe) {
          this._subscribe = subscribe;
        }
      }
      Observable3.prototype.lift = function(operator) {
        var observable = new Observable3();
        observable.source = this;
        observable.operator = operator;
        return observable;
      };
      Observable3.prototype.subscribe = function(observerOrNext, error, complete) {
        var _this = this;
        var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new Subscriber_1.SafeSubscriber(observerOrNext, error, complete);
        errorContext_1.errorContext(function() {
          var _a = _this, operator = _a.operator, source = _a.source;
          subscriber.add(operator ? operator.call(subscriber, source) : source ? _this._subscribe(subscriber) : _this._trySubscribe(subscriber));
        });
        return subscriber;
      };
      Observable3.prototype._trySubscribe = function(sink) {
        try {
          return this._subscribe(sink);
        } catch (err) {
          sink.error(err);
        }
      };
      Observable3.prototype.forEach = function(next, promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function(resolve, reject) {
          var subscriber = new Subscriber_1.SafeSubscriber({
            next: function(value) {
              try {
                next(value);
              } catch (err) {
                reject(err);
                subscriber.unsubscribe();
              }
            },
            error: reject,
            complete: resolve
          });
          _this.subscribe(subscriber);
        });
      };
      Observable3.prototype._subscribe = function(subscriber) {
        var _a;
        return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
      };
      Observable3.prototype[observable_1.observable] = function() {
        return this;
      };
      Observable3.prototype.pipe = function() {
        var operations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          operations[_i] = arguments[_i];
        }
        return pipe_1.pipeFromArray(operations)(this);
      };
      Observable3.prototype.toPromise = function(promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function(resolve, reject) {
          var value;
          _this.subscribe(function(x3) {
            return value = x3;
          }, function(err) {
            return reject(err);
          }, function() {
            return resolve(value);
          });
        });
      };
      Observable3.create = function(subscribe) {
        return new Observable3(subscribe);
      };
      return Observable3;
    })();
    exports2.Observable = Observable2;
    function getPromiseCtor(promiseCtor) {
      var _a;
      return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config_1.config.Promise) !== null && _a !== void 0 ? _a : Promise;
    }
    function isObserver(value) {
      return value && isFunction_1.isFunction(value.next) && isFunction_1.isFunction(value.error) && isFunction_1.isFunction(value.complete);
    }
    function isSubscriber(value) {
      return value && value instanceof Subscriber_1.Subscriber || isObserver(value) && Subscription_1.isSubscription(value);
    }
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/lift.js
var require_lift = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/lift.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.operate = exports2.hasLift = void 0;
    var isFunction_1 = require_isFunction();
    function hasLift(source) {
      return isFunction_1.isFunction(source === null || source === void 0 ? void 0 : source.lift);
    }
    exports2.hasLift = hasLift;
    function operate(init) {
      return function(source) {
        if (hasLift(source)) {
          return source.lift(function(liftedSource) {
            try {
              return init(liftedSource, this);
            } catch (err) {
              this.error(err);
            }
          });
        }
        throw new TypeError("Unable to lift unknown Observable type");
      };
    }
    exports2.operate = operate;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/OperatorSubscriber.js
var require_OperatorSubscriber = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/OperatorSubscriber.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.OperatorSubscriber = exports2.createOperatorSubscriber = void 0;
    var Subscriber_1 = require_Subscriber();
    function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
      return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
    }
    exports2.createOperatorSubscriber = createOperatorSubscriber;
    var OperatorSubscriber = (function(_super) {
      __extends(OperatorSubscriber2, _super);
      function OperatorSubscriber2(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
        var _this = _super.call(this, destination) || this;
        _this.onFinalize = onFinalize;
        _this.shouldUnsubscribe = shouldUnsubscribe;
        _this._next = onNext ? function(value) {
          try {
            onNext(value);
          } catch (err) {
            destination.error(err);
          }
        } : _super.prototype._next;
        _this._error = onError ? function(err) {
          try {
            onError(err);
          } catch (err2) {
            destination.error(err2);
          } finally {
            this.unsubscribe();
          }
        } : _super.prototype._error;
        _this._complete = onComplete ? function() {
          try {
            onComplete();
          } catch (err) {
            destination.error(err);
          } finally {
            this.unsubscribe();
          }
        } : _super.prototype._complete;
        return _this;
      }
      OperatorSubscriber2.prototype.unsubscribe = function() {
        var _a;
        if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
          var closed_1 = this.closed;
          _super.prototype.unsubscribe.call(this);
          !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
        }
      };
      return OperatorSubscriber2;
    })(Subscriber_1.Subscriber);
    exports2.OperatorSubscriber = OperatorSubscriber;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/refCount.js
var require_refCount = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/refCount.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.refCount = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function refCount() {
      return lift_1.operate(function(source, subscriber) {
        var connection = null;
        source._refCount++;
        var refCounter = OperatorSubscriber_1.createOperatorSubscriber(subscriber, void 0, void 0, void 0, function() {
          if (!source || source._refCount <= 0 || 0 < --source._refCount) {
            connection = null;
            return;
          }
          var sharedConnection = source._connection;
          var conn = connection;
          connection = null;
          if (sharedConnection && (!conn || sharedConnection === conn)) {
            sharedConnection.unsubscribe();
          }
          subscriber.unsubscribe();
        });
        source.subscribe(refCounter);
        if (!refCounter.closed) {
          connection = source.connect();
        }
      });
    }
    exports2.refCount = refCount;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/ConnectableObservable.js
var require_ConnectableObservable = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/ConnectableObservable.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ConnectableObservable = void 0;
    var Observable_1 = require_Observable();
    var Subscription_1 = require_Subscription();
    var refCount_1 = require_refCount();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var lift_1 = require_lift();
    var ConnectableObservable = (function(_super) {
      __extends(ConnectableObservable2, _super);
      function ConnectableObservable2(source, subjectFactory) {
        var _this = _super.call(this) || this;
        _this.source = source;
        _this.subjectFactory = subjectFactory;
        _this._subject = null;
        _this._refCount = 0;
        _this._connection = null;
        if (lift_1.hasLift(source)) {
          _this.lift = source.lift;
        }
        return _this;
      }
      ConnectableObservable2.prototype._subscribe = function(subscriber) {
        return this.getSubject().subscribe(subscriber);
      };
      ConnectableObservable2.prototype.getSubject = function() {
        var subject = this._subject;
        if (!subject || subject.isStopped) {
          this._subject = this.subjectFactory();
        }
        return this._subject;
      };
      ConnectableObservable2.prototype._teardown = function() {
        this._refCount = 0;
        var _connection = this._connection;
        this._subject = this._connection = null;
        _connection === null || _connection === void 0 ? void 0 : _connection.unsubscribe();
      };
      ConnectableObservable2.prototype.connect = function() {
        var _this = this;
        var connection = this._connection;
        if (!connection) {
          connection = this._connection = new Subscription_1.Subscription();
          var subject_1 = this.getSubject();
          connection.add(this.source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subject_1, void 0, function() {
            _this._teardown();
            subject_1.complete();
          }, function(err) {
            _this._teardown();
            subject_1.error(err);
          }, function() {
            return _this._teardown();
          })));
          if (connection.closed) {
            this._connection = null;
            connection = Subscription_1.Subscription.EMPTY;
          }
        }
        return connection;
      };
      ConnectableObservable2.prototype.refCount = function() {
        return refCount_1.refCount()(this);
      };
      return ConnectableObservable2;
    })(Observable_1.Observable);
    exports2.ConnectableObservable = ConnectableObservable;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/performanceTimestampProvider.js
var require_performanceTimestampProvider = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/performanceTimestampProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.performanceTimestampProvider = void 0;
    exports2.performanceTimestampProvider = {
      now: function() {
        return (exports2.performanceTimestampProvider.delegate || performance).now();
      },
      delegate: void 0
    };
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/animationFrameProvider.js
var require_animationFrameProvider = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/animationFrameProvider.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.animationFrameProvider = void 0;
    var Subscription_1 = require_Subscription();
    exports2.animationFrameProvider = {
      schedule: function(callback) {
        var request = requestAnimationFrame;
        var cancel = cancelAnimationFrame;
        var delegate = exports2.animationFrameProvider.delegate;
        if (delegate) {
          request = delegate.requestAnimationFrame;
          cancel = delegate.cancelAnimationFrame;
        }
        var handle = request(function(timestamp) {
          cancel = void 0;
          callback(timestamp);
        });
        return new Subscription_1.Subscription(function() {
          return cancel === null || cancel === void 0 ? void 0 : cancel(handle);
        });
      },
      requestAnimationFrame: function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        var delegate = exports2.animationFrameProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.requestAnimationFrame) || requestAnimationFrame).apply(void 0, __spreadArray([], __read(args)));
      },
      cancelAnimationFrame: function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        var delegate = exports2.animationFrameProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.cancelAnimationFrame) || cancelAnimationFrame).apply(void 0, __spreadArray([], __read(args)));
      },
      delegate: void 0
    };
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/dom/animationFrames.js
var require_animationFrames = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/dom/animationFrames.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.animationFrames = void 0;
    var Observable_1 = require_Observable();
    var performanceTimestampProvider_1 = require_performanceTimestampProvider();
    var animationFrameProvider_1 = require_animationFrameProvider();
    function animationFrames(timestampProvider) {
      return timestampProvider ? animationFramesFactory(timestampProvider) : DEFAULT_ANIMATION_FRAMES;
    }
    exports2.animationFrames = animationFrames;
    function animationFramesFactory(timestampProvider) {
      return new Observable_1.Observable(function(subscriber) {
        var provider = timestampProvider || performanceTimestampProvider_1.performanceTimestampProvider;
        var start = provider.now();
        var id = 0;
        var run = function() {
          if (!subscriber.closed) {
            id = animationFrameProvider_1.animationFrameProvider.requestAnimationFrame(function(timestamp) {
              id = 0;
              var now = provider.now();
              subscriber.next({
                timestamp: timestampProvider ? now : timestamp,
                elapsed: now - start
              });
              run();
            });
          }
        };
        run();
        return function() {
          if (id) {
            animationFrameProvider_1.animationFrameProvider.cancelAnimationFrame(id);
          }
        };
      });
    }
    var DEFAULT_ANIMATION_FRAMES = animationFramesFactory();
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/ObjectUnsubscribedError.js
var require_ObjectUnsubscribedError = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/ObjectUnsubscribedError.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ObjectUnsubscribedError = void 0;
    var createErrorClass_1 = require_createErrorClass();
    exports2.ObjectUnsubscribedError = createErrorClass_1.createErrorClass(function(_super) {
      return function ObjectUnsubscribedErrorImpl() {
        _super(this);
        this.name = "ObjectUnsubscribedError";
        this.message = "object unsubscribed";
      };
    });
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/Subject.js
var require_Subject = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/Subject.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    var __values = exports2 && exports2.__values || function(o5) {
      var s4 = typeof Symbol === "function" && Symbol.iterator, m2 = s4 && o5[s4], i2 = 0;
      if (m2) return m2.call(o5);
      if (o5 && typeof o5.length === "number") return {
        next: function() {
          if (o5 && i2 >= o5.length) o5 = void 0;
          return { value: o5 && o5[i2++], done: !o5 };
        }
      };
      throw new TypeError(s4 ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.AnonymousSubject = exports2.Subject = void 0;
    var Observable_1 = require_Observable();
    var Subscription_1 = require_Subscription();
    var ObjectUnsubscribedError_1 = require_ObjectUnsubscribedError();
    var arrRemove_1 = require_arrRemove();
    var errorContext_1 = require_errorContext();
    var Subject = (function(_super) {
      __extends(Subject2, _super);
      function Subject2() {
        var _this = _super.call(this) || this;
        _this.closed = false;
        _this.currentObservers = null;
        _this.observers = [];
        _this.isStopped = false;
        _this.hasError = false;
        _this.thrownError = null;
        return _this;
      }
      Subject2.prototype.lift = function(operator) {
        var subject = new AnonymousSubject(this, this);
        subject.operator = operator;
        return subject;
      };
      Subject2.prototype._throwIfClosed = function() {
        if (this.closed) {
          throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
      };
      Subject2.prototype.next = function(value) {
        var _this = this;
        errorContext_1.errorContext(function() {
          var e_1, _a;
          _this._throwIfClosed();
          if (!_this.isStopped) {
            if (!_this.currentObservers) {
              _this.currentObservers = Array.from(_this.observers);
            }
            try {
              for (var _b = __values(_this.currentObservers), _c = _b.next(); !_c.done; _c = _b.next()) {
                var observer = _c.value;
                observer.next(value);
              }
            } catch (e_1_1) {
              e_1 = { error: e_1_1 };
            } finally {
              try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
              } finally {
                if (e_1) throw e_1.error;
              }
            }
          }
        });
      };
      Subject2.prototype.error = function(err) {
        var _this = this;
        errorContext_1.errorContext(function() {
          _this._throwIfClosed();
          if (!_this.isStopped) {
            _this.hasError = _this.isStopped = true;
            _this.thrownError = err;
            var observers = _this.observers;
            while (observers.length) {
              observers.shift().error(err);
            }
          }
        });
      };
      Subject2.prototype.complete = function() {
        var _this = this;
        errorContext_1.errorContext(function() {
          _this._throwIfClosed();
          if (!_this.isStopped) {
            _this.isStopped = true;
            var observers = _this.observers;
            while (observers.length) {
              observers.shift().complete();
            }
          }
        });
      };
      Subject2.prototype.unsubscribe = function() {
        this.isStopped = this.closed = true;
        this.observers = this.currentObservers = null;
      };
      Object.defineProperty(Subject2.prototype, "observed", {
        get: function() {
          var _a;
          return ((_a = this.observers) === null || _a === void 0 ? void 0 : _a.length) > 0;
        },
        enumerable: false,
        configurable: true
      });
      Subject2.prototype._trySubscribe = function(subscriber) {
        this._throwIfClosed();
        return _super.prototype._trySubscribe.call(this, subscriber);
      };
      Subject2.prototype._subscribe = function(subscriber) {
        this._throwIfClosed();
        this._checkFinalizedStatuses(subscriber);
        return this._innerSubscribe(subscriber);
      };
      Subject2.prototype._innerSubscribe = function(subscriber) {
        var _this = this;
        var _a = this, hasError = _a.hasError, isStopped = _a.isStopped, observers = _a.observers;
        if (hasError || isStopped) {
          return Subscription_1.EMPTY_SUBSCRIPTION;
        }
        this.currentObservers = null;
        observers.push(subscriber);
        return new Subscription_1.Subscription(function() {
          _this.currentObservers = null;
          arrRemove_1.arrRemove(observers, subscriber);
        });
      };
      Subject2.prototype._checkFinalizedStatuses = function(subscriber) {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, isStopped = _a.isStopped;
        if (hasError) {
          subscriber.error(thrownError);
        } else if (isStopped) {
          subscriber.complete();
        }
      };
      Subject2.prototype.asObservable = function() {
        var observable = new Observable_1.Observable();
        observable.source = this;
        return observable;
      };
      Subject2.create = function(destination, source) {
        return new AnonymousSubject(destination, source);
      };
      return Subject2;
    })(Observable_1.Observable);
    exports2.Subject = Subject;
    var AnonymousSubject = (function(_super) {
      __extends(AnonymousSubject2, _super);
      function AnonymousSubject2(destination, source) {
        var _this = _super.call(this) || this;
        _this.destination = destination;
        _this.source = source;
        return _this;
      }
      AnonymousSubject2.prototype.next = function(value) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.call(_a, value);
      };
      AnonymousSubject2.prototype.error = function(err) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.call(_a, err);
      };
      AnonymousSubject2.prototype.complete = function() {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.complete) === null || _b === void 0 ? void 0 : _b.call(_a);
      };
      AnonymousSubject2.prototype._subscribe = function(subscriber) {
        var _a, _b;
        return (_b = (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber)) !== null && _b !== void 0 ? _b : Subscription_1.EMPTY_SUBSCRIPTION;
      };
      return AnonymousSubject2;
    })(Subject);
    exports2.AnonymousSubject = AnonymousSubject;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/BehaviorSubject.js
var require_BehaviorSubject = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/BehaviorSubject.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BehaviorSubject = void 0;
    var Subject_1 = require_Subject();
    var BehaviorSubject = (function(_super) {
      __extends(BehaviorSubject2, _super);
      function BehaviorSubject2(_value) {
        var _this = _super.call(this) || this;
        _this._value = _value;
        return _this;
      }
      Object.defineProperty(BehaviorSubject2.prototype, "value", {
        get: function() {
          return this.getValue();
        },
        enumerable: false,
        configurable: true
      });
      BehaviorSubject2.prototype._subscribe = function(subscriber) {
        var subscription = _super.prototype._subscribe.call(this, subscriber);
        !subscription.closed && subscriber.next(this._value);
        return subscription;
      };
      BehaviorSubject2.prototype.getValue = function() {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, _value = _a._value;
        if (hasError) {
          throw thrownError;
        }
        this._throwIfClosed();
        return _value;
      };
      BehaviorSubject2.prototype.next = function(value) {
        _super.prototype.next.call(this, this._value = value);
      };
      return BehaviorSubject2;
    })(Subject_1.Subject);
    exports2.BehaviorSubject = BehaviorSubject;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/dateTimestampProvider.js
var require_dateTimestampProvider = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/dateTimestampProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.dateTimestampProvider = void 0;
    exports2.dateTimestampProvider = {
      now: function() {
        return (exports2.dateTimestampProvider.delegate || Date).now();
      },
      delegate: void 0
    };
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/ReplaySubject.js
var require_ReplaySubject = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/ReplaySubject.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ReplaySubject = void 0;
    var Subject_1 = require_Subject();
    var dateTimestampProvider_1 = require_dateTimestampProvider();
    var ReplaySubject = (function(_super) {
      __extends(ReplaySubject2, _super);
      function ReplaySubject2(_bufferSize, _windowTime, _timestampProvider) {
        if (_bufferSize === void 0) {
          _bufferSize = Infinity;
        }
        if (_windowTime === void 0) {
          _windowTime = Infinity;
        }
        if (_timestampProvider === void 0) {
          _timestampProvider = dateTimestampProvider_1.dateTimestampProvider;
        }
        var _this = _super.call(this) || this;
        _this._bufferSize = _bufferSize;
        _this._windowTime = _windowTime;
        _this._timestampProvider = _timestampProvider;
        _this._buffer = [];
        _this._infiniteTimeWindow = true;
        _this._infiniteTimeWindow = _windowTime === Infinity;
        _this._bufferSize = Math.max(1, _bufferSize);
        _this._windowTime = Math.max(1, _windowTime);
        return _this;
      }
      ReplaySubject2.prototype.next = function(value) {
        var _a = this, isStopped = _a.isStopped, _buffer = _a._buffer, _infiniteTimeWindow = _a._infiniteTimeWindow, _timestampProvider = _a._timestampProvider, _windowTime = _a._windowTime;
        if (!isStopped) {
          _buffer.push(value);
          !_infiniteTimeWindow && _buffer.push(_timestampProvider.now() + _windowTime);
        }
        this._trimBuffer();
        _super.prototype.next.call(this, value);
      };
      ReplaySubject2.prototype._subscribe = function(subscriber) {
        this._throwIfClosed();
        this._trimBuffer();
        var subscription = this._innerSubscribe(subscriber);
        var _a = this, _infiniteTimeWindow = _a._infiniteTimeWindow, _buffer = _a._buffer;
        var copy = _buffer.slice();
        for (var i2 = 0; i2 < copy.length && !subscriber.closed; i2 += _infiniteTimeWindow ? 1 : 2) {
          subscriber.next(copy[i2]);
        }
        this._checkFinalizedStatuses(subscriber);
        return subscription;
      };
      ReplaySubject2.prototype._trimBuffer = function() {
        var _a = this, _bufferSize = _a._bufferSize, _timestampProvider = _a._timestampProvider, _buffer = _a._buffer, _infiniteTimeWindow = _a._infiniteTimeWindow;
        var adjustedBufferSize = (_infiniteTimeWindow ? 1 : 2) * _bufferSize;
        _bufferSize < Infinity && adjustedBufferSize < _buffer.length && _buffer.splice(0, _buffer.length - adjustedBufferSize);
        if (!_infiniteTimeWindow) {
          var now = _timestampProvider.now();
          var last = 0;
          for (var i2 = 1; i2 < _buffer.length && _buffer[i2] <= now; i2 += 2) {
            last = i2;
          }
          last && _buffer.splice(0, last + 1);
        }
      };
      return ReplaySubject2;
    })(Subject_1.Subject);
    exports2.ReplaySubject = ReplaySubject;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/AsyncSubject.js
var require_AsyncSubject = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/AsyncSubject.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.AsyncSubject = void 0;
    var Subject_1 = require_Subject();
    var AsyncSubject = (function(_super) {
      __extends(AsyncSubject2, _super);
      function AsyncSubject2() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._value = null;
        _this._hasValue = false;
        _this._isComplete = false;
        return _this;
      }
      AsyncSubject2.prototype._checkFinalizedStatuses = function(subscriber) {
        var _a = this, hasError = _a.hasError, _hasValue = _a._hasValue, _value = _a._value, thrownError = _a.thrownError, isStopped = _a.isStopped, _isComplete = _a._isComplete;
        if (hasError) {
          subscriber.error(thrownError);
        } else if (isStopped || _isComplete) {
          _hasValue && subscriber.next(_value);
          subscriber.complete();
        }
      };
      AsyncSubject2.prototype.next = function(value) {
        if (!this.isStopped) {
          this._value = value;
          this._hasValue = true;
        }
      };
      AsyncSubject2.prototype.complete = function() {
        var _a = this, _hasValue = _a._hasValue, _value = _a._value, _isComplete = _a._isComplete;
        if (!_isComplete) {
          this._isComplete = true;
          _hasValue && _super.prototype.next.call(this, _value);
          _super.prototype.complete.call(this);
        }
      };
      return AsyncSubject2;
    })(Subject_1.Subject);
    exports2.AsyncSubject = AsyncSubject;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/Action.js
var require_Action = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/Action.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Action = void 0;
    var Subscription_1 = require_Subscription();
    var Action = (function(_super) {
      __extends(Action2, _super);
      function Action2(scheduler, work) {
        return _super.call(this) || this;
      }
      Action2.prototype.schedule = function(state, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        return this;
      };
      return Action2;
    })(Subscription_1.Subscription);
    exports2.Action = Action;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/intervalProvider.js
var require_intervalProvider = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/intervalProvider.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.intervalProvider = void 0;
    exports2.intervalProvider = {
      setInterval: function(handler, timeout) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
          args[_i - 2] = arguments[_i];
        }
        var delegate = exports2.intervalProvider.delegate;
        if (delegate === null || delegate === void 0 ? void 0 : delegate.setInterval) {
          return delegate.setInterval.apply(delegate, __spreadArray([handler, timeout], __read(args)));
        }
        return setInterval.apply(void 0, __spreadArray([handler, timeout], __read(args)));
      },
      clearInterval: function(handle) {
        var delegate = exports2.intervalProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearInterval) || clearInterval)(handle);
      },
      delegate: void 0
    };
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/AsyncAction.js
var require_AsyncAction = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/AsyncAction.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.AsyncAction = void 0;
    var Action_1 = require_Action();
    var intervalProvider_1 = require_intervalProvider();
    var arrRemove_1 = require_arrRemove();
    var AsyncAction = (function(_super) {
      __extends(AsyncAction2, _super);
      function AsyncAction2(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        _this.pending = false;
        return _this;
      }
      AsyncAction2.prototype.schedule = function(state, delay) {
        var _a;
        if (delay === void 0) {
          delay = 0;
        }
        if (this.closed) {
          return this;
        }
        this.state = state;
        var id = this.id;
        var scheduler = this.scheduler;
        if (id != null) {
          this.id = this.recycleAsyncId(scheduler, id, delay);
        }
        this.pending = true;
        this.delay = delay;
        this.id = (_a = this.id) !== null && _a !== void 0 ? _a : this.requestAsyncId(scheduler, this.id, delay);
        return this;
      };
      AsyncAction2.prototype.requestAsyncId = function(scheduler, _id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        return intervalProvider_1.intervalProvider.setInterval(scheduler.flush.bind(scheduler, this), delay);
      };
      AsyncAction2.prototype.recycleAsyncId = function(_scheduler, id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        if (delay != null && this.delay === delay && this.pending === false) {
          return id;
        }
        if (id != null) {
          intervalProvider_1.intervalProvider.clearInterval(id);
        }
        return void 0;
      };
      AsyncAction2.prototype.execute = function(state, delay) {
        if (this.closed) {
          return new Error("executing a cancelled action");
        }
        this.pending = false;
        var error = this._execute(state, delay);
        if (error) {
          return error;
        } else if (this.pending === false && this.id != null) {
          this.id = this.recycleAsyncId(this.scheduler, this.id, null);
        }
      };
      AsyncAction2.prototype._execute = function(state, _delay) {
        var errored = false;
        var errorValue;
        try {
          this.work(state);
        } catch (e5) {
          errored = true;
          errorValue = e5 ? e5 : new Error("Scheduled action threw falsy error");
        }
        if (errored) {
          this.unsubscribe();
          return errorValue;
        }
      };
      AsyncAction2.prototype.unsubscribe = function() {
        if (!this.closed) {
          var _a = this, id = _a.id, scheduler = _a.scheduler;
          var actions = scheduler.actions;
          this.work = this.state = this.scheduler = null;
          this.pending = false;
          arrRemove_1.arrRemove(actions, this);
          if (id != null) {
            this.id = this.recycleAsyncId(scheduler, id, null);
          }
          this.delay = null;
          _super.prototype.unsubscribe.call(this);
        }
      };
      return AsyncAction2;
    })(Action_1.Action);
    exports2.AsyncAction = AsyncAction;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/Immediate.js
var require_Immediate = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/Immediate.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TestTools = exports2.Immediate = void 0;
    var nextHandle = 1;
    var resolved;
    var activeHandles = {};
    function findAndClearHandle(handle) {
      if (handle in activeHandles) {
        delete activeHandles[handle];
        return true;
      }
      return false;
    }
    exports2.Immediate = {
      setImmediate: function(cb) {
        var handle = nextHandle++;
        activeHandles[handle] = true;
        if (!resolved) {
          resolved = Promise.resolve();
        }
        resolved.then(function() {
          return findAndClearHandle(handle) && cb();
        });
        return handle;
      },
      clearImmediate: function(handle) {
        findAndClearHandle(handle);
      }
    };
    exports2.TestTools = {
      pending: function() {
        return Object.keys(activeHandles).length;
      }
    };
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/immediateProvider.js
var require_immediateProvider = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/immediateProvider.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.immediateProvider = void 0;
    var Immediate_1 = require_Immediate();
    var setImmediate2 = Immediate_1.Immediate.setImmediate;
    var clearImmediate2 = Immediate_1.Immediate.clearImmediate;
    exports2.immediateProvider = {
      setImmediate: function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        var delegate = exports2.immediateProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.setImmediate) || setImmediate2).apply(void 0, __spreadArray([], __read(args)));
      },
      clearImmediate: function(handle) {
        var delegate = exports2.immediateProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearImmediate) || clearImmediate2)(handle);
      },
      delegate: void 0
    };
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/AsapAction.js
var require_AsapAction = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/AsapAction.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.AsapAction = void 0;
    var AsyncAction_1 = require_AsyncAction();
    var immediateProvider_1 = require_immediateProvider();
    var AsapAction = (function(_super) {
      __extends(AsapAction2, _super);
      function AsapAction2(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
      }
      AsapAction2.prototype.requestAsyncId = function(scheduler, id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        if (delay !== null && delay > 0) {
          return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler._scheduled || (scheduler._scheduled = immediateProvider_1.immediateProvider.setImmediate(scheduler.flush.bind(scheduler, void 0)));
      };
      AsapAction2.prototype.recycleAsyncId = function(scheduler, id, delay) {
        var _a;
        if (delay === void 0) {
          delay = 0;
        }
        if (delay != null ? delay > 0 : this.delay > 0) {
          return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
        }
        var actions = scheduler.actions;
        if (id != null && ((_a = actions[actions.length - 1]) === null || _a === void 0 ? void 0 : _a.id) !== id) {
          immediateProvider_1.immediateProvider.clearImmediate(id);
          if (scheduler._scheduled === id) {
            scheduler._scheduled = void 0;
          }
        }
        return void 0;
      };
      return AsapAction2;
    })(AsyncAction_1.AsyncAction);
    exports2.AsapAction = AsapAction;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/Scheduler.js
var require_Scheduler = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/Scheduler.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Scheduler = void 0;
    var dateTimestampProvider_1 = require_dateTimestampProvider();
    var Scheduler = (function() {
      function Scheduler2(schedulerActionCtor, now) {
        if (now === void 0) {
          now = Scheduler2.now;
        }
        this.schedulerActionCtor = schedulerActionCtor;
        this.now = now;
      }
      Scheduler2.prototype.schedule = function(work, delay, state) {
        if (delay === void 0) {
          delay = 0;
        }
        return new this.schedulerActionCtor(this, work).schedule(state, delay);
      };
      Scheduler2.now = dateTimestampProvider_1.dateTimestampProvider.now;
      return Scheduler2;
    })();
    exports2.Scheduler = Scheduler;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/AsyncScheduler.js
var require_AsyncScheduler = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/AsyncScheduler.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.AsyncScheduler = void 0;
    var Scheduler_1 = require_Scheduler();
    var AsyncScheduler = (function(_super) {
      __extends(AsyncScheduler2, _super);
      function AsyncScheduler2(SchedulerAction, now) {
        if (now === void 0) {
          now = Scheduler_1.Scheduler.now;
        }
        var _this = _super.call(this, SchedulerAction, now) || this;
        _this.actions = [];
        _this._active = false;
        return _this;
      }
      AsyncScheduler2.prototype.flush = function(action) {
        var actions = this.actions;
        if (this._active) {
          actions.push(action);
          return;
        }
        var error;
        this._active = true;
        do {
          if (error = action.execute(action.state, action.delay)) {
            break;
          }
        } while (action = actions.shift());
        this._active = false;
        if (error) {
          while (action = actions.shift()) {
            action.unsubscribe();
          }
          throw error;
        }
      };
      return AsyncScheduler2;
    })(Scheduler_1.Scheduler);
    exports2.AsyncScheduler = AsyncScheduler;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/AsapScheduler.js
var require_AsapScheduler = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/AsapScheduler.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.AsapScheduler = void 0;
    var AsyncScheduler_1 = require_AsyncScheduler();
    var AsapScheduler = (function(_super) {
      __extends(AsapScheduler2, _super);
      function AsapScheduler2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      AsapScheduler2.prototype.flush = function(action) {
        this._active = true;
        var flushId = this._scheduled;
        this._scheduled = void 0;
        var actions = this.actions;
        var error;
        action = action || actions.shift();
        do {
          if (error = action.execute(action.state, action.delay)) {
            break;
          }
        } while ((action = actions[0]) && action.id === flushId && actions.shift());
        this._active = false;
        if (error) {
          while ((action = actions[0]) && action.id === flushId && actions.shift()) {
            action.unsubscribe();
          }
          throw error;
        }
      };
      return AsapScheduler2;
    })(AsyncScheduler_1.AsyncScheduler);
    exports2.AsapScheduler = AsapScheduler;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/asap.js
var require_asap = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/asap.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.asap = exports2.asapScheduler = void 0;
    var AsapAction_1 = require_AsapAction();
    var AsapScheduler_1 = require_AsapScheduler();
    exports2.asapScheduler = new AsapScheduler_1.AsapScheduler(AsapAction_1.AsapAction);
    exports2.asap = exports2.asapScheduler;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/async.js
var require_async = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/async.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.async = exports2.asyncScheduler = void 0;
    var AsyncAction_1 = require_AsyncAction();
    var AsyncScheduler_1 = require_AsyncScheduler();
    exports2.asyncScheduler = new AsyncScheduler_1.AsyncScheduler(AsyncAction_1.AsyncAction);
    exports2.async = exports2.asyncScheduler;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/QueueAction.js
var require_QueueAction = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/QueueAction.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.QueueAction = void 0;
    var AsyncAction_1 = require_AsyncAction();
    var QueueAction = (function(_super) {
      __extends(QueueAction2, _super);
      function QueueAction2(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
      }
      QueueAction2.prototype.schedule = function(state, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        if (delay > 0) {
          return _super.prototype.schedule.call(this, state, delay);
        }
        this.delay = delay;
        this.state = state;
        this.scheduler.flush(this);
        return this;
      };
      QueueAction2.prototype.execute = function(state, delay) {
        return delay > 0 || this.closed ? _super.prototype.execute.call(this, state, delay) : this._execute(state, delay);
      };
      QueueAction2.prototype.requestAsyncId = function(scheduler, id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        if (delay != null && delay > 0 || delay == null && this.delay > 0) {
          return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.flush(this);
        return 0;
      };
      return QueueAction2;
    })(AsyncAction_1.AsyncAction);
    exports2.QueueAction = QueueAction;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/QueueScheduler.js
var require_QueueScheduler = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/QueueScheduler.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.QueueScheduler = void 0;
    var AsyncScheduler_1 = require_AsyncScheduler();
    var QueueScheduler = (function(_super) {
      __extends(QueueScheduler2, _super);
      function QueueScheduler2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      return QueueScheduler2;
    })(AsyncScheduler_1.AsyncScheduler);
    exports2.QueueScheduler = QueueScheduler;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/queue.js
var require_queue = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/queue.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.queue = exports2.queueScheduler = void 0;
    var QueueAction_1 = require_QueueAction();
    var QueueScheduler_1 = require_QueueScheduler();
    exports2.queueScheduler = new QueueScheduler_1.QueueScheduler(QueueAction_1.QueueAction);
    exports2.queue = exports2.queueScheduler;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/AnimationFrameAction.js
var require_AnimationFrameAction = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/AnimationFrameAction.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.AnimationFrameAction = void 0;
    var AsyncAction_1 = require_AsyncAction();
    var animationFrameProvider_1 = require_animationFrameProvider();
    var AnimationFrameAction = (function(_super) {
      __extends(AnimationFrameAction2, _super);
      function AnimationFrameAction2(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
      }
      AnimationFrameAction2.prototype.requestAsyncId = function(scheduler, id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        if (delay !== null && delay > 0) {
          return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler._scheduled || (scheduler._scheduled = animationFrameProvider_1.animationFrameProvider.requestAnimationFrame(function() {
          return scheduler.flush(void 0);
        }));
      };
      AnimationFrameAction2.prototype.recycleAsyncId = function(scheduler, id, delay) {
        var _a;
        if (delay === void 0) {
          delay = 0;
        }
        if (delay != null ? delay > 0 : this.delay > 0) {
          return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
        }
        var actions = scheduler.actions;
        if (id != null && id === scheduler._scheduled && ((_a = actions[actions.length - 1]) === null || _a === void 0 ? void 0 : _a.id) !== id) {
          animationFrameProvider_1.animationFrameProvider.cancelAnimationFrame(id);
          scheduler._scheduled = void 0;
        }
        return void 0;
      };
      return AnimationFrameAction2;
    })(AsyncAction_1.AsyncAction);
    exports2.AnimationFrameAction = AnimationFrameAction;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/AnimationFrameScheduler.js
var require_AnimationFrameScheduler = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/AnimationFrameScheduler.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.AnimationFrameScheduler = void 0;
    var AsyncScheduler_1 = require_AsyncScheduler();
    var AnimationFrameScheduler = (function(_super) {
      __extends(AnimationFrameScheduler2, _super);
      function AnimationFrameScheduler2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      AnimationFrameScheduler2.prototype.flush = function(action) {
        this._active = true;
        var flushId;
        if (action) {
          flushId = action.id;
        } else {
          flushId = this._scheduled;
          this._scheduled = void 0;
        }
        var actions = this.actions;
        var error;
        action = action || actions.shift();
        do {
          if (error = action.execute(action.state, action.delay)) {
            break;
          }
        } while ((action = actions[0]) && action.id === flushId && actions.shift());
        this._active = false;
        if (error) {
          while ((action = actions[0]) && action.id === flushId && actions.shift()) {
            action.unsubscribe();
          }
          throw error;
        }
      };
      return AnimationFrameScheduler2;
    })(AsyncScheduler_1.AsyncScheduler);
    exports2.AnimationFrameScheduler = AnimationFrameScheduler;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/animationFrame.js
var require_animationFrame = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/animationFrame.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.animationFrame = exports2.animationFrameScheduler = void 0;
    var AnimationFrameAction_1 = require_AnimationFrameAction();
    var AnimationFrameScheduler_1 = require_AnimationFrameScheduler();
    exports2.animationFrameScheduler = new AnimationFrameScheduler_1.AnimationFrameScheduler(AnimationFrameAction_1.AnimationFrameAction);
    exports2.animationFrame = exports2.animationFrameScheduler;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/VirtualTimeScheduler.js
var require_VirtualTimeScheduler = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduler/VirtualTimeScheduler.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d2, b3) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b4) {
          d3.__proto__ = b4;
        } || function(d3, b4) {
          for (var p3 in b4) if (Object.prototype.hasOwnProperty.call(b4, p3)) d3[p3] = b4[p3];
        };
        return extendStatics(d2, b3);
      };
      return function(d2, b3) {
        if (typeof b3 !== "function" && b3 !== null)
          throw new TypeError("Class extends value " + String(b3) + " is not a constructor or null");
        extendStatics(d2, b3);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b3 === null ? Object.create(b3) : (__.prototype = b3.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.VirtualAction = exports2.VirtualTimeScheduler = void 0;
    var AsyncAction_1 = require_AsyncAction();
    var Subscription_1 = require_Subscription();
    var AsyncScheduler_1 = require_AsyncScheduler();
    var VirtualTimeScheduler = (function(_super) {
      __extends(VirtualTimeScheduler2, _super);
      function VirtualTimeScheduler2(schedulerActionCtor, maxFrames) {
        if (schedulerActionCtor === void 0) {
          schedulerActionCtor = VirtualAction;
        }
        if (maxFrames === void 0) {
          maxFrames = Infinity;
        }
        var _this = _super.call(this, schedulerActionCtor, function() {
          return _this.frame;
        }) || this;
        _this.maxFrames = maxFrames;
        _this.frame = 0;
        _this.index = -1;
        return _this;
      }
      VirtualTimeScheduler2.prototype.flush = function() {
        var _a = this, actions = _a.actions, maxFrames = _a.maxFrames;
        var error;
        var action;
        while ((action = actions[0]) && action.delay <= maxFrames) {
          actions.shift();
          this.frame = action.delay;
          if (error = action.execute(action.state, action.delay)) {
            break;
          }
        }
        if (error) {
          while (action = actions.shift()) {
            action.unsubscribe();
          }
          throw error;
        }
      };
      VirtualTimeScheduler2.frameTimeFactor = 10;
      return VirtualTimeScheduler2;
    })(AsyncScheduler_1.AsyncScheduler);
    exports2.VirtualTimeScheduler = VirtualTimeScheduler;
    var VirtualAction = (function(_super) {
      __extends(VirtualAction2, _super);
      function VirtualAction2(scheduler, work, index) {
        if (index === void 0) {
          index = scheduler.index += 1;
        }
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        _this.index = index;
        _this.active = true;
        _this.index = scheduler.index = index;
        return _this;
      }
      VirtualAction2.prototype.schedule = function(state, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        if (Number.isFinite(delay)) {
          if (!this.id) {
            return _super.prototype.schedule.call(this, state, delay);
          }
          this.active = false;
          var action = new VirtualAction2(this.scheduler, this.work);
          this.add(action);
          return action.schedule(state, delay);
        } else {
          return Subscription_1.Subscription.EMPTY;
        }
      };
      VirtualAction2.prototype.requestAsyncId = function(scheduler, id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        this.delay = scheduler.frame + delay;
        var actions = scheduler.actions;
        actions.push(this);
        actions.sort(VirtualAction2.sortActions);
        return 1;
      };
      VirtualAction2.prototype.recycleAsyncId = function(scheduler, id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        return void 0;
      };
      VirtualAction2.prototype._execute = function(state, delay) {
        if (this.active === true) {
          return _super.prototype._execute.call(this, state, delay);
        }
      };
      VirtualAction2.sortActions = function(a3, b3) {
        if (a3.delay === b3.delay) {
          if (a3.index === b3.index) {
            return 0;
          } else if (a3.index > b3.index) {
            return 1;
          } else {
            return -1;
          }
        } else if (a3.delay > b3.delay) {
          return 1;
        } else {
          return -1;
        }
      };
      return VirtualAction2;
    })(AsyncAction_1.AsyncAction);
    exports2.VirtualAction = VirtualAction;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/empty.js
var require_empty = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/empty.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.empty = exports2.EMPTY = void 0;
    var Observable_1 = require_Observable();
    exports2.EMPTY = new Observable_1.Observable(function(subscriber) {
      return subscriber.complete();
    });
    function empty(scheduler) {
      return scheduler ? emptyScheduled(scheduler) : exports2.EMPTY;
    }
    exports2.empty = empty;
    function emptyScheduled(scheduler) {
      return new Observable_1.Observable(function(subscriber) {
        return scheduler.schedule(function() {
          return subscriber.complete();
        });
      });
    }
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isScheduler.js
var require_isScheduler = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isScheduler.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isScheduler = void 0;
    var isFunction_1 = require_isFunction();
    function isScheduler(value) {
      return value && isFunction_1.isFunction(value.schedule);
    }
    exports2.isScheduler = isScheduler;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/args.js
var require_args = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/args.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.popNumber = exports2.popScheduler = exports2.popResultSelector = void 0;
    var isFunction_1 = require_isFunction();
    var isScheduler_1 = require_isScheduler();
    function last(arr) {
      return arr[arr.length - 1];
    }
    function popResultSelector(args) {
      return isFunction_1.isFunction(last(args)) ? args.pop() : void 0;
    }
    exports2.popResultSelector = popResultSelector;
    function popScheduler(args) {
      return isScheduler_1.isScheduler(last(args)) ? args.pop() : void 0;
    }
    exports2.popScheduler = popScheduler;
    function popNumber(args, defaultValue) {
      return typeof last(args) === "number" ? args.pop() : defaultValue;
    }
    exports2.popNumber = popNumber;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isArrayLike.js
var require_isArrayLike = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isArrayLike.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isArrayLike = void 0;
    exports2.isArrayLike = (function(x3) {
      return x3 && typeof x3.length === "number" && typeof x3 !== "function";
    });
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isPromise.js
var require_isPromise = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isPromise.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isPromise = void 0;
    var isFunction_1 = require_isFunction();
    function isPromise(value) {
      return isFunction_1.isFunction(value === null || value === void 0 ? void 0 : value.then);
    }
    exports2.isPromise = isPromise;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isInteropObservable.js
var require_isInteropObservable = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isInteropObservable.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isInteropObservable = void 0;
    var observable_1 = require_observable();
    var isFunction_1 = require_isFunction();
    function isInteropObservable(input) {
      return isFunction_1.isFunction(input[observable_1.observable]);
    }
    exports2.isInteropObservable = isInteropObservable;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isAsyncIterable.js
var require_isAsyncIterable = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isAsyncIterable.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isAsyncIterable = void 0;
    var isFunction_1 = require_isFunction();
    function isAsyncIterable(obj) {
      return Symbol.asyncIterator && isFunction_1.isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
    }
    exports2.isAsyncIterable = isAsyncIterable;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/throwUnobservableError.js
var require_throwUnobservableError = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/throwUnobservableError.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createInvalidObservableTypeError = void 0;
    function createInvalidObservableTypeError(input) {
      return new TypeError("You provided " + (input !== null && typeof input === "object" ? "an invalid object" : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
    }
    exports2.createInvalidObservableTypeError = createInvalidObservableTypeError;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/symbol/iterator.js
var require_iterator = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/symbol/iterator.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.iterator = exports2.getSymbolIterator = void 0;
    function getSymbolIterator() {
      if (typeof Symbol !== "function" || !Symbol.iterator) {
        return "@@iterator";
      }
      return Symbol.iterator;
    }
    exports2.getSymbolIterator = getSymbolIterator;
    exports2.iterator = getSymbolIterator();
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isIterable.js
var require_isIterable = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isIterable.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isIterable = void 0;
    var iterator_1 = require_iterator();
    var isFunction_1 = require_isFunction();
    function isIterable(input) {
      return isFunction_1.isFunction(input === null || input === void 0 ? void 0 : input[iterator_1.iterator]);
    }
    exports2.isIterable = isIterable;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isReadableStreamLike.js
var require_isReadableStreamLike = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isReadableStreamLike.js"(exports2) {
    "use strict";
    var __generator = exports2 && exports2.__generator || function(thisArg, body) {
      var _2 = { label: 0, sent: function() {
        if (t4[0] & 1) throw t4[1];
        return t4[1];
      }, trys: [], ops: [] }, f3, y3, t4, g3;
      return g3 = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g3[Symbol.iterator] = function() {
        return this;
      }), g3;
      function verb(n5) {
        return function(v3) {
          return step([n5, v3]);
        };
      }
      function step(op) {
        if (f3) throw new TypeError("Generator is already executing.");
        while (_2) try {
          if (f3 = 1, y3 && (t4 = op[0] & 2 ? y3["return"] : op[0] ? y3["throw"] || ((t4 = y3["return"]) && t4.call(y3), 0) : y3.next) && !(t4 = t4.call(y3, op[1])).done) return t4;
          if (y3 = 0, t4) op = [op[0] & 2, t4.value];
          switch (op[0]) {
            case 0:
            case 1:
              t4 = op;
              break;
            case 4:
              _2.label++;
              return { value: op[1], done: false };
            case 5:
              _2.label++;
              y3 = op[1];
              op = [0];
              continue;
            case 7:
              op = _2.ops.pop();
              _2.trys.pop();
              continue;
            default:
              if (!(t4 = _2.trys, t4 = t4.length > 0 && t4[t4.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _2 = 0;
                continue;
              }
              if (op[0] === 3 && (!t4 || op[1] > t4[0] && op[1] < t4[3])) {
                _2.label = op[1];
                break;
              }
              if (op[0] === 6 && _2.label < t4[1]) {
                _2.label = t4[1];
                t4 = op;
                break;
              }
              if (t4 && _2.label < t4[2]) {
                _2.label = t4[2];
                _2.ops.push(op);
                break;
              }
              if (t4[2]) _2.ops.pop();
              _2.trys.pop();
              continue;
          }
          op = body.call(thisArg, _2);
        } catch (e5) {
          op = [6, e5];
          y3 = 0;
        } finally {
          f3 = t4 = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    var __await = exports2 && exports2.__await || function(v3) {
      return this instanceof __await ? (this.v = v3, this) : new __await(v3);
    };
    var __asyncGenerator = exports2 && exports2.__asyncGenerator || function(thisArg, _arguments, generator) {
      if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
      var g3 = generator.apply(thisArg, _arguments || []), i2, q2 = [];
      return i2 = {}, verb("next"), verb("throw"), verb("return"), i2[Symbol.asyncIterator] = function() {
        return this;
      }, i2;
      function verb(n5) {
        if (g3[n5]) i2[n5] = function(v3) {
          return new Promise(function(a3, b3) {
            q2.push([n5, v3, a3, b3]) > 1 || resume(n5, v3);
          });
        };
      }
      function resume(n5, v3) {
        try {
          step(g3[n5](v3));
        } catch (e5) {
          settle(q2[0][3], e5);
        }
      }
      function step(r5) {
        r5.value instanceof __await ? Promise.resolve(r5.value.v).then(fulfill, reject) : settle(q2[0][2], r5);
      }
      function fulfill(value) {
        resume("next", value);
      }
      function reject(value) {
        resume("throw", value);
      }
      function settle(f3, v3) {
        if (f3(v3), q2.shift(), q2.length) resume(q2[0][0], q2[0][1]);
      }
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isReadableStreamLike = exports2.readableStreamLikeToAsyncGenerator = void 0;
    var isFunction_1 = require_isFunction();
    function readableStreamLikeToAsyncGenerator(readableStream) {
      return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
        var reader, _a, value, done;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              reader = readableStream.getReader();
              _b.label = 1;
            case 1:
              _b.trys.push([1, , 9, 10]);
              _b.label = 2;
            case 2:
              if (false) return [3, 8];
              return [4, __await(reader.read())];
            case 3:
              _a = _b.sent(), value = _a.value, done = _a.done;
              if (!done) return [3, 5];
              return [4, __await(void 0)];
            case 4:
              return [2, _b.sent()];
            case 5:
              return [4, __await(value)];
            case 6:
              return [4, _b.sent()];
            case 7:
              _b.sent();
              return [3, 2];
            case 8:
              return [3, 10];
            case 9:
              reader.releaseLock();
              return [7];
            case 10:
              return [2];
          }
        });
      });
    }
    exports2.readableStreamLikeToAsyncGenerator = readableStreamLikeToAsyncGenerator;
    function isReadableStreamLike(obj) {
      return isFunction_1.isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
    }
    exports2.isReadableStreamLike = isReadableStreamLike;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/innerFrom.js
var require_innerFrom = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/innerFrom.js"(exports2) {
    "use strict";
    var __awaiter = exports2 && exports2.__awaiter || function(thisArg, _arguments, P2, generator) {
      function adopt(value) {
        return value instanceof P2 ? value : new P2(function(resolve) {
          resolve(value);
        });
      }
      return new (P2 || (P2 = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e5) {
            reject(e5);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e5) {
            reject(e5);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports2 && exports2.__generator || function(thisArg, body) {
      var _2 = { label: 0, sent: function() {
        if (t4[0] & 1) throw t4[1];
        return t4[1];
      }, trys: [], ops: [] }, f3, y3, t4, g3;
      return g3 = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g3[Symbol.iterator] = function() {
        return this;
      }), g3;
      function verb(n5) {
        return function(v3) {
          return step([n5, v3]);
        };
      }
      function step(op) {
        if (f3) throw new TypeError("Generator is already executing.");
        while (_2) try {
          if (f3 = 1, y3 && (t4 = op[0] & 2 ? y3["return"] : op[0] ? y3["throw"] || ((t4 = y3["return"]) && t4.call(y3), 0) : y3.next) && !(t4 = t4.call(y3, op[1])).done) return t4;
          if (y3 = 0, t4) op = [op[0] & 2, t4.value];
          switch (op[0]) {
            case 0:
            case 1:
              t4 = op;
              break;
            case 4:
              _2.label++;
              return { value: op[1], done: false };
            case 5:
              _2.label++;
              y3 = op[1];
              op = [0];
              continue;
            case 7:
              op = _2.ops.pop();
              _2.trys.pop();
              continue;
            default:
              if (!(t4 = _2.trys, t4 = t4.length > 0 && t4[t4.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _2 = 0;
                continue;
              }
              if (op[0] === 3 && (!t4 || op[1] > t4[0] && op[1] < t4[3])) {
                _2.label = op[1];
                break;
              }
              if (op[0] === 6 && _2.label < t4[1]) {
                _2.label = t4[1];
                t4 = op;
                break;
              }
              if (t4 && _2.label < t4[2]) {
                _2.label = t4[2];
                _2.ops.push(op);
                break;
              }
              if (t4[2]) _2.ops.pop();
              _2.trys.pop();
              continue;
          }
          op = body.call(thisArg, _2);
        } catch (e5) {
          op = [6, e5];
          y3 = 0;
        } finally {
          f3 = t4 = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    var __asyncValues = exports2 && exports2.__asyncValues || function(o5) {
      if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
      var m2 = o5[Symbol.asyncIterator], i2;
      return m2 ? m2.call(o5) : (o5 = typeof __values === "function" ? __values(o5) : o5[Symbol.iterator](), i2 = {}, verb("next"), verb("throw"), verb("return"), i2[Symbol.asyncIterator] = function() {
        return this;
      }, i2);
      function verb(n5) {
        i2[n5] = o5[n5] && function(v3) {
          return new Promise(function(resolve, reject) {
            v3 = o5[n5](v3), settle(resolve, reject, v3.done, v3.value);
          });
        };
      }
      function settle(resolve, reject, d2, v3) {
        Promise.resolve(v3).then(function(v4) {
          resolve({ value: v4, done: d2 });
        }, reject);
      }
    };
    var __values = exports2 && exports2.__values || function(o5) {
      var s4 = typeof Symbol === "function" && Symbol.iterator, m2 = s4 && o5[s4], i2 = 0;
      if (m2) return m2.call(o5);
      if (o5 && typeof o5.length === "number") return {
        next: function() {
          if (o5 && i2 >= o5.length) o5 = void 0;
          return { value: o5 && o5[i2++], done: !o5 };
        }
      };
      throw new TypeError(s4 ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fromReadableStreamLike = exports2.fromAsyncIterable = exports2.fromIterable = exports2.fromPromise = exports2.fromArrayLike = exports2.fromInteropObservable = exports2.innerFrom = void 0;
    var isArrayLike_1 = require_isArrayLike();
    var isPromise_1 = require_isPromise();
    var Observable_1 = require_Observable();
    var isInteropObservable_1 = require_isInteropObservable();
    var isAsyncIterable_1 = require_isAsyncIterable();
    var throwUnobservableError_1 = require_throwUnobservableError();
    var isIterable_1 = require_isIterable();
    var isReadableStreamLike_1 = require_isReadableStreamLike();
    var isFunction_1 = require_isFunction();
    var reportUnhandledError_1 = require_reportUnhandledError();
    var observable_1 = require_observable();
    function innerFrom(input) {
      if (input instanceof Observable_1.Observable) {
        return input;
      }
      if (input != null) {
        if (isInteropObservable_1.isInteropObservable(input)) {
          return fromInteropObservable(input);
        }
        if (isArrayLike_1.isArrayLike(input)) {
          return fromArrayLike(input);
        }
        if (isPromise_1.isPromise(input)) {
          return fromPromise(input);
        }
        if (isAsyncIterable_1.isAsyncIterable(input)) {
          return fromAsyncIterable(input);
        }
        if (isIterable_1.isIterable(input)) {
          return fromIterable(input);
        }
        if (isReadableStreamLike_1.isReadableStreamLike(input)) {
          return fromReadableStreamLike(input);
        }
      }
      throw throwUnobservableError_1.createInvalidObservableTypeError(input);
    }
    exports2.innerFrom = innerFrom;
    function fromInteropObservable(obj) {
      return new Observable_1.Observable(function(subscriber) {
        var obs = obj[observable_1.observable]();
        if (isFunction_1.isFunction(obs.subscribe)) {
          return obs.subscribe(subscriber);
        }
        throw new TypeError("Provided object does not correctly implement Symbol.observable");
      });
    }
    exports2.fromInteropObservable = fromInteropObservable;
    function fromArrayLike(array) {
      return new Observable_1.Observable(function(subscriber) {
        for (var i2 = 0; i2 < array.length && !subscriber.closed; i2++) {
          subscriber.next(array[i2]);
        }
        subscriber.complete();
      });
    }
    exports2.fromArrayLike = fromArrayLike;
    function fromPromise(promise) {
      return new Observable_1.Observable(function(subscriber) {
        promise.then(function(value) {
          if (!subscriber.closed) {
            subscriber.next(value);
            subscriber.complete();
          }
        }, function(err) {
          return subscriber.error(err);
        }).then(null, reportUnhandledError_1.reportUnhandledError);
      });
    }
    exports2.fromPromise = fromPromise;
    function fromIterable(iterable) {
      return new Observable_1.Observable(function(subscriber) {
        var e_1, _a;
        try {
          for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
            var value = iterable_1_1.value;
            subscriber.next(value);
            if (subscriber.closed) {
              return;
            }
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) _a.call(iterable_1);
          } finally {
            if (e_1) throw e_1.error;
          }
        }
        subscriber.complete();
      });
    }
    exports2.fromIterable = fromIterable;
    function fromAsyncIterable(asyncIterable) {
      return new Observable_1.Observable(function(subscriber) {
        process2(asyncIterable, subscriber).catch(function(err) {
          return subscriber.error(err);
        });
      });
    }
    exports2.fromAsyncIterable = fromAsyncIterable;
    function fromReadableStreamLike(readableStream) {
      return fromAsyncIterable(isReadableStreamLike_1.readableStreamLikeToAsyncGenerator(readableStream));
    }
    exports2.fromReadableStreamLike = fromReadableStreamLike;
    function process2(asyncIterable, subscriber) {
      var asyncIterable_1, asyncIterable_1_1;
      var e_2, _a;
      return __awaiter(this, void 0, void 0, function() {
        var value, e_2_1;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              _b.trys.push([0, 5, 6, 11]);
              asyncIterable_1 = __asyncValues(asyncIterable);
              _b.label = 1;
            case 1:
              return [4, asyncIterable_1.next()];
            case 2:
              if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
              value = asyncIterable_1_1.value;
              subscriber.next(value);
              if (subscriber.closed) {
                return [2];
              }
              _b.label = 3;
            case 3:
              return [3, 1];
            case 4:
              return [3, 11];
            case 5:
              e_2_1 = _b.sent();
              e_2 = { error: e_2_1 };
              return [3, 11];
            case 6:
              _b.trys.push([6, , 9, 10]);
              if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return))) return [3, 8];
              return [4, _a.call(asyncIterable_1)];
            case 7:
              _b.sent();
              _b.label = 8;
            case 8:
              return [3, 10];
            case 9:
              if (e_2) throw e_2.error;
              return [7];
            case 10:
              return [7];
            case 11:
              subscriber.complete();
              return [2];
          }
        });
      });
    }
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/executeSchedule.js
var require_executeSchedule = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/executeSchedule.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.executeSchedule = void 0;
    function executeSchedule(parentSubscription, scheduler, work, delay, repeat) {
      if (delay === void 0) {
        delay = 0;
      }
      if (repeat === void 0) {
        repeat = false;
      }
      var scheduleSubscription = scheduler.schedule(function() {
        work();
        if (repeat) {
          parentSubscription.add(this.schedule(null, delay));
        } else {
          this.unsubscribe();
        }
      }, delay);
      parentSubscription.add(scheduleSubscription);
      if (!repeat) {
        return scheduleSubscription;
      }
    }
    exports2.executeSchedule = executeSchedule;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/observeOn.js
var require_observeOn = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/observeOn.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.observeOn = void 0;
    var executeSchedule_1 = require_executeSchedule();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function observeOn(scheduler, delay) {
      if (delay === void 0) {
        delay = 0;
      }
      return lift_1.operate(function(source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
            return subscriber.next(value);
          }, delay);
        }, function() {
          return executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
            return subscriber.complete();
          }, delay);
        }, function(err) {
          return executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
            return subscriber.error(err);
          }, delay);
        }));
      });
    }
    exports2.observeOn = observeOn;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/subscribeOn.js
var require_subscribeOn = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/subscribeOn.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.subscribeOn = void 0;
    var lift_1 = require_lift();
    function subscribeOn(scheduler, delay) {
      if (delay === void 0) {
        delay = 0;
      }
      return lift_1.operate(function(source, subscriber) {
        subscriber.add(scheduler.schedule(function() {
          return source.subscribe(subscriber);
        }, delay));
      });
    }
    exports2.subscribeOn = subscribeOn;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/scheduleObservable.js
var require_scheduleObservable = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/scheduleObservable.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.scheduleObservable = void 0;
    var innerFrom_1 = require_innerFrom();
    var observeOn_1 = require_observeOn();
    var subscribeOn_1 = require_subscribeOn();
    function scheduleObservable(input, scheduler) {
      return innerFrom_1.innerFrom(input).pipe(subscribeOn_1.subscribeOn(scheduler), observeOn_1.observeOn(scheduler));
    }
    exports2.scheduleObservable = scheduleObservable;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/schedulePromise.js
var require_schedulePromise = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/schedulePromise.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.schedulePromise = void 0;
    var innerFrom_1 = require_innerFrom();
    var observeOn_1 = require_observeOn();
    var subscribeOn_1 = require_subscribeOn();
    function schedulePromise(input, scheduler) {
      return innerFrom_1.innerFrom(input).pipe(subscribeOn_1.subscribeOn(scheduler), observeOn_1.observeOn(scheduler));
    }
    exports2.schedulePromise = schedulePromise;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/scheduleArray.js
var require_scheduleArray = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/scheduleArray.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.scheduleArray = void 0;
    var Observable_1 = require_Observable();
    function scheduleArray(input, scheduler) {
      return new Observable_1.Observable(function(subscriber) {
        var i2 = 0;
        return scheduler.schedule(function() {
          if (i2 === input.length) {
            subscriber.complete();
          } else {
            subscriber.next(input[i2++]);
            if (!subscriber.closed) {
              this.schedule();
            }
          }
        });
      });
    }
    exports2.scheduleArray = scheduleArray;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/scheduleIterable.js
var require_scheduleIterable = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/scheduleIterable.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.scheduleIterable = void 0;
    var Observable_1 = require_Observable();
    var iterator_1 = require_iterator();
    var isFunction_1 = require_isFunction();
    var executeSchedule_1 = require_executeSchedule();
    function scheduleIterable(input, scheduler) {
      return new Observable_1.Observable(function(subscriber) {
        var iterator;
        executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
          iterator = input[iterator_1.iterator]();
          executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
            var _a;
            var value;
            var done;
            try {
              _a = iterator.next(), value = _a.value, done = _a.done;
            } catch (err) {
              subscriber.error(err);
              return;
            }
            if (done) {
              subscriber.complete();
            } else {
              subscriber.next(value);
            }
          }, 0, true);
        });
        return function() {
          return isFunction_1.isFunction(iterator === null || iterator === void 0 ? void 0 : iterator.return) && iterator.return();
        };
      });
    }
    exports2.scheduleIterable = scheduleIterable;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/scheduleAsyncIterable.js
var require_scheduleAsyncIterable = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/scheduleAsyncIterable.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.scheduleAsyncIterable = void 0;
    var Observable_1 = require_Observable();
    var executeSchedule_1 = require_executeSchedule();
    function scheduleAsyncIterable(input, scheduler) {
      if (!input) {
        throw new Error("Iterable cannot be null");
      }
      return new Observable_1.Observable(function(subscriber) {
        executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
          var iterator = input[Symbol.asyncIterator]();
          executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
            iterator.next().then(function(result) {
              if (result.done) {
                subscriber.complete();
              } else {
                subscriber.next(result.value);
              }
            });
          }, 0, true);
        });
      });
    }
    exports2.scheduleAsyncIterable = scheduleAsyncIterable;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/scheduleReadableStreamLike.js
var require_scheduleReadableStreamLike = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/scheduleReadableStreamLike.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.scheduleReadableStreamLike = void 0;
    var scheduleAsyncIterable_1 = require_scheduleAsyncIterable();
    var isReadableStreamLike_1 = require_isReadableStreamLike();
    function scheduleReadableStreamLike(input, scheduler) {
      return scheduleAsyncIterable_1.scheduleAsyncIterable(isReadableStreamLike_1.readableStreamLikeToAsyncGenerator(input), scheduler);
    }
    exports2.scheduleReadableStreamLike = scheduleReadableStreamLike;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/scheduled.js
var require_scheduled = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/scheduled/scheduled.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.scheduled = void 0;
    var scheduleObservable_1 = require_scheduleObservable();
    var schedulePromise_1 = require_schedulePromise();
    var scheduleArray_1 = require_scheduleArray();
    var scheduleIterable_1 = require_scheduleIterable();
    var scheduleAsyncIterable_1 = require_scheduleAsyncIterable();
    var isInteropObservable_1 = require_isInteropObservable();
    var isPromise_1 = require_isPromise();
    var isArrayLike_1 = require_isArrayLike();
    var isIterable_1 = require_isIterable();
    var isAsyncIterable_1 = require_isAsyncIterable();
    var throwUnobservableError_1 = require_throwUnobservableError();
    var isReadableStreamLike_1 = require_isReadableStreamLike();
    var scheduleReadableStreamLike_1 = require_scheduleReadableStreamLike();
    function scheduled(input, scheduler) {
      if (input != null) {
        if (isInteropObservable_1.isInteropObservable(input)) {
          return scheduleObservable_1.scheduleObservable(input, scheduler);
        }
        if (isArrayLike_1.isArrayLike(input)) {
          return scheduleArray_1.scheduleArray(input, scheduler);
        }
        if (isPromise_1.isPromise(input)) {
          return schedulePromise_1.schedulePromise(input, scheduler);
        }
        if (isAsyncIterable_1.isAsyncIterable(input)) {
          return scheduleAsyncIterable_1.scheduleAsyncIterable(input, scheduler);
        }
        if (isIterable_1.isIterable(input)) {
          return scheduleIterable_1.scheduleIterable(input, scheduler);
        }
        if (isReadableStreamLike_1.isReadableStreamLike(input)) {
          return scheduleReadableStreamLike_1.scheduleReadableStreamLike(input, scheduler);
        }
      }
      throw throwUnobservableError_1.createInvalidObservableTypeError(input);
    }
    exports2.scheduled = scheduled;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/from.js
var require_from2 = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/from.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.from = void 0;
    var scheduled_1 = require_scheduled();
    var innerFrom_1 = require_innerFrom();
    function from2(input, scheduler) {
      return scheduler ? scheduled_1.scheduled(input, scheduler) : innerFrom_1.innerFrom(input);
    }
    exports2.from = from2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/of.js
var require_of = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/of.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.of = void 0;
    var args_1 = require_args();
    var from_1 = require_from2();
    function of2() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var scheduler = args_1.popScheduler(args);
      return from_1.from(args, scheduler);
    }
    exports2.of = of2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/throwError.js
var require_throwError = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/throwError.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.throwError = void 0;
    var Observable_1 = require_Observable();
    var isFunction_1 = require_isFunction();
    function throwError2(errorOrErrorFactory, scheduler) {
      var errorFactory = isFunction_1.isFunction(errorOrErrorFactory) ? errorOrErrorFactory : function() {
        return errorOrErrorFactory;
      };
      var init = function(subscriber) {
        return subscriber.error(errorFactory());
      };
      return new Observable_1.Observable(scheduler ? function(subscriber) {
        return scheduler.schedule(init, 0, subscriber);
      } : init);
    }
    exports2.throwError = throwError2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/Notification.js
var require_Notification = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/Notification.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.observeNotification = exports2.Notification = exports2.NotificationKind = void 0;
    var empty_1 = require_empty();
    var of_1 = require_of();
    var throwError_1 = require_throwError();
    var isFunction_1 = require_isFunction();
    var NotificationKind;
    (function(NotificationKind2) {
      NotificationKind2["NEXT"] = "N";
      NotificationKind2["ERROR"] = "E";
      NotificationKind2["COMPLETE"] = "C";
    })(NotificationKind = exports2.NotificationKind || (exports2.NotificationKind = {}));
    var Notification = (function() {
      function Notification2(kind, value, error) {
        this.kind = kind;
        this.value = value;
        this.error = error;
        this.hasValue = kind === "N";
      }
      Notification2.prototype.observe = function(observer) {
        return observeNotification(this, observer);
      };
      Notification2.prototype.do = function(nextHandler, errorHandler, completeHandler) {
        var _a = this, kind = _a.kind, value = _a.value, error = _a.error;
        return kind === "N" ? nextHandler === null || nextHandler === void 0 ? void 0 : nextHandler(value) : kind === "E" ? errorHandler === null || errorHandler === void 0 ? void 0 : errorHandler(error) : completeHandler === null || completeHandler === void 0 ? void 0 : completeHandler();
      };
      Notification2.prototype.accept = function(nextOrObserver, error, complete) {
        var _a;
        return isFunction_1.isFunction((_a = nextOrObserver) === null || _a === void 0 ? void 0 : _a.next) ? this.observe(nextOrObserver) : this.do(nextOrObserver, error, complete);
      };
      Notification2.prototype.toObservable = function() {
        var _a = this, kind = _a.kind, value = _a.value, error = _a.error;
        var result = kind === "N" ? of_1.of(value) : kind === "E" ? throwError_1.throwError(function() {
          return error;
        }) : kind === "C" ? empty_1.EMPTY : 0;
        if (!result) {
          throw new TypeError("Unexpected notification kind " + kind);
        }
        return result;
      };
      Notification2.createNext = function(value) {
        return new Notification2("N", value);
      };
      Notification2.createError = function(err) {
        return new Notification2("E", void 0, err);
      };
      Notification2.createComplete = function() {
        return Notification2.completeNotification;
      };
      Notification2.completeNotification = new Notification2("C");
      return Notification2;
    })();
    exports2.Notification = Notification;
    function observeNotification(notification, observer) {
      var _a, _b, _c;
      var _d = notification, kind = _d.kind, value = _d.value, error = _d.error;
      if (typeof kind !== "string") {
        throw new TypeError('Invalid notification, missing "kind"');
      }
      kind === "N" ? (_a = observer.next) === null || _a === void 0 ? void 0 : _a.call(observer, value) : kind === "E" ? (_b = observer.error) === null || _b === void 0 ? void 0 : _b.call(observer, error) : (_c = observer.complete) === null || _c === void 0 ? void 0 : _c.call(observer);
    }
    exports2.observeNotification = observeNotification;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isObservable.js
var require_isObservable = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isObservable.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isObservable = void 0;
    var Observable_1 = require_Observable();
    var isFunction_1 = require_isFunction();
    function isObservable2(obj) {
      return !!obj && (obj instanceof Observable_1.Observable || isFunction_1.isFunction(obj.lift) && isFunction_1.isFunction(obj.subscribe));
    }
    exports2.isObservable = isObservable2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/EmptyError.js
var require_EmptyError = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/EmptyError.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.EmptyError = void 0;
    var createErrorClass_1 = require_createErrorClass();
    exports2.EmptyError = createErrorClass_1.createErrorClass(function(_super) {
      return function EmptyErrorImpl() {
        _super(this);
        this.name = "EmptyError";
        this.message = "no elements in sequence";
      };
    });
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/lastValueFrom.js
var require_lastValueFrom = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/lastValueFrom.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.lastValueFrom = void 0;
    var EmptyError_1 = require_EmptyError();
    function lastValueFrom2(source, config) {
      var hasConfig = typeof config === "object";
      return new Promise(function(resolve, reject) {
        var _hasValue = false;
        var _value;
        source.subscribe({
          next: function(value) {
            _value = value;
            _hasValue = true;
          },
          error: reject,
          complete: function() {
            if (_hasValue) {
              resolve(_value);
            } else if (hasConfig) {
              resolve(config.defaultValue);
            } else {
              reject(new EmptyError_1.EmptyError());
            }
          }
        });
      });
    }
    exports2.lastValueFrom = lastValueFrom2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/firstValueFrom.js
var require_firstValueFrom = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/firstValueFrom.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.firstValueFrom = void 0;
    var EmptyError_1 = require_EmptyError();
    var Subscriber_1 = require_Subscriber();
    function firstValueFrom2(source, config) {
      var hasConfig = typeof config === "object";
      return new Promise(function(resolve, reject) {
        var subscriber = new Subscriber_1.SafeSubscriber({
          next: function(value) {
            resolve(value);
            subscriber.unsubscribe();
          },
          error: reject,
          complete: function() {
            if (hasConfig) {
              resolve(config.defaultValue);
            } else {
              reject(new EmptyError_1.EmptyError());
            }
          }
        });
        source.subscribe(subscriber);
      });
    }
    exports2.firstValueFrom = firstValueFrom2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/ArgumentOutOfRangeError.js
var require_ArgumentOutOfRangeError = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/ArgumentOutOfRangeError.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ArgumentOutOfRangeError = void 0;
    var createErrorClass_1 = require_createErrorClass();
    exports2.ArgumentOutOfRangeError = createErrorClass_1.createErrorClass(function(_super) {
      return function ArgumentOutOfRangeErrorImpl() {
        _super(this);
        this.name = "ArgumentOutOfRangeError";
        this.message = "argument out of range";
      };
    });
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/NotFoundError.js
var require_NotFoundError = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/NotFoundError.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NotFoundError = void 0;
    var createErrorClass_1 = require_createErrorClass();
    exports2.NotFoundError = createErrorClass_1.createErrorClass(function(_super) {
      return function NotFoundErrorImpl(message) {
        _super(this);
        this.name = "NotFoundError";
        this.message = message;
      };
    });
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/SequenceError.js
var require_SequenceError = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/SequenceError.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SequenceError = void 0;
    var createErrorClass_1 = require_createErrorClass();
    exports2.SequenceError = createErrorClass_1.createErrorClass(function(_super) {
      return function SequenceErrorImpl(message) {
        _super(this);
        this.name = "SequenceError";
        this.message = message;
      };
    });
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isDate.js
var require_isDate = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/isDate.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isValidDate = void 0;
    function isValidDate2(value) {
      return value instanceof Date && !isNaN(value);
    }
    exports2.isValidDate = isValidDate2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/timeout.js
var require_timeout = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/timeout.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.timeout = exports2.TimeoutError = void 0;
    var async_1 = require_async();
    var isDate_1 = require_isDate();
    var lift_1 = require_lift();
    var innerFrom_1 = require_innerFrom();
    var createErrorClass_1 = require_createErrorClass();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var executeSchedule_1 = require_executeSchedule();
    exports2.TimeoutError = createErrorClass_1.createErrorClass(function(_super) {
      return function TimeoutErrorImpl(info) {
        if (info === void 0) {
          info = null;
        }
        _super(this);
        this.message = "Timeout has occurred";
        this.name = "TimeoutError";
        this.info = info;
      };
    });
    function timeout(config, schedulerArg) {
      var _a = isDate_1.isValidDate(config) ? { first: config } : typeof config === "number" ? { each: config } : config, first = _a.first, each = _a.each, _b = _a.with, _with = _b === void 0 ? timeoutErrorFactory : _b, _c = _a.scheduler, scheduler = _c === void 0 ? schedulerArg !== null && schedulerArg !== void 0 ? schedulerArg : async_1.asyncScheduler : _c, _d = _a.meta, meta = _d === void 0 ? null : _d;
      if (first == null && each == null) {
        throw new TypeError("No timeout provided.");
      }
      return lift_1.operate(function(source, subscriber) {
        var originalSourceSubscription;
        var timerSubscription;
        var lastValue = null;
        var seen = 0;
        var startTimer = function(delay) {
          timerSubscription = executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
            try {
              originalSourceSubscription.unsubscribe();
              innerFrom_1.innerFrom(_with({
                meta,
                lastValue,
                seen
              })).subscribe(subscriber);
            } catch (err) {
              subscriber.error(err);
            }
          }, delay);
        };
        originalSourceSubscription = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
          seen++;
          subscriber.next(lastValue = value);
          each > 0 && startTimer(each);
        }, void 0, void 0, function() {
          if (!(timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.closed)) {
            timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
          }
          lastValue = null;
        }));
        !seen && startTimer(first != null ? typeof first === "number" ? first : +first - scheduler.now() : each);
      });
    }
    exports2.timeout = timeout;
    function timeoutErrorFactory(info) {
      throw new exports2.TimeoutError(info);
    }
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/map.js
var require_map = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/map.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.map = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function map2(project, thisArg) {
      return lift_1.operate(function(source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          subscriber.next(project.call(thisArg, value, index++));
        }));
      });
    }
    exports2.map = map2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/mapOneOrManyArgs.js
var require_mapOneOrManyArgs = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/mapOneOrManyArgs.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mapOneOrManyArgs = void 0;
    var map_1 = require_map();
    var isArray2 = Array.isArray;
    function callOrApply(fn, args) {
      return isArray2(args) ? fn.apply(void 0, __spreadArray([], __read(args))) : fn(args);
    }
    function mapOneOrManyArgs(fn) {
      return map_1.map(function(args) {
        return callOrApply(fn, args);
      });
    }
    exports2.mapOneOrManyArgs = mapOneOrManyArgs;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/bindCallbackInternals.js
var require_bindCallbackInternals = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/bindCallbackInternals.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.bindCallbackInternals = void 0;
    var isScheduler_1 = require_isScheduler();
    var Observable_1 = require_Observable();
    var subscribeOn_1 = require_subscribeOn();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    var observeOn_1 = require_observeOn();
    var AsyncSubject_1 = require_AsyncSubject();
    function bindCallbackInternals(isNodeStyle, callbackFunc, resultSelector, scheduler) {
      if (resultSelector) {
        if (isScheduler_1.isScheduler(resultSelector)) {
          scheduler = resultSelector;
        } else {
          return function() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
            }
            return bindCallbackInternals(isNodeStyle, callbackFunc, scheduler).apply(this, args).pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector));
          };
        }
      }
      if (scheduler) {
        return function() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          return bindCallbackInternals(isNodeStyle, callbackFunc).apply(this, args).pipe(subscribeOn_1.subscribeOn(scheduler), observeOn_1.observeOn(scheduler));
        };
      }
      return function() {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        var subject = new AsyncSubject_1.AsyncSubject();
        var uninitialized = true;
        return new Observable_1.Observable(function(subscriber) {
          var subs = subject.subscribe(subscriber);
          if (uninitialized) {
            uninitialized = false;
            var isAsync_1 = false;
            var isComplete_1 = false;
            callbackFunc.apply(_this, __spreadArray(__spreadArray([], __read(args)), [
              function() {
                var results = [];
                for (var _i2 = 0; _i2 < arguments.length; _i2++) {
                  results[_i2] = arguments[_i2];
                }
                if (isNodeStyle) {
                  var err = results.shift();
                  if (err != null) {
                    subject.error(err);
                    return;
                  }
                }
                subject.next(1 < results.length ? results : results[0]);
                isComplete_1 = true;
                if (isAsync_1) {
                  subject.complete();
                }
              }
            ]));
            if (isComplete_1) {
              subject.complete();
            }
            isAsync_1 = true;
          }
          return subs;
        });
      };
    }
    exports2.bindCallbackInternals = bindCallbackInternals;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/bindCallback.js
var require_bindCallback = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/bindCallback.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.bindCallback = void 0;
    var bindCallbackInternals_1 = require_bindCallbackInternals();
    function bindCallback(callbackFunc, resultSelector, scheduler) {
      return bindCallbackInternals_1.bindCallbackInternals(false, callbackFunc, resultSelector, scheduler);
    }
    exports2.bindCallback = bindCallback;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/bindNodeCallback.js
var require_bindNodeCallback = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/bindNodeCallback.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.bindNodeCallback = void 0;
    var bindCallbackInternals_1 = require_bindCallbackInternals();
    function bindNodeCallback(callbackFunc, resultSelector, scheduler) {
      return bindCallbackInternals_1.bindCallbackInternals(true, callbackFunc, resultSelector, scheduler);
    }
    exports2.bindNodeCallback = bindNodeCallback;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/argsArgArrayOrObject.js
var require_argsArgArrayOrObject = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/argsArgArrayOrObject.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.argsArgArrayOrObject = void 0;
    var isArray2 = Array.isArray;
    var getPrototypeOf = Object.getPrototypeOf;
    var objectProto = Object.prototype;
    var getKeys = Object.keys;
    function argsArgArrayOrObject(args) {
      if (args.length === 1) {
        var first_1 = args[0];
        if (isArray2(first_1)) {
          return { args: first_1, keys: null };
        }
        if (isPOJO(first_1)) {
          var keys = getKeys(first_1);
          return {
            args: keys.map(function(key) {
              return first_1[key];
            }),
            keys
          };
        }
      }
      return { args, keys: null };
    }
    exports2.argsArgArrayOrObject = argsArgArrayOrObject;
    function isPOJO(obj) {
      return obj && typeof obj === "object" && getPrototypeOf(obj) === objectProto;
    }
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/createObject.js
var require_createObject = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/createObject.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createObject = void 0;
    function createObject(keys, values) {
      return keys.reduce(function(result, key, i2) {
        return result[key] = values[i2], result;
      }, {});
    }
    exports2.createObject = createObject;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/combineLatest.js
var require_combineLatest = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/combineLatest.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.combineLatestInit = exports2.combineLatest = void 0;
    var Observable_1 = require_Observable();
    var argsArgArrayOrObject_1 = require_argsArgArrayOrObject();
    var from_1 = require_from2();
    var identity_1 = require_identity();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    var args_1 = require_args();
    var createObject_1 = require_createObject();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var executeSchedule_1 = require_executeSchedule();
    function combineLatest() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var scheduler = args_1.popScheduler(args);
      var resultSelector = args_1.popResultSelector(args);
      var _a = argsArgArrayOrObject_1.argsArgArrayOrObject(args), observables = _a.args, keys = _a.keys;
      if (observables.length === 0) {
        return from_1.from([], scheduler);
      }
      var result = new Observable_1.Observable(combineLatestInit(observables, scheduler, keys ? function(values) {
        return createObject_1.createObject(keys, values);
      } : identity_1.identity));
      return resultSelector ? result.pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector)) : result;
    }
    exports2.combineLatest = combineLatest;
    function combineLatestInit(observables, scheduler, valueTransform) {
      if (valueTransform === void 0) {
        valueTransform = identity_1.identity;
      }
      return function(subscriber) {
        maybeSchedule(scheduler, function() {
          var length = observables.length;
          var values = new Array(length);
          var active = length;
          var remainingFirstValues = length;
          var _loop_1 = function(i3) {
            maybeSchedule(scheduler, function() {
              var source = from_1.from(observables[i3], scheduler);
              var hasFirstValue = false;
              source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
                values[i3] = value;
                if (!hasFirstValue) {
                  hasFirstValue = true;
                  remainingFirstValues--;
                }
                if (!remainingFirstValues) {
                  subscriber.next(valueTransform(values.slice()));
                }
              }, function() {
                if (!--active) {
                  subscriber.complete();
                }
              }));
            }, subscriber);
          };
          for (var i2 = 0; i2 < length; i2++) {
            _loop_1(i2);
          }
        }, subscriber);
      };
    }
    exports2.combineLatestInit = combineLatestInit;
    function maybeSchedule(scheduler, execute, subscription) {
      if (scheduler) {
        executeSchedule_1.executeSchedule(subscription, scheduler, execute);
      } else {
        execute();
      }
    }
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mergeInternals.js
var require_mergeInternals = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mergeInternals.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mergeInternals = void 0;
    var innerFrom_1 = require_innerFrom();
    var executeSchedule_1 = require_executeSchedule();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
      var buffer = [];
      var active = 0;
      var index = 0;
      var isComplete = false;
      var checkComplete = function() {
        if (isComplete && !buffer.length && !active) {
          subscriber.complete();
        }
      };
      var outerNext = function(value) {
        return active < concurrent ? doInnerSub(value) : buffer.push(value);
      };
      var doInnerSub = function(value) {
        expand && subscriber.next(value);
        active++;
        var innerComplete = false;
        innerFrom_1.innerFrom(project(value, index++)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(innerValue) {
          onBeforeNext === null || onBeforeNext === void 0 ? void 0 : onBeforeNext(innerValue);
          if (expand) {
            outerNext(innerValue);
          } else {
            subscriber.next(innerValue);
          }
        }, function() {
          innerComplete = true;
        }, void 0, function() {
          if (innerComplete) {
            try {
              active--;
              var _loop_1 = function() {
                var bufferedValue = buffer.shift();
                if (innerSubScheduler) {
                  executeSchedule_1.executeSchedule(subscriber, innerSubScheduler, function() {
                    return doInnerSub(bufferedValue);
                  });
                } else {
                  doInnerSub(bufferedValue);
                }
              };
              while (buffer.length && active < concurrent) {
                _loop_1();
              }
              checkComplete();
            } catch (err) {
              subscriber.error(err);
            }
          }
        }));
      };
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, outerNext, function() {
        isComplete = true;
        checkComplete();
      }));
      return function() {
        additionalFinalizer === null || additionalFinalizer === void 0 ? void 0 : additionalFinalizer();
      };
    }
    exports2.mergeInternals = mergeInternals;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mergeMap.js
var require_mergeMap = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mergeMap.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mergeMap = void 0;
    var map_1 = require_map();
    var innerFrom_1 = require_innerFrom();
    var lift_1 = require_lift();
    var mergeInternals_1 = require_mergeInternals();
    var isFunction_1 = require_isFunction();
    function mergeMap2(project, resultSelector, concurrent) {
      if (concurrent === void 0) {
        concurrent = Infinity;
      }
      if (isFunction_1.isFunction(resultSelector)) {
        return mergeMap2(function(a3, i2) {
          return map_1.map(function(b3, ii) {
            return resultSelector(a3, b3, i2, ii);
          })(innerFrom_1.innerFrom(project(a3, i2)));
        }, concurrent);
      } else if (typeof resultSelector === "number") {
        concurrent = resultSelector;
      }
      return lift_1.operate(function(source, subscriber) {
        return mergeInternals_1.mergeInternals(source, subscriber, project, concurrent);
      });
    }
    exports2.mergeMap = mergeMap2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mergeAll.js
var require_mergeAll = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mergeAll.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mergeAll = void 0;
    var mergeMap_1 = require_mergeMap();
    var identity_1 = require_identity();
    function mergeAll(concurrent) {
      if (concurrent === void 0) {
        concurrent = Infinity;
      }
      return mergeMap_1.mergeMap(identity_1.identity, concurrent);
    }
    exports2.mergeAll = mergeAll;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/concatAll.js
var require_concatAll = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/concatAll.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.concatAll = void 0;
    var mergeAll_1 = require_mergeAll();
    function concatAll() {
      return mergeAll_1.mergeAll(1);
    }
    exports2.concatAll = concatAll;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/concat.js
var require_concat = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/concat.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.concat = void 0;
    var concatAll_1 = require_concatAll();
    var args_1 = require_args();
    var from_1 = require_from2();
    function concat2() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return concatAll_1.concatAll()(from_1.from(args, args_1.popScheduler(args)));
    }
    exports2.concat = concat2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/defer.js
var require_defer = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/defer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.defer = void 0;
    var Observable_1 = require_Observable();
    var innerFrom_1 = require_innerFrom();
    function defer2(observableFactory) {
      return new Observable_1.Observable(function(subscriber) {
        innerFrom_1.innerFrom(observableFactory()).subscribe(subscriber);
      });
    }
    exports2.defer = defer2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/connectable.js
var require_connectable = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/connectable.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.connectable = void 0;
    var Subject_1 = require_Subject();
    var Observable_1 = require_Observable();
    var defer_1 = require_defer();
    var DEFAULT_CONFIG = {
      connector: function() {
        return new Subject_1.Subject();
      },
      resetOnDisconnect: true
    };
    function connectable(source, config) {
      if (config === void 0) {
        config = DEFAULT_CONFIG;
      }
      var connection = null;
      var connector = config.connector, _a = config.resetOnDisconnect, resetOnDisconnect = _a === void 0 ? true : _a;
      var subject = connector();
      var result = new Observable_1.Observable(function(subscriber) {
        return subject.subscribe(subscriber);
      });
      result.connect = function() {
        if (!connection || connection.closed) {
          connection = defer_1.defer(function() {
            return source;
          }).subscribe(subject);
          if (resetOnDisconnect) {
            connection.add(function() {
              return subject = connector();
            });
          }
        }
        return connection;
      };
      return result;
    }
    exports2.connectable = connectable;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/forkJoin.js
var require_forkJoin = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/forkJoin.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.forkJoin = void 0;
    var Observable_1 = require_Observable();
    var argsArgArrayOrObject_1 = require_argsArgArrayOrObject();
    var innerFrom_1 = require_innerFrom();
    var args_1 = require_args();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    var createObject_1 = require_createObject();
    function forkJoin() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var resultSelector = args_1.popResultSelector(args);
      var _a = argsArgArrayOrObject_1.argsArgArrayOrObject(args), sources = _a.args, keys = _a.keys;
      var result = new Observable_1.Observable(function(subscriber) {
        var length = sources.length;
        if (!length) {
          subscriber.complete();
          return;
        }
        var values = new Array(length);
        var remainingCompletions = length;
        var remainingEmissions = length;
        var _loop_1 = function(sourceIndex2) {
          var hasValue = false;
          innerFrom_1.innerFrom(sources[sourceIndex2]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
            if (!hasValue) {
              hasValue = true;
              remainingEmissions--;
            }
            values[sourceIndex2] = value;
          }, function() {
            return remainingCompletions--;
          }, void 0, function() {
            if (!remainingCompletions || !hasValue) {
              if (!remainingEmissions) {
                subscriber.next(keys ? createObject_1.createObject(keys, values) : values);
              }
              subscriber.complete();
            }
          }));
        };
        for (var sourceIndex = 0; sourceIndex < length; sourceIndex++) {
          _loop_1(sourceIndex);
        }
      });
      return resultSelector ? result.pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector)) : result;
    }
    exports2.forkJoin = forkJoin;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/fromEvent.js
var require_fromEvent = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/fromEvent.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fromEvent = void 0;
    var innerFrom_1 = require_innerFrom();
    var Observable_1 = require_Observable();
    var mergeMap_1 = require_mergeMap();
    var isArrayLike_1 = require_isArrayLike();
    var isFunction_1 = require_isFunction();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    var nodeEventEmitterMethods = ["addListener", "removeListener"];
    var eventTargetMethods = ["addEventListener", "removeEventListener"];
    var jqueryMethods = ["on", "off"];
    function fromEvent(target, eventName, options, resultSelector) {
      if (isFunction_1.isFunction(options)) {
        resultSelector = options;
        options = void 0;
      }
      if (resultSelector) {
        return fromEvent(target, eventName, options).pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector));
      }
      var _a = __read(isEventTarget(target) ? eventTargetMethods.map(function(methodName) {
        return function(handler) {
          return target[methodName](eventName, handler, options);
        };
      }) : isNodeStyleEventEmitter(target) ? nodeEventEmitterMethods.map(toCommonHandlerRegistry(target, eventName)) : isJQueryStyleEventEmitter(target) ? jqueryMethods.map(toCommonHandlerRegistry(target, eventName)) : [], 2), add = _a[0], remove = _a[1];
      if (!add) {
        if (isArrayLike_1.isArrayLike(target)) {
          return mergeMap_1.mergeMap(function(subTarget) {
            return fromEvent(subTarget, eventName, options);
          })(innerFrom_1.innerFrom(target));
        }
      }
      if (!add) {
        throw new TypeError("Invalid event target");
      }
      return new Observable_1.Observable(function(subscriber) {
        var handler = function() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          return subscriber.next(1 < args.length ? args : args[0]);
        };
        add(handler);
        return function() {
          return remove(handler);
        };
      });
    }
    exports2.fromEvent = fromEvent;
    function toCommonHandlerRegistry(target, eventName) {
      return function(methodName) {
        return function(handler) {
          return target[methodName](eventName, handler);
        };
      };
    }
    function isNodeStyleEventEmitter(target) {
      return isFunction_1.isFunction(target.addListener) && isFunction_1.isFunction(target.removeListener);
    }
    function isJQueryStyleEventEmitter(target) {
      return isFunction_1.isFunction(target.on) && isFunction_1.isFunction(target.off);
    }
    function isEventTarget(target) {
      return isFunction_1.isFunction(target.addEventListener) && isFunction_1.isFunction(target.removeEventListener);
    }
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/fromEventPattern.js
var require_fromEventPattern = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/fromEventPattern.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fromEventPattern = void 0;
    var Observable_1 = require_Observable();
    var isFunction_1 = require_isFunction();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    function fromEventPattern(addHandler, removeHandler, resultSelector) {
      if (resultSelector) {
        return fromEventPattern(addHandler, removeHandler).pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector));
      }
      return new Observable_1.Observable(function(subscriber) {
        var handler = function() {
          var e5 = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            e5[_i] = arguments[_i];
          }
          return subscriber.next(e5.length === 1 ? e5[0] : e5);
        };
        var retValue = addHandler(handler);
        return isFunction_1.isFunction(removeHandler) ? function() {
          return removeHandler(handler, retValue);
        } : void 0;
      });
    }
    exports2.fromEventPattern = fromEventPattern;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/generate.js
var require_generate = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/generate.js"(exports2) {
    "use strict";
    var __generator = exports2 && exports2.__generator || function(thisArg, body) {
      var _2 = { label: 0, sent: function() {
        if (t4[0] & 1) throw t4[1];
        return t4[1];
      }, trys: [], ops: [] }, f3, y3, t4, g3;
      return g3 = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g3[Symbol.iterator] = function() {
        return this;
      }), g3;
      function verb(n5) {
        return function(v3) {
          return step([n5, v3]);
        };
      }
      function step(op) {
        if (f3) throw new TypeError("Generator is already executing.");
        while (_2) try {
          if (f3 = 1, y3 && (t4 = op[0] & 2 ? y3["return"] : op[0] ? y3["throw"] || ((t4 = y3["return"]) && t4.call(y3), 0) : y3.next) && !(t4 = t4.call(y3, op[1])).done) return t4;
          if (y3 = 0, t4) op = [op[0] & 2, t4.value];
          switch (op[0]) {
            case 0:
            case 1:
              t4 = op;
              break;
            case 4:
              _2.label++;
              return { value: op[1], done: false };
            case 5:
              _2.label++;
              y3 = op[1];
              op = [0];
              continue;
            case 7:
              op = _2.ops.pop();
              _2.trys.pop();
              continue;
            default:
              if (!(t4 = _2.trys, t4 = t4.length > 0 && t4[t4.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _2 = 0;
                continue;
              }
              if (op[0] === 3 && (!t4 || op[1] > t4[0] && op[1] < t4[3])) {
                _2.label = op[1];
                break;
              }
              if (op[0] === 6 && _2.label < t4[1]) {
                _2.label = t4[1];
                t4 = op;
                break;
              }
              if (t4 && _2.label < t4[2]) {
                _2.label = t4[2];
                _2.ops.push(op);
                break;
              }
              if (t4[2]) _2.ops.pop();
              _2.trys.pop();
              continue;
          }
          op = body.call(thisArg, _2);
        } catch (e5) {
          op = [6, e5];
          y3 = 0;
        } finally {
          f3 = t4 = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.generate = void 0;
    var identity_1 = require_identity();
    var isScheduler_1 = require_isScheduler();
    var defer_1 = require_defer();
    var scheduleIterable_1 = require_scheduleIterable();
    function generate(initialStateOrOptions, condition, iterate, resultSelectorOrScheduler, scheduler) {
      var _a, _b;
      var resultSelector;
      var initialState;
      if (arguments.length === 1) {
        _a = initialStateOrOptions, initialState = _a.initialState, condition = _a.condition, iterate = _a.iterate, _b = _a.resultSelector, resultSelector = _b === void 0 ? identity_1.identity : _b, scheduler = _a.scheduler;
      } else {
        initialState = initialStateOrOptions;
        if (!resultSelectorOrScheduler || isScheduler_1.isScheduler(resultSelectorOrScheduler)) {
          resultSelector = identity_1.identity;
          scheduler = resultSelectorOrScheduler;
        } else {
          resultSelector = resultSelectorOrScheduler;
        }
      }
      function gen() {
        var state;
        return __generator(this, function(_a2) {
          switch (_a2.label) {
            case 0:
              state = initialState;
              _a2.label = 1;
            case 1:
              if (!(!condition || condition(state))) return [3, 4];
              return [4, resultSelector(state)];
            case 2:
              _a2.sent();
              _a2.label = 3;
            case 3:
              state = iterate(state);
              return [3, 1];
            case 4:
              return [2];
          }
        });
      }
      return defer_1.defer(scheduler ? function() {
        return scheduleIterable_1.scheduleIterable(gen(), scheduler);
      } : gen);
    }
    exports2.generate = generate;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/iif.js
var require_iif = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/iif.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.iif = void 0;
    var defer_1 = require_defer();
    function iif(condition, trueResult, falseResult) {
      return defer_1.defer(function() {
        return condition() ? trueResult : falseResult;
      });
    }
    exports2.iif = iif;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/timer.js
var require_timer = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/timer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.timer = void 0;
    var Observable_1 = require_Observable();
    var async_1 = require_async();
    var isScheduler_1 = require_isScheduler();
    var isDate_1 = require_isDate();
    function timer2(dueTime, intervalOrScheduler, scheduler) {
      if (dueTime === void 0) {
        dueTime = 0;
      }
      if (scheduler === void 0) {
        scheduler = async_1.async;
      }
      var intervalDuration = -1;
      if (intervalOrScheduler != null) {
        if (isScheduler_1.isScheduler(intervalOrScheduler)) {
          scheduler = intervalOrScheduler;
        } else {
          intervalDuration = intervalOrScheduler;
        }
      }
      return new Observable_1.Observable(function(subscriber) {
        var due = isDate_1.isValidDate(dueTime) ? +dueTime - scheduler.now() : dueTime;
        if (due < 0) {
          due = 0;
        }
        var n5 = 0;
        return scheduler.schedule(function() {
          if (!subscriber.closed) {
            subscriber.next(n5++);
            if (0 <= intervalDuration) {
              this.schedule(void 0, intervalDuration);
            } else {
              subscriber.complete();
            }
          }
        }, due);
      });
    }
    exports2.timer = timer2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/interval.js
var require_interval = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/interval.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.interval = void 0;
    var async_1 = require_async();
    var timer_1 = require_timer();
    function interval(period, scheduler) {
      if (period === void 0) {
        period = 0;
      }
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      if (period < 0) {
        period = 0;
      }
      return timer_1.timer(period, period, scheduler);
    }
    exports2.interval = interval;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/merge.js
var require_merge = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/merge.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.merge = void 0;
    var mergeAll_1 = require_mergeAll();
    var innerFrom_1 = require_innerFrom();
    var empty_1 = require_empty();
    var args_1 = require_args();
    var from_1 = require_from2();
    function merge2() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var scheduler = args_1.popScheduler(args);
      var concurrent = args_1.popNumber(args, Infinity);
      var sources = args;
      return !sources.length ? empty_1.EMPTY : sources.length === 1 ? innerFrom_1.innerFrom(sources[0]) : mergeAll_1.mergeAll(concurrent)(from_1.from(sources, scheduler));
    }
    exports2.merge = merge2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/never.js
var require_never = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/never.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.never = exports2.NEVER = void 0;
    var Observable_1 = require_Observable();
    var noop_1 = require_noop();
    exports2.NEVER = new Observable_1.Observable(noop_1.noop);
    function never() {
      return exports2.NEVER;
    }
    exports2.never = never;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/argsOrArgArray.js
var require_argsOrArgArray = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/argsOrArgArray.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.argsOrArgArray = void 0;
    var isArray2 = Array.isArray;
    function argsOrArgArray(args) {
      return args.length === 1 && isArray2(args[0]) ? args[0] : args;
    }
    exports2.argsOrArgArray = argsOrArgArray;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/onErrorResumeNext.js
var require_onErrorResumeNext = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/onErrorResumeNext.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.onErrorResumeNext = void 0;
    var Observable_1 = require_Observable();
    var argsOrArgArray_1 = require_argsOrArgArray();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var noop_1 = require_noop();
    var innerFrom_1 = require_innerFrom();
    function onErrorResumeNext() {
      var sources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
      }
      var nextSources = argsOrArgArray_1.argsOrArgArray(sources);
      return new Observable_1.Observable(function(subscriber) {
        var sourceIndex = 0;
        var subscribeNext = function() {
          if (sourceIndex < nextSources.length) {
            var nextSource = void 0;
            try {
              nextSource = innerFrom_1.innerFrom(nextSources[sourceIndex++]);
            } catch (err) {
              subscribeNext();
              return;
            }
            var innerSubscriber = new OperatorSubscriber_1.OperatorSubscriber(subscriber, void 0, noop_1.noop, noop_1.noop);
            nextSource.subscribe(innerSubscriber);
            innerSubscriber.add(subscribeNext);
          } else {
            subscriber.complete();
          }
        };
        subscribeNext();
      });
    }
    exports2.onErrorResumeNext = onErrorResumeNext;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/pairs.js
var require_pairs = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/pairs.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.pairs = void 0;
    var from_1 = require_from2();
    function pairs(obj, scheduler) {
      return from_1.from(Object.entries(obj), scheduler);
    }
    exports2.pairs = pairs;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/not.js
var require_not = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/util/not.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.not = void 0;
    function not(pred, thisArg) {
      return function(value, index) {
        return !pred.call(thisArg, value, index);
      };
    }
    exports2.not = not;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/filter.js
var require_filter = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/filter.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.filter = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function filter2(predicate, thisArg) {
      return lift_1.operate(function(source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return predicate.call(thisArg, value, index++) && subscriber.next(value);
        }));
      });
    }
    exports2.filter = filter2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/partition.js
var require_partition = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/partition.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.partition = void 0;
    var not_1 = require_not();
    var filter_1 = require_filter();
    var innerFrom_1 = require_innerFrom();
    function partition(source, predicate, thisArg) {
      return [filter_1.filter(predicate, thisArg)(innerFrom_1.innerFrom(source)), filter_1.filter(not_1.not(predicate, thisArg))(innerFrom_1.innerFrom(source))];
    }
    exports2.partition = partition;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/race.js
var require_race = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/race.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.raceInit = exports2.race = void 0;
    var Observable_1 = require_Observable();
    var innerFrom_1 = require_innerFrom();
    var argsOrArgArray_1 = require_argsOrArgArray();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function race() {
      var sources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
      }
      sources = argsOrArgArray_1.argsOrArgArray(sources);
      return sources.length === 1 ? innerFrom_1.innerFrom(sources[0]) : new Observable_1.Observable(raceInit(sources));
    }
    exports2.race = race;
    function raceInit(sources) {
      return function(subscriber) {
        var subscriptions = [];
        var _loop_1 = function(i3) {
          subscriptions.push(innerFrom_1.innerFrom(sources[i3]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
            if (subscriptions) {
              for (var s4 = 0; s4 < subscriptions.length; s4++) {
                s4 !== i3 && subscriptions[s4].unsubscribe();
              }
              subscriptions = null;
            }
            subscriber.next(value);
          })));
        };
        for (var i2 = 0; subscriptions && !subscriber.closed && i2 < sources.length; i2++) {
          _loop_1(i2);
        }
      };
    }
    exports2.raceInit = raceInit;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/range.js
var require_range = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/range.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.range = void 0;
    var Observable_1 = require_Observable();
    var empty_1 = require_empty();
    function range(start, count, scheduler) {
      if (count == null) {
        count = start;
        start = 0;
      }
      if (count <= 0) {
        return empty_1.EMPTY;
      }
      var end = count + start;
      return new Observable_1.Observable(scheduler ? function(subscriber) {
        var n5 = start;
        return scheduler.schedule(function() {
          if (n5 < end) {
            subscriber.next(n5++);
            this.schedule();
          } else {
            subscriber.complete();
          }
        });
      } : function(subscriber) {
        var n5 = start;
        while (n5 < end && !subscriber.closed) {
          subscriber.next(n5++);
        }
        subscriber.complete();
      });
    }
    exports2.range = range;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/using.js
var require_using = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/using.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.using = void 0;
    var Observable_1 = require_Observable();
    var innerFrom_1 = require_innerFrom();
    var empty_1 = require_empty();
    function using(resourceFactory, observableFactory) {
      return new Observable_1.Observable(function(subscriber) {
        var resource = resourceFactory();
        var result = observableFactory(resource);
        var source = result ? innerFrom_1.innerFrom(result) : empty_1.EMPTY;
        source.subscribe(subscriber);
        return function() {
          if (resource) {
            resource.unsubscribe();
          }
        };
      });
    }
    exports2.using = using;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/zip.js
var require_zip = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/zip.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.zip = void 0;
    var Observable_1 = require_Observable();
    var innerFrom_1 = require_innerFrom();
    var argsOrArgArray_1 = require_argsOrArgArray();
    var empty_1 = require_empty();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var args_1 = require_args();
    function zip() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var resultSelector = args_1.popResultSelector(args);
      var sources = argsOrArgArray_1.argsOrArgArray(args);
      return sources.length ? new Observable_1.Observable(function(subscriber) {
        var buffers = sources.map(function() {
          return [];
        });
        var completed = sources.map(function() {
          return false;
        });
        subscriber.add(function() {
          buffers = completed = null;
        });
        var _loop_1 = function(sourceIndex2) {
          innerFrom_1.innerFrom(sources[sourceIndex2]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
            buffers[sourceIndex2].push(value);
            if (buffers.every(function(buffer) {
              return buffer.length;
            })) {
              var result = buffers.map(function(buffer) {
                return buffer.shift();
              });
              subscriber.next(resultSelector ? resultSelector.apply(void 0, __spreadArray([], __read(result))) : result);
              if (buffers.some(function(buffer, i2) {
                return !buffer.length && completed[i2];
              })) {
                subscriber.complete();
              }
            }
          }, function() {
            completed[sourceIndex2] = true;
            !buffers[sourceIndex2].length && subscriber.complete();
          }));
        };
        for (var sourceIndex = 0; !subscriber.closed && sourceIndex < sources.length; sourceIndex++) {
          _loop_1(sourceIndex);
        }
        return function() {
          buffers = completed = null;
        };
      }) : empty_1.EMPTY;
    }
    exports2.zip = zip;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/types.js
var require_types = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/audit.js
var require_audit = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/audit.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.audit = void 0;
    var lift_1 = require_lift();
    var innerFrom_1 = require_innerFrom();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function audit(durationSelector) {
      return lift_1.operate(function(source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        var durationSubscriber = null;
        var isComplete = false;
        var endDuration = function() {
          durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
          durationSubscriber = null;
          if (hasValue) {
            hasValue = false;
            var value = lastValue;
            lastValue = null;
            subscriber.next(value);
          }
          isComplete && subscriber.complete();
        };
        var cleanupDuration = function() {
          durationSubscriber = null;
          isComplete && subscriber.complete();
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          hasValue = true;
          lastValue = value;
          if (!durationSubscriber) {
            innerFrom_1.innerFrom(durationSelector(value)).subscribe(durationSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, endDuration, cleanupDuration));
          }
        }, function() {
          isComplete = true;
          (!hasValue || !durationSubscriber || durationSubscriber.closed) && subscriber.complete();
        }));
      });
    }
    exports2.audit = audit;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/auditTime.js
var require_auditTime = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/auditTime.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.auditTime = void 0;
    var async_1 = require_async();
    var audit_1 = require_audit();
    var timer_1 = require_timer();
    function auditTime(duration, scheduler) {
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      return audit_1.audit(function() {
        return timer_1.timer(duration, scheduler);
      });
    }
    exports2.auditTime = auditTime;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/buffer.js
var require_buffer = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/buffer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.buffer = void 0;
    var lift_1 = require_lift();
    var noop_1 = require_noop();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    function buffer(closingNotifier) {
      return lift_1.operate(function(source, subscriber) {
        var currentBuffer = [];
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return currentBuffer.push(value);
        }, function() {
          subscriber.next(currentBuffer);
          subscriber.complete();
        }));
        innerFrom_1.innerFrom(closingNotifier).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          var b3 = currentBuffer;
          currentBuffer = [];
          subscriber.next(b3);
        }, noop_1.noop));
        return function() {
          currentBuffer = null;
        };
      });
    }
    exports2.buffer = buffer;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/bufferCount.js
var require_bufferCount = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/bufferCount.js"(exports2) {
    "use strict";
    var __values = exports2 && exports2.__values || function(o5) {
      var s4 = typeof Symbol === "function" && Symbol.iterator, m2 = s4 && o5[s4], i2 = 0;
      if (m2) return m2.call(o5);
      if (o5 && typeof o5.length === "number") return {
        next: function() {
          if (o5 && i2 >= o5.length) o5 = void 0;
          return { value: o5 && o5[i2++], done: !o5 };
        }
      };
      throw new TypeError(s4 ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.bufferCount = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var arrRemove_1 = require_arrRemove();
    function bufferCount(bufferSize, startBufferEvery) {
      if (startBufferEvery === void 0) {
        startBufferEvery = null;
      }
      startBufferEvery = startBufferEvery !== null && startBufferEvery !== void 0 ? startBufferEvery : bufferSize;
      return lift_1.operate(function(source, subscriber) {
        var buffers = [];
        var count = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var e_1, _a, e_2, _b;
          var toEmit = null;
          if (count++ % startBufferEvery === 0) {
            buffers.push([]);
          }
          try {
            for (var buffers_1 = __values(buffers), buffers_1_1 = buffers_1.next(); !buffers_1_1.done; buffers_1_1 = buffers_1.next()) {
              var buffer = buffers_1_1.value;
              buffer.push(value);
              if (bufferSize <= buffer.length) {
                toEmit = toEmit !== null && toEmit !== void 0 ? toEmit : [];
                toEmit.push(buffer);
              }
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (buffers_1_1 && !buffers_1_1.done && (_a = buffers_1.return)) _a.call(buffers_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
          if (toEmit) {
            try {
              for (var toEmit_1 = __values(toEmit), toEmit_1_1 = toEmit_1.next(); !toEmit_1_1.done; toEmit_1_1 = toEmit_1.next()) {
                var buffer = toEmit_1_1.value;
                arrRemove_1.arrRemove(buffers, buffer);
                subscriber.next(buffer);
              }
            } catch (e_2_1) {
              e_2 = { error: e_2_1 };
            } finally {
              try {
                if (toEmit_1_1 && !toEmit_1_1.done && (_b = toEmit_1.return)) _b.call(toEmit_1);
              } finally {
                if (e_2) throw e_2.error;
              }
            }
          }
        }, function() {
          var e_3, _a;
          try {
            for (var buffers_2 = __values(buffers), buffers_2_1 = buffers_2.next(); !buffers_2_1.done; buffers_2_1 = buffers_2.next()) {
              var buffer = buffers_2_1.value;
              subscriber.next(buffer);
            }
          } catch (e_3_1) {
            e_3 = { error: e_3_1 };
          } finally {
            try {
              if (buffers_2_1 && !buffers_2_1.done && (_a = buffers_2.return)) _a.call(buffers_2);
            } finally {
              if (e_3) throw e_3.error;
            }
          }
          subscriber.complete();
        }, void 0, function() {
          buffers = null;
        }));
      });
    }
    exports2.bufferCount = bufferCount;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/bufferTime.js
var require_bufferTime = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/bufferTime.js"(exports2) {
    "use strict";
    var __values = exports2 && exports2.__values || function(o5) {
      var s4 = typeof Symbol === "function" && Symbol.iterator, m2 = s4 && o5[s4], i2 = 0;
      if (m2) return m2.call(o5);
      if (o5 && typeof o5.length === "number") return {
        next: function() {
          if (o5 && i2 >= o5.length) o5 = void 0;
          return { value: o5 && o5[i2++], done: !o5 };
        }
      };
      throw new TypeError(s4 ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.bufferTime = void 0;
    var Subscription_1 = require_Subscription();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var arrRemove_1 = require_arrRemove();
    var async_1 = require_async();
    var args_1 = require_args();
    var executeSchedule_1 = require_executeSchedule();
    function bufferTime(bufferTimeSpan) {
      var _a, _b;
      var otherArgs = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        otherArgs[_i - 1] = arguments[_i];
      }
      var scheduler = (_a = args_1.popScheduler(otherArgs)) !== null && _a !== void 0 ? _a : async_1.asyncScheduler;
      var bufferCreationInterval = (_b = otherArgs[0]) !== null && _b !== void 0 ? _b : null;
      var maxBufferSize = otherArgs[1] || Infinity;
      return lift_1.operate(function(source, subscriber) {
        var bufferRecords = [];
        var restartOnEmit = false;
        var emit = function(record) {
          var buffer = record.buffer, subs = record.subs;
          subs.unsubscribe();
          arrRemove_1.arrRemove(bufferRecords, record);
          subscriber.next(buffer);
          restartOnEmit && startBuffer();
        };
        var startBuffer = function() {
          if (bufferRecords) {
            var subs = new Subscription_1.Subscription();
            subscriber.add(subs);
            var buffer = [];
            var record_1 = {
              buffer,
              subs
            };
            bufferRecords.push(record_1);
            executeSchedule_1.executeSchedule(subs, scheduler, function() {
              return emit(record_1);
            }, bufferTimeSpan);
          }
        };
        if (bufferCreationInterval !== null && bufferCreationInterval >= 0) {
          executeSchedule_1.executeSchedule(subscriber, scheduler, startBuffer, bufferCreationInterval, true);
        } else {
          restartOnEmit = true;
        }
        startBuffer();
        var bufferTimeSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var e_1, _a2;
          var recordsCopy = bufferRecords.slice();
          try {
            for (var recordsCopy_1 = __values(recordsCopy), recordsCopy_1_1 = recordsCopy_1.next(); !recordsCopy_1_1.done; recordsCopy_1_1 = recordsCopy_1.next()) {
              var record = recordsCopy_1_1.value;
              var buffer = record.buffer;
              buffer.push(value);
              maxBufferSize <= buffer.length && emit(record);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (recordsCopy_1_1 && !recordsCopy_1_1.done && (_a2 = recordsCopy_1.return)) _a2.call(recordsCopy_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
        }, function() {
          while (bufferRecords === null || bufferRecords === void 0 ? void 0 : bufferRecords.length) {
            subscriber.next(bufferRecords.shift().buffer);
          }
          bufferTimeSubscriber === null || bufferTimeSubscriber === void 0 ? void 0 : bufferTimeSubscriber.unsubscribe();
          subscriber.complete();
          subscriber.unsubscribe();
        }, void 0, function() {
          return bufferRecords = null;
        });
        source.subscribe(bufferTimeSubscriber);
      });
    }
    exports2.bufferTime = bufferTime;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/bufferToggle.js
var require_bufferToggle = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/bufferToggle.js"(exports2) {
    "use strict";
    var __values = exports2 && exports2.__values || function(o5) {
      var s4 = typeof Symbol === "function" && Symbol.iterator, m2 = s4 && o5[s4], i2 = 0;
      if (m2) return m2.call(o5);
      if (o5 && typeof o5.length === "number") return {
        next: function() {
          if (o5 && i2 >= o5.length) o5 = void 0;
          return { value: o5 && o5[i2++], done: !o5 };
        }
      };
      throw new TypeError(s4 ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.bufferToggle = void 0;
    var Subscription_1 = require_Subscription();
    var lift_1 = require_lift();
    var innerFrom_1 = require_innerFrom();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var noop_1 = require_noop();
    var arrRemove_1 = require_arrRemove();
    function bufferToggle(openings, closingSelector) {
      return lift_1.operate(function(source, subscriber) {
        var buffers = [];
        innerFrom_1.innerFrom(openings).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(openValue) {
          var buffer = [];
          buffers.push(buffer);
          var closingSubscription = new Subscription_1.Subscription();
          var emitBuffer = function() {
            arrRemove_1.arrRemove(buffers, buffer);
            subscriber.next(buffer);
            closingSubscription.unsubscribe();
          };
          closingSubscription.add(innerFrom_1.innerFrom(closingSelector(openValue)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, emitBuffer, noop_1.noop)));
        }, noop_1.noop));
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var e_1, _a;
          try {
            for (var buffers_1 = __values(buffers), buffers_1_1 = buffers_1.next(); !buffers_1_1.done; buffers_1_1 = buffers_1.next()) {
              var buffer = buffers_1_1.value;
              buffer.push(value);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (buffers_1_1 && !buffers_1_1.done && (_a = buffers_1.return)) _a.call(buffers_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
        }, function() {
          while (buffers.length > 0) {
            subscriber.next(buffers.shift());
          }
          subscriber.complete();
        }));
      });
    }
    exports2.bufferToggle = bufferToggle;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/bufferWhen.js
var require_bufferWhen = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/bufferWhen.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.bufferWhen = void 0;
    var lift_1 = require_lift();
    var noop_1 = require_noop();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    function bufferWhen(closingSelector) {
      return lift_1.operate(function(source, subscriber) {
        var buffer = null;
        var closingSubscriber = null;
        var openBuffer = function() {
          closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
          var b3 = buffer;
          buffer = [];
          b3 && subscriber.next(b3);
          innerFrom_1.innerFrom(closingSelector()).subscribe(closingSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, openBuffer, noop_1.noop));
        };
        openBuffer();
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return buffer === null || buffer === void 0 ? void 0 : buffer.push(value);
        }, function() {
          buffer && subscriber.next(buffer);
          subscriber.complete();
        }, void 0, function() {
          return buffer = closingSubscriber = null;
        }));
      });
    }
    exports2.bufferWhen = bufferWhen;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/catchError.js
var require_catchError = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/catchError.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.catchError = void 0;
    var innerFrom_1 = require_innerFrom();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var lift_1 = require_lift();
    function catchError2(selector) {
      return lift_1.operate(function(source, subscriber) {
        var innerSub = null;
        var syncUnsub = false;
        var handledResult;
        innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, void 0, void 0, function(err) {
          handledResult = innerFrom_1.innerFrom(selector(err, catchError2(selector)(source)));
          if (innerSub) {
            innerSub.unsubscribe();
            innerSub = null;
            handledResult.subscribe(subscriber);
          } else {
            syncUnsub = true;
          }
        }));
        if (syncUnsub) {
          innerSub.unsubscribe();
          innerSub = null;
          handledResult.subscribe(subscriber);
        }
      });
    }
    exports2.catchError = catchError2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/scanInternals.js
var require_scanInternals = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/scanInternals.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.scanInternals = void 0;
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function scanInternals(accumulator, seed, hasSeed, emitOnNext, emitBeforeComplete) {
      return function(source, subscriber) {
        var hasState = hasSeed;
        var state = seed;
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var i2 = index++;
          state = hasState ? accumulator(state, value, i2) : (hasState = true, value);
          emitOnNext && subscriber.next(state);
        }, emitBeforeComplete && (function() {
          hasState && subscriber.next(state);
          subscriber.complete();
        })));
      };
    }
    exports2.scanInternals = scanInternals;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/reduce.js
var require_reduce = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/reduce.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.reduce = void 0;
    var scanInternals_1 = require_scanInternals();
    var lift_1 = require_lift();
    function reduce(accumulator, seed) {
      return lift_1.operate(scanInternals_1.scanInternals(accumulator, seed, arguments.length >= 2, false, true));
    }
    exports2.reduce = reduce;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/toArray.js
var require_toArray = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/toArray.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.toArray = void 0;
    var reduce_1 = require_reduce();
    var lift_1 = require_lift();
    var arrReducer = function(arr, value) {
      return arr.push(value), arr;
    };
    function toArray() {
      return lift_1.operate(function(source, subscriber) {
        reduce_1.reduce(arrReducer, [])(source).subscribe(subscriber);
      });
    }
    exports2.toArray = toArray;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/joinAllInternals.js
var require_joinAllInternals = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/joinAllInternals.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.joinAllInternals = void 0;
    var identity_1 = require_identity();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    var pipe_1 = require_pipe();
    var mergeMap_1 = require_mergeMap();
    var toArray_1 = require_toArray();
    function joinAllInternals(joinFn, project) {
      return pipe_1.pipe(toArray_1.toArray(), mergeMap_1.mergeMap(function(sources) {
        return joinFn(sources);
      }), project ? mapOneOrManyArgs_1.mapOneOrManyArgs(project) : identity_1.identity);
    }
    exports2.joinAllInternals = joinAllInternals;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/combineLatestAll.js
var require_combineLatestAll = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/combineLatestAll.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.combineLatestAll = void 0;
    var combineLatest_1 = require_combineLatest();
    var joinAllInternals_1 = require_joinAllInternals();
    function combineLatestAll(project) {
      return joinAllInternals_1.joinAllInternals(combineLatest_1.combineLatest, project);
    }
    exports2.combineLatestAll = combineLatestAll;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/combineAll.js
var require_combineAll = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/combineAll.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.combineAll = void 0;
    var combineLatestAll_1 = require_combineLatestAll();
    exports2.combineAll = combineLatestAll_1.combineLatestAll;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/combineLatest.js
var require_combineLatest2 = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/combineLatest.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.combineLatest = void 0;
    var combineLatest_1 = require_combineLatest();
    var lift_1 = require_lift();
    var argsOrArgArray_1 = require_argsOrArgArray();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    var pipe_1 = require_pipe();
    var args_1 = require_args();
    function combineLatest() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var resultSelector = args_1.popResultSelector(args);
      return resultSelector ? pipe_1.pipe(combineLatest.apply(void 0, __spreadArray([], __read(args))), mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector)) : lift_1.operate(function(source, subscriber) {
        combineLatest_1.combineLatestInit(__spreadArray([source], __read(argsOrArgArray_1.argsOrArgArray(args))))(subscriber);
      });
    }
    exports2.combineLatest = combineLatest;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/combineLatestWith.js
var require_combineLatestWith = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/combineLatestWith.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.combineLatestWith = void 0;
    var combineLatest_1 = require_combineLatest2();
    function combineLatestWith2() {
      var otherSources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
      }
      return combineLatest_1.combineLatest.apply(void 0, __spreadArray([], __read(otherSources)));
    }
    exports2.combineLatestWith = combineLatestWith2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/concatMap.js
var require_concatMap = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/concatMap.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.concatMap = void 0;
    var mergeMap_1 = require_mergeMap();
    var isFunction_1 = require_isFunction();
    function concatMap(project, resultSelector) {
      return isFunction_1.isFunction(resultSelector) ? mergeMap_1.mergeMap(project, resultSelector, 1) : mergeMap_1.mergeMap(project, 1);
    }
    exports2.concatMap = concatMap;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/concatMapTo.js
var require_concatMapTo = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/concatMapTo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.concatMapTo = void 0;
    var concatMap_1 = require_concatMap();
    var isFunction_1 = require_isFunction();
    function concatMapTo(innerObservable, resultSelector) {
      return isFunction_1.isFunction(resultSelector) ? concatMap_1.concatMap(function() {
        return innerObservable;
      }, resultSelector) : concatMap_1.concatMap(function() {
        return innerObservable;
      });
    }
    exports2.concatMapTo = concatMapTo;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/concat.js
var require_concat2 = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/concat.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.concat = void 0;
    var lift_1 = require_lift();
    var concatAll_1 = require_concatAll();
    var args_1 = require_args();
    var from_1 = require_from2();
    function concat2() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var scheduler = args_1.popScheduler(args);
      return lift_1.operate(function(source, subscriber) {
        concatAll_1.concatAll()(from_1.from(__spreadArray([source], __read(args)), scheduler)).subscribe(subscriber);
      });
    }
    exports2.concat = concat2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/concatWith.js
var require_concatWith = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/concatWith.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.concatWith = void 0;
    var concat_1 = require_concat2();
    function concatWith() {
      var otherSources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
      }
      return concat_1.concat.apply(void 0, __spreadArray([], __read(otherSources)));
    }
    exports2.concatWith = concatWith;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/fromSubscribable.js
var require_fromSubscribable = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/observable/fromSubscribable.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fromSubscribable = void 0;
    var Observable_1 = require_Observable();
    function fromSubscribable(subscribable) {
      return new Observable_1.Observable(function(subscriber) {
        return subscribable.subscribe(subscriber);
      });
    }
    exports2.fromSubscribable = fromSubscribable;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/connect.js
var require_connect = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/connect.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.connect = void 0;
    var Subject_1 = require_Subject();
    var innerFrom_1 = require_innerFrom();
    var lift_1 = require_lift();
    var fromSubscribable_1 = require_fromSubscribable();
    var DEFAULT_CONFIG = {
      connector: function() {
        return new Subject_1.Subject();
      }
    };
    function connect(selector, config) {
      if (config === void 0) {
        config = DEFAULT_CONFIG;
      }
      var connector = config.connector;
      return lift_1.operate(function(source, subscriber) {
        var subject = connector();
        innerFrom_1.innerFrom(selector(fromSubscribable_1.fromSubscribable(subject))).subscribe(subscriber);
        subscriber.add(source.subscribe(subject));
      });
    }
    exports2.connect = connect;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/count.js
var require_count = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/count.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.count = void 0;
    var reduce_1 = require_reduce();
    function count(predicate) {
      return reduce_1.reduce(function(total, value, i2) {
        return !predicate || predicate(value, i2) ? total + 1 : total;
      }, 0);
    }
    exports2.count = count;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/debounce.js
var require_debounce = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/debounce.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.debounce = void 0;
    var lift_1 = require_lift();
    var noop_1 = require_noop();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    function debounce(durationSelector) {
      return lift_1.operate(function(source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        var durationSubscriber = null;
        var emit = function() {
          durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
          durationSubscriber = null;
          if (hasValue) {
            hasValue = false;
            var value = lastValue;
            lastValue = null;
            subscriber.next(value);
          }
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
          hasValue = true;
          lastValue = value;
          durationSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, emit, noop_1.noop);
          innerFrom_1.innerFrom(durationSelector(value)).subscribe(durationSubscriber);
        }, function() {
          emit();
          subscriber.complete();
        }, void 0, function() {
          lastValue = durationSubscriber = null;
        }));
      });
    }
    exports2.debounce = debounce;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/debounceTime.js
var require_debounceTime = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/debounceTime.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.debounceTime = void 0;
    var async_1 = require_async();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function debounceTime(dueTime, scheduler) {
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      return lift_1.operate(function(source, subscriber) {
        var activeTask = null;
        var lastValue = null;
        var lastTime = null;
        var emit = function() {
          if (activeTask) {
            activeTask.unsubscribe();
            activeTask = null;
            var value = lastValue;
            lastValue = null;
            subscriber.next(value);
          }
        };
        function emitWhenIdle() {
          var targetTime = lastTime + dueTime;
          var now = scheduler.now();
          if (now < targetTime) {
            activeTask = this.schedule(void 0, targetTime - now);
            subscriber.add(activeTask);
            return;
          }
          emit();
        }
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          lastValue = value;
          lastTime = scheduler.now();
          if (!activeTask) {
            activeTask = scheduler.schedule(emitWhenIdle, dueTime);
            subscriber.add(activeTask);
          }
        }, function() {
          emit();
          subscriber.complete();
        }, void 0, function() {
          lastValue = activeTask = null;
        }));
      });
    }
    exports2.debounceTime = debounceTime;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/defaultIfEmpty.js
var require_defaultIfEmpty = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/defaultIfEmpty.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.defaultIfEmpty = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function defaultIfEmpty(defaultValue) {
      return lift_1.operate(function(source, subscriber) {
        var hasValue = false;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          hasValue = true;
          subscriber.next(value);
        }, function() {
          if (!hasValue) {
            subscriber.next(defaultValue);
          }
          subscriber.complete();
        }));
      });
    }
    exports2.defaultIfEmpty = defaultIfEmpty;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/take.js
var require_take = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/take.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.take = void 0;
    var empty_1 = require_empty();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function take(count) {
      return count <= 0 ? function() {
        return empty_1.EMPTY;
      } : lift_1.operate(function(source, subscriber) {
        var seen = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          if (++seen <= count) {
            subscriber.next(value);
            if (count <= seen) {
              subscriber.complete();
            }
          }
        }));
      });
    }
    exports2.take = take;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/ignoreElements.js
var require_ignoreElements = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/ignoreElements.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ignoreElements = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var noop_1 = require_noop();
    function ignoreElements() {
      return lift_1.operate(function(source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, noop_1.noop));
      });
    }
    exports2.ignoreElements = ignoreElements;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mapTo.js
var require_mapTo = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mapTo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mapTo = void 0;
    var map_1 = require_map();
    function mapTo(value) {
      return map_1.map(function() {
        return value;
      });
    }
    exports2.mapTo = mapTo;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/delayWhen.js
var require_delayWhen = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/delayWhen.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.delayWhen = void 0;
    var concat_1 = require_concat();
    var take_1 = require_take();
    var ignoreElements_1 = require_ignoreElements();
    var mapTo_1 = require_mapTo();
    var mergeMap_1 = require_mergeMap();
    var innerFrom_1 = require_innerFrom();
    function delayWhen(delayDurationSelector, subscriptionDelay) {
      if (subscriptionDelay) {
        return function(source) {
          return concat_1.concat(subscriptionDelay.pipe(take_1.take(1), ignoreElements_1.ignoreElements()), source.pipe(delayWhen(delayDurationSelector)));
        };
      }
      return mergeMap_1.mergeMap(function(value, index) {
        return innerFrom_1.innerFrom(delayDurationSelector(value, index)).pipe(take_1.take(1), mapTo_1.mapTo(value));
      });
    }
    exports2.delayWhen = delayWhen;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/delay.js
var require_delay = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/delay.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.delay = void 0;
    var async_1 = require_async();
    var delayWhen_1 = require_delayWhen();
    var timer_1 = require_timer();
    function delay(due, scheduler) {
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      var duration = timer_1.timer(due, scheduler);
      return delayWhen_1.delayWhen(function() {
        return duration;
      });
    }
    exports2.delay = delay;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/dematerialize.js
var require_dematerialize = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/dematerialize.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.dematerialize = void 0;
    var Notification_1 = require_Notification();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function dematerialize() {
      return lift_1.operate(function(source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(notification) {
          return Notification_1.observeNotification(notification, subscriber);
        }));
      });
    }
    exports2.dematerialize = dematerialize;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/distinct.js
var require_distinct = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/distinct.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.distinct = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var noop_1 = require_noop();
    var innerFrom_1 = require_innerFrom();
    function distinct(keySelector, flushes) {
      return lift_1.operate(function(source, subscriber) {
        var distinctKeys = /* @__PURE__ */ new Set();
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var key = keySelector ? keySelector(value) : value;
          if (!distinctKeys.has(key)) {
            distinctKeys.add(key);
            subscriber.next(value);
          }
        }));
        flushes && innerFrom_1.innerFrom(flushes).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          return distinctKeys.clear();
        }, noop_1.noop));
      });
    }
    exports2.distinct = distinct;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/distinctUntilChanged.js
var require_distinctUntilChanged = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/distinctUntilChanged.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.distinctUntilChanged = void 0;
    var identity_1 = require_identity();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function distinctUntilChanged(comparator, keySelector) {
      if (keySelector === void 0) {
        keySelector = identity_1.identity;
      }
      comparator = comparator !== null && comparator !== void 0 ? comparator : defaultCompare;
      return lift_1.operate(function(source, subscriber) {
        var previousKey;
        var first = true;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var currentKey = keySelector(value);
          if (first || !comparator(previousKey, currentKey)) {
            first = false;
            previousKey = currentKey;
            subscriber.next(value);
          }
        }));
      });
    }
    exports2.distinctUntilChanged = distinctUntilChanged;
    function defaultCompare(a3, b3) {
      return a3 === b3;
    }
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/distinctUntilKeyChanged.js
var require_distinctUntilKeyChanged = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/distinctUntilKeyChanged.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.distinctUntilKeyChanged = void 0;
    var distinctUntilChanged_1 = require_distinctUntilChanged();
    function distinctUntilKeyChanged(key, compare) {
      return distinctUntilChanged_1.distinctUntilChanged(function(x3, y3) {
        return compare ? compare(x3[key], y3[key]) : x3[key] === y3[key];
      });
    }
    exports2.distinctUntilKeyChanged = distinctUntilKeyChanged;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/throwIfEmpty.js
var require_throwIfEmpty = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/throwIfEmpty.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.throwIfEmpty = void 0;
    var EmptyError_1 = require_EmptyError();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function throwIfEmpty(errorFactory) {
      if (errorFactory === void 0) {
        errorFactory = defaultErrorFactory;
      }
      return lift_1.operate(function(source, subscriber) {
        var hasValue = false;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          hasValue = true;
          subscriber.next(value);
        }, function() {
          return hasValue ? subscriber.complete() : subscriber.error(errorFactory());
        }));
      });
    }
    exports2.throwIfEmpty = throwIfEmpty;
    function defaultErrorFactory() {
      return new EmptyError_1.EmptyError();
    }
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/elementAt.js
var require_elementAt = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/elementAt.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.elementAt = void 0;
    var ArgumentOutOfRangeError_1 = require_ArgumentOutOfRangeError();
    var filter_1 = require_filter();
    var throwIfEmpty_1 = require_throwIfEmpty();
    var defaultIfEmpty_1 = require_defaultIfEmpty();
    var take_1 = require_take();
    function elementAt(index, defaultValue) {
      if (index < 0) {
        throw new ArgumentOutOfRangeError_1.ArgumentOutOfRangeError();
      }
      var hasDefaultValue = arguments.length >= 2;
      return function(source) {
        return source.pipe(filter_1.filter(function(v3, i2) {
          return i2 === index;
        }), take_1.take(1), hasDefaultValue ? defaultIfEmpty_1.defaultIfEmpty(defaultValue) : throwIfEmpty_1.throwIfEmpty(function() {
          return new ArgumentOutOfRangeError_1.ArgumentOutOfRangeError();
        }));
      };
    }
    exports2.elementAt = elementAt;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/endWith.js
var require_endWith = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/endWith.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.endWith = void 0;
    var concat_1 = require_concat();
    var of_1 = require_of();
    function endWith() {
      var values = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
      }
      return function(source) {
        return concat_1.concat(source, of_1.of.apply(void 0, __spreadArray([], __read(values))));
      };
    }
    exports2.endWith = endWith;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/every.js
var require_every = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/every.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.every = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function every(predicate, thisArg) {
      return lift_1.operate(function(source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          if (!predicate.call(thisArg, value, index++, source)) {
            subscriber.next(false);
            subscriber.complete();
          }
        }, function() {
          subscriber.next(true);
          subscriber.complete();
        }));
      });
    }
    exports2.every = every;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/exhaustMap.js
var require_exhaustMap = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/exhaustMap.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.exhaustMap = void 0;
    var map_1 = require_map();
    var innerFrom_1 = require_innerFrom();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function exhaustMap(project, resultSelector) {
      if (resultSelector) {
        return function(source) {
          return source.pipe(exhaustMap(function(a3, i2) {
            return innerFrom_1.innerFrom(project(a3, i2)).pipe(map_1.map(function(b3, ii) {
              return resultSelector(a3, b3, i2, ii);
            }));
          }));
        };
      }
      return lift_1.operate(function(source, subscriber) {
        var index = 0;
        var innerSub = null;
        var isComplete = false;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(outerValue) {
          if (!innerSub) {
            innerSub = OperatorSubscriber_1.createOperatorSubscriber(subscriber, void 0, function() {
              innerSub = null;
              isComplete && subscriber.complete();
            });
            innerFrom_1.innerFrom(project(outerValue, index++)).subscribe(innerSub);
          }
        }, function() {
          isComplete = true;
          !innerSub && subscriber.complete();
        }));
      });
    }
    exports2.exhaustMap = exhaustMap;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/exhaustAll.js
var require_exhaustAll = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/exhaustAll.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.exhaustAll = void 0;
    var exhaustMap_1 = require_exhaustMap();
    var identity_1 = require_identity();
    function exhaustAll() {
      return exhaustMap_1.exhaustMap(identity_1.identity);
    }
    exports2.exhaustAll = exhaustAll;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/exhaust.js
var require_exhaust = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/exhaust.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.exhaust = void 0;
    var exhaustAll_1 = require_exhaustAll();
    exports2.exhaust = exhaustAll_1.exhaustAll;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/expand.js
var require_expand = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/expand.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.expand = void 0;
    var lift_1 = require_lift();
    var mergeInternals_1 = require_mergeInternals();
    function expand(project, concurrent, scheduler) {
      if (concurrent === void 0) {
        concurrent = Infinity;
      }
      concurrent = (concurrent || 0) < 1 ? Infinity : concurrent;
      return lift_1.operate(function(source, subscriber) {
        return mergeInternals_1.mergeInternals(source, subscriber, project, concurrent, void 0, true, scheduler);
      });
    }
    exports2.expand = expand;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/finalize.js
var require_finalize = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/finalize.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.finalize = void 0;
    var lift_1 = require_lift();
    function finalize2(callback) {
      return lift_1.operate(function(source, subscriber) {
        try {
          source.subscribe(subscriber);
        } finally {
          subscriber.add(callback);
        }
      });
    }
    exports2.finalize = finalize2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/find.js
var require_find = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/find.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createFind = exports2.find = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function find(predicate, thisArg) {
      return lift_1.operate(createFind(predicate, thisArg, "value"));
    }
    exports2.find = find;
    function createFind(predicate, thisArg, emit) {
      var findIndex = emit === "index";
      return function(source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var i2 = index++;
          if (predicate.call(thisArg, value, i2, source)) {
            subscriber.next(findIndex ? i2 : value);
            subscriber.complete();
          }
        }, function() {
          subscriber.next(findIndex ? -1 : void 0);
          subscriber.complete();
        }));
      };
    }
    exports2.createFind = createFind;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/findIndex.js
var require_findIndex = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/findIndex.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.findIndex = void 0;
    var lift_1 = require_lift();
    var find_1 = require_find();
    function findIndex(predicate, thisArg) {
      return lift_1.operate(find_1.createFind(predicate, thisArg, "index"));
    }
    exports2.findIndex = findIndex;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/first.js
var require_first = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/first.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.first = void 0;
    var EmptyError_1 = require_EmptyError();
    var filter_1 = require_filter();
    var take_1 = require_take();
    var defaultIfEmpty_1 = require_defaultIfEmpty();
    var throwIfEmpty_1 = require_throwIfEmpty();
    var identity_1 = require_identity();
    function first(predicate, defaultValue) {
      var hasDefaultValue = arguments.length >= 2;
      return function(source) {
        return source.pipe(predicate ? filter_1.filter(function(v3, i2) {
          return predicate(v3, i2, source);
        }) : identity_1.identity, take_1.take(1), hasDefaultValue ? defaultIfEmpty_1.defaultIfEmpty(defaultValue) : throwIfEmpty_1.throwIfEmpty(function() {
          return new EmptyError_1.EmptyError();
        }));
      };
    }
    exports2.first = first;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/groupBy.js
var require_groupBy = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/groupBy.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.groupBy = void 0;
    var Observable_1 = require_Observable();
    var innerFrom_1 = require_innerFrom();
    var Subject_1 = require_Subject();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function groupBy(keySelector, elementOrOptions, duration, connector) {
      return lift_1.operate(function(source, subscriber) {
        var element;
        if (!elementOrOptions || typeof elementOrOptions === "function") {
          element = elementOrOptions;
        } else {
          duration = elementOrOptions.duration, element = elementOrOptions.element, connector = elementOrOptions.connector;
        }
        var groups = /* @__PURE__ */ new Map();
        var notify = function(cb) {
          groups.forEach(cb);
          cb(subscriber);
        };
        var handleError = function(err) {
          return notify(function(consumer) {
            return consumer.error(err);
          });
        };
        var activeGroups = 0;
        var teardownAttempted = false;
        var groupBySourceSubscriber = new OperatorSubscriber_1.OperatorSubscriber(subscriber, function(value) {
          try {
            var key_1 = keySelector(value);
            var group_1 = groups.get(key_1);
            if (!group_1) {
              groups.set(key_1, group_1 = connector ? connector() : new Subject_1.Subject());
              var grouped = createGroupedObservable(key_1, group_1);
              subscriber.next(grouped);
              if (duration) {
                var durationSubscriber_1 = OperatorSubscriber_1.createOperatorSubscriber(group_1, function() {
                  group_1.complete();
                  durationSubscriber_1 === null || durationSubscriber_1 === void 0 ? void 0 : durationSubscriber_1.unsubscribe();
                }, void 0, void 0, function() {
                  return groups.delete(key_1);
                });
                groupBySourceSubscriber.add(innerFrom_1.innerFrom(duration(grouped)).subscribe(durationSubscriber_1));
              }
            }
            group_1.next(element ? element(value) : value);
          } catch (err) {
            handleError(err);
          }
        }, function() {
          return notify(function(consumer) {
            return consumer.complete();
          });
        }, handleError, function() {
          return groups.clear();
        }, function() {
          teardownAttempted = true;
          return activeGroups === 0;
        });
        source.subscribe(groupBySourceSubscriber);
        function createGroupedObservable(key, groupSubject) {
          var result = new Observable_1.Observable(function(groupSubscriber) {
            activeGroups++;
            var innerSub = groupSubject.subscribe(groupSubscriber);
            return function() {
              innerSub.unsubscribe();
              --activeGroups === 0 && teardownAttempted && groupBySourceSubscriber.unsubscribe();
            };
          });
          result.key = key;
          return result;
        }
      });
    }
    exports2.groupBy = groupBy;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/isEmpty.js
var require_isEmpty = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/isEmpty.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isEmpty = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function isEmpty() {
      return lift_1.operate(function(source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          subscriber.next(false);
          subscriber.complete();
        }, function() {
          subscriber.next(true);
          subscriber.complete();
        }));
      });
    }
    exports2.isEmpty = isEmpty;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/takeLast.js
var require_takeLast = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/takeLast.js"(exports2) {
    "use strict";
    var __values = exports2 && exports2.__values || function(o5) {
      var s4 = typeof Symbol === "function" && Symbol.iterator, m2 = s4 && o5[s4], i2 = 0;
      if (m2) return m2.call(o5);
      if (o5 && typeof o5.length === "number") return {
        next: function() {
          if (o5 && i2 >= o5.length) o5 = void 0;
          return { value: o5 && o5[i2++], done: !o5 };
        }
      };
      throw new TypeError(s4 ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.takeLast = void 0;
    var empty_1 = require_empty();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function takeLast(count) {
      return count <= 0 ? function() {
        return empty_1.EMPTY;
      } : lift_1.operate(function(source, subscriber) {
        var buffer = [];
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          buffer.push(value);
          count < buffer.length && buffer.shift();
        }, function() {
          var e_1, _a;
          try {
            for (var buffer_1 = __values(buffer), buffer_1_1 = buffer_1.next(); !buffer_1_1.done; buffer_1_1 = buffer_1.next()) {
              var value = buffer_1_1.value;
              subscriber.next(value);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (buffer_1_1 && !buffer_1_1.done && (_a = buffer_1.return)) _a.call(buffer_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
          subscriber.complete();
        }, void 0, function() {
          buffer = null;
        }));
      });
    }
    exports2.takeLast = takeLast;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/last.js
var require_last = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/last.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.last = void 0;
    var EmptyError_1 = require_EmptyError();
    var filter_1 = require_filter();
    var takeLast_1 = require_takeLast();
    var throwIfEmpty_1 = require_throwIfEmpty();
    var defaultIfEmpty_1 = require_defaultIfEmpty();
    var identity_1 = require_identity();
    function last(predicate, defaultValue) {
      var hasDefaultValue = arguments.length >= 2;
      return function(source) {
        return source.pipe(predicate ? filter_1.filter(function(v3, i2) {
          return predicate(v3, i2, source);
        }) : identity_1.identity, takeLast_1.takeLast(1), hasDefaultValue ? defaultIfEmpty_1.defaultIfEmpty(defaultValue) : throwIfEmpty_1.throwIfEmpty(function() {
          return new EmptyError_1.EmptyError();
        }));
      };
    }
    exports2.last = last;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/materialize.js
var require_materialize = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/materialize.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.materialize = void 0;
    var Notification_1 = require_Notification();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function materialize() {
      return lift_1.operate(function(source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          subscriber.next(Notification_1.Notification.createNext(value));
        }, function() {
          subscriber.next(Notification_1.Notification.createComplete());
          subscriber.complete();
        }, function(err) {
          subscriber.next(Notification_1.Notification.createError(err));
          subscriber.complete();
        }));
      });
    }
    exports2.materialize = materialize;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/max.js
var require_max = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/max.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.max = void 0;
    var reduce_1 = require_reduce();
    var isFunction_1 = require_isFunction();
    function max(comparer) {
      return reduce_1.reduce(isFunction_1.isFunction(comparer) ? function(x3, y3) {
        return comparer(x3, y3) > 0 ? x3 : y3;
      } : function(x3, y3) {
        return x3 > y3 ? x3 : y3;
      });
    }
    exports2.max = max;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/flatMap.js
var require_flatMap = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/flatMap.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.flatMap = void 0;
    var mergeMap_1 = require_mergeMap();
    exports2.flatMap = mergeMap_1.mergeMap;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mergeMapTo.js
var require_mergeMapTo = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mergeMapTo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mergeMapTo = void 0;
    var mergeMap_1 = require_mergeMap();
    var isFunction_1 = require_isFunction();
    function mergeMapTo(innerObservable, resultSelector, concurrent) {
      if (concurrent === void 0) {
        concurrent = Infinity;
      }
      if (isFunction_1.isFunction(resultSelector)) {
        return mergeMap_1.mergeMap(function() {
          return innerObservable;
        }, resultSelector, concurrent);
      }
      if (typeof resultSelector === "number") {
        concurrent = resultSelector;
      }
      return mergeMap_1.mergeMap(function() {
        return innerObservable;
      }, concurrent);
    }
    exports2.mergeMapTo = mergeMapTo;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mergeScan.js
var require_mergeScan = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mergeScan.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mergeScan = void 0;
    var lift_1 = require_lift();
    var mergeInternals_1 = require_mergeInternals();
    function mergeScan(accumulator, seed, concurrent) {
      if (concurrent === void 0) {
        concurrent = Infinity;
      }
      return lift_1.operate(function(source, subscriber) {
        var state = seed;
        return mergeInternals_1.mergeInternals(source, subscriber, function(value, index) {
          return accumulator(state, value, index);
        }, concurrent, function(value) {
          state = value;
        }, false, void 0, function() {
          return state = null;
        });
      });
    }
    exports2.mergeScan = mergeScan;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/merge.js
var require_merge2 = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/merge.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.merge = void 0;
    var lift_1 = require_lift();
    var mergeAll_1 = require_mergeAll();
    var args_1 = require_args();
    var from_1 = require_from2();
    function merge2() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var scheduler = args_1.popScheduler(args);
      var concurrent = args_1.popNumber(args, Infinity);
      return lift_1.operate(function(source, subscriber) {
        mergeAll_1.mergeAll(concurrent)(from_1.from(__spreadArray([source], __read(args)), scheduler)).subscribe(subscriber);
      });
    }
    exports2.merge = merge2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mergeWith.js
var require_mergeWith = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/mergeWith.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mergeWith = void 0;
    var merge_1 = require_merge2();
    function mergeWith() {
      var otherSources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
      }
      return merge_1.merge.apply(void 0, __spreadArray([], __read(otherSources)));
    }
    exports2.mergeWith = mergeWith;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/min.js
var require_min = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/min.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.min = void 0;
    var reduce_1 = require_reduce();
    var isFunction_1 = require_isFunction();
    function min(comparer) {
      return reduce_1.reduce(isFunction_1.isFunction(comparer) ? function(x3, y3) {
        return comparer(x3, y3) < 0 ? x3 : y3;
      } : function(x3, y3) {
        return x3 < y3 ? x3 : y3;
      });
    }
    exports2.min = min;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/multicast.js
var require_multicast = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/multicast.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.multicast = void 0;
    var ConnectableObservable_1 = require_ConnectableObservable();
    var isFunction_1 = require_isFunction();
    var connect_1 = require_connect();
    function multicast(subjectOrSubjectFactory, selector) {
      var subjectFactory = isFunction_1.isFunction(subjectOrSubjectFactory) ? subjectOrSubjectFactory : function() {
        return subjectOrSubjectFactory;
      };
      if (isFunction_1.isFunction(selector)) {
        return connect_1.connect(selector, {
          connector: subjectFactory
        });
      }
      return function(source) {
        return new ConnectableObservable_1.ConnectableObservable(source, subjectFactory);
      };
    }
    exports2.multicast = multicast;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/onErrorResumeNextWith.js
var require_onErrorResumeNextWith = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/onErrorResumeNextWith.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.onErrorResumeNext = exports2.onErrorResumeNextWith = void 0;
    var argsOrArgArray_1 = require_argsOrArgArray();
    var onErrorResumeNext_1 = require_onErrorResumeNext();
    function onErrorResumeNextWith() {
      var sources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
      }
      var nextSources = argsOrArgArray_1.argsOrArgArray(sources);
      return function(source) {
        return onErrorResumeNext_1.onErrorResumeNext.apply(void 0, __spreadArray([source], __read(nextSources)));
      };
    }
    exports2.onErrorResumeNextWith = onErrorResumeNextWith;
    exports2.onErrorResumeNext = onErrorResumeNextWith;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/pairwise.js
var require_pairwise = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/pairwise.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.pairwise = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function pairwise() {
      return lift_1.operate(function(source, subscriber) {
        var prev;
        var hasPrev = false;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var p3 = prev;
          prev = value;
          hasPrev && subscriber.next([p3, value]);
          hasPrev = true;
        }));
      });
    }
    exports2.pairwise = pairwise;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/pluck.js
var require_pluck = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/pluck.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.pluck = void 0;
    var map_1 = require_map();
    function pluck() {
      var properties = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        properties[_i] = arguments[_i];
      }
      var length = properties.length;
      if (length === 0) {
        throw new Error("list of properties cannot be empty.");
      }
      return map_1.map(function(x3) {
        var currentProp = x3;
        for (var i2 = 0; i2 < length; i2++) {
          var p3 = currentProp === null || currentProp === void 0 ? void 0 : currentProp[properties[i2]];
          if (typeof p3 !== "undefined") {
            currentProp = p3;
          } else {
            return void 0;
          }
        }
        return currentProp;
      });
    }
    exports2.pluck = pluck;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/publish.js
var require_publish = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/publish.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.publish = void 0;
    var Subject_1 = require_Subject();
    var multicast_1 = require_multicast();
    var connect_1 = require_connect();
    function publish(selector) {
      return selector ? function(source) {
        return connect_1.connect(selector)(source);
      } : function(source) {
        return multicast_1.multicast(new Subject_1.Subject())(source);
      };
    }
    exports2.publish = publish;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/publishBehavior.js
var require_publishBehavior = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/publishBehavior.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.publishBehavior = void 0;
    var BehaviorSubject_1 = require_BehaviorSubject();
    var ConnectableObservable_1 = require_ConnectableObservable();
    function publishBehavior(initialValue) {
      return function(source) {
        var subject = new BehaviorSubject_1.BehaviorSubject(initialValue);
        return new ConnectableObservable_1.ConnectableObservable(source, function() {
          return subject;
        });
      };
    }
    exports2.publishBehavior = publishBehavior;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/publishLast.js
var require_publishLast = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/publishLast.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.publishLast = void 0;
    var AsyncSubject_1 = require_AsyncSubject();
    var ConnectableObservable_1 = require_ConnectableObservable();
    function publishLast() {
      return function(source) {
        var subject = new AsyncSubject_1.AsyncSubject();
        return new ConnectableObservable_1.ConnectableObservable(source, function() {
          return subject;
        });
      };
    }
    exports2.publishLast = publishLast;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/publishReplay.js
var require_publishReplay = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/publishReplay.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.publishReplay = void 0;
    var ReplaySubject_1 = require_ReplaySubject();
    var multicast_1 = require_multicast();
    var isFunction_1 = require_isFunction();
    function publishReplay(bufferSize, windowTime, selectorOrScheduler, timestampProvider) {
      if (selectorOrScheduler && !isFunction_1.isFunction(selectorOrScheduler)) {
        timestampProvider = selectorOrScheduler;
      }
      var selector = isFunction_1.isFunction(selectorOrScheduler) ? selectorOrScheduler : void 0;
      return function(source) {
        return multicast_1.multicast(new ReplaySubject_1.ReplaySubject(bufferSize, windowTime, timestampProvider), selector)(source);
      };
    }
    exports2.publishReplay = publishReplay;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/raceWith.js
var require_raceWith = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/raceWith.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.raceWith = void 0;
    var race_1 = require_race();
    var lift_1 = require_lift();
    var identity_1 = require_identity();
    function raceWith() {
      var otherSources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
      }
      return !otherSources.length ? identity_1.identity : lift_1.operate(function(source, subscriber) {
        race_1.raceInit(__spreadArray([source], __read(otherSources)))(subscriber);
      });
    }
    exports2.raceWith = raceWith;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/repeat.js
var require_repeat = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/repeat.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.repeat = void 0;
    var empty_1 = require_empty();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    var timer_1 = require_timer();
    function repeat(countOrConfig) {
      var _a;
      var count = Infinity;
      var delay;
      if (countOrConfig != null) {
        if (typeof countOrConfig === "object") {
          _a = countOrConfig.count, count = _a === void 0 ? Infinity : _a, delay = countOrConfig.delay;
        } else {
          count = countOrConfig;
        }
      }
      return count <= 0 ? function() {
        return empty_1.EMPTY;
      } : lift_1.operate(function(source, subscriber) {
        var soFar = 0;
        var sourceSub;
        var resubscribe = function() {
          sourceSub === null || sourceSub === void 0 ? void 0 : sourceSub.unsubscribe();
          sourceSub = null;
          if (delay != null) {
            var notifier = typeof delay === "number" ? timer_1.timer(delay) : innerFrom_1.innerFrom(delay(soFar));
            var notifierSubscriber_1 = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
              notifierSubscriber_1.unsubscribe();
              subscribeToSource();
            });
            notifier.subscribe(notifierSubscriber_1);
          } else {
            subscribeToSource();
          }
        };
        var subscribeToSource = function() {
          var syncUnsub = false;
          sourceSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, void 0, function() {
            if (++soFar < count) {
              if (sourceSub) {
                resubscribe();
              } else {
                syncUnsub = true;
              }
            } else {
              subscriber.complete();
            }
          }));
          if (syncUnsub) {
            resubscribe();
          }
        };
        subscribeToSource();
      });
    }
    exports2.repeat = repeat;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/repeatWhen.js
var require_repeatWhen = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/repeatWhen.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.repeatWhen = void 0;
    var innerFrom_1 = require_innerFrom();
    var Subject_1 = require_Subject();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function repeatWhen(notifier) {
      return lift_1.operate(function(source, subscriber) {
        var innerSub;
        var syncResub = false;
        var completions$;
        var isNotifierComplete = false;
        var isMainComplete = false;
        var checkComplete = function() {
          return isMainComplete && isNotifierComplete && (subscriber.complete(), true);
        };
        var getCompletionSubject = function() {
          if (!completions$) {
            completions$ = new Subject_1.Subject();
            innerFrom_1.innerFrom(notifier(completions$)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
              if (innerSub) {
                subscribeForRepeatWhen();
              } else {
                syncResub = true;
              }
            }, function() {
              isNotifierComplete = true;
              checkComplete();
            }));
          }
          return completions$;
        };
        var subscribeForRepeatWhen = function() {
          isMainComplete = false;
          innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, void 0, function() {
            isMainComplete = true;
            !checkComplete() && getCompletionSubject().next();
          }));
          if (syncResub) {
            innerSub.unsubscribe();
            innerSub = null;
            syncResub = false;
            subscribeForRepeatWhen();
          }
        };
        subscribeForRepeatWhen();
      });
    }
    exports2.repeatWhen = repeatWhen;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/retry.js
var require_retry = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/retry.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.retry = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var identity_1 = require_identity();
    var timer_1 = require_timer();
    var innerFrom_1 = require_innerFrom();
    function retry(configOrCount) {
      if (configOrCount === void 0) {
        configOrCount = Infinity;
      }
      var config;
      if (configOrCount && typeof configOrCount === "object") {
        config = configOrCount;
      } else {
        config = {
          count: configOrCount
        };
      }
      var _a = config.count, count = _a === void 0 ? Infinity : _a, delay = config.delay, _b = config.resetOnSuccess, resetOnSuccess = _b === void 0 ? false : _b;
      return count <= 0 ? identity_1.identity : lift_1.operate(function(source, subscriber) {
        var soFar = 0;
        var innerSub;
        var subscribeForRetry = function() {
          var syncUnsub = false;
          innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
            if (resetOnSuccess) {
              soFar = 0;
            }
            subscriber.next(value);
          }, void 0, function(err) {
            if (soFar++ < count) {
              var resub_1 = function() {
                if (innerSub) {
                  innerSub.unsubscribe();
                  innerSub = null;
                  subscribeForRetry();
                } else {
                  syncUnsub = true;
                }
              };
              if (delay != null) {
                var notifier = typeof delay === "number" ? timer_1.timer(delay) : innerFrom_1.innerFrom(delay(err, soFar));
                var notifierSubscriber_1 = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
                  notifierSubscriber_1.unsubscribe();
                  resub_1();
                }, function() {
                  subscriber.complete();
                });
                notifier.subscribe(notifierSubscriber_1);
              } else {
                resub_1();
              }
            } else {
              subscriber.error(err);
            }
          }));
          if (syncUnsub) {
            innerSub.unsubscribe();
            innerSub = null;
            subscribeForRetry();
          }
        };
        subscribeForRetry();
      });
    }
    exports2.retry = retry;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/retryWhen.js
var require_retryWhen = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/retryWhen.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.retryWhen = void 0;
    var innerFrom_1 = require_innerFrom();
    var Subject_1 = require_Subject();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function retryWhen(notifier) {
      return lift_1.operate(function(source, subscriber) {
        var innerSub;
        var syncResub = false;
        var errors$;
        var subscribeForRetryWhen = function() {
          innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, void 0, void 0, function(err) {
            if (!errors$) {
              errors$ = new Subject_1.Subject();
              innerFrom_1.innerFrom(notifier(errors$)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
                return innerSub ? subscribeForRetryWhen() : syncResub = true;
              }));
            }
            if (errors$) {
              errors$.next(err);
            }
          }));
          if (syncResub) {
            innerSub.unsubscribe();
            innerSub = null;
            syncResub = false;
            subscribeForRetryWhen();
          }
        };
        subscribeForRetryWhen();
      });
    }
    exports2.retryWhen = retryWhen;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/sample.js
var require_sample = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/sample.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.sample = void 0;
    var innerFrom_1 = require_innerFrom();
    var lift_1 = require_lift();
    var noop_1 = require_noop();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function sample(notifier) {
      return lift_1.operate(function(source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          hasValue = true;
          lastValue = value;
        }));
        innerFrom_1.innerFrom(notifier).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          if (hasValue) {
            hasValue = false;
            var value = lastValue;
            lastValue = null;
            subscriber.next(value);
          }
        }, noop_1.noop));
      });
    }
    exports2.sample = sample;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/sampleTime.js
var require_sampleTime = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/sampleTime.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.sampleTime = void 0;
    var async_1 = require_async();
    var sample_1 = require_sample();
    var interval_1 = require_interval();
    function sampleTime(period, scheduler) {
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      return sample_1.sample(interval_1.interval(period, scheduler));
    }
    exports2.sampleTime = sampleTime;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/scan.js
var require_scan = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/scan.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.scan = void 0;
    var lift_1 = require_lift();
    var scanInternals_1 = require_scanInternals();
    function scan(accumulator, seed) {
      return lift_1.operate(scanInternals_1.scanInternals(accumulator, seed, arguments.length >= 2, true));
    }
    exports2.scan = scan;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/sequenceEqual.js
var require_sequenceEqual = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/sequenceEqual.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.sequenceEqual = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    function sequenceEqual(compareTo, comparator) {
      if (comparator === void 0) {
        comparator = function(a3, b3) {
          return a3 === b3;
        };
      }
      return lift_1.operate(function(source, subscriber) {
        var aState = createState();
        var bState = createState();
        var emit = function(isEqual) {
          subscriber.next(isEqual);
          subscriber.complete();
        };
        var createSubscriber = function(selfState, otherState) {
          var sequenceEqualSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(a3) {
            var buffer = otherState.buffer, complete = otherState.complete;
            if (buffer.length === 0) {
              complete ? emit(false) : selfState.buffer.push(a3);
            } else {
              !comparator(a3, buffer.shift()) && emit(false);
            }
          }, function() {
            selfState.complete = true;
            var complete = otherState.complete, buffer = otherState.buffer;
            complete && emit(buffer.length === 0);
            sequenceEqualSubscriber === null || sequenceEqualSubscriber === void 0 ? void 0 : sequenceEqualSubscriber.unsubscribe();
          });
          return sequenceEqualSubscriber;
        };
        source.subscribe(createSubscriber(aState, bState));
        innerFrom_1.innerFrom(compareTo).subscribe(createSubscriber(bState, aState));
      });
    }
    exports2.sequenceEqual = sequenceEqual;
    function createState() {
      return {
        buffer: [],
        complete: false
      };
    }
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/share.js
var require_share = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/share.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.share = void 0;
    var innerFrom_1 = require_innerFrom();
    var Subject_1 = require_Subject();
    var Subscriber_1 = require_Subscriber();
    var lift_1 = require_lift();
    function share2(options) {
      if (options === void 0) {
        options = {};
      }
      var _a = options.connector, connector = _a === void 0 ? function() {
        return new Subject_1.Subject();
      } : _a, _b = options.resetOnError, resetOnError = _b === void 0 ? true : _b, _c = options.resetOnComplete, resetOnComplete = _c === void 0 ? true : _c, _d = options.resetOnRefCountZero, resetOnRefCountZero = _d === void 0 ? true : _d;
      return function(wrapperSource) {
        var connection;
        var resetConnection;
        var subject;
        var refCount = 0;
        var hasCompleted = false;
        var hasErrored = false;
        var cancelReset = function() {
          resetConnection === null || resetConnection === void 0 ? void 0 : resetConnection.unsubscribe();
          resetConnection = void 0;
        };
        var reset = function() {
          cancelReset();
          connection = subject = void 0;
          hasCompleted = hasErrored = false;
        };
        var resetAndUnsubscribe = function() {
          var conn = connection;
          reset();
          conn === null || conn === void 0 ? void 0 : conn.unsubscribe();
        };
        return lift_1.operate(function(source, subscriber) {
          refCount++;
          if (!hasErrored && !hasCompleted) {
            cancelReset();
          }
          var dest = subject = subject !== null && subject !== void 0 ? subject : connector();
          subscriber.add(function() {
            refCount--;
            if (refCount === 0 && !hasErrored && !hasCompleted) {
              resetConnection = handleReset(resetAndUnsubscribe, resetOnRefCountZero);
            }
          });
          dest.subscribe(subscriber);
          if (!connection && refCount > 0) {
            connection = new Subscriber_1.SafeSubscriber({
              next: function(value) {
                return dest.next(value);
              },
              error: function(err) {
                hasErrored = true;
                cancelReset();
                resetConnection = handleReset(reset, resetOnError, err);
                dest.error(err);
              },
              complete: function() {
                hasCompleted = true;
                cancelReset();
                resetConnection = handleReset(reset, resetOnComplete);
                dest.complete();
              }
            });
            innerFrom_1.innerFrom(source).subscribe(connection);
          }
        })(wrapperSource);
      };
    }
    exports2.share = share2;
    function handleReset(reset, on) {
      var args = [];
      for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
      }
      if (on === true) {
        reset();
        return;
      }
      if (on === false) {
        return;
      }
      var onSubscriber = new Subscriber_1.SafeSubscriber({
        next: function() {
          onSubscriber.unsubscribe();
          reset();
        }
      });
      return innerFrom_1.innerFrom(on.apply(void 0, __spreadArray([], __read(args)))).subscribe(onSubscriber);
    }
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/shareReplay.js
var require_shareReplay = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/shareReplay.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.shareReplay = void 0;
    var ReplaySubject_1 = require_ReplaySubject();
    var share_1 = require_share();
    function shareReplay2(configOrBufferSize, windowTime, scheduler) {
      var _a, _b, _c;
      var bufferSize;
      var refCount = false;
      if (configOrBufferSize && typeof configOrBufferSize === "object") {
        _a = configOrBufferSize.bufferSize, bufferSize = _a === void 0 ? Infinity : _a, _b = configOrBufferSize.windowTime, windowTime = _b === void 0 ? Infinity : _b, _c = configOrBufferSize.refCount, refCount = _c === void 0 ? false : _c, scheduler = configOrBufferSize.scheduler;
      } else {
        bufferSize = configOrBufferSize !== null && configOrBufferSize !== void 0 ? configOrBufferSize : Infinity;
      }
      return share_1.share({
        connector: function() {
          return new ReplaySubject_1.ReplaySubject(bufferSize, windowTime, scheduler);
        },
        resetOnError: true,
        resetOnComplete: false,
        resetOnRefCountZero: refCount
      });
    }
    exports2.shareReplay = shareReplay2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/single.js
var require_single = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/single.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.single = void 0;
    var EmptyError_1 = require_EmptyError();
    var SequenceError_1 = require_SequenceError();
    var NotFoundError_1 = require_NotFoundError();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function single(predicate) {
      return lift_1.operate(function(source, subscriber) {
        var hasValue = false;
        var singleValue;
        var seenValue = false;
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          seenValue = true;
          if (!predicate || predicate(value, index++, source)) {
            hasValue && subscriber.error(new SequenceError_1.SequenceError("Too many matching values"));
            hasValue = true;
            singleValue = value;
          }
        }, function() {
          if (hasValue) {
            subscriber.next(singleValue);
            subscriber.complete();
          } else {
            subscriber.error(seenValue ? new NotFoundError_1.NotFoundError("No matching values") : new EmptyError_1.EmptyError());
          }
        }));
      });
    }
    exports2.single = single;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/skip.js
var require_skip = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/skip.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.skip = void 0;
    var filter_1 = require_filter();
    function skip(count) {
      return filter_1.filter(function(_2, index) {
        return count <= index;
      });
    }
    exports2.skip = skip;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/skipLast.js
var require_skipLast = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/skipLast.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.skipLast = void 0;
    var identity_1 = require_identity();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function skipLast(skipCount) {
      return skipCount <= 0 ? identity_1.identity : lift_1.operate(function(source, subscriber) {
        var ring = new Array(skipCount);
        var seen = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var valueIndex = seen++;
          if (valueIndex < skipCount) {
            ring[valueIndex] = value;
          } else {
            var index = valueIndex % skipCount;
            var oldValue = ring[index];
            ring[index] = value;
            subscriber.next(oldValue);
          }
        }));
        return function() {
          ring = null;
        };
      });
    }
    exports2.skipLast = skipLast;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/skipUntil.js
var require_skipUntil = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/skipUntil.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.skipUntil = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    var noop_1 = require_noop();
    function skipUntil(notifier) {
      return lift_1.operate(function(source, subscriber) {
        var taking = false;
        var skipSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          skipSubscriber === null || skipSubscriber === void 0 ? void 0 : skipSubscriber.unsubscribe();
          taking = true;
        }, noop_1.noop);
        innerFrom_1.innerFrom(notifier).subscribe(skipSubscriber);
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return taking && subscriber.next(value);
        }));
      });
    }
    exports2.skipUntil = skipUntil;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/skipWhile.js
var require_skipWhile = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/skipWhile.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.skipWhile = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function skipWhile(predicate) {
      return lift_1.operate(function(source, subscriber) {
        var taking = false;
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return (taking || (taking = !predicate(value, index++))) && subscriber.next(value);
        }));
      });
    }
    exports2.skipWhile = skipWhile;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/startWith.js
var require_startWith = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/startWith.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.startWith = void 0;
    var concat_1 = require_concat();
    var args_1 = require_args();
    var lift_1 = require_lift();
    function startWith() {
      var values = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
      }
      var scheduler = args_1.popScheduler(values);
      return lift_1.operate(function(source, subscriber) {
        (scheduler ? concat_1.concat(values, source, scheduler) : concat_1.concat(values, source)).subscribe(subscriber);
      });
    }
    exports2.startWith = startWith;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/switchMap.js
var require_switchMap = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/switchMap.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.switchMap = void 0;
    var innerFrom_1 = require_innerFrom();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function switchMap(project, resultSelector) {
      return lift_1.operate(function(source, subscriber) {
        var innerSubscriber = null;
        var index = 0;
        var isComplete = false;
        var checkComplete = function() {
          return isComplete && !innerSubscriber && subscriber.complete();
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          innerSubscriber === null || innerSubscriber === void 0 ? void 0 : innerSubscriber.unsubscribe();
          var innerIndex = 0;
          var outerIndex = index++;
          innerFrom_1.innerFrom(project(value, outerIndex)).subscribe(innerSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(innerValue) {
            return subscriber.next(resultSelector ? resultSelector(value, innerValue, outerIndex, innerIndex++) : innerValue);
          }, function() {
            innerSubscriber = null;
            checkComplete();
          }));
        }, function() {
          isComplete = true;
          checkComplete();
        }));
      });
    }
    exports2.switchMap = switchMap;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/switchAll.js
var require_switchAll = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/switchAll.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.switchAll = void 0;
    var switchMap_1 = require_switchMap();
    var identity_1 = require_identity();
    function switchAll() {
      return switchMap_1.switchMap(identity_1.identity);
    }
    exports2.switchAll = switchAll;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/switchMapTo.js
var require_switchMapTo = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/switchMapTo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.switchMapTo = void 0;
    var switchMap_1 = require_switchMap();
    var isFunction_1 = require_isFunction();
    function switchMapTo(innerObservable, resultSelector) {
      return isFunction_1.isFunction(resultSelector) ? switchMap_1.switchMap(function() {
        return innerObservable;
      }, resultSelector) : switchMap_1.switchMap(function() {
        return innerObservable;
      });
    }
    exports2.switchMapTo = switchMapTo;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/switchScan.js
var require_switchScan = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/switchScan.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.switchScan = void 0;
    var switchMap_1 = require_switchMap();
    var lift_1 = require_lift();
    function switchScan(accumulator, seed) {
      return lift_1.operate(function(source, subscriber) {
        var state = seed;
        switchMap_1.switchMap(function(value, index) {
          return accumulator(state, value, index);
        }, function(_2, innerValue) {
          return state = innerValue, innerValue;
        })(source).subscribe(subscriber);
        return function() {
          state = null;
        };
      });
    }
    exports2.switchScan = switchScan;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/takeUntil.js
var require_takeUntil = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/takeUntil.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.takeUntil = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    var noop_1 = require_noop();
    function takeUntil(notifier) {
      return lift_1.operate(function(source, subscriber) {
        innerFrom_1.innerFrom(notifier).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          return subscriber.complete();
        }, noop_1.noop));
        !subscriber.closed && source.subscribe(subscriber);
      });
    }
    exports2.takeUntil = takeUntil;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/takeWhile.js
var require_takeWhile = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/takeWhile.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.takeWhile = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function takeWhile(predicate, inclusive) {
      if (inclusive === void 0) {
        inclusive = false;
      }
      return lift_1.operate(function(source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var result = predicate(value, index++);
          (result || inclusive) && subscriber.next(value);
          !result && subscriber.complete();
        }));
      });
    }
    exports2.takeWhile = takeWhile;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/tap.js
var require_tap = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/tap.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.tap = void 0;
    var isFunction_1 = require_isFunction();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var identity_1 = require_identity();
    function tap2(observerOrNext, error, complete) {
      var tapObserver = isFunction_1.isFunction(observerOrNext) || error || complete ? { next: observerOrNext, error, complete } : observerOrNext;
      return tapObserver ? lift_1.operate(function(source, subscriber) {
        var _a;
        (_a = tapObserver.subscribe) === null || _a === void 0 ? void 0 : _a.call(tapObserver);
        var isUnsub = true;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var _a2;
          (_a2 = tapObserver.next) === null || _a2 === void 0 ? void 0 : _a2.call(tapObserver, value);
          subscriber.next(value);
        }, function() {
          var _a2;
          isUnsub = false;
          (_a2 = tapObserver.complete) === null || _a2 === void 0 ? void 0 : _a2.call(tapObserver);
          subscriber.complete();
        }, function(err) {
          var _a2;
          isUnsub = false;
          (_a2 = tapObserver.error) === null || _a2 === void 0 ? void 0 : _a2.call(tapObserver, err);
          subscriber.error(err);
        }, function() {
          var _a2, _b;
          if (isUnsub) {
            (_a2 = tapObserver.unsubscribe) === null || _a2 === void 0 ? void 0 : _a2.call(tapObserver);
          }
          (_b = tapObserver.finalize) === null || _b === void 0 ? void 0 : _b.call(tapObserver);
        }));
      }) : identity_1.identity;
    }
    exports2.tap = tap2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/throttle.js
var require_throttle = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/throttle.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.throttle = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    function throttle(durationSelector, config) {
      return lift_1.operate(function(source, subscriber) {
        var _a = config !== null && config !== void 0 ? config : {}, _b = _a.leading, leading = _b === void 0 ? true : _b, _c = _a.trailing, trailing = _c === void 0 ? false : _c;
        var hasValue = false;
        var sendValue = null;
        var throttled = null;
        var isComplete = false;
        var endThrottling = function() {
          throttled === null || throttled === void 0 ? void 0 : throttled.unsubscribe();
          throttled = null;
          if (trailing) {
            send();
            isComplete && subscriber.complete();
          }
        };
        var cleanupThrottling = function() {
          throttled = null;
          isComplete && subscriber.complete();
        };
        var startThrottle = function(value) {
          return throttled = innerFrom_1.innerFrom(durationSelector(value)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, endThrottling, cleanupThrottling));
        };
        var send = function() {
          if (hasValue) {
            hasValue = false;
            var value = sendValue;
            sendValue = null;
            subscriber.next(value);
            !isComplete && startThrottle(value);
          }
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          hasValue = true;
          sendValue = value;
          !(throttled && !throttled.closed) && (leading ? send() : startThrottle(value));
        }, function() {
          isComplete = true;
          !(trailing && hasValue && throttled && !throttled.closed) && subscriber.complete();
        }));
      });
    }
    exports2.throttle = throttle;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/throttleTime.js
var require_throttleTime = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/throttleTime.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.throttleTime = void 0;
    var async_1 = require_async();
    var throttle_1 = require_throttle();
    var timer_1 = require_timer();
    function throttleTime(duration, scheduler, config) {
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      var duration$ = timer_1.timer(duration, scheduler);
      return throttle_1.throttle(function() {
        return duration$;
      }, config);
    }
    exports2.throttleTime = throttleTime;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/timeInterval.js
var require_timeInterval = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/timeInterval.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TimeInterval = exports2.timeInterval = void 0;
    var async_1 = require_async();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function timeInterval(scheduler) {
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      return lift_1.operate(function(source, subscriber) {
        var last = scheduler.now();
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var now = scheduler.now();
          var interval = now - last;
          last = now;
          subscriber.next(new TimeInterval(value, interval));
        }));
      });
    }
    exports2.timeInterval = timeInterval;
    var TimeInterval = /* @__PURE__ */ (function() {
      function TimeInterval2(value, interval) {
        this.value = value;
        this.interval = interval;
      }
      return TimeInterval2;
    })();
    exports2.TimeInterval = TimeInterval;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/timeoutWith.js
var require_timeoutWith = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/timeoutWith.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.timeoutWith = void 0;
    var async_1 = require_async();
    var isDate_1 = require_isDate();
    var timeout_1 = require_timeout();
    function timeoutWith(due, withObservable, scheduler) {
      var first;
      var each;
      var _with;
      scheduler = scheduler !== null && scheduler !== void 0 ? scheduler : async_1.async;
      if (isDate_1.isValidDate(due)) {
        first = due;
      } else if (typeof due === "number") {
        each = due;
      }
      if (withObservable) {
        _with = function() {
          return withObservable;
        };
      } else {
        throw new TypeError("No observable provided to switch to");
      }
      if (first == null && each == null) {
        throw new TypeError("No timeout provided.");
      }
      return timeout_1.timeout({
        first,
        each,
        scheduler,
        with: _with
      });
    }
    exports2.timeoutWith = timeoutWith;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/timestamp.js
var require_timestamp = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/timestamp.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.timestamp = void 0;
    var dateTimestampProvider_1 = require_dateTimestampProvider();
    var map_1 = require_map();
    function timestamp(timestampProvider) {
      if (timestampProvider === void 0) {
        timestampProvider = dateTimestampProvider_1.dateTimestampProvider;
      }
      return map_1.map(function(value) {
        return { value, timestamp: timestampProvider.now() };
      });
    }
    exports2.timestamp = timestamp;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/window.js
var require_window = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/window.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.window = void 0;
    var Subject_1 = require_Subject();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var noop_1 = require_noop();
    var innerFrom_1 = require_innerFrom();
    function window2(windowBoundaries) {
      return lift_1.operate(function(source, subscriber) {
        var windowSubject = new Subject_1.Subject();
        subscriber.next(windowSubject.asObservable());
        var errorHandler = function(err) {
          windowSubject.error(err);
          subscriber.error(err);
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return windowSubject === null || windowSubject === void 0 ? void 0 : windowSubject.next(value);
        }, function() {
          windowSubject.complete();
          subscriber.complete();
        }, errorHandler));
        innerFrom_1.innerFrom(windowBoundaries).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          windowSubject.complete();
          subscriber.next(windowSubject = new Subject_1.Subject());
        }, noop_1.noop, errorHandler));
        return function() {
          windowSubject === null || windowSubject === void 0 ? void 0 : windowSubject.unsubscribe();
          windowSubject = null;
        };
      });
    }
    exports2.window = window2;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/windowCount.js
var require_windowCount = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/windowCount.js"(exports2) {
    "use strict";
    var __values = exports2 && exports2.__values || function(o5) {
      var s4 = typeof Symbol === "function" && Symbol.iterator, m2 = s4 && o5[s4], i2 = 0;
      if (m2) return m2.call(o5);
      if (o5 && typeof o5.length === "number") return {
        next: function() {
          if (o5 && i2 >= o5.length) o5 = void 0;
          return { value: o5 && o5[i2++], done: !o5 };
        }
      };
      throw new TypeError(s4 ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.windowCount = void 0;
    var Subject_1 = require_Subject();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function windowCount(windowSize, startWindowEvery) {
      if (startWindowEvery === void 0) {
        startWindowEvery = 0;
      }
      var startEvery = startWindowEvery > 0 ? startWindowEvery : windowSize;
      return lift_1.operate(function(source, subscriber) {
        var windows = [new Subject_1.Subject()];
        var starts = [];
        var count = 0;
        subscriber.next(windows[0].asObservable());
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var e_1, _a;
          try {
            for (var windows_1 = __values(windows), windows_1_1 = windows_1.next(); !windows_1_1.done; windows_1_1 = windows_1.next()) {
              var window_1 = windows_1_1.value;
              window_1.next(value);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (windows_1_1 && !windows_1_1.done && (_a = windows_1.return)) _a.call(windows_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
          var c4 = count - windowSize + 1;
          if (c4 >= 0 && c4 % startEvery === 0) {
            windows.shift().complete();
          }
          if (++count % startEvery === 0) {
            var window_2 = new Subject_1.Subject();
            windows.push(window_2);
            subscriber.next(window_2.asObservable());
          }
        }, function() {
          while (windows.length > 0) {
            windows.shift().complete();
          }
          subscriber.complete();
        }, function(err) {
          while (windows.length > 0) {
            windows.shift().error(err);
          }
          subscriber.error(err);
        }, function() {
          starts = null;
          windows = null;
        }));
      });
    }
    exports2.windowCount = windowCount;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/windowTime.js
var require_windowTime = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/windowTime.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.windowTime = void 0;
    var Subject_1 = require_Subject();
    var async_1 = require_async();
    var Subscription_1 = require_Subscription();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var arrRemove_1 = require_arrRemove();
    var args_1 = require_args();
    var executeSchedule_1 = require_executeSchedule();
    function windowTime(windowTimeSpan) {
      var _a, _b;
      var otherArgs = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        otherArgs[_i - 1] = arguments[_i];
      }
      var scheduler = (_a = args_1.popScheduler(otherArgs)) !== null && _a !== void 0 ? _a : async_1.asyncScheduler;
      var windowCreationInterval = (_b = otherArgs[0]) !== null && _b !== void 0 ? _b : null;
      var maxWindowSize = otherArgs[1] || Infinity;
      return lift_1.operate(function(source, subscriber) {
        var windowRecords = [];
        var restartOnClose = false;
        var closeWindow = function(record) {
          var window2 = record.window, subs = record.subs;
          window2.complete();
          subs.unsubscribe();
          arrRemove_1.arrRemove(windowRecords, record);
          restartOnClose && startWindow();
        };
        var startWindow = function() {
          if (windowRecords) {
            var subs = new Subscription_1.Subscription();
            subscriber.add(subs);
            var window_1 = new Subject_1.Subject();
            var record_1 = {
              window: window_1,
              subs,
              seen: 0
            };
            windowRecords.push(record_1);
            subscriber.next(window_1.asObservable());
            executeSchedule_1.executeSchedule(subs, scheduler, function() {
              return closeWindow(record_1);
            }, windowTimeSpan);
          }
        };
        if (windowCreationInterval !== null && windowCreationInterval >= 0) {
          executeSchedule_1.executeSchedule(subscriber, scheduler, startWindow, windowCreationInterval, true);
        } else {
          restartOnClose = true;
        }
        startWindow();
        var loop = function(cb) {
          return windowRecords.slice().forEach(cb);
        };
        var terminate = function(cb) {
          loop(function(_a2) {
            var window2 = _a2.window;
            return cb(window2);
          });
          cb(subscriber);
          subscriber.unsubscribe();
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          loop(function(record) {
            record.window.next(value);
            maxWindowSize <= ++record.seen && closeWindow(record);
          });
        }, function() {
          return terminate(function(consumer) {
            return consumer.complete();
          });
        }, function(err) {
          return terminate(function(consumer) {
            return consumer.error(err);
          });
        }));
        return function() {
          windowRecords = null;
        };
      });
    }
    exports2.windowTime = windowTime;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/windowToggle.js
var require_windowToggle = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/windowToggle.js"(exports2) {
    "use strict";
    var __values = exports2 && exports2.__values || function(o5) {
      var s4 = typeof Symbol === "function" && Symbol.iterator, m2 = s4 && o5[s4], i2 = 0;
      if (m2) return m2.call(o5);
      if (o5 && typeof o5.length === "number") return {
        next: function() {
          if (o5 && i2 >= o5.length) o5 = void 0;
          return { value: o5 && o5[i2++], done: !o5 };
        }
      };
      throw new TypeError(s4 ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.windowToggle = void 0;
    var Subject_1 = require_Subject();
    var Subscription_1 = require_Subscription();
    var lift_1 = require_lift();
    var innerFrom_1 = require_innerFrom();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var noop_1 = require_noop();
    var arrRemove_1 = require_arrRemove();
    function windowToggle(openings, closingSelector) {
      return lift_1.operate(function(source, subscriber) {
        var windows = [];
        var handleError = function(err) {
          while (0 < windows.length) {
            windows.shift().error(err);
          }
          subscriber.error(err);
        };
        innerFrom_1.innerFrom(openings).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(openValue) {
          var window2 = new Subject_1.Subject();
          windows.push(window2);
          var closingSubscription = new Subscription_1.Subscription();
          var closeWindow = function() {
            arrRemove_1.arrRemove(windows, window2);
            window2.complete();
            closingSubscription.unsubscribe();
          };
          var closingNotifier;
          try {
            closingNotifier = innerFrom_1.innerFrom(closingSelector(openValue));
          } catch (err) {
            handleError(err);
            return;
          }
          subscriber.next(window2.asObservable());
          closingSubscription.add(closingNotifier.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, closeWindow, noop_1.noop, handleError)));
        }, noop_1.noop));
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var e_1, _a;
          var windowsCopy = windows.slice();
          try {
            for (var windowsCopy_1 = __values(windowsCopy), windowsCopy_1_1 = windowsCopy_1.next(); !windowsCopy_1_1.done; windowsCopy_1_1 = windowsCopy_1.next()) {
              var window_1 = windowsCopy_1_1.value;
              window_1.next(value);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (windowsCopy_1_1 && !windowsCopy_1_1.done && (_a = windowsCopy_1.return)) _a.call(windowsCopy_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
        }, function() {
          while (0 < windows.length) {
            windows.shift().complete();
          }
          subscriber.complete();
        }, handleError, function() {
          while (0 < windows.length) {
            windows.shift().unsubscribe();
          }
        }));
      });
    }
    exports2.windowToggle = windowToggle;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/windowWhen.js
var require_windowWhen = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/windowWhen.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.windowWhen = void 0;
    var Subject_1 = require_Subject();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    function windowWhen(closingSelector) {
      return lift_1.operate(function(source, subscriber) {
        var window2;
        var closingSubscriber;
        var handleError = function(err) {
          window2.error(err);
          subscriber.error(err);
        };
        var openWindow = function() {
          closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
          window2 === null || window2 === void 0 ? void 0 : window2.complete();
          window2 = new Subject_1.Subject();
          subscriber.next(window2.asObservable());
          var closingNotifier;
          try {
            closingNotifier = innerFrom_1.innerFrom(closingSelector());
          } catch (err) {
            handleError(err);
            return;
          }
          closingNotifier.subscribe(closingSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, openWindow, openWindow, handleError));
        };
        openWindow();
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return window2.next(value);
        }, function() {
          window2.complete();
          subscriber.complete();
        }, handleError, function() {
          closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
          window2 = null;
        }));
      });
    }
    exports2.windowWhen = windowWhen;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/withLatestFrom.js
var require_withLatestFrom = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/withLatestFrom.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.withLatestFrom = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    var identity_1 = require_identity();
    var noop_1 = require_noop();
    var args_1 = require_args();
    function withLatestFrom() {
      var inputs = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
      }
      var project = args_1.popResultSelector(inputs);
      return lift_1.operate(function(source, subscriber) {
        var len = inputs.length;
        var otherValues = new Array(len);
        var hasValue = inputs.map(function() {
          return false;
        });
        var ready = false;
        var _loop_1 = function(i3) {
          innerFrom_1.innerFrom(inputs[i3]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
            otherValues[i3] = value;
            if (!ready && !hasValue[i3]) {
              hasValue[i3] = true;
              (ready = hasValue.every(identity_1.identity)) && (hasValue = null);
            }
          }, noop_1.noop));
        };
        for (var i2 = 0; i2 < len; i2++) {
          _loop_1(i2);
        }
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          if (ready) {
            var values = __spreadArray([value], __read(otherValues));
            subscriber.next(project ? project.apply(void 0, __spreadArray([], __read(values))) : values);
          }
        }));
      });
    }
    exports2.withLatestFrom = withLatestFrom;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/zipAll.js
var require_zipAll = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/zipAll.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.zipAll = void 0;
    var zip_1 = require_zip();
    var joinAllInternals_1 = require_joinAllInternals();
    function zipAll(project) {
      return joinAllInternals_1.joinAllInternals(zip_1.zip, project);
    }
    exports2.zipAll = zipAll;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/zip.js
var require_zip2 = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/zip.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.zip = void 0;
    var zip_1 = require_zip();
    var lift_1 = require_lift();
    function zip() {
      var sources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
      }
      return lift_1.operate(function(source, subscriber) {
        zip_1.zip.apply(void 0, __spreadArray([source], __read(sources))).subscribe(subscriber);
      });
    }
    exports2.zip = zip;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/zipWith.js
var require_zipWith = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/zipWith.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.zipWith = void 0;
    var zip_1 = require_zip2();
    function zipWith() {
      var otherInputs = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        otherInputs[_i] = arguments[_i];
      }
      return zip_1.zip.apply(void 0, __spreadArray([], __read(otherInputs)));
    }
    exports2.zipWith = zipWith;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/index.js
var require_cjs = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o5, m2, k2, k22) {
      if (k22 === void 0) k22 = k2;
      Object.defineProperty(o5, k22, { enumerable: true, get: function() {
        return m2[k2];
      } });
    }) : (function(o5, m2, k2, k22) {
      if (k22 === void 0) k22 = k2;
      o5[k22] = m2[k2];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m2, exports3) {
      for (var p3 in m2) if (p3 !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p3)) __createBinding(exports3, m2, p3);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.interval = exports2.iif = exports2.generate = exports2.fromEventPattern = exports2.fromEvent = exports2.from = exports2.forkJoin = exports2.empty = exports2.defer = exports2.connectable = exports2.concat = exports2.combineLatest = exports2.bindNodeCallback = exports2.bindCallback = exports2.UnsubscriptionError = exports2.TimeoutError = exports2.SequenceError = exports2.ObjectUnsubscribedError = exports2.NotFoundError = exports2.EmptyError = exports2.ArgumentOutOfRangeError = exports2.firstValueFrom = exports2.lastValueFrom = exports2.isObservable = exports2.identity = exports2.noop = exports2.pipe = exports2.NotificationKind = exports2.Notification = exports2.Subscriber = exports2.Subscription = exports2.Scheduler = exports2.VirtualAction = exports2.VirtualTimeScheduler = exports2.animationFrameScheduler = exports2.animationFrame = exports2.queueScheduler = exports2.queue = exports2.asyncScheduler = exports2.async = exports2.asapScheduler = exports2.asap = exports2.AsyncSubject = exports2.ReplaySubject = exports2.BehaviorSubject = exports2.Subject = exports2.animationFrames = exports2.observable = exports2.ConnectableObservable = exports2.Observable = void 0;
    exports2.filter = exports2.expand = exports2.exhaustMap = exports2.exhaustAll = exports2.exhaust = exports2.every = exports2.endWith = exports2.elementAt = exports2.distinctUntilKeyChanged = exports2.distinctUntilChanged = exports2.distinct = exports2.dematerialize = exports2.delayWhen = exports2.delay = exports2.defaultIfEmpty = exports2.debounceTime = exports2.debounce = exports2.count = exports2.connect = exports2.concatWith = exports2.concatMapTo = exports2.concatMap = exports2.concatAll = exports2.combineLatestWith = exports2.combineLatestAll = exports2.combineAll = exports2.catchError = exports2.bufferWhen = exports2.bufferToggle = exports2.bufferTime = exports2.bufferCount = exports2.buffer = exports2.auditTime = exports2.audit = exports2.config = exports2.NEVER = exports2.EMPTY = exports2.scheduled = exports2.zip = exports2.using = exports2.timer = exports2.throwError = exports2.range = exports2.race = exports2.partition = exports2.pairs = exports2.onErrorResumeNext = exports2.of = exports2.never = exports2.merge = void 0;
    exports2.switchMap = exports2.switchAll = exports2.subscribeOn = exports2.startWith = exports2.skipWhile = exports2.skipUntil = exports2.skipLast = exports2.skip = exports2.single = exports2.shareReplay = exports2.share = exports2.sequenceEqual = exports2.scan = exports2.sampleTime = exports2.sample = exports2.refCount = exports2.retryWhen = exports2.retry = exports2.repeatWhen = exports2.repeat = exports2.reduce = exports2.raceWith = exports2.publishReplay = exports2.publishLast = exports2.publishBehavior = exports2.publish = exports2.pluck = exports2.pairwise = exports2.onErrorResumeNextWith = exports2.observeOn = exports2.multicast = exports2.min = exports2.mergeWith = exports2.mergeScan = exports2.mergeMapTo = exports2.mergeMap = exports2.flatMap = exports2.mergeAll = exports2.max = exports2.materialize = exports2.mapTo = exports2.map = exports2.last = exports2.isEmpty = exports2.ignoreElements = exports2.groupBy = exports2.first = exports2.findIndex = exports2.find = exports2.finalize = void 0;
    exports2.zipWith = exports2.zipAll = exports2.withLatestFrom = exports2.windowWhen = exports2.windowToggle = exports2.windowTime = exports2.windowCount = exports2.window = exports2.toArray = exports2.timestamp = exports2.timeoutWith = exports2.timeout = exports2.timeInterval = exports2.throwIfEmpty = exports2.throttleTime = exports2.throttle = exports2.tap = exports2.takeWhile = exports2.takeUntil = exports2.takeLast = exports2.take = exports2.switchScan = exports2.switchMapTo = void 0;
    var Observable_1 = require_Observable();
    Object.defineProperty(exports2, "Observable", { enumerable: true, get: function() {
      return Observable_1.Observable;
    } });
    var ConnectableObservable_1 = require_ConnectableObservable();
    Object.defineProperty(exports2, "ConnectableObservable", { enumerable: true, get: function() {
      return ConnectableObservable_1.ConnectableObservable;
    } });
    var observable_1 = require_observable();
    Object.defineProperty(exports2, "observable", { enumerable: true, get: function() {
      return observable_1.observable;
    } });
    var animationFrames_1 = require_animationFrames();
    Object.defineProperty(exports2, "animationFrames", { enumerable: true, get: function() {
      return animationFrames_1.animationFrames;
    } });
    var Subject_1 = require_Subject();
    Object.defineProperty(exports2, "Subject", { enumerable: true, get: function() {
      return Subject_1.Subject;
    } });
    var BehaviorSubject_1 = require_BehaviorSubject();
    Object.defineProperty(exports2, "BehaviorSubject", { enumerable: true, get: function() {
      return BehaviorSubject_1.BehaviorSubject;
    } });
    var ReplaySubject_1 = require_ReplaySubject();
    Object.defineProperty(exports2, "ReplaySubject", { enumerable: true, get: function() {
      return ReplaySubject_1.ReplaySubject;
    } });
    var AsyncSubject_1 = require_AsyncSubject();
    Object.defineProperty(exports2, "AsyncSubject", { enumerable: true, get: function() {
      return AsyncSubject_1.AsyncSubject;
    } });
    var asap_1 = require_asap();
    Object.defineProperty(exports2, "asap", { enumerable: true, get: function() {
      return asap_1.asap;
    } });
    Object.defineProperty(exports2, "asapScheduler", { enumerable: true, get: function() {
      return asap_1.asapScheduler;
    } });
    var async_1 = require_async();
    Object.defineProperty(exports2, "async", { enumerable: true, get: function() {
      return async_1.async;
    } });
    Object.defineProperty(exports2, "asyncScheduler", { enumerable: true, get: function() {
      return async_1.asyncScheduler;
    } });
    var queue_1 = require_queue();
    Object.defineProperty(exports2, "queue", { enumerable: true, get: function() {
      return queue_1.queue;
    } });
    Object.defineProperty(exports2, "queueScheduler", { enumerable: true, get: function() {
      return queue_1.queueScheduler;
    } });
    var animationFrame_1 = require_animationFrame();
    Object.defineProperty(exports2, "animationFrame", { enumerable: true, get: function() {
      return animationFrame_1.animationFrame;
    } });
    Object.defineProperty(exports2, "animationFrameScheduler", { enumerable: true, get: function() {
      return animationFrame_1.animationFrameScheduler;
    } });
    var VirtualTimeScheduler_1 = require_VirtualTimeScheduler();
    Object.defineProperty(exports2, "VirtualTimeScheduler", { enumerable: true, get: function() {
      return VirtualTimeScheduler_1.VirtualTimeScheduler;
    } });
    Object.defineProperty(exports2, "VirtualAction", { enumerable: true, get: function() {
      return VirtualTimeScheduler_1.VirtualAction;
    } });
    var Scheduler_1 = require_Scheduler();
    Object.defineProperty(exports2, "Scheduler", { enumerable: true, get: function() {
      return Scheduler_1.Scheduler;
    } });
    var Subscription_1 = require_Subscription();
    Object.defineProperty(exports2, "Subscription", { enumerable: true, get: function() {
      return Subscription_1.Subscription;
    } });
    var Subscriber_1 = require_Subscriber();
    Object.defineProperty(exports2, "Subscriber", { enumerable: true, get: function() {
      return Subscriber_1.Subscriber;
    } });
    var Notification_1 = require_Notification();
    Object.defineProperty(exports2, "Notification", { enumerable: true, get: function() {
      return Notification_1.Notification;
    } });
    Object.defineProperty(exports2, "NotificationKind", { enumerable: true, get: function() {
      return Notification_1.NotificationKind;
    } });
    var pipe_1 = require_pipe();
    Object.defineProperty(exports2, "pipe", { enumerable: true, get: function() {
      return pipe_1.pipe;
    } });
    var noop_1 = require_noop();
    Object.defineProperty(exports2, "noop", { enumerable: true, get: function() {
      return noop_1.noop;
    } });
    var identity_1 = require_identity();
    Object.defineProperty(exports2, "identity", { enumerable: true, get: function() {
      return identity_1.identity;
    } });
    var isObservable_1 = require_isObservable();
    Object.defineProperty(exports2, "isObservable", { enumerable: true, get: function() {
      return isObservable_1.isObservable;
    } });
    var lastValueFrom_1 = require_lastValueFrom();
    Object.defineProperty(exports2, "lastValueFrom", { enumerable: true, get: function() {
      return lastValueFrom_1.lastValueFrom;
    } });
    var firstValueFrom_1 = require_firstValueFrom();
    Object.defineProperty(exports2, "firstValueFrom", { enumerable: true, get: function() {
      return firstValueFrom_1.firstValueFrom;
    } });
    var ArgumentOutOfRangeError_1 = require_ArgumentOutOfRangeError();
    Object.defineProperty(exports2, "ArgumentOutOfRangeError", { enumerable: true, get: function() {
      return ArgumentOutOfRangeError_1.ArgumentOutOfRangeError;
    } });
    var EmptyError_1 = require_EmptyError();
    Object.defineProperty(exports2, "EmptyError", { enumerable: true, get: function() {
      return EmptyError_1.EmptyError;
    } });
    var NotFoundError_1 = require_NotFoundError();
    Object.defineProperty(exports2, "NotFoundError", { enumerable: true, get: function() {
      return NotFoundError_1.NotFoundError;
    } });
    var ObjectUnsubscribedError_1 = require_ObjectUnsubscribedError();
    Object.defineProperty(exports2, "ObjectUnsubscribedError", { enumerable: true, get: function() {
      return ObjectUnsubscribedError_1.ObjectUnsubscribedError;
    } });
    var SequenceError_1 = require_SequenceError();
    Object.defineProperty(exports2, "SequenceError", { enumerable: true, get: function() {
      return SequenceError_1.SequenceError;
    } });
    var timeout_1 = require_timeout();
    Object.defineProperty(exports2, "TimeoutError", { enumerable: true, get: function() {
      return timeout_1.TimeoutError;
    } });
    var UnsubscriptionError_1 = require_UnsubscriptionError();
    Object.defineProperty(exports2, "UnsubscriptionError", { enumerable: true, get: function() {
      return UnsubscriptionError_1.UnsubscriptionError;
    } });
    var bindCallback_1 = require_bindCallback();
    Object.defineProperty(exports2, "bindCallback", { enumerable: true, get: function() {
      return bindCallback_1.bindCallback;
    } });
    var bindNodeCallback_1 = require_bindNodeCallback();
    Object.defineProperty(exports2, "bindNodeCallback", { enumerable: true, get: function() {
      return bindNodeCallback_1.bindNodeCallback;
    } });
    var combineLatest_1 = require_combineLatest();
    Object.defineProperty(exports2, "combineLatest", { enumerable: true, get: function() {
      return combineLatest_1.combineLatest;
    } });
    var concat_1 = require_concat();
    Object.defineProperty(exports2, "concat", { enumerable: true, get: function() {
      return concat_1.concat;
    } });
    var connectable_1 = require_connectable();
    Object.defineProperty(exports2, "connectable", { enumerable: true, get: function() {
      return connectable_1.connectable;
    } });
    var defer_1 = require_defer();
    Object.defineProperty(exports2, "defer", { enumerable: true, get: function() {
      return defer_1.defer;
    } });
    var empty_1 = require_empty();
    Object.defineProperty(exports2, "empty", { enumerable: true, get: function() {
      return empty_1.empty;
    } });
    var forkJoin_1 = require_forkJoin();
    Object.defineProperty(exports2, "forkJoin", { enumerable: true, get: function() {
      return forkJoin_1.forkJoin;
    } });
    var from_1 = require_from2();
    Object.defineProperty(exports2, "from", { enumerable: true, get: function() {
      return from_1.from;
    } });
    var fromEvent_1 = require_fromEvent();
    Object.defineProperty(exports2, "fromEvent", { enumerable: true, get: function() {
      return fromEvent_1.fromEvent;
    } });
    var fromEventPattern_1 = require_fromEventPattern();
    Object.defineProperty(exports2, "fromEventPattern", { enumerable: true, get: function() {
      return fromEventPattern_1.fromEventPattern;
    } });
    var generate_1 = require_generate();
    Object.defineProperty(exports2, "generate", { enumerable: true, get: function() {
      return generate_1.generate;
    } });
    var iif_1 = require_iif();
    Object.defineProperty(exports2, "iif", { enumerable: true, get: function() {
      return iif_1.iif;
    } });
    var interval_1 = require_interval();
    Object.defineProperty(exports2, "interval", { enumerable: true, get: function() {
      return interval_1.interval;
    } });
    var merge_1 = require_merge();
    Object.defineProperty(exports2, "merge", { enumerable: true, get: function() {
      return merge_1.merge;
    } });
    var never_1 = require_never();
    Object.defineProperty(exports2, "never", { enumerable: true, get: function() {
      return never_1.never;
    } });
    var of_1 = require_of();
    Object.defineProperty(exports2, "of", { enumerable: true, get: function() {
      return of_1.of;
    } });
    var onErrorResumeNext_1 = require_onErrorResumeNext();
    Object.defineProperty(exports2, "onErrorResumeNext", { enumerable: true, get: function() {
      return onErrorResumeNext_1.onErrorResumeNext;
    } });
    var pairs_1 = require_pairs();
    Object.defineProperty(exports2, "pairs", { enumerable: true, get: function() {
      return pairs_1.pairs;
    } });
    var partition_1 = require_partition();
    Object.defineProperty(exports2, "partition", { enumerable: true, get: function() {
      return partition_1.partition;
    } });
    var race_1 = require_race();
    Object.defineProperty(exports2, "race", { enumerable: true, get: function() {
      return race_1.race;
    } });
    var range_1 = require_range();
    Object.defineProperty(exports2, "range", { enumerable: true, get: function() {
      return range_1.range;
    } });
    var throwError_1 = require_throwError();
    Object.defineProperty(exports2, "throwError", { enumerable: true, get: function() {
      return throwError_1.throwError;
    } });
    var timer_1 = require_timer();
    Object.defineProperty(exports2, "timer", { enumerable: true, get: function() {
      return timer_1.timer;
    } });
    var using_1 = require_using();
    Object.defineProperty(exports2, "using", { enumerable: true, get: function() {
      return using_1.using;
    } });
    var zip_1 = require_zip();
    Object.defineProperty(exports2, "zip", { enumerable: true, get: function() {
      return zip_1.zip;
    } });
    var scheduled_1 = require_scheduled();
    Object.defineProperty(exports2, "scheduled", { enumerable: true, get: function() {
      return scheduled_1.scheduled;
    } });
    var empty_2 = require_empty();
    Object.defineProperty(exports2, "EMPTY", { enumerable: true, get: function() {
      return empty_2.EMPTY;
    } });
    var never_2 = require_never();
    Object.defineProperty(exports2, "NEVER", { enumerable: true, get: function() {
      return never_2.NEVER;
    } });
    __exportStar(require_types(), exports2);
    var config_1 = require_config();
    Object.defineProperty(exports2, "config", { enumerable: true, get: function() {
      return config_1.config;
    } });
    var audit_1 = require_audit();
    Object.defineProperty(exports2, "audit", { enumerable: true, get: function() {
      return audit_1.audit;
    } });
    var auditTime_1 = require_auditTime();
    Object.defineProperty(exports2, "auditTime", { enumerable: true, get: function() {
      return auditTime_1.auditTime;
    } });
    var buffer_1 = require_buffer();
    Object.defineProperty(exports2, "buffer", { enumerable: true, get: function() {
      return buffer_1.buffer;
    } });
    var bufferCount_1 = require_bufferCount();
    Object.defineProperty(exports2, "bufferCount", { enumerable: true, get: function() {
      return bufferCount_1.bufferCount;
    } });
    var bufferTime_1 = require_bufferTime();
    Object.defineProperty(exports2, "bufferTime", { enumerable: true, get: function() {
      return bufferTime_1.bufferTime;
    } });
    var bufferToggle_1 = require_bufferToggle();
    Object.defineProperty(exports2, "bufferToggle", { enumerable: true, get: function() {
      return bufferToggle_1.bufferToggle;
    } });
    var bufferWhen_1 = require_bufferWhen();
    Object.defineProperty(exports2, "bufferWhen", { enumerable: true, get: function() {
      return bufferWhen_1.bufferWhen;
    } });
    var catchError_1 = require_catchError();
    Object.defineProperty(exports2, "catchError", { enumerable: true, get: function() {
      return catchError_1.catchError;
    } });
    var combineAll_1 = require_combineAll();
    Object.defineProperty(exports2, "combineAll", { enumerable: true, get: function() {
      return combineAll_1.combineAll;
    } });
    var combineLatestAll_1 = require_combineLatestAll();
    Object.defineProperty(exports2, "combineLatestAll", { enumerable: true, get: function() {
      return combineLatestAll_1.combineLatestAll;
    } });
    var combineLatestWith_1 = require_combineLatestWith();
    Object.defineProperty(exports2, "combineLatestWith", { enumerable: true, get: function() {
      return combineLatestWith_1.combineLatestWith;
    } });
    var concatAll_1 = require_concatAll();
    Object.defineProperty(exports2, "concatAll", { enumerable: true, get: function() {
      return concatAll_1.concatAll;
    } });
    var concatMap_1 = require_concatMap();
    Object.defineProperty(exports2, "concatMap", { enumerable: true, get: function() {
      return concatMap_1.concatMap;
    } });
    var concatMapTo_1 = require_concatMapTo();
    Object.defineProperty(exports2, "concatMapTo", { enumerable: true, get: function() {
      return concatMapTo_1.concatMapTo;
    } });
    var concatWith_1 = require_concatWith();
    Object.defineProperty(exports2, "concatWith", { enumerable: true, get: function() {
      return concatWith_1.concatWith;
    } });
    var connect_1 = require_connect();
    Object.defineProperty(exports2, "connect", { enumerable: true, get: function() {
      return connect_1.connect;
    } });
    var count_1 = require_count();
    Object.defineProperty(exports2, "count", { enumerable: true, get: function() {
      return count_1.count;
    } });
    var debounce_1 = require_debounce();
    Object.defineProperty(exports2, "debounce", { enumerable: true, get: function() {
      return debounce_1.debounce;
    } });
    var debounceTime_1 = require_debounceTime();
    Object.defineProperty(exports2, "debounceTime", { enumerable: true, get: function() {
      return debounceTime_1.debounceTime;
    } });
    var defaultIfEmpty_1 = require_defaultIfEmpty();
    Object.defineProperty(exports2, "defaultIfEmpty", { enumerable: true, get: function() {
      return defaultIfEmpty_1.defaultIfEmpty;
    } });
    var delay_1 = require_delay();
    Object.defineProperty(exports2, "delay", { enumerable: true, get: function() {
      return delay_1.delay;
    } });
    var delayWhen_1 = require_delayWhen();
    Object.defineProperty(exports2, "delayWhen", { enumerable: true, get: function() {
      return delayWhen_1.delayWhen;
    } });
    var dematerialize_1 = require_dematerialize();
    Object.defineProperty(exports2, "dematerialize", { enumerable: true, get: function() {
      return dematerialize_1.dematerialize;
    } });
    var distinct_1 = require_distinct();
    Object.defineProperty(exports2, "distinct", { enumerable: true, get: function() {
      return distinct_1.distinct;
    } });
    var distinctUntilChanged_1 = require_distinctUntilChanged();
    Object.defineProperty(exports2, "distinctUntilChanged", { enumerable: true, get: function() {
      return distinctUntilChanged_1.distinctUntilChanged;
    } });
    var distinctUntilKeyChanged_1 = require_distinctUntilKeyChanged();
    Object.defineProperty(exports2, "distinctUntilKeyChanged", { enumerable: true, get: function() {
      return distinctUntilKeyChanged_1.distinctUntilKeyChanged;
    } });
    var elementAt_1 = require_elementAt();
    Object.defineProperty(exports2, "elementAt", { enumerable: true, get: function() {
      return elementAt_1.elementAt;
    } });
    var endWith_1 = require_endWith();
    Object.defineProperty(exports2, "endWith", { enumerable: true, get: function() {
      return endWith_1.endWith;
    } });
    var every_1 = require_every();
    Object.defineProperty(exports2, "every", { enumerable: true, get: function() {
      return every_1.every;
    } });
    var exhaust_1 = require_exhaust();
    Object.defineProperty(exports2, "exhaust", { enumerable: true, get: function() {
      return exhaust_1.exhaust;
    } });
    var exhaustAll_1 = require_exhaustAll();
    Object.defineProperty(exports2, "exhaustAll", { enumerable: true, get: function() {
      return exhaustAll_1.exhaustAll;
    } });
    var exhaustMap_1 = require_exhaustMap();
    Object.defineProperty(exports2, "exhaustMap", { enumerable: true, get: function() {
      return exhaustMap_1.exhaustMap;
    } });
    var expand_1 = require_expand();
    Object.defineProperty(exports2, "expand", { enumerable: true, get: function() {
      return expand_1.expand;
    } });
    var filter_1 = require_filter();
    Object.defineProperty(exports2, "filter", { enumerable: true, get: function() {
      return filter_1.filter;
    } });
    var finalize_1 = require_finalize();
    Object.defineProperty(exports2, "finalize", { enumerable: true, get: function() {
      return finalize_1.finalize;
    } });
    var find_1 = require_find();
    Object.defineProperty(exports2, "find", { enumerable: true, get: function() {
      return find_1.find;
    } });
    var findIndex_1 = require_findIndex();
    Object.defineProperty(exports2, "findIndex", { enumerable: true, get: function() {
      return findIndex_1.findIndex;
    } });
    var first_1 = require_first();
    Object.defineProperty(exports2, "first", { enumerable: true, get: function() {
      return first_1.first;
    } });
    var groupBy_1 = require_groupBy();
    Object.defineProperty(exports2, "groupBy", { enumerable: true, get: function() {
      return groupBy_1.groupBy;
    } });
    var ignoreElements_1 = require_ignoreElements();
    Object.defineProperty(exports2, "ignoreElements", { enumerable: true, get: function() {
      return ignoreElements_1.ignoreElements;
    } });
    var isEmpty_1 = require_isEmpty();
    Object.defineProperty(exports2, "isEmpty", { enumerable: true, get: function() {
      return isEmpty_1.isEmpty;
    } });
    var last_1 = require_last();
    Object.defineProperty(exports2, "last", { enumerable: true, get: function() {
      return last_1.last;
    } });
    var map_1 = require_map();
    Object.defineProperty(exports2, "map", { enumerable: true, get: function() {
      return map_1.map;
    } });
    var mapTo_1 = require_mapTo();
    Object.defineProperty(exports2, "mapTo", { enumerable: true, get: function() {
      return mapTo_1.mapTo;
    } });
    var materialize_1 = require_materialize();
    Object.defineProperty(exports2, "materialize", { enumerable: true, get: function() {
      return materialize_1.materialize;
    } });
    var max_1 = require_max();
    Object.defineProperty(exports2, "max", { enumerable: true, get: function() {
      return max_1.max;
    } });
    var mergeAll_1 = require_mergeAll();
    Object.defineProperty(exports2, "mergeAll", { enumerable: true, get: function() {
      return mergeAll_1.mergeAll;
    } });
    var flatMap_1 = require_flatMap();
    Object.defineProperty(exports2, "flatMap", { enumerable: true, get: function() {
      return flatMap_1.flatMap;
    } });
    var mergeMap_1 = require_mergeMap();
    Object.defineProperty(exports2, "mergeMap", { enumerable: true, get: function() {
      return mergeMap_1.mergeMap;
    } });
    var mergeMapTo_1 = require_mergeMapTo();
    Object.defineProperty(exports2, "mergeMapTo", { enumerable: true, get: function() {
      return mergeMapTo_1.mergeMapTo;
    } });
    var mergeScan_1 = require_mergeScan();
    Object.defineProperty(exports2, "mergeScan", { enumerable: true, get: function() {
      return mergeScan_1.mergeScan;
    } });
    var mergeWith_1 = require_mergeWith();
    Object.defineProperty(exports2, "mergeWith", { enumerable: true, get: function() {
      return mergeWith_1.mergeWith;
    } });
    var min_1 = require_min();
    Object.defineProperty(exports2, "min", { enumerable: true, get: function() {
      return min_1.min;
    } });
    var multicast_1 = require_multicast();
    Object.defineProperty(exports2, "multicast", { enumerable: true, get: function() {
      return multicast_1.multicast;
    } });
    var observeOn_1 = require_observeOn();
    Object.defineProperty(exports2, "observeOn", { enumerable: true, get: function() {
      return observeOn_1.observeOn;
    } });
    var onErrorResumeNextWith_1 = require_onErrorResumeNextWith();
    Object.defineProperty(exports2, "onErrorResumeNextWith", { enumerable: true, get: function() {
      return onErrorResumeNextWith_1.onErrorResumeNextWith;
    } });
    var pairwise_1 = require_pairwise();
    Object.defineProperty(exports2, "pairwise", { enumerable: true, get: function() {
      return pairwise_1.pairwise;
    } });
    var pluck_1 = require_pluck();
    Object.defineProperty(exports2, "pluck", { enumerable: true, get: function() {
      return pluck_1.pluck;
    } });
    var publish_1 = require_publish();
    Object.defineProperty(exports2, "publish", { enumerable: true, get: function() {
      return publish_1.publish;
    } });
    var publishBehavior_1 = require_publishBehavior();
    Object.defineProperty(exports2, "publishBehavior", { enumerable: true, get: function() {
      return publishBehavior_1.publishBehavior;
    } });
    var publishLast_1 = require_publishLast();
    Object.defineProperty(exports2, "publishLast", { enumerable: true, get: function() {
      return publishLast_1.publishLast;
    } });
    var publishReplay_1 = require_publishReplay();
    Object.defineProperty(exports2, "publishReplay", { enumerable: true, get: function() {
      return publishReplay_1.publishReplay;
    } });
    var raceWith_1 = require_raceWith();
    Object.defineProperty(exports2, "raceWith", { enumerable: true, get: function() {
      return raceWith_1.raceWith;
    } });
    var reduce_1 = require_reduce();
    Object.defineProperty(exports2, "reduce", { enumerable: true, get: function() {
      return reduce_1.reduce;
    } });
    var repeat_1 = require_repeat();
    Object.defineProperty(exports2, "repeat", { enumerable: true, get: function() {
      return repeat_1.repeat;
    } });
    var repeatWhen_1 = require_repeatWhen();
    Object.defineProperty(exports2, "repeatWhen", { enumerable: true, get: function() {
      return repeatWhen_1.repeatWhen;
    } });
    var retry_1 = require_retry();
    Object.defineProperty(exports2, "retry", { enumerable: true, get: function() {
      return retry_1.retry;
    } });
    var retryWhen_1 = require_retryWhen();
    Object.defineProperty(exports2, "retryWhen", { enumerable: true, get: function() {
      return retryWhen_1.retryWhen;
    } });
    var refCount_1 = require_refCount();
    Object.defineProperty(exports2, "refCount", { enumerable: true, get: function() {
      return refCount_1.refCount;
    } });
    var sample_1 = require_sample();
    Object.defineProperty(exports2, "sample", { enumerable: true, get: function() {
      return sample_1.sample;
    } });
    var sampleTime_1 = require_sampleTime();
    Object.defineProperty(exports2, "sampleTime", { enumerable: true, get: function() {
      return sampleTime_1.sampleTime;
    } });
    var scan_1 = require_scan();
    Object.defineProperty(exports2, "scan", { enumerable: true, get: function() {
      return scan_1.scan;
    } });
    var sequenceEqual_1 = require_sequenceEqual();
    Object.defineProperty(exports2, "sequenceEqual", { enumerable: true, get: function() {
      return sequenceEqual_1.sequenceEqual;
    } });
    var share_1 = require_share();
    Object.defineProperty(exports2, "share", { enumerable: true, get: function() {
      return share_1.share;
    } });
    var shareReplay_1 = require_shareReplay();
    Object.defineProperty(exports2, "shareReplay", { enumerable: true, get: function() {
      return shareReplay_1.shareReplay;
    } });
    var single_1 = require_single();
    Object.defineProperty(exports2, "single", { enumerable: true, get: function() {
      return single_1.single;
    } });
    var skip_1 = require_skip();
    Object.defineProperty(exports2, "skip", { enumerable: true, get: function() {
      return skip_1.skip;
    } });
    var skipLast_1 = require_skipLast();
    Object.defineProperty(exports2, "skipLast", { enumerable: true, get: function() {
      return skipLast_1.skipLast;
    } });
    var skipUntil_1 = require_skipUntil();
    Object.defineProperty(exports2, "skipUntil", { enumerable: true, get: function() {
      return skipUntil_1.skipUntil;
    } });
    var skipWhile_1 = require_skipWhile();
    Object.defineProperty(exports2, "skipWhile", { enumerable: true, get: function() {
      return skipWhile_1.skipWhile;
    } });
    var startWith_1 = require_startWith();
    Object.defineProperty(exports2, "startWith", { enumerable: true, get: function() {
      return startWith_1.startWith;
    } });
    var subscribeOn_1 = require_subscribeOn();
    Object.defineProperty(exports2, "subscribeOn", { enumerable: true, get: function() {
      return subscribeOn_1.subscribeOn;
    } });
    var switchAll_1 = require_switchAll();
    Object.defineProperty(exports2, "switchAll", { enumerable: true, get: function() {
      return switchAll_1.switchAll;
    } });
    var switchMap_1 = require_switchMap();
    Object.defineProperty(exports2, "switchMap", { enumerable: true, get: function() {
      return switchMap_1.switchMap;
    } });
    var switchMapTo_1 = require_switchMapTo();
    Object.defineProperty(exports2, "switchMapTo", { enumerable: true, get: function() {
      return switchMapTo_1.switchMapTo;
    } });
    var switchScan_1 = require_switchScan();
    Object.defineProperty(exports2, "switchScan", { enumerable: true, get: function() {
      return switchScan_1.switchScan;
    } });
    var take_1 = require_take();
    Object.defineProperty(exports2, "take", { enumerable: true, get: function() {
      return take_1.take;
    } });
    var takeLast_1 = require_takeLast();
    Object.defineProperty(exports2, "takeLast", { enumerable: true, get: function() {
      return takeLast_1.takeLast;
    } });
    var takeUntil_1 = require_takeUntil();
    Object.defineProperty(exports2, "takeUntil", { enumerable: true, get: function() {
      return takeUntil_1.takeUntil;
    } });
    var takeWhile_1 = require_takeWhile();
    Object.defineProperty(exports2, "takeWhile", { enumerable: true, get: function() {
      return takeWhile_1.takeWhile;
    } });
    var tap_1 = require_tap();
    Object.defineProperty(exports2, "tap", { enumerable: true, get: function() {
      return tap_1.tap;
    } });
    var throttle_1 = require_throttle();
    Object.defineProperty(exports2, "throttle", { enumerable: true, get: function() {
      return throttle_1.throttle;
    } });
    var throttleTime_1 = require_throttleTime();
    Object.defineProperty(exports2, "throttleTime", { enumerable: true, get: function() {
      return throttleTime_1.throttleTime;
    } });
    var throwIfEmpty_1 = require_throwIfEmpty();
    Object.defineProperty(exports2, "throwIfEmpty", { enumerable: true, get: function() {
      return throwIfEmpty_1.throwIfEmpty;
    } });
    var timeInterval_1 = require_timeInterval();
    Object.defineProperty(exports2, "timeInterval", { enumerable: true, get: function() {
      return timeInterval_1.timeInterval;
    } });
    var timeout_2 = require_timeout();
    Object.defineProperty(exports2, "timeout", { enumerable: true, get: function() {
      return timeout_2.timeout;
    } });
    var timeoutWith_1 = require_timeoutWith();
    Object.defineProperty(exports2, "timeoutWith", { enumerable: true, get: function() {
      return timeoutWith_1.timeoutWith;
    } });
    var timestamp_1 = require_timestamp();
    Object.defineProperty(exports2, "timestamp", { enumerable: true, get: function() {
      return timestamp_1.timestamp;
    } });
    var toArray_1 = require_toArray();
    Object.defineProperty(exports2, "toArray", { enumerable: true, get: function() {
      return toArray_1.toArray;
    } });
    var window_1 = require_window();
    Object.defineProperty(exports2, "window", { enumerable: true, get: function() {
      return window_1.window;
    } });
    var windowCount_1 = require_windowCount();
    Object.defineProperty(exports2, "windowCount", { enumerable: true, get: function() {
      return windowCount_1.windowCount;
    } });
    var windowTime_1 = require_windowTime();
    Object.defineProperty(exports2, "windowTime", { enumerable: true, get: function() {
      return windowTime_1.windowTime;
    } });
    var windowToggle_1 = require_windowToggle();
    Object.defineProperty(exports2, "windowToggle", { enumerable: true, get: function() {
      return windowToggle_1.windowToggle;
    } });
    var windowWhen_1 = require_windowWhen();
    Object.defineProperty(exports2, "windowWhen", { enumerable: true, get: function() {
      return windowWhen_1.windowWhen;
    } });
    var withLatestFrom_1 = require_withLatestFrom();
    Object.defineProperty(exports2, "withLatestFrom", { enumerable: true, get: function() {
      return withLatestFrom_1.withLatestFrom;
    } });
    var zipAll_1 = require_zipAll();
    Object.defineProperty(exports2, "zipAll", { enumerable: true, get: function() {
      return zipAll_1.zipAll;
    } });
    var zipWith_1 = require_zipWith();
    Object.defineProperty(exports2, "zipWith", { enumerable: true, get: function() {
      return zipWith_1.zipWith;
    } });
  }
});

// ../node_modules/.pnpm/@sanity+client@7.10.0/node_modules/@sanity/client/dist/_chunks-es/stegaClean.js
function isRecord2(value) {
  return typeof value == "object" && value !== null && !Array.isArray(value);
}
function E2(t4) {
  let e5 = JSON.stringify(t4);
  return `${u3}${Array.from(e5).map((r5) => {
    let n5 = r5.charCodeAt(0);
    if (n5 > 255) throw new Error(`Only ASCII edit info can be encoded. Error attempting to encode ${e5} on character ${r5} (${n5})`);
    return Array.from(n5.toString(4).padStart(4, "0")).map((o5) => String.fromCodePoint(c3[o5])).join("");
  }).join("")}`;
}
function I2(t4) {
  return !Number.isNaN(Number(t4)) || /[a-z]/i.test(t4) && !/\d+(?:[-:\/]\d+){2}(?:T\d+(?:[-:\/]\d+){1,2}(\.\d+)?Z?)?/.test(t4) ? false : !!Date.parse(t4);
}
function T3(t4) {
  try {
    new URL(t4, t4.startsWith("/") ? "https://acme.com" : void 0);
  } catch {
    return false;
  }
  return true;
}
function C2(t4, e5, r5 = "auto") {
  return r5 === true || r5 === "auto" && (I2(t4) || T3(t4)) ? t4 : `${t4}${E2(e5)}`;
}
function _(t4) {
  var e5;
  return { cleaned: t4.replace(f2, ""), encoded: ((e5 = t4.match(f2)) == null ? void 0 : e5[0]) || "" };
}
function O3(t4) {
  return t4 && JSON.parse(_(JSON.stringify(t4)).cleaned);
}
function stegaClean(result) {
  return O3(result);
}
var s3, c3, u3, S2, f2;
var init_stegaClean = __esm({
  "../node_modules/.pnpm/@sanity+client@7.10.0/node_modules/@sanity/client/dist/_chunks-es/stegaClean.js"() {
    s3 = { 0: 8203, 1: 8204, 2: 8205, 3: 8290, 4: 8291, 5: 8288, 6: 65279, 7: 8289, 8: 119155, 9: 119156, a: 119157, b: 119158, c: 119159, d: 119160, e: 119161, f: 119162 };
    c3 = { 0: 8203, 1: 8204, 2: 8205, 3: 65279 };
    u3 = new Array(4).fill(String.fromCodePoint(c3[0])).join("");
    Object.fromEntries(Object.entries(c3).map((t4) => t4.reverse()));
    Object.fromEntries(Object.entries(s3).map((t4) => t4.reverse()));
    S2 = `${Object.values(s3).map((t4) => `\\u{${t4.toString(16)}}`).join("")}`;
    f2 = new RegExp(`[${S2}]{4,}`, "gu");
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/partition.js
var require_partition2 = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/partition.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.partition = void 0;
    var not_1 = require_not();
    var filter_1 = require_filter();
    function partition(predicate, thisArg) {
      return function(source) {
        return [filter_1.filter(predicate, thisArg)(source), filter_1.filter(not_1.not(predicate, thisArg))(source)];
      };
    }
    exports2.partition = partition;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/race.js
var require_race2 = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/internal/operators/race.js"(exports2) {
    "use strict";
    var __read = exports2 && exports2.__read || function(o5, n5) {
      var m2 = typeof Symbol === "function" && o5[Symbol.iterator];
      if (!m2) return o5;
      var i2 = m2.call(o5), r5, ar = [], e5;
      try {
        while ((n5 === void 0 || n5-- > 0) && !(r5 = i2.next()).done) ar.push(r5.value);
      } catch (error) {
        e5 = { error };
      } finally {
        try {
          if (r5 && !r5.done && (m2 = i2["return"])) m2.call(i2);
        } finally {
          if (e5) throw e5.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from2) {
      for (var i2 = 0, il = from2.length, j2 = to.length; i2 < il; i2++, j2++)
        to[j2] = from2[i2];
      return to;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.race = void 0;
    var argsOrArgArray_1 = require_argsOrArgArray();
    var raceWith_1 = require_raceWith();
    function race() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return raceWith_1.raceWith.apply(void 0, __spreadArray([], __read(argsOrArgArray_1.argsOrArgArray(args))));
    }
    exports2.race = race;
  }
});

// ../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/operators/index.js
var require_operators = __commonJS({
  "../node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/dist/cjs/operators/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mergeAll = exports2.merge = exports2.max = exports2.materialize = exports2.mapTo = exports2.map = exports2.last = exports2.isEmpty = exports2.ignoreElements = exports2.groupBy = exports2.first = exports2.findIndex = exports2.find = exports2.finalize = exports2.filter = exports2.expand = exports2.exhaustMap = exports2.exhaustAll = exports2.exhaust = exports2.every = exports2.endWith = exports2.elementAt = exports2.distinctUntilKeyChanged = exports2.distinctUntilChanged = exports2.distinct = exports2.dematerialize = exports2.delayWhen = exports2.delay = exports2.defaultIfEmpty = exports2.debounceTime = exports2.debounce = exports2.count = exports2.connect = exports2.concatWith = exports2.concatMapTo = exports2.concatMap = exports2.concatAll = exports2.concat = exports2.combineLatestWith = exports2.combineLatest = exports2.combineLatestAll = exports2.combineAll = exports2.catchError = exports2.bufferWhen = exports2.bufferToggle = exports2.bufferTime = exports2.bufferCount = exports2.buffer = exports2.auditTime = exports2.audit = void 0;
    exports2.timeInterval = exports2.throwIfEmpty = exports2.throttleTime = exports2.throttle = exports2.tap = exports2.takeWhile = exports2.takeUntil = exports2.takeLast = exports2.take = exports2.switchScan = exports2.switchMapTo = exports2.switchMap = exports2.switchAll = exports2.subscribeOn = exports2.startWith = exports2.skipWhile = exports2.skipUntil = exports2.skipLast = exports2.skip = exports2.single = exports2.shareReplay = exports2.share = exports2.sequenceEqual = exports2.scan = exports2.sampleTime = exports2.sample = exports2.refCount = exports2.retryWhen = exports2.retry = exports2.repeatWhen = exports2.repeat = exports2.reduce = exports2.raceWith = exports2.race = exports2.publishReplay = exports2.publishLast = exports2.publishBehavior = exports2.publish = exports2.pluck = exports2.partition = exports2.pairwise = exports2.onErrorResumeNext = exports2.observeOn = exports2.multicast = exports2.min = exports2.mergeWith = exports2.mergeScan = exports2.mergeMapTo = exports2.mergeMap = exports2.flatMap = void 0;
    exports2.zipWith = exports2.zipAll = exports2.zip = exports2.withLatestFrom = exports2.windowWhen = exports2.windowToggle = exports2.windowTime = exports2.windowCount = exports2.window = exports2.toArray = exports2.timestamp = exports2.timeoutWith = exports2.timeout = void 0;
    var audit_1 = require_audit();
    Object.defineProperty(exports2, "audit", { enumerable: true, get: function() {
      return audit_1.audit;
    } });
    var auditTime_1 = require_auditTime();
    Object.defineProperty(exports2, "auditTime", { enumerable: true, get: function() {
      return auditTime_1.auditTime;
    } });
    var buffer_1 = require_buffer();
    Object.defineProperty(exports2, "buffer", { enumerable: true, get: function() {
      return buffer_1.buffer;
    } });
    var bufferCount_1 = require_bufferCount();
    Object.defineProperty(exports2, "bufferCount", { enumerable: true, get: function() {
      return bufferCount_1.bufferCount;
    } });
    var bufferTime_1 = require_bufferTime();
    Object.defineProperty(exports2, "bufferTime", { enumerable: true, get: function() {
      return bufferTime_1.bufferTime;
    } });
    var bufferToggle_1 = require_bufferToggle();
    Object.defineProperty(exports2, "bufferToggle", { enumerable: true, get: function() {
      return bufferToggle_1.bufferToggle;
    } });
    var bufferWhen_1 = require_bufferWhen();
    Object.defineProperty(exports2, "bufferWhen", { enumerable: true, get: function() {
      return bufferWhen_1.bufferWhen;
    } });
    var catchError_1 = require_catchError();
    Object.defineProperty(exports2, "catchError", { enumerable: true, get: function() {
      return catchError_1.catchError;
    } });
    var combineAll_1 = require_combineAll();
    Object.defineProperty(exports2, "combineAll", { enumerable: true, get: function() {
      return combineAll_1.combineAll;
    } });
    var combineLatestAll_1 = require_combineLatestAll();
    Object.defineProperty(exports2, "combineLatestAll", { enumerable: true, get: function() {
      return combineLatestAll_1.combineLatestAll;
    } });
    var combineLatest_1 = require_combineLatest2();
    Object.defineProperty(exports2, "combineLatest", { enumerable: true, get: function() {
      return combineLatest_1.combineLatest;
    } });
    var combineLatestWith_1 = require_combineLatestWith();
    Object.defineProperty(exports2, "combineLatestWith", { enumerable: true, get: function() {
      return combineLatestWith_1.combineLatestWith;
    } });
    var concat_1 = require_concat2();
    Object.defineProperty(exports2, "concat", { enumerable: true, get: function() {
      return concat_1.concat;
    } });
    var concatAll_1 = require_concatAll();
    Object.defineProperty(exports2, "concatAll", { enumerable: true, get: function() {
      return concatAll_1.concatAll;
    } });
    var concatMap_1 = require_concatMap();
    Object.defineProperty(exports2, "concatMap", { enumerable: true, get: function() {
      return concatMap_1.concatMap;
    } });
    var concatMapTo_1 = require_concatMapTo();
    Object.defineProperty(exports2, "concatMapTo", { enumerable: true, get: function() {
      return concatMapTo_1.concatMapTo;
    } });
    var concatWith_1 = require_concatWith();
    Object.defineProperty(exports2, "concatWith", { enumerable: true, get: function() {
      return concatWith_1.concatWith;
    } });
    var connect_1 = require_connect();
    Object.defineProperty(exports2, "connect", { enumerable: true, get: function() {
      return connect_1.connect;
    } });
    var count_1 = require_count();
    Object.defineProperty(exports2, "count", { enumerable: true, get: function() {
      return count_1.count;
    } });
    var debounce_1 = require_debounce();
    Object.defineProperty(exports2, "debounce", { enumerable: true, get: function() {
      return debounce_1.debounce;
    } });
    var debounceTime_1 = require_debounceTime();
    Object.defineProperty(exports2, "debounceTime", { enumerable: true, get: function() {
      return debounceTime_1.debounceTime;
    } });
    var defaultIfEmpty_1 = require_defaultIfEmpty();
    Object.defineProperty(exports2, "defaultIfEmpty", { enumerable: true, get: function() {
      return defaultIfEmpty_1.defaultIfEmpty;
    } });
    var delay_1 = require_delay();
    Object.defineProperty(exports2, "delay", { enumerable: true, get: function() {
      return delay_1.delay;
    } });
    var delayWhen_1 = require_delayWhen();
    Object.defineProperty(exports2, "delayWhen", { enumerable: true, get: function() {
      return delayWhen_1.delayWhen;
    } });
    var dematerialize_1 = require_dematerialize();
    Object.defineProperty(exports2, "dematerialize", { enumerable: true, get: function() {
      return dematerialize_1.dematerialize;
    } });
    var distinct_1 = require_distinct();
    Object.defineProperty(exports2, "distinct", { enumerable: true, get: function() {
      return distinct_1.distinct;
    } });
    var distinctUntilChanged_1 = require_distinctUntilChanged();
    Object.defineProperty(exports2, "distinctUntilChanged", { enumerable: true, get: function() {
      return distinctUntilChanged_1.distinctUntilChanged;
    } });
    var distinctUntilKeyChanged_1 = require_distinctUntilKeyChanged();
    Object.defineProperty(exports2, "distinctUntilKeyChanged", { enumerable: true, get: function() {
      return distinctUntilKeyChanged_1.distinctUntilKeyChanged;
    } });
    var elementAt_1 = require_elementAt();
    Object.defineProperty(exports2, "elementAt", { enumerable: true, get: function() {
      return elementAt_1.elementAt;
    } });
    var endWith_1 = require_endWith();
    Object.defineProperty(exports2, "endWith", { enumerable: true, get: function() {
      return endWith_1.endWith;
    } });
    var every_1 = require_every();
    Object.defineProperty(exports2, "every", { enumerable: true, get: function() {
      return every_1.every;
    } });
    var exhaust_1 = require_exhaust();
    Object.defineProperty(exports2, "exhaust", { enumerable: true, get: function() {
      return exhaust_1.exhaust;
    } });
    var exhaustAll_1 = require_exhaustAll();
    Object.defineProperty(exports2, "exhaustAll", { enumerable: true, get: function() {
      return exhaustAll_1.exhaustAll;
    } });
    var exhaustMap_1 = require_exhaustMap();
    Object.defineProperty(exports2, "exhaustMap", { enumerable: true, get: function() {
      return exhaustMap_1.exhaustMap;
    } });
    var expand_1 = require_expand();
    Object.defineProperty(exports2, "expand", { enumerable: true, get: function() {
      return expand_1.expand;
    } });
    var filter_1 = require_filter();
    Object.defineProperty(exports2, "filter", { enumerable: true, get: function() {
      return filter_1.filter;
    } });
    var finalize_1 = require_finalize();
    Object.defineProperty(exports2, "finalize", { enumerable: true, get: function() {
      return finalize_1.finalize;
    } });
    var find_1 = require_find();
    Object.defineProperty(exports2, "find", { enumerable: true, get: function() {
      return find_1.find;
    } });
    var findIndex_1 = require_findIndex();
    Object.defineProperty(exports2, "findIndex", { enumerable: true, get: function() {
      return findIndex_1.findIndex;
    } });
    var first_1 = require_first();
    Object.defineProperty(exports2, "first", { enumerable: true, get: function() {
      return first_1.first;
    } });
    var groupBy_1 = require_groupBy();
    Object.defineProperty(exports2, "groupBy", { enumerable: true, get: function() {
      return groupBy_1.groupBy;
    } });
    var ignoreElements_1 = require_ignoreElements();
    Object.defineProperty(exports2, "ignoreElements", { enumerable: true, get: function() {
      return ignoreElements_1.ignoreElements;
    } });
    var isEmpty_1 = require_isEmpty();
    Object.defineProperty(exports2, "isEmpty", { enumerable: true, get: function() {
      return isEmpty_1.isEmpty;
    } });
    var last_1 = require_last();
    Object.defineProperty(exports2, "last", { enumerable: true, get: function() {
      return last_1.last;
    } });
    var map_1 = require_map();
    Object.defineProperty(exports2, "map", { enumerable: true, get: function() {
      return map_1.map;
    } });
    var mapTo_1 = require_mapTo();
    Object.defineProperty(exports2, "mapTo", { enumerable: true, get: function() {
      return mapTo_1.mapTo;
    } });
    var materialize_1 = require_materialize();
    Object.defineProperty(exports2, "materialize", { enumerable: true, get: function() {
      return materialize_1.materialize;
    } });
    var max_1 = require_max();
    Object.defineProperty(exports2, "max", { enumerable: true, get: function() {
      return max_1.max;
    } });
    var merge_1 = require_merge2();
    Object.defineProperty(exports2, "merge", { enumerable: true, get: function() {
      return merge_1.merge;
    } });
    var mergeAll_1 = require_mergeAll();
    Object.defineProperty(exports2, "mergeAll", { enumerable: true, get: function() {
      return mergeAll_1.mergeAll;
    } });
    var flatMap_1 = require_flatMap();
    Object.defineProperty(exports2, "flatMap", { enumerable: true, get: function() {
      return flatMap_1.flatMap;
    } });
    var mergeMap_1 = require_mergeMap();
    Object.defineProperty(exports2, "mergeMap", { enumerable: true, get: function() {
      return mergeMap_1.mergeMap;
    } });
    var mergeMapTo_1 = require_mergeMapTo();
    Object.defineProperty(exports2, "mergeMapTo", { enumerable: true, get: function() {
      return mergeMapTo_1.mergeMapTo;
    } });
    var mergeScan_1 = require_mergeScan();
    Object.defineProperty(exports2, "mergeScan", { enumerable: true, get: function() {
      return mergeScan_1.mergeScan;
    } });
    var mergeWith_1 = require_mergeWith();
    Object.defineProperty(exports2, "mergeWith", { enumerable: true, get: function() {
      return mergeWith_1.mergeWith;
    } });
    var min_1 = require_min();
    Object.defineProperty(exports2, "min", { enumerable: true, get: function() {
      return min_1.min;
    } });
    var multicast_1 = require_multicast();
    Object.defineProperty(exports2, "multicast", { enumerable: true, get: function() {
      return multicast_1.multicast;
    } });
    var observeOn_1 = require_observeOn();
    Object.defineProperty(exports2, "observeOn", { enumerable: true, get: function() {
      return observeOn_1.observeOn;
    } });
    var onErrorResumeNextWith_1 = require_onErrorResumeNextWith();
    Object.defineProperty(exports2, "onErrorResumeNext", { enumerable: true, get: function() {
      return onErrorResumeNextWith_1.onErrorResumeNext;
    } });
    var pairwise_1 = require_pairwise();
    Object.defineProperty(exports2, "pairwise", { enumerable: true, get: function() {
      return pairwise_1.pairwise;
    } });
    var partition_1 = require_partition2();
    Object.defineProperty(exports2, "partition", { enumerable: true, get: function() {
      return partition_1.partition;
    } });
    var pluck_1 = require_pluck();
    Object.defineProperty(exports2, "pluck", { enumerable: true, get: function() {
      return pluck_1.pluck;
    } });
    var publish_1 = require_publish();
    Object.defineProperty(exports2, "publish", { enumerable: true, get: function() {
      return publish_1.publish;
    } });
    var publishBehavior_1 = require_publishBehavior();
    Object.defineProperty(exports2, "publishBehavior", { enumerable: true, get: function() {
      return publishBehavior_1.publishBehavior;
    } });
    var publishLast_1 = require_publishLast();
    Object.defineProperty(exports2, "publishLast", { enumerable: true, get: function() {
      return publishLast_1.publishLast;
    } });
    var publishReplay_1 = require_publishReplay();
    Object.defineProperty(exports2, "publishReplay", { enumerable: true, get: function() {
      return publishReplay_1.publishReplay;
    } });
    var race_1 = require_race2();
    Object.defineProperty(exports2, "race", { enumerable: true, get: function() {
      return race_1.race;
    } });
    var raceWith_1 = require_raceWith();
    Object.defineProperty(exports2, "raceWith", { enumerable: true, get: function() {
      return raceWith_1.raceWith;
    } });
    var reduce_1 = require_reduce();
    Object.defineProperty(exports2, "reduce", { enumerable: true, get: function() {
      return reduce_1.reduce;
    } });
    var repeat_1 = require_repeat();
    Object.defineProperty(exports2, "repeat", { enumerable: true, get: function() {
      return repeat_1.repeat;
    } });
    var repeatWhen_1 = require_repeatWhen();
    Object.defineProperty(exports2, "repeatWhen", { enumerable: true, get: function() {
      return repeatWhen_1.repeatWhen;
    } });
    var retry_1 = require_retry();
    Object.defineProperty(exports2, "retry", { enumerable: true, get: function() {
      return retry_1.retry;
    } });
    var retryWhen_1 = require_retryWhen();
    Object.defineProperty(exports2, "retryWhen", { enumerable: true, get: function() {
      return retryWhen_1.retryWhen;
    } });
    var refCount_1 = require_refCount();
    Object.defineProperty(exports2, "refCount", { enumerable: true, get: function() {
      return refCount_1.refCount;
    } });
    var sample_1 = require_sample();
    Object.defineProperty(exports2, "sample", { enumerable: true, get: function() {
      return sample_1.sample;
    } });
    var sampleTime_1 = require_sampleTime();
    Object.defineProperty(exports2, "sampleTime", { enumerable: true, get: function() {
      return sampleTime_1.sampleTime;
    } });
    var scan_1 = require_scan();
    Object.defineProperty(exports2, "scan", { enumerable: true, get: function() {
      return scan_1.scan;
    } });
    var sequenceEqual_1 = require_sequenceEqual();
    Object.defineProperty(exports2, "sequenceEqual", { enumerable: true, get: function() {
      return sequenceEqual_1.sequenceEqual;
    } });
    var share_1 = require_share();
    Object.defineProperty(exports2, "share", { enumerable: true, get: function() {
      return share_1.share;
    } });
    var shareReplay_1 = require_shareReplay();
    Object.defineProperty(exports2, "shareReplay", { enumerable: true, get: function() {
      return shareReplay_1.shareReplay;
    } });
    var single_1 = require_single();
    Object.defineProperty(exports2, "single", { enumerable: true, get: function() {
      return single_1.single;
    } });
    var skip_1 = require_skip();
    Object.defineProperty(exports2, "skip", { enumerable: true, get: function() {
      return skip_1.skip;
    } });
    var skipLast_1 = require_skipLast();
    Object.defineProperty(exports2, "skipLast", { enumerable: true, get: function() {
      return skipLast_1.skipLast;
    } });
    var skipUntil_1 = require_skipUntil();
    Object.defineProperty(exports2, "skipUntil", { enumerable: true, get: function() {
      return skipUntil_1.skipUntil;
    } });
    var skipWhile_1 = require_skipWhile();
    Object.defineProperty(exports2, "skipWhile", { enumerable: true, get: function() {
      return skipWhile_1.skipWhile;
    } });
    var startWith_1 = require_startWith();
    Object.defineProperty(exports2, "startWith", { enumerable: true, get: function() {
      return startWith_1.startWith;
    } });
    var subscribeOn_1 = require_subscribeOn();
    Object.defineProperty(exports2, "subscribeOn", { enumerable: true, get: function() {
      return subscribeOn_1.subscribeOn;
    } });
    var switchAll_1 = require_switchAll();
    Object.defineProperty(exports2, "switchAll", { enumerable: true, get: function() {
      return switchAll_1.switchAll;
    } });
    var switchMap_1 = require_switchMap();
    Object.defineProperty(exports2, "switchMap", { enumerable: true, get: function() {
      return switchMap_1.switchMap;
    } });
    var switchMapTo_1 = require_switchMapTo();
    Object.defineProperty(exports2, "switchMapTo", { enumerable: true, get: function() {
      return switchMapTo_1.switchMapTo;
    } });
    var switchScan_1 = require_switchScan();
    Object.defineProperty(exports2, "switchScan", { enumerable: true, get: function() {
      return switchScan_1.switchScan;
    } });
    var take_1 = require_take();
    Object.defineProperty(exports2, "take", { enumerable: true, get: function() {
      return take_1.take;
    } });
    var takeLast_1 = require_takeLast();
    Object.defineProperty(exports2, "takeLast", { enumerable: true, get: function() {
      return takeLast_1.takeLast;
    } });
    var takeUntil_1 = require_takeUntil();
    Object.defineProperty(exports2, "takeUntil", { enumerable: true, get: function() {
      return takeUntil_1.takeUntil;
    } });
    var takeWhile_1 = require_takeWhile();
    Object.defineProperty(exports2, "takeWhile", { enumerable: true, get: function() {
      return takeWhile_1.takeWhile;
    } });
    var tap_1 = require_tap();
    Object.defineProperty(exports2, "tap", { enumerable: true, get: function() {
      return tap_1.tap;
    } });
    var throttle_1 = require_throttle();
    Object.defineProperty(exports2, "throttle", { enumerable: true, get: function() {
      return throttle_1.throttle;
    } });
    var throttleTime_1 = require_throttleTime();
    Object.defineProperty(exports2, "throttleTime", { enumerable: true, get: function() {
      return throttleTime_1.throttleTime;
    } });
    var throwIfEmpty_1 = require_throwIfEmpty();
    Object.defineProperty(exports2, "throwIfEmpty", { enumerable: true, get: function() {
      return throwIfEmpty_1.throwIfEmpty;
    } });
    var timeInterval_1 = require_timeInterval();
    Object.defineProperty(exports2, "timeInterval", { enumerable: true, get: function() {
      return timeInterval_1.timeInterval;
    } });
    var timeout_1 = require_timeout();
    Object.defineProperty(exports2, "timeout", { enumerable: true, get: function() {
      return timeout_1.timeout;
    } });
    var timeoutWith_1 = require_timeoutWith();
    Object.defineProperty(exports2, "timeoutWith", { enumerable: true, get: function() {
      return timeoutWith_1.timeoutWith;
    } });
    var timestamp_1 = require_timestamp();
    Object.defineProperty(exports2, "timestamp", { enumerable: true, get: function() {
      return timestamp_1.timestamp;
    } });
    var toArray_1 = require_toArray();
    Object.defineProperty(exports2, "toArray", { enumerable: true, get: function() {
      return toArray_1.toArray;
    } });
    var window_1 = require_window();
    Object.defineProperty(exports2, "window", { enumerable: true, get: function() {
      return window_1.window;
    } });
    var windowCount_1 = require_windowCount();
    Object.defineProperty(exports2, "windowCount", { enumerable: true, get: function() {
      return windowCount_1.windowCount;
    } });
    var windowTime_1 = require_windowTime();
    Object.defineProperty(exports2, "windowTime", { enumerable: true, get: function() {
      return windowTime_1.windowTime;
    } });
    var windowToggle_1 = require_windowToggle();
    Object.defineProperty(exports2, "windowToggle", { enumerable: true, get: function() {
      return windowToggle_1.windowToggle;
    } });
    var windowWhen_1 = require_windowWhen();
    Object.defineProperty(exports2, "windowWhen", { enumerable: true, get: function() {
      return windowWhen_1.windowWhen;
    } });
    var withLatestFrom_1 = require_withLatestFrom();
    Object.defineProperty(exports2, "withLatestFrom", { enumerable: true, get: function() {
      return withLatestFrom_1.withLatestFrom;
    } });
    var zip_1 = require_zip2();
    Object.defineProperty(exports2, "zip", { enumerable: true, get: function() {
      return zip_1.zip;
    } });
    var zipAll_1 = require_zipAll();
    Object.defineProperty(exports2, "zipAll", { enumerable: true, get: function() {
      return zipAll_1.zipAll;
    } });
    var zipWith_1 = require_zipWith();
    Object.defineProperty(exports2, "zipWith", { enumerable: true, get: function() {
      return zipWith_1.zipWith;
    } });
  }
});

// ../node_modules/.pnpm/@sanity+client@7.10.0/node_modules/@sanity/client/dist/_chunks-es/stegaEncodeSourceMap.js
var stegaEncodeSourceMap_exports = {};
__export(stegaEncodeSourceMap_exports, {
  encodeIntoResult: () => encodeIntoResult,
  stegaEncodeSourceMap: () => stegaEncodeSourceMap,
  stegaEncodeSourceMap$1: () => stegaEncodeSourceMap$1
});
function isKeySegment(segment) {
  return typeof segment == "string" ? reKeySegment.test(segment.trim()) : typeof segment == "object" && "_key" in segment;
}
function toString2(path) {
  if (!Array.isArray(path))
    throw new Error("Path is not an array");
  return path.reduce((target, segment, i2) => {
    const segmentType = typeof segment;
    if (segmentType === "number")
      return `${target}[${segment}]`;
    if (segmentType === "string")
      return `${target}${i2 === 0 ? "" : "."}${segment}`;
    if (isKeySegment(segment) && segment._key)
      return `${target}[_key=="${segment._key}"]`;
    if (Array.isArray(segment)) {
      const [from2, to] = segment;
      return `${target}[${from2}:${to}]`;
    }
    throw new Error(`Unsupported path segment \`${JSON.stringify(segment)}\``);
  }, "");
}
function jsonPath2(path) {
  return `$${path.map((segment) => typeof segment == "string" ? `['${segment.replace(/[\f\n\r\t'\\]/g, (match) => ESCAPE[match])}']` : typeof segment == "number" ? `[${segment}]` : segment._key !== "" ? `[?(@._key=='${segment._key.replace(/['\\]/g, (match) => ESCAPE[match])}')]` : `[${segment._index}]`).join("")}`;
}
function parseJsonPath2(path) {
  const parsed = [], parseRe = /\['(.*?)'\]|\[(\d+)\]|\[\?\(@\._key=='(.*?)'\)\]/g;
  let match;
  for (; (match = parseRe.exec(path)) !== null; ) {
    if (match[1] !== void 0) {
      const key = match[1].replace(/\\(\\|f|n|r|t|')/g, (m2) => UNESCAPE[m2]);
      parsed.push(key);
      continue;
    }
    if (match[2] !== void 0) {
      parsed.push(parseInt(match[2], 10));
      continue;
    }
    if (match[3] !== void 0) {
      const _key = match[3].replace(/\\(\\')/g, (m2) => UNESCAPE[m2]);
      parsed.push({
        _key,
        _index: -1
      });
      continue;
    }
  }
  return parsed;
}
function jsonPathToStudioPath2(path) {
  return path.map((segment) => {
    if (typeof segment == "string" || typeof segment == "number")
      return segment;
    if (segment._key !== "")
      return { _key: segment._key };
    if (segment._index !== -1)
      return segment._index;
    throw new Error(`invalid segment:${JSON.stringify(segment)}`);
  });
}
function jsonPathToMappingPath(path) {
  return path.map((segment) => {
    if (typeof segment == "string" || typeof segment == "number")
      return segment;
    if (segment._index !== -1)
      return segment._index;
    throw new Error(`invalid segment:${JSON.stringify(segment)}`);
  });
}
function resolveMapping2(resultPath, csm) {
  if (!csm?.mappings)
    return;
  const resultMappingPath = jsonPath2(jsonPathToMappingPath(resultPath));
  if (csm.mappings[resultMappingPath] !== void 0)
    return {
      mapping: csm.mappings[resultMappingPath],
      matchedPath: resultMappingPath,
      pathSuffix: ""
    };
  const mappings = Object.entries(csm.mappings).filter(([key]) => resultMappingPath.startsWith(key)).sort(([key1], [key2]) => key2.length - key1.length);
  if (mappings.length == 0)
    return;
  const [matchedPath, mapping] = mappings[0], pathSuffix = resultMappingPath.substring(matchedPath.length);
  return { mapping, matchedPath, pathSuffix };
}
function isArray(value) {
  return value !== null && Array.isArray(value);
}
function walkMap2(value, mappingFn, path = []) {
  if (isArray(value))
    return value.map((v3, idx) => {
      if (isRecord2(v3)) {
        const _key = v3._key;
        if (typeof _key == "string")
          return walkMap2(v3, mappingFn, path.concat({ _key, _index: idx }));
      }
      return walkMap2(v3, mappingFn, path.concat(idx));
    });
  if (isRecord2(value)) {
    if (value._type === "block" || value._type === "span") {
      const result = { ...value };
      return value._type === "block" ? result.children = walkMap2(value.children, mappingFn, path.concat("children")) : value._type === "span" && (result.text = walkMap2(value.text, mappingFn, path.concat("text"))), result;
    }
    return Object.fromEntries(
      Object.entries(value).map(([k2, v3]) => [k2, walkMap2(v3, mappingFn, path.concat(k2))])
    );
  }
  return mappingFn(value, path);
}
function encodeIntoResult(result, csm, encoder) {
  return walkMap2(result, (value, path) => {
    if (typeof value != "string")
      return value;
    const resolveMappingResult = resolveMapping2(path, csm);
    if (!resolveMappingResult)
      return value;
    const { mapping, matchedPath } = resolveMappingResult;
    if (mapping.type !== "value" || mapping.source.type !== "documentValue")
      return value;
    const sourceDocument = csm.documents[mapping.source.document], sourcePath = csm.paths[mapping.source.path], matchPathSegments = parseJsonPath2(matchedPath), fullSourceSegments = parseJsonPath2(sourcePath).concat(path.slice(matchPathSegments.length));
    return encoder({
      sourcePath: fullSourceSegments,
      sourceDocument,
      resultPath: path,
      value
    });
  });
}
function isDraftId2(id) {
  return id.startsWith(DRAFTS_PREFIX2);
}
function isVersionId2(id) {
  return id.startsWith(VERSION_PREFIX2);
}
function isPublishedId2(id) {
  return !isDraftId2(id) && !isVersionId2(id);
}
function getVersionFromId2(id) {
  if (!isVersionId2(id)) return;
  const [_versionPrefix, versionId, ..._publishedId] = id.split(PATH_SEPARATOR2);
  return versionId;
}
function getPublishedId2(id) {
  return isVersionId2(id) ? id.split(PATH_SEPARATOR2).slice(2).join(PATH_SEPARATOR2) : isDraftId2(id) ? id.slice(DRAFTS_PREFIX2.length) : id;
}
function createEditUrl2(options) {
  const {
    baseUrl,
    workspace: _workspace = "default",
    tool: _tool = "default",
    id: _id,
    type,
    path,
    projectId: projectId2,
    dataset: dataset2
  } = options;
  if (!baseUrl)
    throw new Error("baseUrl is required");
  if (!path)
    throw new Error("path is required");
  if (!_id)
    throw new Error("id is required");
  if (baseUrl !== "/" && baseUrl.endsWith("/"))
    throw new Error("baseUrl must not end with a slash");
  const workspace = _workspace === "default" ? void 0 : _workspace, tool = _tool === "default" ? void 0 : _tool, id = getPublishedId2(_id), stringifiedPath = Array.isArray(path) ? toString2(jsonPathToStudioPath2(path)) : path, searchParams = new URLSearchParams({
    baseUrl,
    id,
    type,
    path: stringifiedPath
  });
  if (workspace && searchParams.set("workspace", workspace), tool && searchParams.set("tool", tool), projectId2 && searchParams.set("projectId", projectId2), dataset2 && searchParams.set("dataset", dataset2), isPublishedId2(_id))
    searchParams.set("perspective", "published");
  else if (isVersionId2(_id)) {
    const versionId = getVersionFromId2(_id);
    searchParams.set("perspective", versionId);
  }
  const segments = [baseUrl === "/" ? "" : baseUrl];
  workspace && segments.push(workspace);
  const routerParams = [
    "mode=presentation",
    `id=${id}`,
    `type=${type}`,
    `path=${encodeURIComponent(stringifiedPath)}`
  ];
  return tool && routerParams.push(`tool=${tool}`), segments.push("intent", "edit", `${routerParams.join(";")}?${searchParams}`), segments.join("/");
}
function resolveStudioBaseRoute(studioUrl) {
  let baseUrl = typeof studioUrl == "string" ? studioUrl : studioUrl.baseUrl;
  return baseUrl !== "/" && (baseUrl = baseUrl.replace(/\/$/, "")), typeof studioUrl == "string" ? { baseUrl } : { ...studioUrl, baseUrl };
}
function isValidDate(dateString) {
  return /^\d{4}-\d{2}-\d{2}/.test(dateString) ? !!Date.parse(dateString) : false;
}
function isValidURL(url) {
  try {
    const { protocol } = new URL(url, url.startsWith("/") ? "https://acme.com" : void 0);
    return allowedProtocols.has(protocol) || protocol.startsWith("web+");
  } catch {
    return false;
  }
}
function hasTypeLike(path) {
  return path.some((segment) => typeof segment == "string" && segment.match(/type/i) !== null);
}
function stegaEncodeSourceMap(result, resultSourceMap, config) {
  const { filter: filter2, logger, enabled } = config;
  if (!enabled) {
    const msg = "config.enabled must be true, don't call this function otherwise";
    throw logger?.error?.(`[@sanity/client]: ${msg}`, { result, resultSourceMap, config }), new TypeError(msg);
  }
  if (!resultSourceMap)
    return logger?.error?.("[@sanity/client]: Missing Content Source Map from response body", {
      result,
      resultSourceMap,
      config
    }), result;
  if (!config.studioUrl) {
    const msg = "config.studioUrl must be defined";
    throw logger?.error?.(`[@sanity/client]: ${msg}`, { result, resultSourceMap, config }), new TypeError(msg);
  }
  const report = {
    encoded: [],
    skipped: []
  }, resultWithStega = encodeIntoResult(
    result,
    resultSourceMap,
    ({ sourcePath, sourceDocument, resultPath, value }) => {
      if ((typeof filter2 == "function" ? filter2({ sourcePath, resultPath, filterDefault, sourceDocument, value }) : filterDefault({ sourcePath, resultPath, value })) === false)
        return logger && report.skipped.push({
          path: prettyPathForLogging(sourcePath),
          value: `${value.slice(0, TRUNCATE_LENGTH)}${value.length > TRUNCATE_LENGTH ? "..." : ""}`,
          length: value.length
        }), value;
      logger && report.encoded.push({
        path: prettyPathForLogging(sourcePath),
        value: `${value.slice(0, TRUNCATE_LENGTH)}${value.length > TRUNCATE_LENGTH ? "..." : ""}`,
        length: value.length
      });
      const { baseUrl, workspace, tool } = resolveStudioBaseRoute(
        typeof config.studioUrl == "function" ? config.studioUrl(sourceDocument) : config.studioUrl
      );
      if (!baseUrl) return value;
      const { _id: id, _type: type, _projectId: projectId2, _dataset: dataset2 } = sourceDocument;
      return C2(
        value,
        {
          origin: "sanity.io",
          href: createEditUrl2({
            baseUrl,
            workspace,
            tool,
            id,
            type,
            path: sourcePath,
            ...!config.omitCrossDatasetReferenceData && { dataset: dataset2, projectId: projectId2 }
          })
        },
        // We use custom logic to determine if we should skip encoding
        false
      );
    }
  );
  if (logger) {
    const isSkipping = report.skipped.length, isEncoding = report.encoded.length;
    if ((isSkipping || isEncoding) && ((logger?.groupCollapsed || logger.log)?.("[@sanity/client]: Encoding source map into result"), logger.log?.(
      `[@sanity/client]: Paths encoded: ${report.encoded.length}, skipped: ${report.skipped.length}`
    )), report.encoded.length > 0 && (logger?.log?.("[@sanity/client]: Table of encoded paths"), (logger?.table || logger.log)?.(report.encoded)), report.skipped.length > 0) {
      const skipped = /* @__PURE__ */ new Set();
      for (const { path } of report.skipped)
        skipped.add(path.replace(reKeySegment, "0").replace(/\[\d+\]/g, "[]"));
      logger?.log?.("[@sanity/client]: List of skipped paths", [...skipped.values()]);
    }
    (isSkipping || isEncoding) && logger?.groupEnd?.();
  }
  return resultWithStega;
}
function prettyPathForLogging(path) {
  return toString2(jsonPathToStudioPath2(path));
}
var reKeySegment, ESCAPE, UNESCAPE, DRAFTS_FOLDER2, VERSION_FOLDER2, PATH_SEPARATOR2, DRAFTS_PREFIX2, VERSION_PREFIX2, filterDefault, denylist, allowedProtocols, TRUNCATE_LENGTH, stegaEncodeSourceMap$1;
var init_stegaEncodeSourceMap = __esm({
  "../node_modules/.pnpm/@sanity+client@7.10.0/node_modules/@sanity/client/dist/_chunks-es/stegaEncodeSourceMap.js"() {
    init_stegaClean();
    reKeySegment = /_key\s*==\s*['"](.*)['"]/;
    ESCAPE = {
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "'": "\\'",
      "\\": "\\\\"
    };
    UNESCAPE = {
      "\\f": "\f",
      "\\n": `
`,
      "\\r": "\r",
      "\\t": "	",
      "\\'": "'",
      "\\\\": "\\"
    };
    DRAFTS_FOLDER2 = "drafts";
    VERSION_FOLDER2 = "versions";
    PATH_SEPARATOR2 = ".";
    DRAFTS_PREFIX2 = `${DRAFTS_FOLDER2}${PATH_SEPARATOR2}`;
    VERSION_PREFIX2 = `${VERSION_FOLDER2}${PATH_SEPARATOR2}`;
    filterDefault = ({ sourcePath, resultPath, value }) => {
      if (isValidDate(value) || isValidURL(value))
        return false;
      const endPath = sourcePath.at(-1);
      return !(sourcePath.at(-2) === "slug" && endPath === "current" || typeof endPath == "string" && (endPath.startsWith("_") || endPath.endsWith("Id")) || sourcePath.some(
        (path) => path === "meta" || path === "metadata" || path === "openGraph" || path === "seo"
      ) || hasTypeLike(sourcePath) || hasTypeLike(resultPath) || typeof endPath == "string" && denylist.has(endPath));
    };
    denylist = /* @__PURE__ */ new Set([
      "color",
      "colour",
      "currency",
      "email",
      "format",
      "gid",
      "hex",
      "href",
      "hsl",
      "hsla",
      "icon",
      "id",
      "index",
      "key",
      "language",
      "layout",
      "link",
      "linkAction",
      "locale",
      "lqip",
      "page",
      "path",
      "ref",
      "rgb",
      "rgba",
      "route",
      "secret",
      "slug",
      "status",
      "tag",
      "template",
      "theme",
      "type",
      "textTheme",
      "unit",
      "url",
      "username",
      "variant",
      "website"
    ]);
    allowedProtocols = /* @__PURE__ */ new Set([
      "app:",
      "data:",
      "discord:",
      "file:",
      "ftp:",
      "ftps:",
      "geo:",
      "http:",
      "https:",
      "imap:",
      "javascript:",
      "magnet:",
      "mailto:",
      "maps:",
      "ms-excel:",
      "ms-powerpoint:",
      "ms-word:",
      "slack:",
      "sms:",
      "spotify:",
      "steam:",
      "teams:",
      "tel:",
      "vscode:",
      "zoom:"
    ]);
    TRUNCATE_LENGTH = 20;
    stegaEncodeSourceMap$1 = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      stegaEncodeSourceMap
    });
  }
});

// ../node_modules/.pnpm/eventsource@2.0.2/node_modules/eventsource/lib/eventsource.js
var require_eventsource = __commonJS({
  "../node_modules/.pnpm/eventsource@2.0.2/node_modules/eventsource/lib/eventsource.js"(exports2, module2) {
    var parse = require("url").parse;
    var events = require("events");
    var https = require("https");
    var http = require("http");
    var util = require("util");
    var httpsOptions = [
      "pfx",
      "key",
      "passphrase",
      "cert",
      "ca",
      "ciphers",
      "rejectUnauthorized",
      "secureProtocol",
      "servername",
      "checkServerIdentity"
    ];
    var bom = [239, 187, 191];
    var colon = 58;
    var space = 32;
    var lineFeed = 10;
    var carriageReturn = 13;
    var maxBufferAheadAllocation = 1024 * 256;
    var reUnsafeHeader = /^(cookie|authorization)$/i;
    function hasBom(buf) {
      return bom.every(function(charCode, index) {
        return buf[index] === charCode;
      });
    }
    function EventSource2(url, eventSourceInitDict) {
      var readyState = EventSource2.CONNECTING;
      var headers = eventSourceInitDict && eventSourceInitDict.headers;
      var hasNewOrigin = false;
      Object.defineProperty(this, "readyState", {
        get: function() {
          return readyState;
        }
      });
      Object.defineProperty(this, "url", {
        get: function() {
          return url;
        }
      });
      var self2 = this;
      self2.reconnectInterval = 1e3;
      self2.connectionInProgress = false;
      function onConnectionClosed(message) {
        if (readyState === EventSource2.CLOSED) return;
        readyState = EventSource2.CONNECTING;
        _emit("error", new Event("error", { message }));
        if (reconnectUrl) {
          url = reconnectUrl;
          reconnectUrl = null;
          hasNewOrigin = false;
        }
        setTimeout(function() {
          if (readyState !== EventSource2.CONNECTING || self2.connectionInProgress) {
            return;
          }
          self2.connectionInProgress = true;
          connect();
        }, self2.reconnectInterval);
      }
      var req;
      var lastEventId = "";
      if (headers && headers["Last-Event-ID"]) {
        lastEventId = headers["Last-Event-ID"];
        delete headers["Last-Event-ID"];
      }
      var discardTrailingNewline = false;
      var data = "";
      var eventName = "";
      var reconnectUrl = null;
      function connect() {
        var options = parse(url);
        var isSecure = options.protocol === "https:";
        options.headers = { "Cache-Control": "no-cache", "Accept": "text/event-stream" };
        if (lastEventId) options.headers["Last-Event-ID"] = lastEventId;
        if (headers) {
          var reqHeaders = hasNewOrigin ? removeUnsafeHeaders(headers) : headers;
          for (var i2 in reqHeaders) {
            var header = reqHeaders[i2];
            if (header) {
              options.headers[i2] = header;
            }
          }
        }
        options.rejectUnauthorized = !(eventSourceInitDict && !eventSourceInitDict.rejectUnauthorized);
        if (eventSourceInitDict && eventSourceInitDict.createConnection !== void 0) {
          options.createConnection = eventSourceInitDict.createConnection;
        }
        var useProxy = eventSourceInitDict && eventSourceInitDict.proxy;
        if (useProxy) {
          var proxy = parse(eventSourceInitDict.proxy);
          isSecure = proxy.protocol === "https:";
          options.protocol = isSecure ? "https:" : "http:";
          options.path = url;
          options.headers.Host = options.host;
          options.hostname = proxy.hostname;
          options.host = proxy.host;
          options.port = proxy.port;
        }
        if (eventSourceInitDict && eventSourceInitDict.https) {
          for (var optName in eventSourceInitDict.https) {
            if (httpsOptions.indexOf(optName) === -1) {
              continue;
            }
            var option = eventSourceInitDict.https[optName];
            if (option !== void 0) {
              options[optName] = option;
            }
          }
        }
        if (eventSourceInitDict && eventSourceInitDict.withCredentials !== void 0) {
          options.withCredentials = eventSourceInitDict.withCredentials;
        }
        req = (isSecure ? https : http).request(options, function(res) {
          self2.connectionInProgress = false;
          if (res.statusCode === 500 || res.statusCode === 502 || res.statusCode === 503 || res.statusCode === 504) {
            _emit("error", new Event("error", { status: res.statusCode, message: res.statusMessage }));
            onConnectionClosed();
            return;
          }
          if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
            var location2 = res.headers.location;
            if (!location2) {
              _emit("error", new Event("error", { status: res.statusCode, message: res.statusMessage }));
              return;
            }
            var prevOrigin = new URL(url).origin;
            var nextOrigin = new URL(location2).origin;
            hasNewOrigin = prevOrigin !== nextOrigin;
            if (res.statusCode === 307) reconnectUrl = url;
            url = location2;
            process.nextTick(connect);
            return;
          }
          if (res.statusCode !== 200) {
            _emit("error", new Event("error", { status: res.statusCode, message: res.statusMessage }));
            return self2.close();
          }
          readyState = EventSource2.OPEN;
          res.on("close", function() {
            res.removeAllListeners("close");
            res.removeAllListeners("end");
            onConnectionClosed();
          });
          res.on("end", function() {
            res.removeAllListeners("close");
            res.removeAllListeners("end");
            onConnectionClosed();
          });
          _emit("open", new Event("open"));
          var buf;
          var newBuffer;
          var startingPos = 0;
          var startingFieldLength = -1;
          var newBufferSize = 0;
          var bytesUsed = 0;
          res.on("data", function(chunk) {
            if (!buf) {
              buf = chunk;
              if (hasBom(buf)) {
                buf = buf.slice(bom.length);
              }
              bytesUsed = buf.length;
            } else {
              if (chunk.length > buf.length - bytesUsed) {
                newBufferSize = buf.length * 2 + chunk.length;
                if (newBufferSize > maxBufferAheadAllocation) {
                  newBufferSize = buf.length + chunk.length + maxBufferAheadAllocation;
                }
                newBuffer = Buffer.alloc(newBufferSize);
                buf.copy(newBuffer, 0, 0, bytesUsed);
                buf = newBuffer;
              }
              chunk.copy(buf, bytesUsed);
              bytesUsed += chunk.length;
            }
            var pos = 0;
            var length = bytesUsed;
            while (pos < length) {
              if (discardTrailingNewline) {
                if (buf[pos] === lineFeed) {
                  ++pos;
                }
                discardTrailingNewline = false;
              }
              var lineLength = -1;
              var fieldLength = startingFieldLength;
              var c4;
              for (var i3 = startingPos; lineLength < 0 && i3 < length; ++i3) {
                c4 = buf[i3];
                if (c4 === colon) {
                  if (fieldLength < 0) {
                    fieldLength = i3 - pos;
                  }
                } else if (c4 === carriageReturn) {
                  discardTrailingNewline = true;
                  lineLength = i3 - pos;
                } else if (c4 === lineFeed) {
                  lineLength = i3 - pos;
                }
              }
              if (lineLength < 0) {
                startingPos = length - pos;
                startingFieldLength = fieldLength;
                break;
              } else {
                startingPos = 0;
                startingFieldLength = -1;
              }
              parseEventStreamLine(buf, pos, fieldLength, lineLength);
              pos += lineLength + 1;
            }
            if (pos === length) {
              buf = void 0;
              bytesUsed = 0;
            } else if (pos > 0) {
              buf = buf.slice(pos, bytesUsed);
              bytesUsed = buf.length;
            }
          });
        });
        req.on("error", function(err) {
          self2.connectionInProgress = false;
          onConnectionClosed(err.message);
        });
        if (req.setNoDelay) req.setNoDelay(true);
        req.end();
      }
      connect();
      function _emit() {
        if (self2.listeners(arguments[0]).length > 0) {
          self2.emit.apply(self2, arguments);
        }
      }
      this._close = function() {
        if (readyState === EventSource2.CLOSED) return;
        readyState = EventSource2.CLOSED;
        if (req.abort) req.abort();
        if (req.xhr && req.xhr.abort) req.xhr.abort();
      };
      function parseEventStreamLine(buf, pos, fieldLength, lineLength) {
        if (lineLength === 0) {
          if (data.length > 0) {
            var type = eventName || "message";
            _emit(type, new MessageEvent(type, {
              data: data.slice(0, -1),
              // remove trailing newline
              lastEventId,
              origin: new URL(url).origin
            }));
            data = "";
          }
          eventName = void 0;
        } else if (fieldLength > 0) {
          var noValue = fieldLength < 0;
          var step = 0;
          var field = buf.slice(pos, pos + (noValue ? lineLength : fieldLength)).toString();
          if (noValue) {
            step = lineLength;
          } else if (buf[pos + fieldLength + 1] !== space) {
            step = fieldLength + 1;
          } else {
            step = fieldLength + 2;
          }
          pos += step;
          var valueLength = lineLength - step;
          var value = buf.slice(pos, pos + valueLength).toString();
          if (field === "data") {
            data += value + "\n";
          } else if (field === "event") {
            eventName = value;
          } else if (field === "id") {
            lastEventId = value;
          } else if (field === "retry") {
            var retry = parseInt(value, 10);
            if (!Number.isNaN(retry)) {
              self2.reconnectInterval = retry;
            }
          }
        }
      }
    }
    module2.exports = EventSource2;
    util.inherits(EventSource2, events.EventEmitter);
    EventSource2.prototype.constructor = EventSource2;
    ["open", "error", "message"].forEach(function(method) {
      Object.defineProperty(EventSource2.prototype, "on" + method, {
        /**
         * Returns the current listener
         *
         * @return {Mixed} the set function or undefined
         * @api private
         */
        get: function get2() {
          var listener = this.listeners(method)[0];
          return listener ? listener._listener ? listener._listener : listener : void 0;
        },
        /**
         * Start listening for events
         *
         * @param {Function} listener the listener
         * @return {Mixed} the set function or undefined
         * @api private
         */
        set: function set(listener) {
          this.removeAllListeners(method);
          this.addEventListener(method, listener);
        }
      });
    });
    Object.defineProperty(EventSource2, "CONNECTING", { enumerable: true, value: 0 });
    Object.defineProperty(EventSource2, "OPEN", { enumerable: true, value: 1 });
    Object.defineProperty(EventSource2, "CLOSED", { enumerable: true, value: 2 });
    EventSource2.prototype.CONNECTING = 0;
    EventSource2.prototype.OPEN = 1;
    EventSource2.prototype.CLOSED = 2;
    EventSource2.prototype.close = function() {
      this._close();
    };
    EventSource2.prototype.addEventListener = function addEventListener(type, listener) {
      if (typeof listener === "function") {
        listener._listener = listener;
        this.on(type, listener);
      }
    };
    EventSource2.prototype.dispatchEvent = function dispatchEvent(event) {
      if (!event.type) {
        throw new Error("UNSPECIFIED_EVENT_TYPE_ERR");
      }
      this.emit(event.type, event.detail);
    };
    EventSource2.prototype.removeEventListener = function removeEventListener(type, listener) {
      if (typeof listener === "function") {
        listener._listener = void 0;
        this.removeListener(type, listener);
      }
    };
    function Event(type, optionalProperties) {
      Object.defineProperty(this, "type", { writable: false, value: type, enumerable: true });
      if (optionalProperties) {
        for (var f3 in optionalProperties) {
          if (optionalProperties.hasOwnProperty(f3)) {
            Object.defineProperty(this, f3, { writable: false, value: optionalProperties[f3], enumerable: true });
          }
        }
      }
    }
    function MessageEvent(type, eventInitDict) {
      Object.defineProperty(this, "type", { writable: false, value: type, enumerable: true });
      for (var f3 in eventInitDict) {
        if (eventInitDict.hasOwnProperty(f3)) {
          Object.defineProperty(this, f3, { writable: false, value: eventInitDict[f3], enumerable: true });
        }
      }
    }
    function removeUnsafeHeaders(headers) {
      var safe = {};
      for (var key in headers) {
        if (reUnsafeHeader.test(key)) {
          continue;
        }
        safe[key] = headers[key];
      }
      return safe;
    }
  }
});

// ../node_modules/.pnpm/@sanity+eventsource@5.0.2/node_modules/@sanity/eventsource/node.js
var require_node3 = __commonJS({
  "../node_modules/.pnpm/@sanity+eventsource@5.0.2/node_modules/@sanity/eventsource/node.js"(exports2, module2) {
    module2.exports = require_eventsource();
  }
});

// ../node_modules/.pnpm/@sanity+image-url@1.2.0/node_modules/@sanity/image-url/lib/node/parseAssetId.js
var require_parseAssetId = __commonJS({
  "../node_modules/.pnpm/@sanity+image-url@1.2.0/node_modules/@sanity/image-url/lib/node/parseAssetId.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var example = "image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg";
    function parseAssetId(ref) {
      var _a = ref.split("-"), id = _a[1], dimensionString = _a[2], format = _a[3];
      if (!id || !dimensionString || !format) {
        throw new Error("Malformed asset _ref '".concat(ref, `'. Expected an id like "`).concat(example, '".'));
      }
      var _b = dimensionString.split("x"), imgWidthStr = _b[0], imgHeightStr = _b[1];
      var width = +imgWidthStr;
      var height = +imgHeightStr;
      var isValidAssetId = isFinite(width) && isFinite(height);
      if (!isValidAssetId) {
        throw new Error("Malformed asset _ref '".concat(ref, `'. Expected an id like "`).concat(example, '".'));
      }
      return { id, width, height, format };
    }
    exports2.default = parseAssetId;
  }
});

// ../node_modules/.pnpm/@sanity+image-url@1.2.0/node_modules/@sanity/image-url/lib/node/parseSource.js
var require_parseSource = __commonJS({
  "../node_modules/.pnpm/@sanity+image-url@1.2.0/node_modules/@sanity/image-url/lib/node/parseSource.js"(exports2) {
    "use strict";
    var __assign = exports2 && exports2.__assign || function() {
      __assign = Object.assign || function(t4) {
        for (var s4, i2 = 1, n5 = arguments.length; i2 < n5; i2++) {
          s4 = arguments[i2];
          for (var p3 in s4) if (Object.prototype.hasOwnProperty.call(s4, p3))
            t4[p3] = s4[p3];
        }
        return t4;
      };
      return __assign.apply(this, arguments);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isInProgressUpload = void 0;
    var isRef = function(src) {
      var source = src;
      return source ? typeof source._ref === "string" : false;
    };
    var isAsset = function(src) {
      var source = src;
      return source ? typeof source._id === "string" : false;
    };
    var isAssetStub = function(src) {
      var source = src;
      return source && source.asset ? typeof source.asset.url === "string" : false;
    };
    var isInProgressUpload = function(src) {
      if (typeof src === "object" && src !== null) {
        var obj = src;
        return obj._upload && (!obj.asset || !obj.asset._ref);
      }
      return false;
    };
    exports2.isInProgressUpload = isInProgressUpload;
    function parseSource(source) {
      if (!source) {
        return null;
      }
      var image;
      if (typeof source === "string" && isUrl(source)) {
        image = {
          asset: { _ref: urlToId(source) }
        };
      } else if (typeof source === "string") {
        image = {
          asset: { _ref: source }
        };
      } else if (isRef(source)) {
        image = {
          asset: source
        };
      } else if (isAsset(source)) {
        image = {
          asset: {
            _ref: source._id || ""
          }
        };
      } else if (isAssetStub(source)) {
        image = {
          asset: {
            _ref: urlToId(source.asset.url)
          }
        };
      } else if (typeof source.asset === "object") {
        image = __assign({}, source);
      } else {
        return null;
      }
      var img = source;
      if (img.crop) {
        image.crop = img.crop;
      }
      if (img.hotspot) {
        image.hotspot = img.hotspot;
      }
      return applyDefaults(image);
    }
    exports2.default = parseSource;
    function isUrl(url) {
      return /^https?:\/\//.test("".concat(url));
    }
    function urlToId(url) {
      var parts = url.split("/").slice(-1);
      return "image-".concat(parts[0]).replace(/\.([a-z]+)$/, "-$1");
    }
    function applyDefaults(image) {
      if (image.crop && image.hotspot) {
        return image;
      }
      var result = __assign({}, image);
      if (!result.crop) {
        result.crop = {
          left: 0,
          top: 0,
          bottom: 0,
          right: 0
        };
      }
      if (!result.hotspot) {
        result.hotspot = {
          x: 0.5,
          y: 0.5,
          height: 1,
          width: 1
        };
      }
      return result;
    }
  }
});

// ../node_modules/.pnpm/@sanity+image-url@1.2.0/node_modules/@sanity/image-url/lib/node/urlForImage.js
var require_urlForImage = __commonJS({
  "../node_modules/.pnpm/@sanity+image-url@1.2.0/node_modules/@sanity/image-url/lib/node/urlForImage.js"(exports2) {
    "use strict";
    var __assign = exports2 && exports2.__assign || function() {
      __assign = Object.assign || function(t4) {
        for (var s4, i2 = 1, n5 = arguments.length; i2 < n5; i2++) {
          s4 = arguments[i2];
          for (var p3 in s4) if (Object.prototype.hasOwnProperty.call(s4, p3))
            t4[p3] = s4[p3];
        }
        return t4;
      };
      return __assign.apply(this, arguments);
    };
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o5, m2, k2, k22) {
      if (k22 === void 0) k22 = k2;
      var desc = Object.getOwnPropertyDescriptor(m2, k2);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k2];
        } };
      }
      Object.defineProperty(o5, k22, desc);
    }) : (function(o5, m2, k2, k22) {
      if (k22 === void 0) k22 = k2;
      o5[k22] = m2[k2];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o5, v3) {
      Object.defineProperty(o5, "default", { enumerable: true, value: v3 });
    }) : function(o5, v3) {
      o5["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k2 in mod) if (k2 !== "default" && Object.prototype.hasOwnProperty.call(mod, k2)) __createBinding(result, mod, k2);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.parseSource = exports2.SPEC_NAME_TO_URL_NAME_MAPPINGS = void 0;
    var parseAssetId_1 = __importDefault(require_parseAssetId());
    var parseSource_1 = __importStar(require_parseSource());
    exports2.parseSource = parseSource_1.default;
    exports2.SPEC_NAME_TO_URL_NAME_MAPPINGS = [
      ["width", "w"],
      ["height", "h"],
      ["format", "fm"],
      ["download", "dl"],
      ["blur", "blur"],
      ["sharpen", "sharp"],
      ["invert", "invert"],
      ["orientation", "or"],
      ["minHeight", "min-h"],
      ["maxHeight", "max-h"],
      ["minWidth", "min-w"],
      ["maxWidth", "max-w"],
      ["quality", "q"],
      ["fit", "fit"],
      ["crop", "crop"],
      ["saturation", "sat"],
      ["auto", "auto"],
      ["dpr", "dpr"],
      ["pad", "pad"],
      ["frame", "frame"]
    ];
    function urlForImage(options) {
      var spec = __assign({}, options || {});
      var source = spec.source;
      delete spec.source;
      var image = (0, parseSource_1.default)(source);
      if (!image) {
        if (source && (0, parseSource_1.isInProgressUpload)(source)) {
          return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8HwQACfsD/QNViZkAAAAASUVORK5CYII=";
        }
        throw new Error("Unable to resolve image URL from source (".concat(JSON.stringify(source), ")"));
      }
      var id = image.asset._ref || image.asset._id || "";
      var asset = (0, parseAssetId_1.default)(id);
      var cropLeft = Math.round(image.crop.left * asset.width);
      var cropTop = Math.round(image.crop.top * asset.height);
      var crop = {
        left: cropLeft,
        top: cropTop,
        width: Math.round(asset.width - image.crop.right * asset.width - cropLeft),
        height: Math.round(asset.height - image.crop.bottom * asset.height - cropTop)
      };
      var hotSpotVerticalRadius = image.hotspot.height * asset.height / 2;
      var hotSpotHorizontalRadius = image.hotspot.width * asset.width / 2;
      var hotSpotCenterX = image.hotspot.x * asset.width;
      var hotSpotCenterY = image.hotspot.y * asset.height;
      var hotspot = {
        left: hotSpotCenterX - hotSpotHorizontalRadius,
        top: hotSpotCenterY - hotSpotVerticalRadius,
        right: hotSpotCenterX + hotSpotHorizontalRadius,
        bottom: hotSpotCenterY + hotSpotVerticalRadius
      };
      if (!(spec.rect || spec.focalPoint || spec.ignoreImageParams || spec.crop)) {
        spec = __assign(__assign({}, spec), fit({ crop, hotspot }, spec));
      }
      return specToImageUrl(__assign(__assign({}, spec), { asset }));
    }
    exports2.default = urlForImage;
    function specToImageUrl(spec) {
      var cdnUrl = (spec.baseUrl || "https://cdn.sanity.io").replace(/\/+$/, "");
      var vanityStub = spec.vanityName ? "/".concat(spec.vanityName) : "";
      var filename = "".concat(spec.asset.id, "-").concat(spec.asset.width, "x").concat(spec.asset.height, ".").concat(spec.asset.format).concat(vanityStub);
      var baseUrl = "".concat(cdnUrl, "/images/").concat(spec.projectId, "/").concat(spec.dataset, "/").concat(filename);
      var params = [];
      if (spec.rect) {
        var _a = spec.rect, left = _a.left, top_1 = _a.top, width = _a.width, height = _a.height;
        var isEffectiveCrop = left !== 0 || top_1 !== 0 || height !== spec.asset.height || width !== spec.asset.width;
        if (isEffectiveCrop) {
          params.push("rect=".concat(left, ",").concat(top_1, ",").concat(width, ",").concat(height));
        }
      }
      if (spec.bg) {
        params.push("bg=".concat(spec.bg));
      }
      if (spec.focalPoint) {
        params.push("fp-x=".concat(spec.focalPoint.x));
        params.push("fp-y=".concat(spec.focalPoint.y));
      }
      var flip = [spec.flipHorizontal && "h", spec.flipVertical && "v"].filter(Boolean).join("");
      if (flip) {
        params.push("flip=".concat(flip));
      }
      exports2.SPEC_NAME_TO_URL_NAME_MAPPINGS.forEach(function(mapping) {
        var specName = mapping[0], param = mapping[1];
        if (typeof spec[specName] !== "undefined") {
          params.push("".concat(param, "=").concat(encodeURIComponent(spec[specName])));
        } else if (typeof spec[param] !== "undefined") {
          params.push("".concat(param, "=").concat(encodeURIComponent(spec[param])));
        }
      });
      if (params.length === 0) {
        return baseUrl;
      }
      return "".concat(baseUrl, "?").concat(params.join("&"));
    }
    function fit(source, spec) {
      var cropRect;
      var imgWidth = spec.width;
      var imgHeight = spec.height;
      if (!(imgWidth && imgHeight)) {
        return { width: imgWidth, height: imgHeight, rect: source.crop };
      }
      var crop = source.crop;
      var hotspot = source.hotspot;
      var desiredAspectRatio = imgWidth / imgHeight;
      var cropAspectRatio = crop.width / crop.height;
      if (cropAspectRatio > desiredAspectRatio) {
        var height = Math.round(crop.height);
        var width = Math.round(height * desiredAspectRatio);
        var top_2 = Math.max(0, Math.round(crop.top));
        var hotspotXCenter = Math.round((hotspot.right - hotspot.left) / 2 + hotspot.left);
        var left = Math.max(0, Math.round(hotspotXCenter - width / 2));
        if (left < crop.left) {
          left = crop.left;
        } else if (left + width > crop.left + crop.width) {
          left = crop.left + crop.width - width;
        }
        cropRect = { left, top: top_2, width, height };
      } else {
        var width = crop.width;
        var height = Math.round(width / desiredAspectRatio);
        var left = Math.max(0, Math.round(crop.left));
        var hotspotYCenter = Math.round((hotspot.bottom - hotspot.top) / 2 + hotspot.top);
        var top_3 = Math.max(0, Math.round(hotspotYCenter - height / 2));
        if (top_3 < crop.top) {
          top_3 = crop.top;
        } else if (top_3 + height > crop.top + crop.height) {
          top_3 = crop.top + crop.height - height;
        }
        cropRect = { left, top: top_3, width, height };
      }
      return {
        width: imgWidth,
        height: imgHeight,
        rect: cropRect
      };
    }
  }
});

// ../node_modules/.pnpm/@sanity+image-url@1.2.0/node_modules/@sanity/image-url/lib/node/builder.js
var require_builder = __commonJS({
  "../node_modules/.pnpm/@sanity+image-url@1.2.0/node_modules/@sanity/image-url/lib/node/builder.js"(exports2) {
    "use strict";
    var __assign = exports2 && exports2.__assign || function() {
      __assign = Object.assign || function(t4) {
        for (var s4, i2 = 1, n5 = arguments.length; i2 < n5; i2++) {
          s4 = arguments[i2];
          for (var p3 in s4) if (Object.prototype.hasOwnProperty.call(s4, p3))
            t4[p3] = s4[p3];
        }
        return t4;
      };
      return __assign.apply(this, arguments);
    };
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o5, m2, k2, k22) {
      if (k22 === void 0) k22 = k2;
      var desc = Object.getOwnPropertyDescriptor(m2, k2);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k2];
        } };
      }
      Object.defineProperty(o5, k22, desc);
    }) : (function(o5, m2, k2, k22) {
      if (k22 === void 0) k22 = k2;
      o5[k22] = m2[k2];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o5, v3) {
      Object.defineProperty(o5, "default", { enumerable: true, value: v3 });
    }) : function(o5, v3) {
      o5["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k2 in mod) if (k2 !== "default" && Object.prototype.hasOwnProperty.call(mod, k2)) __createBinding(result, mod, k2);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ImageUrlBuilder = void 0;
    var urlForImage_1 = __importStar(require_urlForImage());
    var validFits = ["clip", "crop", "fill", "fillmax", "max", "scale", "min"];
    var validCrops = ["top", "bottom", "left", "right", "center", "focalpoint", "entropy"];
    var validAutoModes = ["format"];
    function isSanityModernClientLike(client2) {
      return client2 && "config" in client2 ? typeof client2.config === "function" : false;
    }
    function isSanityClientLike(client2) {
      return client2 && "clientConfig" in client2 ? typeof client2.clientConfig === "object" : false;
    }
    function rewriteSpecName(key) {
      var specs = urlForImage_1.SPEC_NAME_TO_URL_NAME_MAPPINGS;
      for (var _i = 0, specs_1 = specs; _i < specs_1.length; _i++) {
        var entry = specs_1[_i];
        var specName = entry[0], param = entry[1];
        if (key === specName || key === param) {
          return specName;
        }
      }
      return key;
    }
    function urlBuilder(options) {
      if (isSanityModernClientLike(options)) {
        var _a = options.config(), apiUrl = _a.apiHost, projectId2 = _a.projectId, dataset2 = _a.dataset;
        var apiHost = apiUrl || "https://api.sanity.io";
        return new ImageUrlBuilder(null, {
          baseUrl: apiHost.replace(/^https:\/\/api\./, "https://cdn."),
          projectId: projectId2,
          dataset: dataset2
        });
      }
      if (isSanityClientLike(options)) {
        var _b = options.clientConfig, apiUrl = _b.apiHost, projectId2 = _b.projectId, dataset2 = _b.dataset;
        var apiHost = apiUrl || "https://api.sanity.io";
        return new ImageUrlBuilder(null, {
          baseUrl: apiHost.replace(/^https:\/\/api\./, "https://cdn."),
          projectId: projectId2,
          dataset: dataset2
        });
      }
      return new ImageUrlBuilder(null, options || {});
    }
    exports2.default = urlBuilder;
    var ImageUrlBuilder = (
      /** @class */
      (function() {
        function ImageUrlBuilder2(parent, options) {
          this.options = parent ? __assign(__assign({}, parent.options || {}), options || {}) : __assign({}, options || {});
        }
        ImageUrlBuilder2.prototype.withOptions = function(options) {
          var baseUrl = options.baseUrl || this.options.baseUrl;
          var newOptions = { baseUrl };
          for (var key in options) {
            if (options.hasOwnProperty(key)) {
              var specKey = rewriteSpecName(key);
              newOptions[specKey] = options[key];
            }
          }
          return new ImageUrlBuilder2(this, __assign({ baseUrl }, newOptions));
        };
        ImageUrlBuilder2.prototype.image = function(source) {
          return this.withOptions({ source });
        };
        ImageUrlBuilder2.prototype.dataset = function(dataset2) {
          return this.withOptions({ dataset: dataset2 });
        };
        ImageUrlBuilder2.prototype.projectId = function(projectId2) {
          return this.withOptions({ projectId: projectId2 });
        };
        ImageUrlBuilder2.prototype.bg = function(bg) {
          return this.withOptions({ bg });
        };
        ImageUrlBuilder2.prototype.dpr = function(dpr) {
          return this.withOptions(dpr && dpr !== 1 ? { dpr } : {});
        };
        ImageUrlBuilder2.prototype.width = function(width) {
          return this.withOptions({ width });
        };
        ImageUrlBuilder2.prototype.height = function(height) {
          return this.withOptions({ height });
        };
        ImageUrlBuilder2.prototype.focalPoint = function(x3, y3) {
          return this.withOptions({ focalPoint: { x: x3, y: y3 } });
        };
        ImageUrlBuilder2.prototype.maxWidth = function(maxWidth) {
          return this.withOptions({ maxWidth });
        };
        ImageUrlBuilder2.prototype.minWidth = function(minWidth) {
          return this.withOptions({ minWidth });
        };
        ImageUrlBuilder2.prototype.maxHeight = function(maxHeight) {
          return this.withOptions({ maxHeight });
        };
        ImageUrlBuilder2.prototype.minHeight = function(minHeight) {
          return this.withOptions({ minHeight });
        };
        ImageUrlBuilder2.prototype.size = function(width, height) {
          return this.withOptions({ width, height });
        };
        ImageUrlBuilder2.prototype.blur = function(blur) {
          return this.withOptions({ blur });
        };
        ImageUrlBuilder2.prototype.sharpen = function(sharpen) {
          return this.withOptions({ sharpen });
        };
        ImageUrlBuilder2.prototype.rect = function(left, top, width, height) {
          return this.withOptions({ rect: { left, top, width, height } });
        };
        ImageUrlBuilder2.prototype.format = function(format) {
          return this.withOptions({ format });
        };
        ImageUrlBuilder2.prototype.invert = function(invert) {
          return this.withOptions({ invert });
        };
        ImageUrlBuilder2.prototype.orientation = function(orientation) {
          return this.withOptions({ orientation });
        };
        ImageUrlBuilder2.prototype.quality = function(quality) {
          return this.withOptions({ quality });
        };
        ImageUrlBuilder2.prototype.forceDownload = function(download) {
          return this.withOptions({ download });
        };
        ImageUrlBuilder2.prototype.flipHorizontal = function() {
          return this.withOptions({ flipHorizontal: true });
        };
        ImageUrlBuilder2.prototype.flipVertical = function() {
          return this.withOptions({ flipVertical: true });
        };
        ImageUrlBuilder2.prototype.ignoreImageParams = function() {
          return this.withOptions({ ignoreImageParams: true });
        };
        ImageUrlBuilder2.prototype.fit = function(value) {
          if (validFits.indexOf(value) === -1) {
            throw new Error('Invalid fit mode "'.concat(value, '"'));
          }
          return this.withOptions({ fit: value });
        };
        ImageUrlBuilder2.prototype.crop = function(value) {
          if (validCrops.indexOf(value) === -1) {
            throw new Error('Invalid crop mode "'.concat(value, '"'));
          }
          return this.withOptions({ crop: value });
        };
        ImageUrlBuilder2.prototype.saturation = function(saturation) {
          return this.withOptions({ saturation });
        };
        ImageUrlBuilder2.prototype.auto = function(value) {
          if (validAutoModes.indexOf(value) === -1) {
            throw new Error('Invalid auto mode "'.concat(value, '"'));
          }
          return this.withOptions({ auto: value });
        };
        ImageUrlBuilder2.prototype.pad = function(pad) {
          return this.withOptions({ pad });
        };
        ImageUrlBuilder2.prototype.vanityName = function(value) {
          return this.withOptions({ vanityName: value });
        };
        ImageUrlBuilder2.prototype.frame = function(frame) {
          if (frame !== 1) {
            throw new Error('Invalid frame value "'.concat(frame, '"'));
          }
          return this.withOptions({ frame });
        };
        ImageUrlBuilder2.prototype.url = function() {
          return (0, urlForImage_1.default)(this.options);
        };
        ImageUrlBuilder2.prototype.toString = function() {
          return this.url();
        };
        return ImageUrlBuilder2;
      })()
    );
    exports2.ImageUrlBuilder = ImageUrlBuilder;
  }
});

// ../node_modules/.pnpm/@sanity+image-url@1.2.0/node_modules/@sanity/image-url/lib/node/index.js
var require_node4 = __commonJS({
  "../node_modules/.pnpm/@sanity+image-url@1.2.0/node_modules/@sanity/image-url/lib/node/index.js"(exports2, module2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    var builder_1 = __importDefault(require_builder());
    module2.exports = builder_1.default;
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/compiled/@edge-runtime/cookies/index.js
var require_cookies = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/compiled/@edge-runtime/cookies/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name2 in all)
        __defProp2(target, name2, { get: all[name2], enumerable: true });
    };
    var __copyProps2 = (to, from2, except, desc) => {
      if (from2 && typeof from2 === "object" || typeof from2 === "function") {
        for (let key of __getOwnPropNames2(from2))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc2(from2, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      RequestCookies: () => RequestCookies,
      ResponseCookies: () => ResponseCookies,
      parseCookie: () => parseCookie,
      parseSetCookie: () => parseSetCookie,
      stringifyCookie: () => stringifyCookie
    });
    module2.exports = __toCommonJS2(src_exports);
    function stringifyCookie(c4) {
      var _a;
      const attrs = [
        "path" in c4 && c4.path && `Path=${c4.path}`,
        "expires" in c4 && (c4.expires || c4.expires === 0) && `Expires=${(typeof c4.expires === "number" ? new Date(c4.expires) : c4.expires).toUTCString()}`,
        "maxAge" in c4 && typeof c4.maxAge === "number" && `Max-Age=${c4.maxAge}`,
        "domain" in c4 && c4.domain && `Domain=${c4.domain}`,
        "secure" in c4 && c4.secure && "Secure",
        "httpOnly" in c4 && c4.httpOnly && "HttpOnly",
        "sameSite" in c4 && c4.sameSite && `SameSite=${c4.sameSite}`,
        "partitioned" in c4 && c4.partitioned && "Partitioned",
        "priority" in c4 && c4.priority && `Priority=${c4.priority}`
      ].filter(Boolean);
      const stringified = `${c4.name}=${encodeURIComponent((_a = c4.value) != null ? _a : "")}`;
      return attrs.length === 0 ? stringified : `${stringified}; ${attrs.join("; ")}`;
    }
    function parseCookie(cookie) {
      const map2 = /* @__PURE__ */ new Map();
      for (const pair of cookie.split(/; */)) {
        if (!pair)
          continue;
        const splitAt = pair.indexOf("=");
        if (splitAt === -1) {
          map2.set(pair, "true");
          continue;
        }
        const [key, value] = [pair.slice(0, splitAt), pair.slice(splitAt + 1)];
        try {
          map2.set(key, decodeURIComponent(value != null ? value : "true"));
        } catch {
        }
      }
      return map2;
    }
    function parseSetCookie(setCookie) {
      if (!setCookie) {
        return void 0;
      }
      const [[name2, value], ...attributes] = parseCookie(setCookie);
      const {
        domain,
        expires,
        httponly,
        maxage,
        path,
        samesite,
        secure,
        partitioned,
        priority
      } = Object.fromEntries(
        attributes.map(([key, value2]) => [
          key.toLowerCase().replace(/-/g, ""),
          value2
        ])
      );
      const cookie = {
        name: name2,
        value: decodeURIComponent(value),
        domain,
        ...expires && { expires: new Date(expires) },
        ...httponly && { httpOnly: true },
        ...typeof maxage === "string" && { maxAge: Number(maxage) },
        path,
        ...samesite && { sameSite: parseSameSite(samesite) },
        ...secure && { secure: true },
        ...priority && { priority: parsePriority(priority) },
        ...partitioned && { partitioned: true }
      };
      return compact(cookie);
    }
    function compact(t4) {
      const newT = {};
      for (const key in t4) {
        if (t4[key]) {
          newT[key] = t4[key];
        }
      }
      return newT;
    }
    var SAME_SITE = ["strict", "lax", "none"];
    function parseSameSite(string) {
      string = string.toLowerCase();
      return SAME_SITE.includes(string) ? string : void 0;
    }
    var PRIORITY = ["low", "medium", "high"];
    function parsePriority(string) {
      string = string.toLowerCase();
      return PRIORITY.includes(string) ? string : void 0;
    }
    function splitCookiesString(cookiesString) {
      if (!cookiesString)
        return [];
      var cookiesStrings = [];
      var pos = 0;
      var start;
      var ch;
      var lastComma;
      var nextStart;
      var cookiesSeparatorFound;
      function skipWhitespace() {
        while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
          pos += 1;
        }
        return pos < cookiesString.length;
      }
      function notSpecialChar() {
        ch = cookiesString.charAt(pos);
        return ch !== "=" && ch !== ";" && ch !== ",";
      }
      while (pos < cookiesString.length) {
        start = pos;
        cookiesSeparatorFound = false;
        while (skipWhitespace()) {
          ch = cookiesString.charAt(pos);
          if (ch === ",") {
            lastComma = pos;
            pos += 1;
            skipWhitespace();
            nextStart = pos;
            while (pos < cookiesString.length && notSpecialChar()) {
              pos += 1;
            }
            if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
              cookiesSeparatorFound = true;
              pos = nextStart;
              cookiesStrings.push(cookiesString.substring(start, lastComma));
              start = pos;
            } else {
              pos = lastComma + 1;
            }
          } else {
            pos += 1;
          }
        }
        if (!cookiesSeparatorFound || pos >= cookiesString.length) {
          cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
        }
      }
      return cookiesStrings;
    }
    var RequestCookies = class {
      constructor(requestHeaders) {
        this._parsed = /* @__PURE__ */ new Map();
        this._headers = requestHeaders;
        const header = requestHeaders.get("cookie");
        if (header) {
          const parsed = parseCookie(header);
          for (const [name2, value] of parsed) {
            this._parsed.set(name2, { name: name2, value });
          }
        }
      }
      [Symbol.iterator]() {
        return this._parsed[Symbol.iterator]();
      }
      /**
       * The amount of cookies received from the client
       */
      get size() {
        return this._parsed.size;
      }
      get(...args) {
        const name2 = typeof args[0] === "string" ? args[0] : args[0].name;
        return this._parsed.get(name2);
      }
      getAll(...args) {
        var _a;
        const all = Array.from(this._parsed);
        if (!args.length) {
          return all.map(([_2, value]) => value);
        }
        const name2 = typeof args[0] === "string" ? args[0] : (_a = args[0]) == null ? void 0 : _a.name;
        return all.filter(([n5]) => n5 === name2).map(([_2, value]) => value);
      }
      has(name2) {
        return this._parsed.has(name2);
      }
      set(...args) {
        const [name2, value] = args.length === 1 ? [args[0].name, args[0].value] : args;
        const map2 = this._parsed;
        map2.set(name2, { name: name2, value });
        this._headers.set(
          "cookie",
          Array.from(map2).map(([_2, value2]) => stringifyCookie(value2)).join("; ")
        );
        return this;
      }
      /**
       * Delete the cookies matching the passed name or names in the request.
       */
      delete(names) {
        const map2 = this._parsed;
        const result = !Array.isArray(names) ? map2.delete(names) : names.map((name2) => map2.delete(name2));
        this._headers.set(
          "cookie",
          Array.from(map2).map(([_2, value]) => stringifyCookie(value)).join("; ")
        );
        return result;
      }
      /**
       * Delete all the cookies in the cookies in the request.
       */
      clear() {
        this.delete(Array.from(this._parsed.keys()));
        return this;
      }
      /**
       * Format the cookies in the request as a string for logging
       */
      [Symbol.for("edge-runtime.inspect.custom")]() {
        return `RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
      }
      toString() {
        return [...this._parsed.values()].map((v3) => `${v3.name}=${encodeURIComponent(v3.value)}`).join("; ");
      }
    };
    var ResponseCookies = class {
      constructor(responseHeaders) {
        this._parsed = /* @__PURE__ */ new Map();
        var _a, _b, _c;
        this._headers = responseHeaders;
        const setCookie = (_c = (_b = (_a = responseHeaders.getSetCookie) == null ? void 0 : _a.call(responseHeaders)) != null ? _b : responseHeaders.get("set-cookie")) != null ? _c : [];
        const cookieStrings = Array.isArray(setCookie) ? setCookie : splitCookiesString(setCookie);
        for (const cookieString of cookieStrings) {
          const parsed = parseSetCookie(cookieString);
          if (parsed)
            this._parsed.set(parsed.name, parsed);
        }
      }
      /**
       * {@link https://wicg.github.io/cookie-store/#CookieStore-get CookieStore#get} without the Promise.
       */
      get(...args) {
        const key = typeof args[0] === "string" ? args[0] : args[0].name;
        return this._parsed.get(key);
      }
      /**
       * {@link https://wicg.github.io/cookie-store/#CookieStore-getAll CookieStore#getAll} without the Promise.
       */
      getAll(...args) {
        var _a;
        const all = Array.from(this._parsed.values());
        if (!args.length) {
          return all;
        }
        const key = typeof args[0] === "string" ? args[0] : (_a = args[0]) == null ? void 0 : _a.name;
        return all.filter((c4) => c4.name === key);
      }
      has(name2) {
        return this._parsed.has(name2);
      }
      /**
       * {@link https://wicg.github.io/cookie-store/#CookieStore-set CookieStore#set} without the Promise.
       */
      set(...args) {
        const [name2, value, cookie] = args.length === 1 ? [args[0].name, args[0].value, args[0]] : args;
        const map2 = this._parsed;
        map2.set(name2, normalizeCookie({ name: name2, value, ...cookie }));
        replace(map2, this._headers);
        return this;
      }
      /**
       * {@link https://wicg.github.io/cookie-store/#CookieStore-delete CookieStore#delete} without the Promise.
       */
      delete(...args) {
        const [name2, options] = typeof args[0] === "string" ? [args[0]] : [args[0].name, args[0]];
        return this.set({ ...options, name: name2, value: "", expires: /* @__PURE__ */ new Date(0) });
      }
      [Symbol.for("edge-runtime.inspect.custom")]() {
        return `ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
      }
      toString() {
        return [...this._parsed.values()].map(stringifyCookie).join("; ");
      }
    };
    function replace(bag, headers) {
      headers.delete("set-cookie");
      for (const [, value] of bag) {
        const serialized = stringifyCookie(value);
        headers.append("set-cookie", serialized);
      }
    }
    function normalizeCookie(cookie = { name: "", value: "" }) {
      if (typeof cookie.expires === "number") {
        cookie.expires = new Date(cookie.expires);
      }
      if (cookie.maxAge) {
        cookie.expires = new Date(Date.now() + cookie.maxAge * 1e3);
      }
      if (cookie.path === null || cookie.path === void 0) {
        cookie.path = "/";
      }
      return cookie;
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/server/web/spec-extension/cookies.js
var require_cookies2 = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/server/web/spec-extension/cookies.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name2 in all) Object.defineProperty(target, name2, {
        enumerable: true,
        get: all[name2]
      });
    }
    _export(exports2, {
      RequestCookies: function() {
        return _cookies.RequestCookies;
      },
      ResponseCookies: function() {
        return _cookies.ResponseCookies;
      },
      stringifyCookie: function() {
        return _cookies.stringifyCookie;
      }
    });
    var _cookies = require_cookies();
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/i18n/detect-domain-locale.js
var require_detect_domain_locale = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/i18n/detect-domain-locale.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "detectDomainLocale", {
      enumerable: true,
      get: function() {
        return detectDomainLocale;
      }
    });
    function detectDomainLocale(domainItems, hostname, detectedLocale) {
      if (!domainItems) return;
      if (detectedLocale) {
        detectedLocale = detectedLocale.toLowerCase();
      }
      for (const item of domainItems) {
        var _item_domain, _item_locales;
        const domainHostname = (_item_domain = item.domain) == null ? void 0 : _item_domain.split(":", 1)[0].toLowerCase();
        if (hostname === domainHostname || detectedLocale === item.defaultLocale.toLowerCase() || ((_item_locales = item.locales) == null ? void 0 : _item_locales.some((locale) => locale.toLowerCase() === detectedLocale))) {
          return item;
        }
      }
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/remove-trailing-slash.js
var require_remove_trailing_slash = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/remove-trailing-slash.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "removeTrailingSlash", {
      enumerable: true,
      get: function() {
        return removeTrailingSlash;
      }
    });
    function removeTrailingSlash(route) {
      return route.replace(/\/$/, "") || "/";
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/parse-path.js
var require_parse_path = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/parse-path.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "parsePath", {
      enumerable: true,
      get: function() {
        return parsePath;
      }
    });
    function parsePath(path) {
      const hashIndex = path.indexOf("#");
      const queryIndex = path.indexOf("?");
      const hasQuery = queryIndex > -1 && (hashIndex < 0 || queryIndex < hashIndex);
      if (hasQuery || hashIndex > -1) {
        return {
          pathname: path.substring(0, hasQuery ? queryIndex : hashIndex),
          query: hasQuery ? path.substring(queryIndex, hashIndex > -1 ? hashIndex : void 0) : "",
          hash: hashIndex > -1 ? path.slice(hashIndex) : ""
        };
      }
      return {
        pathname: path,
        query: "",
        hash: ""
      };
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/add-path-prefix.js
var require_add_path_prefix = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/add-path-prefix.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "addPathPrefix", {
      enumerable: true,
      get: function() {
        return addPathPrefix;
      }
    });
    var _parsepath = require_parse_path();
    function addPathPrefix(path, prefix) {
      if (!path.startsWith("/") || !prefix) {
        return path;
      }
      const { pathname, query, hash } = (0, _parsepath.parsePath)(path);
      return "" + prefix + pathname + query + hash;
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/add-path-suffix.js
var require_add_path_suffix = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/add-path-suffix.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "addPathSuffix", {
      enumerable: true,
      get: function() {
        return addPathSuffix;
      }
    });
    var _parsepath = require_parse_path();
    function addPathSuffix(path, suffix) {
      if (!path.startsWith("/") || !suffix) {
        return path;
      }
      const { pathname, query, hash } = (0, _parsepath.parsePath)(path);
      return "" + pathname + suffix + query + hash;
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/path-has-prefix.js
var require_path_has_prefix = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/path-has-prefix.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "pathHasPrefix", {
      enumerable: true,
      get: function() {
        return pathHasPrefix;
      }
    });
    var _parsepath = require_parse_path();
    function pathHasPrefix(path, prefix) {
      if (typeof path !== "string") {
        return false;
      }
      const { pathname } = (0, _parsepath.parsePath)(path);
      return pathname === prefix || pathname.startsWith(prefix + "/");
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/add-locale.js
var require_add_locale = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/add-locale.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "addLocale", {
      enumerable: true,
      get: function() {
        return addLocale;
      }
    });
    var _addpathprefix = require_add_path_prefix();
    var _pathhasprefix = require_path_has_prefix();
    function addLocale(path, locale, defaultLocale, ignorePrefix) {
      if (!locale || locale === defaultLocale) return path;
      const lower = path.toLowerCase();
      if (!ignorePrefix) {
        if ((0, _pathhasprefix.pathHasPrefix)(lower, "/api")) return path;
        if ((0, _pathhasprefix.pathHasPrefix)(lower, "/" + locale.toLowerCase())) return path;
      }
      return (0, _addpathprefix.addPathPrefix)(path, "/" + locale);
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/format-next-pathname-info.js
var require_format_next_pathname_info = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/format-next-pathname-info.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "formatNextPathnameInfo", {
      enumerable: true,
      get: function() {
        return formatNextPathnameInfo;
      }
    });
    var _removetrailingslash = require_remove_trailing_slash();
    var _addpathprefix = require_add_path_prefix();
    var _addpathsuffix = require_add_path_suffix();
    var _addlocale = require_add_locale();
    function formatNextPathnameInfo(info) {
      let pathname = (0, _addlocale.addLocale)(info.pathname, info.locale, info.buildId ? void 0 : info.defaultLocale, info.ignorePrefix);
      if (info.buildId || !info.trailingSlash) {
        pathname = (0, _removetrailingslash.removeTrailingSlash)(pathname);
      }
      if (info.buildId) {
        pathname = (0, _addpathsuffix.addPathSuffix)((0, _addpathprefix.addPathPrefix)(pathname, "/_next/data/" + info.buildId), info.pathname === "/" ? "index.json" : ".json");
      }
      pathname = (0, _addpathprefix.addPathPrefix)(pathname, info.basePath);
      return !info.buildId && info.trailingSlash ? !pathname.endsWith("/") ? (0, _addpathsuffix.addPathSuffix)(pathname, "/") : pathname : (0, _removetrailingslash.removeTrailingSlash)(pathname);
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/get-hostname.js
var require_get_hostname = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/get-hostname.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "getHostname", {
      enumerable: true,
      get: function() {
        return getHostname;
      }
    });
    function getHostname(parsed, headers) {
      let hostname;
      if ((headers == null ? void 0 : headers.host) && !Array.isArray(headers.host)) {
        hostname = headers.host.toString().split(":", 1)[0];
      } else if (parsed.hostname) {
        hostname = parsed.hostname;
      } else return;
      return hostname.toLowerCase();
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/i18n/normalize-locale-path.js
var require_normalize_locale_path = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/i18n/normalize-locale-path.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "normalizeLocalePath", {
      enumerable: true,
      get: function() {
        return normalizeLocalePath;
      }
    });
    var cache = /* @__PURE__ */ new WeakMap();
    function normalizeLocalePath(pathname, locales) {
      if (!locales) return {
        pathname
      };
      let lowercasedLocales = cache.get(locales);
      if (!lowercasedLocales) {
        lowercasedLocales = locales.map((locale) => locale.toLowerCase());
        cache.set(locales, lowercasedLocales);
      }
      let detectedLocale;
      const segments = pathname.split("/", 2);
      if (!segments[1]) return {
        pathname
      };
      const segment = segments[1].toLowerCase();
      const index = lowercasedLocales.indexOf(segment);
      if (index < 0) return {
        pathname
      };
      detectedLocale = locales[index];
      pathname = pathname.slice(detectedLocale.length + 1) || "/";
      return {
        pathname,
        detectedLocale
      };
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/remove-path-prefix.js
var require_remove_path_prefix = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/remove-path-prefix.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "removePathPrefix", {
      enumerable: true,
      get: function() {
        return removePathPrefix;
      }
    });
    var _pathhasprefix = require_path_has_prefix();
    function removePathPrefix(path, prefix) {
      if (!(0, _pathhasprefix.pathHasPrefix)(path, prefix)) {
        return path;
      }
      const withoutPrefix = path.slice(prefix.length);
      if (withoutPrefix.startsWith("/")) {
        return withoutPrefix;
      }
      return "/" + withoutPrefix;
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/get-next-pathname-info.js
var require_get_next_pathname_info = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/shared/lib/router/utils/get-next-pathname-info.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "getNextPathnameInfo", {
      enumerable: true,
      get: function() {
        return getNextPathnameInfo;
      }
    });
    var _normalizelocalepath = require_normalize_locale_path();
    var _removepathprefix = require_remove_path_prefix();
    var _pathhasprefix = require_path_has_prefix();
    function getNextPathnameInfo(pathname, options) {
      var _options_nextConfig;
      const { basePath, i18n, trailingSlash } = (_options_nextConfig = options.nextConfig) != null ? _options_nextConfig : {};
      const info = {
        pathname,
        trailingSlash: pathname !== "/" ? pathname.endsWith("/") : trailingSlash
      };
      if (basePath && (0, _pathhasprefix.pathHasPrefix)(info.pathname, basePath)) {
        info.pathname = (0, _removepathprefix.removePathPrefix)(info.pathname, basePath);
        info.basePath = basePath;
      }
      let pathnameNoDataPrefix = info.pathname;
      if (info.pathname.startsWith("/_next/data/") && info.pathname.endsWith(".json")) {
        const paths = info.pathname.replace(/^\/_next\/data\//, "").replace(/\.json$/, "").split("/");
        const buildId = paths[0];
        info.buildId = buildId;
        pathnameNoDataPrefix = paths[1] !== "index" ? "/" + paths.slice(1).join("/") : "/";
        if (options.parseData === true) {
          info.pathname = pathnameNoDataPrefix;
        }
      }
      if (i18n) {
        let result = options.i18nProvider ? options.i18nProvider.analyze(info.pathname) : (0, _normalizelocalepath.normalizeLocalePath)(info.pathname, i18n.locales);
        info.locale = result.detectedLocale;
        var _result_pathname;
        info.pathname = (_result_pathname = result.pathname) != null ? _result_pathname : info.pathname;
        if (!result.detectedLocale && info.buildId) {
          result = options.i18nProvider ? options.i18nProvider.analyze(pathnameNoDataPrefix) : (0, _normalizelocalepath.normalizeLocalePath)(pathnameNoDataPrefix, i18n.locales);
          if (result.detectedLocale) {
            info.locale = result.detectedLocale;
          }
        }
      }
      return info;
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/server/web/next-url.js
var require_next_url = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/server/web/next-url.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "NextURL", {
      enumerable: true,
      get: function() {
        return NextURL;
      }
    });
    var _detectdomainlocale = require_detect_domain_locale();
    var _formatnextpathnameinfo = require_format_next_pathname_info();
    var _gethostname = require_get_hostname();
    var _getnextpathnameinfo = require_get_next_pathname_info();
    var REGEX_LOCALHOST_HOSTNAME = /(?!^https?:\/\/)(127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}|\[::1\]|localhost)/;
    function parseURL(url, base) {
      return new URL(String(url).replace(REGEX_LOCALHOST_HOSTNAME, "localhost"), base && String(base).replace(REGEX_LOCALHOST_HOSTNAME, "localhost"));
    }
    var Internal = Symbol("NextURLInternal");
    var NextURL = class _NextURL {
      constructor(input, baseOrOpts, opts) {
        let base;
        let options;
        if (typeof baseOrOpts === "object" && "pathname" in baseOrOpts || typeof baseOrOpts === "string") {
          base = baseOrOpts;
          options = opts || {};
        } else {
          options = opts || baseOrOpts || {};
        }
        this[Internal] = {
          url: parseURL(input, base ?? options.base),
          options,
          basePath: ""
        };
        this.analyze();
      }
      analyze() {
        var _this_Internal_options_nextConfig_i18n, _this_Internal_options_nextConfig, _this_Internal_domainLocale, _this_Internal_options_nextConfig_i18n1, _this_Internal_options_nextConfig1;
        const info = (0, _getnextpathnameinfo.getNextPathnameInfo)(this[Internal].url.pathname, {
          nextConfig: this[Internal].options.nextConfig,
          parseData: !process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE,
          i18nProvider: this[Internal].options.i18nProvider
        });
        const hostname = (0, _gethostname.getHostname)(this[Internal].url, this[Internal].options.headers);
        this[Internal].domainLocale = this[Internal].options.i18nProvider ? this[Internal].options.i18nProvider.detectDomainLocale(hostname) : (0, _detectdomainlocale.detectDomainLocale)((_this_Internal_options_nextConfig = this[Internal].options.nextConfig) == null ? void 0 : (_this_Internal_options_nextConfig_i18n = _this_Internal_options_nextConfig.i18n) == null ? void 0 : _this_Internal_options_nextConfig_i18n.domains, hostname);
        const defaultLocale = ((_this_Internal_domainLocale = this[Internal].domainLocale) == null ? void 0 : _this_Internal_domainLocale.defaultLocale) || ((_this_Internal_options_nextConfig1 = this[Internal].options.nextConfig) == null ? void 0 : (_this_Internal_options_nextConfig_i18n1 = _this_Internal_options_nextConfig1.i18n) == null ? void 0 : _this_Internal_options_nextConfig_i18n1.defaultLocale);
        this[Internal].url.pathname = info.pathname;
        this[Internal].defaultLocale = defaultLocale;
        this[Internal].basePath = info.basePath ?? "";
        this[Internal].buildId = info.buildId;
        this[Internal].locale = info.locale ?? defaultLocale;
        this[Internal].trailingSlash = info.trailingSlash;
      }
      formatPathname() {
        return (0, _formatnextpathnameinfo.formatNextPathnameInfo)({
          basePath: this[Internal].basePath,
          buildId: this[Internal].buildId,
          defaultLocale: !this[Internal].options.forceLocale ? this[Internal].defaultLocale : void 0,
          locale: this[Internal].locale,
          pathname: this[Internal].url.pathname,
          trailingSlash: this[Internal].trailingSlash
        });
      }
      formatSearch() {
        return this[Internal].url.search;
      }
      get buildId() {
        return this[Internal].buildId;
      }
      set buildId(buildId) {
        this[Internal].buildId = buildId;
      }
      get locale() {
        return this[Internal].locale ?? "";
      }
      set locale(locale) {
        var _this_Internal_options_nextConfig_i18n, _this_Internal_options_nextConfig;
        if (!this[Internal].locale || !((_this_Internal_options_nextConfig = this[Internal].options.nextConfig) == null ? void 0 : (_this_Internal_options_nextConfig_i18n = _this_Internal_options_nextConfig.i18n) == null ? void 0 : _this_Internal_options_nextConfig_i18n.locales.includes(locale))) {
          throw Object.defineProperty(new TypeError(`The NextURL configuration includes no locale "${locale}"`), "__NEXT_ERROR_CODE", {
            value: "E597",
            enumerable: false,
            configurable: true
          });
        }
        this[Internal].locale = locale;
      }
      get defaultLocale() {
        return this[Internal].defaultLocale;
      }
      get domainLocale() {
        return this[Internal].domainLocale;
      }
      get searchParams() {
        return this[Internal].url.searchParams;
      }
      get host() {
        return this[Internal].url.host;
      }
      set host(value) {
        this[Internal].url.host = value;
      }
      get hostname() {
        return this[Internal].url.hostname;
      }
      set hostname(value) {
        this[Internal].url.hostname = value;
      }
      get port() {
        return this[Internal].url.port;
      }
      set port(value) {
        this[Internal].url.port = value;
      }
      get protocol() {
        return this[Internal].url.protocol;
      }
      set protocol(value) {
        this[Internal].url.protocol = value;
      }
      get href() {
        const pathname = this.formatPathname();
        const search = this.formatSearch();
        return `${this.protocol}//${this.host}${pathname}${search}${this.hash}`;
      }
      set href(url) {
        this[Internal].url = parseURL(url);
        this.analyze();
      }
      get origin() {
        return this[Internal].url.origin;
      }
      get pathname() {
        return this[Internal].url.pathname;
      }
      set pathname(value) {
        this[Internal].url.pathname = value;
      }
      get hash() {
        return this[Internal].url.hash;
      }
      set hash(value) {
        this[Internal].url.hash = value;
      }
      get search() {
        return this[Internal].url.search;
      }
      set search(value) {
        this[Internal].url.search = value;
      }
      get password() {
        return this[Internal].url.password;
      }
      set password(value) {
        this[Internal].url.password = value;
      }
      get username() {
        return this[Internal].url.username;
      }
      set username(value) {
        this[Internal].url.username = value;
      }
      get basePath() {
        return this[Internal].basePath;
      }
      set basePath(value) {
        this[Internal].basePath = value.startsWith("/") ? value : `/${value}`;
      }
      toString() {
        return this.href;
      }
      toJSON() {
        return this.href;
      }
      [Symbol.for("edge-runtime.inspect.custom")]() {
        return {
          href: this.href,
          origin: this.origin,
          protocol: this.protocol,
          username: this.username,
          password: this.password,
          host: this.host,
          hostname: this.hostname,
          port: this.port,
          pathname: this.pathname,
          search: this.search,
          searchParams: this.searchParams,
          hash: this.hash
        };
      }
      clone() {
        return new _NextURL(String(this), this[Internal].options);
      }
    };
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/lib/constants.js
var require_constants = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/lib/constants.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name2 in all) Object.defineProperty(target, name2, {
        enumerable: true,
        get: all[name2]
      });
    }
    _export(exports2, {
      ACTION_SUFFIX: function() {
        return ACTION_SUFFIX;
      },
      APP_DIR_ALIAS: function() {
        return APP_DIR_ALIAS;
      },
      CACHE_ONE_YEAR: function() {
        return CACHE_ONE_YEAR;
      },
      DOT_NEXT_ALIAS: function() {
        return DOT_NEXT_ALIAS;
      },
      ESLINT_DEFAULT_DIRS: function() {
        return ESLINT_DEFAULT_DIRS;
      },
      GSP_NO_RETURNED_VALUE: function() {
        return GSP_NO_RETURNED_VALUE;
      },
      GSSP_COMPONENT_MEMBER_ERROR: function() {
        return GSSP_COMPONENT_MEMBER_ERROR;
      },
      GSSP_NO_RETURNED_VALUE: function() {
        return GSSP_NO_RETURNED_VALUE;
      },
      HTML_CONTENT_TYPE_HEADER: function() {
        return HTML_CONTENT_TYPE_HEADER;
      },
      INFINITE_CACHE: function() {
        return INFINITE_CACHE;
      },
      INSTRUMENTATION_HOOK_FILENAME: function() {
        return INSTRUMENTATION_HOOK_FILENAME;
      },
      JSON_CONTENT_TYPE_HEADER: function() {
        return JSON_CONTENT_TYPE_HEADER;
      },
      MATCHED_PATH_HEADER: function() {
        return MATCHED_PATH_HEADER;
      },
      MIDDLEWARE_FILENAME: function() {
        return MIDDLEWARE_FILENAME;
      },
      MIDDLEWARE_LOCATION_REGEXP: function() {
        return MIDDLEWARE_LOCATION_REGEXP;
      },
      NEXT_BODY_SUFFIX: function() {
        return NEXT_BODY_SUFFIX;
      },
      NEXT_CACHE_IMPLICIT_TAG_ID: function() {
        return NEXT_CACHE_IMPLICIT_TAG_ID;
      },
      NEXT_CACHE_REVALIDATED_TAGS_HEADER: function() {
        return NEXT_CACHE_REVALIDATED_TAGS_HEADER;
      },
      NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER: function() {
        return NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER;
      },
      NEXT_CACHE_SOFT_TAG_MAX_LENGTH: function() {
        return NEXT_CACHE_SOFT_TAG_MAX_LENGTH;
      },
      NEXT_CACHE_TAGS_HEADER: function() {
        return NEXT_CACHE_TAGS_HEADER;
      },
      NEXT_CACHE_TAG_MAX_ITEMS: function() {
        return NEXT_CACHE_TAG_MAX_ITEMS;
      },
      NEXT_CACHE_TAG_MAX_LENGTH: function() {
        return NEXT_CACHE_TAG_MAX_LENGTH;
      },
      NEXT_DATA_SUFFIX: function() {
        return NEXT_DATA_SUFFIX;
      },
      NEXT_INTERCEPTION_MARKER_PREFIX: function() {
        return NEXT_INTERCEPTION_MARKER_PREFIX;
      },
      NEXT_META_SUFFIX: function() {
        return NEXT_META_SUFFIX;
      },
      NEXT_QUERY_PARAM_PREFIX: function() {
        return NEXT_QUERY_PARAM_PREFIX;
      },
      NEXT_RESUME_HEADER: function() {
        return NEXT_RESUME_HEADER;
      },
      NON_STANDARD_NODE_ENV: function() {
        return NON_STANDARD_NODE_ENV;
      },
      PAGES_DIR_ALIAS: function() {
        return PAGES_DIR_ALIAS;
      },
      PRERENDER_REVALIDATE_HEADER: function() {
        return PRERENDER_REVALIDATE_HEADER;
      },
      PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER: function() {
        return PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER;
      },
      PUBLIC_DIR_MIDDLEWARE_CONFLICT: function() {
        return PUBLIC_DIR_MIDDLEWARE_CONFLICT;
      },
      ROOT_DIR_ALIAS: function() {
        return ROOT_DIR_ALIAS;
      },
      RSC_ACTION_CLIENT_WRAPPER_ALIAS: function() {
        return RSC_ACTION_CLIENT_WRAPPER_ALIAS;
      },
      RSC_ACTION_ENCRYPTION_ALIAS: function() {
        return RSC_ACTION_ENCRYPTION_ALIAS;
      },
      RSC_ACTION_PROXY_ALIAS: function() {
        return RSC_ACTION_PROXY_ALIAS;
      },
      RSC_ACTION_VALIDATE_ALIAS: function() {
        return RSC_ACTION_VALIDATE_ALIAS;
      },
      RSC_CACHE_WRAPPER_ALIAS: function() {
        return RSC_CACHE_WRAPPER_ALIAS;
      },
      RSC_DYNAMIC_IMPORT_WRAPPER_ALIAS: function() {
        return RSC_DYNAMIC_IMPORT_WRAPPER_ALIAS;
      },
      RSC_MOD_REF_PROXY_ALIAS: function() {
        return RSC_MOD_REF_PROXY_ALIAS;
      },
      RSC_PREFETCH_SUFFIX: function() {
        return RSC_PREFETCH_SUFFIX;
      },
      RSC_SEGMENTS_DIR_SUFFIX: function() {
        return RSC_SEGMENTS_DIR_SUFFIX;
      },
      RSC_SEGMENT_SUFFIX: function() {
        return RSC_SEGMENT_SUFFIX;
      },
      RSC_SUFFIX: function() {
        return RSC_SUFFIX;
      },
      SERVER_PROPS_EXPORT_ERROR: function() {
        return SERVER_PROPS_EXPORT_ERROR;
      },
      SERVER_PROPS_GET_INIT_PROPS_CONFLICT: function() {
        return SERVER_PROPS_GET_INIT_PROPS_CONFLICT;
      },
      SERVER_PROPS_SSG_CONFLICT: function() {
        return SERVER_PROPS_SSG_CONFLICT;
      },
      SERVER_RUNTIME: function() {
        return SERVER_RUNTIME;
      },
      SSG_FALLBACK_EXPORT_ERROR: function() {
        return SSG_FALLBACK_EXPORT_ERROR;
      },
      SSG_GET_INITIAL_PROPS_CONFLICT: function() {
        return SSG_GET_INITIAL_PROPS_CONFLICT;
      },
      STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR: function() {
        return STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR;
      },
      TEXT_PLAIN_CONTENT_TYPE_HEADER: function() {
        return TEXT_PLAIN_CONTENT_TYPE_HEADER;
      },
      UNSTABLE_REVALIDATE_RENAME_ERROR: function() {
        return UNSTABLE_REVALIDATE_RENAME_ERROR;
      },
      WEBPACK_LAYERS: function() {
        return WEBPACK_LAYERS;
      },
      WEBPACK_RESOURCE_QUERIES: function() {
        return WEBPACK_RESOURCE_QUERIES;
      }
    });
    var TEXT_PLAIN_CONTENT_TYPE_HEADER = "text/plain";
    var HTML_CONTENT_TYPE_HEADER = "text/html; charset=utf-8";
    var JSON_CONTENT_TYPE_HEADER = "application/json; charset=utf-8";
    var NEXT_QUERY_PARAM_PREFIX = "nxtP";
    var NEXT_INTERCEPTION_MARKER_PREFIX = "nxtI";
    var MATCHED_PATH_HEADER = "x-matched-path";
    var PRERENDER_REVALIDATE_HEADER = "x-prerender-revalidate";
    var PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER = "x-prerender-revalidate-if-generated";
    var RSC_PREFETCH_SUFFIX = ".prefetch.rsc";
    var RSC_SEGMENTS_DIR_SUFFIX = ".segments";
    var RSC_SEGMENT_SUFFIX = ".segment.rsc";
    var RSC_SUFFIX = ".rsc";
    var ACTION_SUFFIX = ".action";
    var NEXT_DATA_SUFFIX = ".json";
    var NEXT_META_SUFFIX = ".meta";
    var NEXT_BODY_SUFFIX = ".body";
    var NEXT_CACHE_TAGS_HEADER = "x-next-cache-tags";
    var NEXT_CACHE_REVALIDATED_TAGS_HEADER = "x-next-revalidated-tags";
    var NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER = "x-next-revalidate-tag-token";
    var NEXT_RESUME_HEADER = "next-resume";
    var NEXT_CACHE_TAG_MAX_ITEMS = 128;
    var NEXT_CACHE_TAG_MAX_LENGTH = 256;
    var NEXT_CACHE_SOFT_TAG_MAX_LENGTH = 1024;
    var NEXT_CACHE_IMPLICIT_TAG_ID = "_N_T_";
    var CACHE_ONE_YEAR = 31536e3;
    var INFINITE_CACHE = 4294967294;
    var MIDDLEWARE_FILENAME = "middleware";
    var MIDDLEWARE_LOCATION_REGEXP = `(?:src/)?${MIDDLEWARE_FILENAME}`;
    var INSTRUMENTATION_HOOK_FILENAME = "instrumentation";
    var PAGES_DIR_ALIAS = "private-next-pages";
    var DOT_NEXT_ALIAS = "private-dot-next";
    var ROOT_DIR_ALIAS = "private-next-root-dir";
    var APP_DIR_ALIAS = "private-next-app-dir";
    var RSC_MOD_REF_PROXY_ALIAS = "private-next-rsc-mod-ref-proxy";
    var RSC_ACTION_VALIDATE_ALIAS = "private-next-rsc-action-validate";
    var RSC_ACTION_PROXY_ALIAS = "private-next-rsc-server-reference";
    var RSC_CACHE_WRAPPER_ALIAS = "private-next-rsc-cache-wrapper";
    var RSC_DYNAMIC_IMPORT_WRAPPER_ALIAS = "private-next-rsc-track-dynamic-import";
    var RSC_ACTION_ENCRYPTION_ALIAS = "private-next-rsc-action-encryption";
    var RSC_ACTION_CLIENT_WRAPPER_ALIAS = "private-next-rsc-action-client-wrapper";
    var PUBLIC_DIR_MIDDLEWARE_CONFLICT = `You can not have a '_next' folder inside of your public folder. This conflicts with the internal '/_next' route. https://nextjs.org/docs/messages/public-next-folder-conflict`;
    var SSG_GET_INITIAL_PROPS_CONFLICT = `You can not use getInitialProps with getStaticProps. To use SSG, please remove your getInitialProps`;
    var SERVER_PROPS_GET_INIT_PROPS_CONFLICT = `You can not use getInitialProps with getServerSideProps. Please remove getInitialProps.`;
    var SERVER_PROPS_SSG_CONFLICT = `You can not use getStaticProps or getStaticPaths with getServerSideProps. To use SSG, please remove getServerSideProps`;
    var STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR = `can not have getInitialProps/getServerSideProps, https://nextjs.org/docs/messages/404-get-initial-props`;
    var SERVER_PROPS_EXPORT_ERROR = `pages with \`getServerSideProps\` can not be exported. See more info here: https://nextjs.org/docs/messages/gssp-export`;
    var GSP_NO_RETURNED_VALUE = "Your `getStaticProps` function did not return an object. Did you forget to add a `return`?";
    var GSSP_NO_RETURNED_VALUE = "Your `getServerSideProps` function did not return an object. Did you forget to add a `return`?";
    var UNSTABLE_REVALIDATE_RENAME_ERROR = "The `unstable_revalidate` property is available for general use.\nPlease use `revalidate` instead.";
    var GSSP_COMPONENT_MEMBER_ERROR = `can not be attached to a page's component and must be exported from the page. See more info here: https://nextjs.org/docs/messages/gssp-component-member`;
    var NON_STANDARD_NODE_ENV = `You are using a non-standard "NODE_ENV" value in your environment. This creates inconsistencies in the project and is strongly advised against. Read more: https://nextjs.org/docs/messages/non-standard-node-env`;
    var SSG_FALLBACK_EXPORT_ERROR = `Pages with \`fallback\` enabled in \`getStaticPaths\` can not be exported. See more info here: https://nextjs.org/docs/messages/ssg-fallback-true-export`;
    var ESLINT_DEFAULT_DIRS = [
      "app",
      "pages",
      "components",
      "lib",
      "src"
    ];
    var SERVER_RUNTIME = {
      edge: "edge",
      experimentalEdge: "experimental-edge",
      nodejs: "nodejs"
    };
    var WEBPACK_LAYERS_NAMES = {
      /**
      * The layer for the shared code between the client and server bundles.
      */
      shared: "shared",
      /**
      * The layer for server-only runtime and picking up `react-server` export conditions.
      * Including app router RSC pages and app router custom routes and metadata routes.
      */
      reactServerComponents: "rsc",
      /**
      * Server Side Rendering layer for app (ssr).
      */
      serverSideRendering: "ssr",
      /**
      * The browser client bundle layer for actions.
      */
      actionBrowser: "action-browser",
      /**
      * The Node.js bundle layer for the API routes.
      */
      apiNode: "api-node",
      /**
      * The Edge Lite bundle layer for the API routes.
      */
      apiEdge: "api-edge",
      /**
      * The layer for the middleware code.
      */
      middleware: "middleware",
      /**
      * The layer for the instrumentation hooks.
      */
      instrument: "instrument",
      /**
      * The layer for assets on the edge.
      */
      edgeAsset: "edge-asset",
      /**
      * The browser client bundle layer for App directory.
      */
      appPagesBrowser: "app-pages-browser",
      /**
      * The browser client bundle layer for Pages directory.
      */
      pagesDirBrowser: "pages-dir-browser",
      /**
      * The Edge Lite bundle layer for Pages directory.
      */
      pagesDirEdge: "pages-dir-edge",
      /**
      * The Node.js bundle layer for Pages directory.
      */
      pagesDirNode: "pages-dir-node"
    };
    var WEBPACK_LAYERS = {
      ...WEBPACK_LAYERS_NAMES,
      GROUP: {
        builtinReact: [
          WEBPACK_LAYERS_NAMES.reactServerComponents,
          WEBPACK_LAYERS_NAMES.actionBrowser
        ],
        serverOnly: [
          WEBPACK_LAYERS_NAMES.reactServerComponents,
          WEBPACK_LAYERS_NAMES.actionBrowser,
          WEBPACK_LAYERS_NAMES.instrument,
          WEBPACK_LAYERS_NAMES.middleware
        ],
        neutralTarget: [
          // pages api
          WEBPACK_LAYERS_NAMES.apiNode,
          WEBPACK_LAYERS_NAMES.apiEdge
        ],
        clientOnly: [
          WEBPACK_LAYERS_NAMES.serverSideRendering,
          WEBPACK_LAYERS_NAMES.appPagesBrowser
        ],
        bundled: [
          WEBPACK_LAYERS_NAMES.reactServerComponents,
          WEBPACK_LAYERS_NAMES.actionBrowser,
          WEBPACK_LAYERS_NAMES.serverSideRendering,
          WEBPACK_LAYERS_NAMES.appPagesBrowser,
          WEBPACK_LAYERS_NAMES.shared,
          WEBPACK_LAYERS_NAMES.instrument,
          WEBPACK_LAYERS_NAMES.middleware
        ],
        appPages: [
          // app router pages and layouts
          WEBPACK_LAYERS_NAMES.reactServerComponents,
          WEBPACK_LAYERS_NAMES.serverSideRendering,
          WEBPACK_LAYERS_NAMES.appPagesBrowser,
          WEBPACK_LAYERS_NAMES.actionBrowser
        ]
      }
    };
    var WEBPACK_RESOURCE_QUERIES = {
      edgeSSREntry: "__next_edge_ssr_entry__",
      metadata: "__next_metadata__",
      metadataRoute: "__next_metadata_route__",
      metadataImageMeta: "__next_metadata_image_meta__"
    };
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/server/web/utils.js
var require_utils = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/server/web/utils.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name2 in all) Object.defineProperty(target, name2, {
        enumerable: true,
        get: all[name2]
      });
    }
    _export(exports2, {
      fromNodeOutgoingHttpHeaders: function() {
        return fromNodeOutgoingHttpHeaders;
      },
      normalizeNextQueryParam: function() {
        return normalizeNextQueryParam;
      },
      splitCookiesString: function() {
        return splitCookiesString;
      },
      toNodeOutgoingHttpHeaders: function() {
        return toNodeOutgoingHttpHeaders;
      },
      validateURL: function() {
        return validateURL;
      }
    });
    var _constants = require_constants();
    function fromNodeOutgoingHttpHeaders(nodeHeaders) {
      const headers = new Headers();
      for (let [key, value] of Object.entries(nodeHeaders)) {
        const values = Array.isArray(value) ? value : [
          value
        ];
        for (let v3 of values) {
          if (typeof v3 === "undefined") continue;
          if (typeof v3 === "number") {
            v3 = v3.toString();
          }
          headers.append(key, v3);
        }
      }
      return headers;
    }
    function splitCookiesString(cookiesString) {
      var cookiesStrings = [];
      var pos = 0;
      var start;
      var ch;
      var lastComma;
      var nextStart;
      var cookiesSeparatorFound;
      function skipWhitespace() {
        while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
          pos += 1;
        }
        return pos < cookiesString.length;
      }
      function notSpecialChar() {
        ch = cookiesString.charAt(pos);
        return ch !== "=" && ch !== ";" && ch !== ",";
      }
      while (pos < cookiesString.length) {
        start = pos;
        cookiesSeparatorFound = false;
        while (skipWhitespace()) {
          ch = cookiesString.charAt(pos);
          if (ch === ",") {
            lastComma = pos;
            pos += 1;
            skipWhitespace();
            nextStart = pos;
            while (pos < cookiesString.length && notSpecialChar()) {
              pos += 1;
            }
            if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
              cookiesSeparatorFound = true;
              pos = nextStart;
              cookiesStrings.push(cookiesString.substring(start, lastComma));
              start = pos;
            } else {
              pos = lastComma + 1;
            }
          } else {
            pos += 1;
          }
        }
        if (!cookiesSeparatorFound || pos >= cookiesString.length) {
          cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
        }
      }
      return cookiesStrings;
    }
    function toNodeOutgoingHttpHeaders(headers) {
      const nodeHeaders = {};
      const cookies = [];
      if (headers) {
        for (const [key, value] of headers.entries()) {
          if (key.toLowerCase() === "set-cookie") {
            cookies.push(...splitCookiesString(value));
            nodeHeaders[key] = cookies.length === 1 ? cookies[0] : cookies;
          } else {
            nodeHeaders[key] = value;
          }
        }
      }
      return nodeHeaders;
    }
    function validateURL(url) {
      try {
        return String(new URL(String(url)));
      } catch (error) {
        throw Object.defineProperty(new Error(`URL is malformed "${String(url)}". Please use only absolute URLs - https://nextjs.org/docs/messages/middleware-relative-urls`, {
          cause: error
        }), "__NEXT_ERROR_CODE", {
          value: "E61",
          enumerable: false,
          configurable: true
        });
      }
    }
    function normalizeNextQueryParam(key) {
      const prefixes = [
        _constants.NEXT_QUERY_PARAM_PREFIX,
        _constants.NEXT_INTERCEPTION_MARKER_PREFIX
      ];
      for (const prefix of prefixes) {
        if (key !== prefix && key.startsWith(prefix)) {
          return key.substring(prefix.length);
        }
      }
      return null;
    }
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/server/web/spec-extension/adapters/reflect.js
var require_reflect = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/server/web/spec-extension/adapters/reflect.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "ReflectAdapter", {
      enumerable: true,
      get: function() {
        return ReflectAdapter;
      }
    });
    var ReflectAdapter = class {
      static get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === "function") {
          return value.bind(target);
        }
        return value;
      }
      static set(target, prop, value, receiver) {
        return Reflect.set(target, prop, value, receiver);
      }
      static has(target, prop) {
        return Reflect.has(target, prop);
      }
      static deleteProperty(target, prop) {
        return Reflect.deleteProperty(target, prop);
      }
    };
  }
});

// ../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/server/web/spec-extension/response.js
var require_response = __commonJS({
  "../node_modules/.pnpm/next@15.5.0_@babel+core@7.2_68dac6a0e46d064c7d59d781be02d2fb/node_modules/next/dist/server/web/spec-extension/response.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    Object.defineProperty(exports2, "NextResponse", {
      enumerable: true,
      get: function() {
        return NextResponse2;
      }
    });
    var _cookies = require_cookies2();
    var _nexturl = require_next_url();
    var _utils = require_utils();
    var _reflect = require_reflect();
    var _cookies1 = require_cookies2();
    var INTERNALS = Symbol("internal response");
    var REDIRECTS = /* @__PURE__ */ new Set([
      301,
      302,
      303,
      307,
      308
    ]);
    function handleMiddlewareField(init, headers) {
      var _init_request;
      if (init == null ? void 0 : (_init_request = init.request) == null ? void 0 : _init_request.headers) {
        if (!(init.request.headers instanceof Headers)) {
          throw Object.defineProperty(new Error("request.headers must be an instance of Headers"), "__NEXT_ERROR_CODE", {
            value: "E119",
            enumerable: false,
            configurable: true
          });
        }
        const keys = [];
        for (const [key, value] of init.request.headers) {
          headers.set("x-middleware-request-" + key, value);
          keys.push(key);
        }
        headers.set("x-middleware-override-headers", keys.join(","));
      }
    }
    var NextResponse2 = class _NextResponse extends Response {
      constructor(body, init = {}) {
        super(body, init);
        const headers = this.headers;
        const cookies = new _cookies1.ResponseCookies(headers);
        const cookiesProxy = new Proxy(cookies, {
          get(target, prop, receiver) {
            switch (prop) {
              case "delete":
              case "set": {
                return (...args) => {
                  const result = Reflect.apply(target[prop], target, args);
                  const newHeaders = new Headers(headers);
                  if (result instanceof _cookies1.ResponseCookies) {
                    headers.set("x-middleware-set-cookie", result.getAll().map((cookie) => (0, _cookies.stringifyCookie)(cookie)).join(","));
                  }
                  handleMiddlewareField(init, newHeaders);
                  return result;
                };
              }
              default:
                return _reflect.ReflectAdapter.get(target, prop, receiver);
            }
          }
        });
        this[INTERNALS] = {
          cookies: cookiesProxy,
          url: init.url ? new _nexturl.NextURL(init.url, {
            headers: (0, _utils.toNodeOutgoingHttpHeaders)(headers),
            nextConfig: init.nextConfig
          }) : void 0
        };
      }
      [Symbol.for("edge-runtime.inspect.custom")]() {
        return {
          cookies: this.cookies,
          url: this.url,
          // rest of props come from Response
          body: this.body,
          bodyUsed: this.bodyUsed,
          headers: Object.fromEntries(this.headers),
          ok: this.ok,
          redirected: this.redirected,
          status: this.status,
          statusText: this.statusText,
          type: this.type
        };
      }
      get cookies() {
        return this[INTERNALS].cookies;
      }
      static json(body, init) {
        const response = Response.json(body, init);
        return new _NextResponse(response.body, response);
      }
      static redirect(url, init) {
        const status = typeof init === "number" ? init : (init == null ? void 0 : init.status) ?? 307;
        if (!REDIRECTS.has(status)) {
          throw Object.defineProperty(new RangeError('Failed to execute "redirect" on "response": Invalid status code'), "__NEXT_ERROR_CODE", {
            value: "E529",
            enumerable: false,
            configurable: true
          });
        }
        const initObj = typeof init === "object" ? init : {};
        const headers = new Headers(initObj == null ? void 0 : initObj.headers);
        headers.set("Location", (0, _utils.validateURL)(url));
        return new _NextResponse(null, {
          ...initObj,
          headers,
          status
        });
      }
      static rewrite(destination, init) {
        const headers = new Headers(init == null ? void 0 : init.headers);
        headers.set("x-middleware-rewrite", (0, _utils.validateURL)(destination));
        handleMiddlewareField(init, headers);
        return new _NextResponse(null, {
          ...init,
          headers
        });
      }
      static next(init) {
        const headers = new Headers(init == null ? void 0 : init.headers);
        headers.set("x-middleware-next", "1");
        handleMiddlewareField(init, headers);
        return new _NextResponse(null, {
          ...init,
          headers
        });
      }
    };
  }
});

// app/api/search/route.ts
var route_exports = {};
__export(route_exports, {
  GET: () => GET,
  POST: () => POST
});
module.exports = __toCommonJS(route_exports);

// ../node_modules/.pnpm/get-it@8.6.10/node_modules/get-it/dist/_chunks-es/defaultOptionsValidator.js
var e = !(typeof navigator > "u") && "ReactNative" === navigator.product;
var t = { timeout: e ? 6e4 : 12e4 };
var r = function(r5) {
  const a3 = { ...t, ..."string" == typeof r5 ? { url: r5 } : r5 };
  if (a3.timeout = o(a3.timeout), a3.query) {
    const { url: t4, searchParams: r6 } = (function(t5) {
      const r7 = t5.indexOf("?");
      if (-1 === r7) return { url: t5, searchParams: new URLSearchParams() };
      const o5 = t5.slice(0, r7), a4 = t5.slice(r7 + 1);
      if (!e) return { url: o5, searchParams: new URLSearchParams(a4) };
      if ("function" != typeof decodeURIComponent) throw new Error("Broken `URLSearchParams` implementation, and `decodeURIComponent` is not defined");
      const s4 = new URLSearchParams();
      for (const e5 of a4.split("&")) {
        const [t6, r8] = e5.split("=");
        t6 && s4.append(n(t6), n(r8 || ""));
      }
      return { url: o5, searchParams: s4 };
    })(a3.url);
    for (const [e5, n5] of Object.entries(a3.query)) {
      if (void 0 !== n5) if (Array.isArray(n5)) for (const t5 of n5) r6.append(e5, t5);
      else r6.append(e5, n5);
      const o5 = r6.toString();
      o5 && (a3.url = `${t4}?${o5}`);
    }
  }
  return a3.method = a3.body && !a3.method ? "POST" : (a3.method || "GET").toUpperCase(), a3;
};
function n(e5) {
  return decodeURIComponent(e5.replace(/\+/g, " "));
}
function o(e5) {
  if (false === e5 || 0 === e5) return false;
  if (e5.connect || e5.socket) return e5;
  const r5 = Number(e5);
  return isNaN(r5) ? o(t.timeout) : { connect: r5, socket: r5 };
}
var a = /^https?:\/\//i;
var s = function(e5) {
  if (!a.test(e5.url)) throw new Error(`"${e5.url}" is not a valid URL`);
};

// ../node_modules/.pnpm/get-it@8.6.10/node_modules/get-it/dist/_chunks-es/createRequester.js
var r2 = ["request", "response", "progress", "error", "abort"];
var o2 = ["processOptions", "validateOptions", "interceptRequest", "finalizeOptions", "onRequest", "onResponse", "onError", "onReturn", "onHeaders"];
function n2(s4, i2) {
  const u4 = [], a3 = o2.reduce((e5, t4) => (e5[t4] = e5[t4] || [], e5), { processOptions: [r], validateOptions: [s] });
  function c4(e5) {
    const t4 = r2.reduce((e6, t5) => (e6[t5] = /* @__PURE__ */ (function() {
      const e7 = /* @__PURE__ */ Object.create(null);
      let t6 = 0;
      return { publish: function(t7) {
        for (const r5 in e7) e7[r5](t7);
      }, subscribe: function(r5) {
        const o6 = t6++;
        return e7[o6] = r5, function() {
          delete e7[o6];
        };
      } };
    })(), e6), {}), o5 = /* @__PURE__ */ ((e6) => function(t5, r5, ...o6) {
      const n6 = "onError" === t5;
      let s6 = r5;
      for (let r6 = 0; r6 < e6[t5].length && (s6 = (0, e6[t5][r6])(s6, ...o6), !n6 || s6); r6++) ;
      return s6;
    })(a3), n5 = o5("processOptions", e5);
    o5("validateOptions", n5);
    const s5 = { options: n5, channels: t4, applyMiddleware: o5 };
    let u5;
    const c5 = t4.request.subscribe((e6) => {
      u5 = i2(e6, (r5, n6) => ((e7, r6, n7) => {
        let s6 = e7, i3 = r6;
        if (!s6) try {
          i3 = o5("onResponse", r6, n7);
        } catch (e8) {
          i3 = null, s6 = e8;
        }
        s6 = s6 && o5("onError", s6, n7), s6 ? t4.error.publish(s6) : i3 && t4.response.publish(i3);
      })(r5, n6, e6));
    });
    t4.abort.subscribe(() => {
      c5(), u5 && u5.abort();
    });
    const l3 = o5("onReturn", t4, s5);
    return l3 === t4 && t4.request.publish(s5), l3;
  }
  return c4.use = function(e5) {
    if (!e5) throw new Error("Tried to add middleware that resolved to falsey value");
    if ("function" == typeof e5) throw new Error("Tried to add middleware that was a function. It probably expects you to pass options to it.");
    if (e5.onReturn && a3.onReturn.length > 0) throw new Error("Tried to add new middleware with `onReturn` handler, but another handler has already been registered for this event");
    return o2.forEach((t4) => {
      e5[t4] && a3[t4].push(e5[t4]);
    }), u4.push(e5), c4;
  }, c4.clone = () => n2(u4, i2), s4.forEach(c4.use), c4;
}

// ../node_modules/.pnpm/get-it@8.6.10/node_modules/get-it/dist/_chunks-es/node-request.js
var import_decompress_response = __toESM(require_decompress_response(), 1);
var import_follow_redirects = __toESM(require_follow_redirects(), 1);
var import_http = __toESM(require("http"), 1);
var import_https = __toESM(require("https"), 1);
var import_querystring = __toESM(require("querystring"), 1);
var import_stream = require("stream");
var import_url = __toESM(require("url"), 1);
var import_through2 = __toESM(require_through2(), 1);
var i = __toESM(require_tunnel_agent(), 1);
function p(e5) {
  return Object.keys(e5 || {}).reduce((t4, o5) => (t4[o5.toLowerCase()] = e5[o5], t4), {});
}
var u = 1;
var d = 65535;
var h = null;
var l = function() {
  u = u + 1 & d;
};
function f(e5) {
  let t4 = e5.length || 0, o5 = 0, r5 = Date.now() + e5.time, n5 = 0;
  const s4 = (function() {
    h || (h = setInterval(l, 250), h.unref && h.unref());
    const e6 = [0];
    let t5 = 1, o6 = u - 1 & d;
    return { getSpeed: function(r6) {
      let n6 = u - o6 & d;
      for (n6 > 20 && (n6 = 20), o6 = u; n6--; ) 20 === t5 && (t5 = 0), e6[t5] = e6[0 === t5 ? 19 : t5 - 1], t5++;
      r6 && (e6[t5 - 1] += r6);
      const s5 = e6[t5 - 1], c5 = e6.length < 20 ? 0 : e6[20 === t5 ? 0 : t5];
      return e6.length < 4 ? s5 : 4 * (s5 - c5) / e6.length;
    }, clear: function() {
      h && (clearInterval(h), h = null);
    } };
  })(), c4 = Date.now(), i2 = { percentage: 0, transferred: o5, length: t4, remaining: t4, eta: 0, runtime: 0, speed: 0, delta: 0 }, p3 = function(a3) {
    i2.delta = n5, i2.percentage = a3 ? 100 : t4 ? o5 / t4 * 100 : 0, i2.speed = s4.getSpeed(n5), i2.eta = Math.round(i2.remaining / i2.speed), i2.runtime = Math.floor((Date.now() - c4) / 1e3), r5 = Date.now() + e5.time, n5 = 0, f3.emit("progress", i2);
  }, f3 = (0, import_through2.default)({}, function(e6, s5, c5) {
    const a3 = e6.length;
    o5 += a3, n5 += a3, i2.transferred = o5, i2.remaining = t4 >= o5 ? t4 - o5 : 0, Date.now() >= r5 && p3(false), c5(null, e6);
  }, function(e6) {
    p3(true), s4.clear(), e6();
  }), m2 = function(e6) {
    t4 = e6, i2.length = t4, i2.remaining = t4 - i2.transferred, f3.emit("length", t4);
  };
  return f3.on("pipe", function(e6) {
    if (!(t4 > 0)) {
      if (e6.readable && !("writable" in e6) && "headers" in e6 && "object" == typeof (o6 = e6.headers) && null !== o6 && !Array.isArray(o6)) {
        const t5 = "string" == typeof e6.headers["content-length"] ? parseInt(e6.headers["content-length"], 10) : 0;
        return m2(t5);
      }
      if ("length" in e6 && "number" == typeof e6.length) return m2(e6.length);
      e6.on("response", function(e7) {
        if (e7 && e7.headers && "gzip" !== e7.headers["content-encoding"] && e7.headers["content-length"]) return m2(parseInt(e7.headers["content-length"]));
      });
    }
    var o6;
  }), f3.progress = function() {
    return i2.speed = s4.getSpeed(0), i2.eta = Math.round(i2.remaining / i2.speed), i2;
  }, f3;
}
function m(e5) {
  return e5.replace(/^\.*/, ".").toLowerCase();
}
function g(e5) {
  const t4 = e5.trim().toLowerCase(), o5 = t4.split(":", 2);
  return { hostname: m(o5[0]), port: o5[1], hasPort: t4.indexOf(":") > -1 };
}
var y = ["protocol", "slashes", "auth", "host", "port", "hostname", "hash", "search", "query", "pathname", "path", "href"];
var b = ["accept", "accept-charset", "accept-encoding", "accept-language", "accept-ranges", "cache-control", "content-encoding", "content-language", "content-location", "content-md5", "content-range", "content-type", "connection", "date", "expect", "max-forwards", "pragma", "referer", "te", "user-agent", "via"];
var x = ["proxy-authorization"];
var w = (e5) => null !== e5 && "object" == typeof e5 && "function" == typeof e5.pipe;
var O = "node";
var T = class extends Error {
  request;
  code;
  constructor(e5, t4) {
    super(e5.message), this.request = t4, this.code = e5.code;
  }
};
var v = (e5, t4, o5, r5) => ({ body: r5, url: t4, method: o5, headers: e5.headers, statusCode: e5.statusCode, statusMessage: e5.statusMessage });
var R = (a3, u4) => {
  const { options: d2 } = a3, h3 = Object.assign({}, import_url.default.parse(d2.url));
  if ("function" == typeof fetch && d2.fetch) {
    const e5 = new AbortController(), t4 = a3.applyMiddleware("finalizeOptions", { ...h3, method: d2.method, headers: { ..."object" == typeof d2.fetch && d2.fetch.headers ? p(d2.fetch.headers) : {}, ...p(d2.headers) }, maxRedirects: d2.maxRedirects }), o5 = { credentials: d2.withCredentials ? "include" : "omit", ..."object" == typeof d2.fetch ? d2.fetch : {}, method: t4.method, headers: t4.headers, body: d2.body, signal: e5.signal }, r5 = a3.applyMiddleware("interceptRequest", void 0, { adapter: O, context: a3 });
    if (r5) {
      const e6 = setTimeout(u4, 0, null, r5);
      return { abort: () => clearTimeout(e6) };
    }
    const n5 = fetch(d2.url, o5);
    return a3.applyMiddleware("onRequest", { options: d2, adapter: O, request: n5, context: a3 }), n5.then(async (e6) => {
      const t5 = d2.rawBody ? e6.body : await e6.text(), o6 = {};
      e6.headers.forEach((e7, t6) => {
        o6[t6] = e7;
      }), u4(null, { body: t5, url: e6.url, method: d2.method, headers: o6, statusCode: e6.status, statusMessage: e6.statusText });
    }).catch((e6) => {
      "AbortError" != e6.name && u4(e6);
    }), { abort: () => e5.abort() };
  }
  const l3 = w(d2.body) ? "stream" : typeof d2.body;
  if ("undefined" !== l3 && "stream" !== l3 && "string" !== l3 && !Buffer.isBuffer(d2.body)) throw new Error(`Request body must be a string, buffer or stream, got ${l3}`);
  const R3 = {};
  d2.bodySize ? R3["content-length"] = d2.bodySize : d2.body && "stream" !== l3 && (R3["content-length"] = Buffer.byteLength(d2.body));
  let j2 = false;
  const M2 = (e5, t4) => !j2 && u4(e5, t4);
  a3.channels.abort.subscribe(() => {
    j2 = true;
  });
  let $ = Object.assign({}, h3, { method: d2.method, headers: Object.assign({}, p(d2.headers), R3), maxRedirects: d2.maxRedirects });
  const q2 = (function(e5) {
    const t4 = typeof e5.proxy > "u" ? (function(e6) {
      const t5 = process.env.NO_PROXY || process.env.no_proxy || "";
      return "*" === t5 || "" !== t5 && (function(e7, t6) {
        const o5 = e7.port || ("https:" === e7.protocol ? "443" : "80"), r5 = m(e7.hostname || "");
        return t6.split(",").map(g).some((e8) => {
          const t7 = r5.indexOf(e8.hostname), n5 = t7 > -1 && t7 === r5.length - e8.hostname.length;
          return e8.hasPort ? o5 === e8.port && n5 : n5;
        });
      })(e6, t5) ? null : "http:" === e6.protocol ? process.env.HTTP_PROXY || process.env.http_proxy || null : "https:" === e6.protocol && (process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy) || null;
    })(import_url.default.parse(e5.url)) : e5.proxy;
    return "string" == typeof t4 ? import_url.default.parse(t4) : t4 || null;
  })(d2), C3 = q2 && (function(e5) {
    return typeof e5.tunnel < "u" ? !!e5.tunnel : "https:" === import_url.default.parse(e5.url).protocol;
  })(d2), S3 = a3.applyMiddleware("interceptRequest", void 0, { adapter: O, context: a3 });
  if (S3) {
    const e5 = setImmediate(M2, null, S3);
    return { abort: () => clearImmediate(e5) };
  }
  if (0 !== d2.maxRedirects && ($.maxRedirects = d2.maxRedirects || 5), q2 && C3 ? $ = (function(e5 = {}, t4) {
    const o5 = Object.assign({}, e5), r5 = b.concat(o5.proxyHeaderWhiteList || []).map((e6) => e6.toLowerCase()), n5 = x.concat(o5.proxyHeaderExclusiveList || []).map((e6) => e6.toLowerCase()), s4 = (c4 = o5.headers, a4 = r5, Object.keys(c4).filter((e6) => -1 !== a4.indexOf(e6.toLowerCase())).reduce((e6, t5) => (e6[t5] = c4[t5], e6), {}));
    var c4, a4;
    s4.host = (function(e6) {
      const t5 = e6.port, o6 = e6.protocol;
      let r6 = `${e6.hostname}:`;
      return r6 += t5 || ("https:" === o6 ? "443" : "80"), r6;
    })(o5), o5.headers = Object.keys(o5.headers || {}).reduce((e6, t5) => (-1 === n5.indexOf(t5.toLowerCase()) && (e6[t5] = o5.headers[t5]), e6), {});
    const p3 = (function(e6, t5) {
      const o6 = (function(e7) {
        return y.reduce((t6, o7) => (t6[o7] = e7[o7], t6), {});
      })(e6), r6 = (function(e7, t6) {
        return `${"https:" === e7.protocol ? "https" : "http"}Over${"https:" === t6.protocol ? "Https" : "Http"}`;
      })(o6, t5);
      return i[r6];
    })(o5, t4), u5 = (function(e6, t5, o6) {
      return { proxy: { host: t5.hostname, port: +t5.port, proxyAuth: t5.auth, headers: o6 }, headers: e6.headers, ca: e6.ca, cert: e6.cert, key: e6.key, passphrase: e6.passphrase, pfx: e6.pfx, ciphers: e6.ciphers, rejectUnauthorized: e6.rejectUnauthorized, secureOptions: e6.secureOptions, secureProtocol: e6.secureProtocol };
    })(o5, t4, s4);
    return o5.agent = p3(u5), o5;
  })($, q2) : q2 && !C3 && ($ = (function(e5, t4, o5) {
    const r5 = e5.headers || {}, n5 = Object.assign({}, e5, { headers: r5 });
    return r5.host = r5.host || (function(e6) {
      const t5 = e6.port || ("https:" === e6.protocol ? "443" : "80");
      return `${e6.hostname}:${t5}`;
    })(t4), n5.protocol = o5.protocol || n5.protocol, n5.hostname = (o5.host || "hostname" in o5 && o5.hostname || n5.hostname || "").replace(/:\d+/, ""), n5.port = o5.port ? `${o5.port}` : n5.port, n5.host = (function(e6) {
      let t5 = e6.host;
      return e6.port && ("80" === e6.port && "http:" === e6.protocol || "443" === e6.port && "https:" === e6.protocol) && (t5 = e6.hostname), t5;
    })(Object.assign({}, t4, o5)), n5.href = `${n5.protocol}//${n5.host}${n5.path}`, n5.path = import_url.default.format(t4), n5;
  })($, h3, q2)), !C3 && q2 && q2.auth && !$.headers["proxy-authorization"]) {
    const [e5, t4] = "string" == typeof q2.auth ? q2.auth.split(":").map((e6) => import_querystring.default.unescape(e6)) : [q2.auth.username, q2.auth.password], o5 = Buffer.from(`${e5}:${t4}`, "utf8").toString("base64");
    $.headers["proxy-authorization"] = `Basic ${o5}`;
  }
  const z2 = (function(e5, n5, s4) {
    const c4 = "https:" === e5.protocol, a4 = 0 === e5.maxRedirects ? { http: import_http.default, https: import_https.default } : { http: import_follow_redirects.default.http, https: import_follow_redirects.default.https };
    if (!n5 || s4) return c4 ? a4.https : a4.http;
    let i2 = 443 === n5.port;
    return n5.protocol && (i2 = /^https:?/.test(n5.protocol)), i2 ? a4.https : a4.http;
  })($, q2, C3);
  "function" == typeof d2.debug && q2 && d2.debug("Proxying using %s", $.agent ? "tunnel agent" : `${$.host}:${$.port}`);
  const E3 = "HEAD" !== $.method;
  let L;
  E3 && !$.headers["accept-encoding"] && false !== d2.compress && ($.headers["accept-encoding"] = typeof Bun < "u" ? "gzip, deflate" : "br, gzip, deflate");
  const P2 = a3.applyMiddleware("finalizeOptions", $), k2 = z2.request(P2, (t4) => {
    const o5 = E3 ? (0, import_decompress_response.default)(t4) : t4;
    L = o5;
    const r5 = a3.applyMiddleware("onHeaders", o5, { headers: t4.headers, adapter: O, context: a3 }), n5 = "responseUrl" in t4 ? t4.responseUrl : d2.url;
    d2.stream ? M2(null, v(o5, n5, $.method, r5)) : (function(e5, t5) {
      const o6 = [];
      e5.on("data", function(e6) {
        o6.push(e6);
      }), e5.once("end", function() {
        t5 && t5(null, Buffer.concat(o6)), t5 = null;
      }), e5.once("error", function(e6) {
        t5 && t5(e6), t5 = null;
      });
    })(r5, (e5, t5) => {
      if (e5) return M2(e5);
      const r6 = d2.rawBody ? t5 : t5.toString(), s4 = v(o5, n5, $.method, r6);
      return M2(null, s4);
    });
  });
  function B2(e5) {
    L && L.destroy(e5), k2.destroy(e5);
  }
  k2.once("socket", (e5) => {
    e5.once("error", B2), k2.once("response", (t4) => {
      t4.once("end", () => {
        e5.removeListener("error", B2);
      });
    });
  }), k2.once("error", (e5) => {
    L || M2(new T(e5, k2));
  }), d2.timeout && (function(e5, t4) {
    if (e5.timeoutTimer) return e5;
    const o5 = isNaN(t4) ? t4 : { socket: t4, connect: t4 }, r5 = e5.getHeader("host"), n5 = r5 ? " to " + r5 : "";
    function s4() {
      e5.timeoutTimer && (clearTimeout(e5.timeoutTimer), e5.timeoutTimer = null);
    }
    function c4(t5) {
      if (s4(), void 0 !== o5.socket) {
        const r6 = () => {
          const e6 = new Error("Socket timed out on request" + n5);
          e6.code = "ESOCKETTIMEDOUT", t5.destroy(e6);
        };
        t5.setTimeout(o5.socket, r6), e5.once("response", (e6) => {
          e6.once("end", () => {
            t5.removeListener("timeout", r6);
          });
        });
      }
    }
    void 0 !== o5.connect && (e5.timeoutTimer = setTimeout(function() {
      const t5 = new Error("Connection timed out on request" + n5);
      t5.code = "ETIMEDOUT", e5.destroy(t5);
    }, o5.connect)), e5.on("socket", function(e6) {
      e6.connecting ? e6.once("connect", () => c4(e6)) : c4(e6);
    }), e5.on("error", s4);
  })(k2, d2.timeout);
  const { bodyStream: H2, progress: D2 } = (function(e5) {
    if (!e5.body) return {};
    const t4 = w(e5.body), o5 = e5.bodySize || (t4 ? null : Buffer.byteLength(e5.body));
    if (!o5) return t4 ? { bodyStream: e5.body } : {};
    const r5 = f({ time: 32, length: o5 });
    return { bodyStream: (t4 ? e5.body : import_stream.Readable.from(e5.body)).pipe(r5), progress: r5 };
  })(d2);
  return a3.applyMiddleware("onRequest", { options: d2, adapter: O, request: k2, context: a3, progress: D2 }), H2 ? H2.pipe(k2) : k2.end(d2.body), { abort: () => k2.abort() };
};

// ../node_modules/.pnpm/get-it@8.6.10/node_modules/get-it/dist/index.js
var o4 = (r5 = [], o5 = R) => n2(r5, o5);

// ../node_modules/.pnpm/get-it@8.6.10/node_modules/get-it/dist/middleware.js
var import_http2 = require("http");
var import_https2 = require("https");

// ../node_modules/.pnpm/get-it@8.6.10/node_modules/get-it/dist/_chunks-es/_commonjsHelpers.js
var e3 = !(typeof navigator > "u") && "ReactNative" === navigator.product;
function c2(e5) {
  return e5 && e5.__esModule && Object.prototype.hasOwnProperty.call(e5, "default") ? e5.default : e5;
}

// ../node_modules/.pnpm/get-it@8.6.10/node_modules/get-it/dist/middleware.js
var import_tty = __toESM(require("tty"), 1);
var import_util = __toESM(require("util"), 1);
var import_is_retry_allowed = __toESM(require_is_retry_allowed(), 1);
var p2 = /^https:/i;
function l2(s4) {
  const n5 = new import_http2.Agent(s4), r5 = new import_https2.Agent(s4), o5 = { http: n5, https: r5 };
  return { finalizeOptions: (e5) => {
    if (e5.agent) return e5;
    if (e5.maxRedirects > 0) return { ...e5, agents: o5 };
    const t4 = p2.test(e5.href || e5.protocol);
    return { ...e5, agent: t4 ? r5 : n5 };
  } };
}
var h2;
var g2;
var C;
var b2;
var y2;
var w2 = { exports: {} };
var O2 = { exports: {} };
function F() {
  return b2 ? C : (b2 = 1, C = function(e5) {
    function t4(e6) {
      let n6, r5, o5, i2 = null;
      function c4(...e7) {
        if (!c4.enabled) return;
        const s5 = c4, r6 = Number(/* @__PURE__ */ new Date()), o6 = r6 - (n6 || r6);
        s5.diff = o6, s5.prev = n6, s5.curr = r6, n6 = r6, e7[0] = t4.coerce(e7[0]), "string" != typeof e7[0] && e7.unshift("%O");
        let i3 = 0;
        e7[0] = e7[0].replace(/%([a-zA-Z%])/g, (n7, r7) => {
          if ("%%" === n7) return "%";
          i3++;
          const o7 = t4.formatters[r7];
          if ("function" == typeof o7) {
            const t5 = e7[i3];
            n7 = o7.call(s5, t5), e7.splice(i3, 1), i3--;
          }
          return n7;
        }), t4.formatArgs.call(s5, e7), (s5.log || t4.log).apply(s5, e7);
      }
      return c4.namespace = e6, c4.useColors = t4.useColors(), c4.color = t4.selectColor(e6), c4.extend = s4, c4.destroy = t4.destroy, Object.defineProperty(c4, "enabled", { enumerable: true, configurable: false, get: () => null !== i2 ? i2 : (r5 !== t4.namespaces && (r5 = t4.namespaces, o5 = t4.enabled(e6)), o5), set: (e7) => {
        i2 = e7;
      } }), "function" == typeof t4.init && t4.init(c4), c4;
    }
    function s4(e6, s5) {
      const n6 = t4(this.namespace + (typeof s5 > "u" ? ":" : s5) + e6);
      return n6.log = this.log, n6;
    }
    function n5(e6, t5) {
      let s5 = 0, n6 = 0, r5 = -1, o5 = 0;
      for (; s5 < e6.length; ) if (n6 < t5.length && (t5[n6] === e6[s5] || "*" === t5[n6])) "*" === t5[n6] ? (r5 = n6, o5 = s5, n6++) : (s5++, n6++);
      else {
        if (-1 === r5) return false;
        n6 = r5 + 1, o5++, s5 = o5;
      }
      for (; n6 < t5.length && "*" === t5[n6]; ) n6++;
      return n6 === t5.length;
    }
    return t4.debug = t4, t4.default = t4, t4.coerce = function(e6) {
      return e6 instanceof Error ? e6.stack || e6.message : e6;
    }, t4.disable = function() {
      const e6 = [...t4.names, ...t4.skips.map((e7) => "-" + e7)].join(",");
      return t4.enable(""), e6;
    }, t4.enable = function(e6) {
      t4.save(e6), t4.namespaces = e6, t4.names = [], t4.skips = [];
      const s5 = ("string" == typeof e6 ? e6 : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const e7 of s5) "-" === e7[0] ? t4.skips.push(e7.slice(1)) : t4.names.push(e7);
    }, t4.enabled = function(e6) {
      for (const s5 of t4.skips) if (n5(e6, s5)) return false;
      for (const s5 of t4.names) if (n5(e6, s5)) return true;
      return false;
    }, t4.humanize = (function() {
      if (g2) return h2;
      g2 = 1;
      var e6 = 1e3, t5 = 60 * e6, s5 = 60 * t5, n6 = 24 * s5, r5 = 7 * n6;
      function o5(e7, t6, s6, n7) {
        var r6 = t6 >= 1.5 * s6;
        return Math.round(e7 / s6) + " " + n7 + (r6 ? "s" : "");
      }
      return h2 = function(i2, c4) {
        c4 = c4 || {};
        var a3, u4, p3 = typeof i2;
        if ("string" === p3 && i2.length > 0) return (function(o6) {
          if (!((o6 = String(o6)).length > 100)) {
            var i3 = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(o6);
            if (i3) {
              var c5 = parseFloat(i3[1]);
              switch ((i3[2] || "ms").toLowerCase()) {
                case "years":
                case "year":
                case "yrs":
                case "yr":
                case "y":
                  return 315576e5 * c5;
                case "weeks":
                case "week":
                case "w":
                  return c5 * r5;
                case "days":
                case "day":
                case "d":
                  return c5 * n6;
                case "hours":
                case "hour":
                case "hrs":
                case "hr":
                case "h":
                  return c5 * s5;
                case "minutes":
                case "minute":
                case "mins":
                case "min":
                case "m":
                  return c5 * t5;
                case "seconds":
                case "second":
                case "secs":
                case "sec":
                case "s":
                  return c5 * e6;
                case "milliseconds":
                case "millisecond":
                case "msecs":
                case "msec":
                case "ms":
                  return c5;
                default:
                  return;
              }
            }
          }
        })(i2);
        if ("number" === p3 && isFinite(i2)) return c4.long ? (a3 = i2, (u4 = Math.abs(a3)) >= n6 ? o5(a3, u4, n6, "day") : u4 >= s5 ? o5(a3, u4, s5, "hour") : u4 >= t5 ? o5(a3, u4, t5, "minute") : u4 >= e6 ? o5(a3, u4, e6, "second") : a3 + " ms") : (function(r6) {
          var o6 = Math.abs(r6);
          return o6 >= n6 ? Math.round(r6 / n6) + "d" : o6 >= s5 ? Math.round(r6 / s5) + "h" : o6 >= t5 ? Math.round(r6 / t5) + "m" : o6 >= e6 ? Math.round(r6 / e6) + "s" : r6 + "ms";
        })(i2);
        throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(i2));
      };
    })(), t4.destroy = function() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }, Object.keys(e5).forEach((s5) => {
      t4[s5] = e5[s5];
    }), t4.names = [], t4.skips = [], t4.formatters = {}, t4.selectColor = function(e6) {
      let s5 = 0;
      for (let t5 = 0; t5 < e6.length; t5++) s5 = (s5 << 5) - s5 + e6.charCodeAt(t5), s5 |= 0;
      return t4.colors[Math.abs(s5) % t4.colors.length];
    }, t4.enable(t4.load()), t4;
  });
}
var v2;
var j;
var x2;
var E;
var k = { exports: {} };
var R2 = /* @__PURE__ */ c2((E || (E = 1, typeof process > "u" || "renderer" === process.type || true === process.browser || process.__nwjs ? w2.exports = (y2 || (y2 = 1, (function(e5, t4) {
  t4.formatArgs = function(t5) {
    if (t5[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + t5[0] + (this.useColors ? "%c " : " ") + "+" + e5.exports.humanize(this.diff), !this.useColors) return;
    const s5 = "color: " + this.color;
    t5.splice(1, 0, s5, "color: inherit");
    let n5 = 0, r5 = 0;
    t5[0].replace(/%[a-zA-Z%]/g, (e6) => {
      "%%" !== e6 && (n5++, "%c" === e6 && (r5 = n5));
    }), t5.splice(r5, 0, s5);
  }, t4.save = function(e6) {
    try {
      e6 ? t4.storage.setItem("debug", e6) : t4.storage.removeItem("debug");
    } catch {
    }
  }, t4.load = function() {
    let e6;
    try {
      e6 = t4.storage.getItem("debug") || t4.storage.getItem("DEBUG");
    } catch {
    }
    return !e6 && typeof process < "u" && "env" in process && (e6 = process.env.DEBUG), e6;
  }, t4.useColors = function() {
    if (typeof window < "u" && window.process && ("renderer" === window.process.type || window.process.__nwjs)) return true;
    if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) return false;
    let e6;
    return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator < "u" && navigator.userAgent && (e6 = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(e6[1], 10) >= 31 || typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }, t4.storage = (function() {
    try {
      return localStorage;
    } catch {
    }
  })(), t4.destroy = /* @__PURE__ */ (() => {
    let e6 = false;
    return () => {
      e6 || (e6 = true, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
    };
  })(), t4.colors = ["#0000CC", "#0000FF", "#0033CC", "#0033FF", "#0066CC", "#0066FF", "#0099CC", "#0099FF", "#00CC00", "#00CC33", "#00CC66", "#00CC99", "#00CCCC", "#00CCFF", "#3300CC", "#3300FF", "#3333CC", "#3333FF", "#3366CC", "#3366FF", "#3399CC", "#3399FF", "#33CC00", "#33CC33", "#33CC66", "#33CC99", "#33CCCC", "#33CCFF", "#6600CC", "#6600FF", "#6633CC", "#6633FF", "#66CC00", "#66CC33", "#9900CC", "#9900FF", "#9933CC", "#9933FF", "#99CC00", "#99CC33", "#CC0000", "#CC0033", "#CC0066", "#CC0099", "#CC00CC", "#CC00FF", "#CC3300", "#CC3333", "#CC3366", "#CC3399", "#CC33CC", "#CC33FF", "#CC6600", "#CC6633", "#CC9900", "#CC9933", "#CCCC00", "#CCCC33", "#FF0000", "#FF0033", "#FF0066", "#FF0099", "#FF00CC", "#FF00FF", "#FF3300", "#FF3333", "#FF3366", "#FF3399", "#FF33CC", "#FF33FF", "#FF6600", "#FF6633", "#FF9900", "#FF9933", "#FFCC00", "#FFCC33"], t4.log = console.debug || console.log || (() => {
  }), e5.exports = F()(t4);
  const { formatters: s4 } = e5.exports;
  s4.j = function(e6) {
    try {
      return JSON.stringify(e6);
    } catch (e7) {
      return "[UnexpectedJSONParseError]: " + e7.message;
    }
  };
})(O2, O2.exports)), O2.exports) : w2.exports = (x2 || (x2 = 1, (function(e5, t4) {
  const s4 = import_tty.default, o5 = import_util.default;
  t4.init = function(e6) {
    e6.inspectOpts = {};
    const s5 = Object.keys(t4.inspectOpts);
    for (let n5 = 0; n5 < s5.length; n5++) e6.inspectOpts[s5[n5]] = t4.inspectOpts[s5[n5]];
  }, t4.log = function(...e6) {
    return process.stderr.write(o5.formatWithOptions(t4.inspectOpts, ...e6) + "\n");
  }, t4.formatArgs = function(s5) {
    const { namespace: n5, useColors: r5 } = this;
    if (r5) {
      const t5 = this.color, r6 = "\x1B[3" + (t5 < 8 ? t5 : "8;5;" + t5), o6 = `  ${r6};1m${n5} \x1B[0m`;
      s5[0] = o6 + s5[0].split("\n").join("\n" + o6), s5.push(r6 + "m+" + e5.exports.humanize(this.diff) + "\x1B[0m");
    } else s5[0] = (t4.inspectOpts.hideDate ? "" : /* @__PURE__ */ (/* @__PURE__ */ new Date()).toISOString() + " ") + n5 + " " + s5[0];
  }, t4.save = function(e6) {
    e6 ? process.env.DEBUG = e6 : delete process.env.DEBUG;
  }, t4.load = function() {
    return process.env.DEBUG;
  }, t4.useColors = function() {
    return "colors" in t4.inspectOpts ? !!t4.inspectOpts.colors : s4.isatty(process.stderr.fd);
  }, t4.destroy = o5.deprecate(() => {
  }, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."), t4.colors = [6, 2, 3, 4, 5, 1];
  try {
    const e6 = (function() {
      if (j) return v2;
      j = 1;
      const e7 = (function() {
        const e8 = /(Chrome|Chromium)\/(?<chromeVersion>\d+)\./.exec(navigator.userAgent);
        if (e8) return Number.parseInt(e8.groups.chromeVersion, 10);
      })() >= 69 && { level: 1, hasBasic: true, has256: false, has16m: false };
      return v2 = { stdout: e7, stderr: e7 };
    })();
    e6 && (e6.stderr || e6).level >= 2 && (t4.colors = [20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113, 128, 129, 134, 135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221]);
  } catch {
  }
  t4.inspectOpts = Object.keys(process.env).filter((e6) => /^debug_/i.test(e6)).reduce((e6, t5) => {
    const s5 = t5.substring(6).toLowerCase().replace(/_([a-z])/g, (e7, t6) => t6.toUpperCase());
    let n5 = process.env[t5];
    return n5 = !!/^(yes|on|true|enabled)$/i.test(n5) || !/^(no|off|false|disabled)$/i.test(n5) && ("null" === n5 ? null : Number(n5)), e6[s5] = n5, e6;
  }, {}), e5.exports = F()(t4);
  const { formatters: i2 } = e5.exports;
  i2.o = function(e6) {
    return this.inspectOpts.colors = this.useColors, o5.inspect(e6, this.inspectOpts).split("\n").map((e7) => e7.trim()).join(" ");
  }, i2.O = function(e6) {
    return this.inspectOpts.colors = this.useColors, o5.inspect(e6, this.inspectOpts);
  };
})(k, k.exports)), k.exports)), w2.exports));
var A = ["cookie", "authorization"];
var q = Object.prototype.hasOwnProperty;
function S(e5 = {}) {
  const t4 = e5.verbose, s4 = e5.namespace || "get-it", n5 = R2(s4), r5 = e5.log || n5, o5 = r5 === n5 && !R2.enabled(s4);
  let i2 = 0;
  return { processOptions: (e6) => (e6.debug = r5, e6.requestId = e6.requestId || ++i2, e6), onRequest: (s5) => {
    if (o5 || !s5) return s5;
    const n6 = s5.options;
    if (r5("[%s] HTTP %s %s", n6.requestId, n6.method, n6.url), t4 && n6.body && "string" == typeof n6.body && r5("[%s] Request body: %s", n6.requestId, n6.body), t4 && n6.headers) {
      const t5 = false === e5.redactSensitiveHeaders ? n6.headers : ((e6, t6) => {
        const s6 = {};
        for (const n7 in e6) q.call(e6, n7) && (s6[n7] = t6.indexOf(n7.toLowerCase()) > -1 ? "<redacted>" : e6[n7]);
        return s6;
      })(n6.headers, A);
      r5("[%s] Request headers: %s", n6.requestId, JSON.stringify(t5, null, 2));
    }
    return s5;
  }, onResponse: (e6, s5) => {
    if (o5 || !e6) return e6;
    const n6 = s5.options.requestId;
    return r5("[%s] Response code: %s %s", n6, e6.statusCode, e6.statusMessage), t4 && e6.body && r5("[%s] Response body: %s", n6, (function(e7) {
      return -1 !== (e7.headers["content-type"] || "").toLowerCase().indexOf("application/json") ? (function(e8) {
        try {
          const t5 = "string" == typeof e8 ? JSON.parse(e8) : e8;
          return JSON.stringify(t5, null, 2);
        } catch {
          return e8;
        }
      })(e7.body) : e7.body;
    })(e6)), e6;
  }, onError: (e6, t5) => {
    const s5 = t5.options.requestId;
    return e6 ? (r5("[%s] ERROR: %s", s5, e6.message), e6) : (r5("[%s] Error encountered, but handled by an earlier middleware", s5), e6);
  } };
}
function I(e5, t4 = {}) {
  return { processOptions: (s4) => {
    const n5 = s4.headers || {};
    return s4.headers = t4.override ? Object.assign({}, n5, e5) : Object.assign({}, e5, n5), s4;
  } };
}
var T2 = typeof Buffer > "u" ? () => false : (e5) => Buffer.isBuffer(e5);
function M(e5) {
  return "[object Object]" === Object.prototype.toString.call(e5);
}
function P(e5) {
  if (false === M(e5)) return false;
  const t4 = e5.constructor;
  if (void 0 === t4) return true;
  const s4 = t4.prototype;
  return !(false === M(s4) || false === s4.hasOwnProperty("isPrototypeOf"));
}
var z = ["boolean", "string", "number"];
function B() {
  return { processOptions: (e5) => {
    const t4 = e5.body;
    return !t4 || "function" == typeof t4.pipe || T2(t4) || -1 === z.indexOf(typeof t4) && !Array.isArray(t4) && !P(t4) ? e5 : Object.assign({}, e5, { body: JSON.stringify(e5.body), headers: Object.assign({}, e5.headers, { "Content-Type": "application/json" }) });
  } };
}
function D(e5) {
  return { onResponse: (s4) => {
    const n5 = s4.headers["content-type"] || "", r5 = e5 && e5.force || -1 !== n5.indexOf("application/json");
    return s4.body && n5 && r5 ? Object.assign({}, s4, { body: t4(s4.body) }) : s4;
  }, processOptions: (e6) => Object.assign({}, e6, { headers: Object.assign({ Accept: "application/json" }, e6.headers) }) };
  function t4(e6) {
    try {
      return JSON.parse(e6);
    } catch (e7) {
      throw e7.message = `Failed to parsed response body as JSON: ${e7.message}`, e7;
    }
  }
}
var J = {};
typeof globalThis < "u" ? J = globalThis : typeof window < "u" ? J = window : typeof global < "u" ? J = global : typeof self < "u" && (J = self);
var U = J;
function G(e5 = {}) {
  const t4 = e5.implementation || U.Observable;
  if (!t4) throw new Error("`Observable` is not available in global scope, and no implementation was passed");
  return { onReturn: (e6, s4) => new t4((t5) => (e6.error.subscribe((e7) => t5.error(e7)), e6.progress.subscribe((e7) => t5.next(Object.assign({ type: "progress" }, e7))), e6.response.subscribe((e7) => {
    t5.next(Object.assign({ type: "response" }, e7)), t5.complete();
  }), e6.request.publish(s4), () => e6.abort.publish())) };
}
function H(e5) {
  return (t4) => ({ stage: e5, percent: t4.percentage, total: t4.length, loaded: t4.transferred, lengthComputable: !(0 === t4.length && 0 === t4.percentage) });
}
function V() {
  let e5 = false;
  const t4 = H("download"), s4 = H("upload");
  return { onHeaders: (e6, s5) => {
    const n5 = f({ time: 32 });
    return n5.on("progress", (e7) => s5.context.channels.progress.publish(t4(e7))), e6.pipe(n5);
  }, onRequest: (t5) => {
    t5.progress && t5.progress.on("progress", (n5) => {
      e5 = true, t5.context.channels.progress.publish(s4(n5));
    });
  }, onResponse: (t5, n5) => (!e5 && typeof n5.options.body < "u" && n5.channels.progress.publish(s4({ length: 0, transferred: 0, percentage: 100 })), t5) };
}
var W = (e5 = {}) => {
  const t4 = e5.implementation || Promise;
  if (!t4) throw new Error("`Promise` is not available in global scope, and no implementation was passed");
  return { onReturn: (s4, n5) => new t4((t5, r5) => {
    const o5 = n5.options.cancelToken;
    o5 && o5.promise.then((e6) => {
      s4.abort.publish(e6), r5(e6);
    }), s4.error.subscribe(r5), s4.response.subscribe((s5) => {
      t5(e5.onlyBody ? s5.body : s5);
    }), setTimeout(() => {
      try {
        s4.request.publish(n5);
      } catch (e6) {
        r5(e6);
      }
    }, 0);
  }) };
};
var Z = class {
  __CANCEL__ = true;
  message;
  constructor(e5) {
    this.message = e5;
  }
  toString() {
    return "Cancel" + (this.message ? `: ${this.message}` : "");
  }
};
var K = class _K {
  promise;
  reason;
  constructor(e5) {
    if ("function" != typeof e5) throw new TypeError("executor must be a function.");
    let t4 = null;
    this.promise = new Promise((e6) => {
      t4 = e6;
    }), e5((e6) => {
      this.reason || (this.reason = new Z(e6), t4(this.reason));
    });
  }
  static source = () => {
    let e5;
    return { token: new _K((t4) => {
      e5 = t4;
    }), cancel: e5 };
  };
};
W.Cancel = Z, W.CancelToken = K, W.isCancel = (e5) => !(!e5 || !e5?.__CANCEL__);
var X = (e5, t4, s4) => !("GET" !== s4.method && "HEAD" !== s4.method || e5.response && e5.response.statusCode) && (0, import_is_retry_allowed.default)(e5);
function Y(e5) {
  return 100 * Math.pow(2, e5) + 100 * Math.random();
}
var ee = (e5 = {}) => ((e6) => {
  const t4 = e6.maxRetries || 5, s4 = e6.retryDelay || Y, n5 = e6.shouldRetry;
  return { onError: (e7, r5) => {
    const o5 = r5.options, i2 = o5.maxRetries || t4, c4 = o5.retryDelay || s4, a3 = o5.shouldRetry || n5, u4 = o5.attemptNumber || 0;
    if (null !== (p3 = o5.body) && "object" == typeof p3 && "function" == typeof p3.pipe || !a3(e7, u4, o5) || u4 >= i2) return e7;
    var p3;
    const l3 = Object.assign({}, r5, { options: Object.assign({}, o5, { attemptNumber: u4 + 1 }) });
    return setTimeout(() => r5.channels.request.publish(l3), c4(u4)), null;
  } };
})({ shouldRetry: X, ...e5 });
ee.shouldRetry = X;
var ne = (re = l2, function(e5 = {}) {
  const { maxRetries: t4 = 3, ms: s4 = 1e3, maxFree: n5 = 256 } = e5, { finalizeOptions: r5 } = re({ keepAlive: true, keepAliveMsecs: s4, maxFreeSockets: n5 });
  return { finalizeOptions: r5, onError: (e6, s5) => {
    if (("GET" === s5.options.method || "POST" === s5.options.method) && e6 instanceof T && "ECONNRESET" === e6.code && e6.request.reusedSocket) {
      const e7 = s5.options.attemptNumber || 0;
      if (e7 < t4) {
        const t5 = Object.assign({}, s5, { options: Object.assign({}, s5.options, { attemptNumber: e7 + 1 }) });
        return setImmediate(() => s5.channels.request.publish(t5)), null;
      }
    }
    return e6;
  } };
});
var re;

// ../node_modules/.pnpm/@sanity+client@7.10.0/node_modules/@sanity/client/dist/index.js
var import_rxjs = __toESM(require_cjs(), 1);

// ../node_modules/.pnpm/@sanity+client@7.10.0/node_modules/@sanity/client/dist/_chunks-es/isRecord.js
function isRecord(value) {
  return typeof value == "object" && value !== null && !Array.isArray(value);
}

// ../node_modules/.pnpm/@sanity+client@7.10.0/node_modules/@sanity/client/dist/index.js
init_stegaClean();
var import_operators = __toESM(require_operators(), 1);

// ../node_modules/.pnpm/@sanity+client@7.10.0/node_modules/@sanity/client/dist/_chunks-es/resolveEditInfo.js
var DRAFTS_FOLDER = "drafts";
var VERSION_FOLDER = "versions";
var PATH_SEPARATOR = ".";
var DRAFTS_PREFIX = `${DRAFTS_FOLDER}${PATH_SEPARATOR}`;
var VERSION_PREFIX = `${VERSION_FOLDER}${PATH_SEPARATOR}`;
function isDraftId(id) {
  return id.startsWith(DRAFTS_PREFIX);
}
function isVersionId(id) {
  return id.startsWith(VERSION_PREFIX);
}
function getDraftId(id) {
  if (isVersionId(id)) {
    const publishedId = getPublishedId(id);
    return DRAFTS_PREFIX + publishedId;
  }
  return isDraftId(id) ? id : DRAFTS_PREFIX + id;
}
function getVersionId(id, version2) {
  if (version2 === "drafts" || version2 === "published")
    throw new Error('Version can not be "published" or "drafts"');
  return `${VERSION_PREFIX}${version2}${PATH_SEPARATOR}${getPublishedId(id)}`;
}
function getVersionFromId(id) {
  if (!isVersionId(id)) return;
  const [_versionPrefix, versionId, ..._publishedId] = id.split(PATH_SEPARATOR);
  return versionId;
}
function getPublishedId(id) {
  return isVersionId(id) ? id.split(PATH_SEPARATOR).slice(2).join(PATH_SEPARATOR) : isDraftId(id) ? id.slice(DRAFTS_PREFIX.length) : id;
}

// ../node_modules/.pnpm/@sanity+client@7.10.0/node_modules/@sanity/client/dist/_chunks-es/config.js
var BASE_URL = "https://www.sanity.io/help/";
function generateHelpUrl(slug) {
  return BASE_URL + slug;
}
var VALID_ASSET_TYPES = ["image", "file"];
var VALID_INSERT_LOCATIONS = ["before", "after", "replace"];
var dataset = (name2) => {
  if (!/^(~[a-z0-9]{1}[-\w]{0,63}|[a-z0-9]{1}[-\w]{0,63})$/.test(name2))
    throw new Error(
      "Datasets can only contain lowercase characters, numbers, underscores and dashes, and start with tilde, and be maximum 64 characters"
    );
};
var projectId = (id) => {
  if (!/^[-a-z0-9]+$/i.test(id))
    throw new Error("`projectId` can only contain only a-z, 0-9 and dashes");
};
var validateAssetType = (type) => {
  if (VALID_ASSET_TYPES.indexOf(type) === -1)
    throw new Error(`Invalid asset type: ${type}. Must be one of ${VALID_ASSET_TYPES.join(", ")}`);
};
var validateObject = (op, val) => {
  if (val === null || typeof val != "object" || Array.isArray(val))
    throw new Error(`${op}() takes an object of properties`);
};
var validateDocumentId = (op, id) => {
  if (typeof id != "string" || !/^[a-z0-9_][a-z0-9_.-]{0,127}$/i.test(id) || id.includes(".."))
    throw new Error(`${op}(): "${id}" is not a valid document ID`);
};
var requireDocumentId = (op, doc) => {
  if (!doc._id)
    throw new Error(`${op}() requires that the document contains an ID ("_id" property)`);
  validateDocumentId(op, doc._id);
};
var validateDocumentType = (op, type) => {
  if (typeof type != "string")
    throw new Error(`\`${op}()\`: \`${type}\` is not a valid document type`);
};
var requireDocumentType = (op, doc) => {
  if (!doc._type)
    throw new Error(`\`${op}()\` requires that the document contains a type (\`_type\` property)`);
  validateDocumentType(op, doc._type);
};
var validateVersionIdMatch = (builtVersionId, document2) => {
  if (document2._id && document2._id !== builtVersionId)
    throw new Error(
      `The provided document ID (\`${document2._id}\`) does not match the generated version ID (\`${builtVersionId}\`)`
    );
};
var validateInsert = (at, selector, items) => {
  const signature = "insert(at, selector, items)";
  if (VALID_INSERT_LOCATIONS.indexOf(at) === -1) {
    const valid = VALID_INSERT_LOCATIONS.map((loc) => `"${loc}"`).join(", ");
    throw new Error(`${signature} takes an "at"-argument which is one of: ${valid}`);
  }
  if (typeof selector != "string")
    throw new Error(`${signature} takes a "selector"-argument which must be a string`);
  if (!Array.isArray(items))
    throw new Error(`${signature} takes an "items"-argument which must be an array`);
};
var hasDataset = (config) => {
  if (!config.dataset)
    throw new Error("`dataset` must be provided to perform queries");
  return config.dataset || "";
};
var requestTag = (tag) => {
  if (typeof tag != "string" || !/^[a-z0-9._-]{1,75}$/i.test(tag))
    throw new Error(
      "Tag can only contain alphanumeric characters, underscores, dashes and dots, and be between one and 75 characters long."
    );
  return tag;
};
var resourceConfig = (config) => {
  if (!config["~experimental_resource"])
    throw new Error("`resource` must be provided to perform resource queries");
  const { type, id } = config["~experimental_resource"];
  switch (type) {
    case "dataset": {
      if (id.split(".").length !== 2)
        throw new Error('Dataset resource ID must be in the format "project.dataset"');
      return;
    }
    case "dashboard":
    case "media-library":
    case "canvas":
      return;
    default:
      throw new Error(`Unsupported resource type: ${type.toString()}`);
  }
};
var resourceGuard = (service, config) => {
  if (config["~experimental_resource"])
    throw new Error(`\`${service}\` does not support resource-based operations`);
};
function once(fn) {
  let didCall = false, returnValue;
  return (...args) => (didCall || (returnValue = fn(...args), didCall = true), returnValue);
}
var createWarningPrinter = (message) => (
  // eslint-disable-next-line no-console
  once((...args) => console.warn(message.join(" "), ...args))
);
var printCdnAndWithCredentialsWarning = createWarningPrinter([
  "Because you set `withCredentials` to true, we will override your `useCdn`",
  "setting to be false since (cookie-based) credentials are never set on the CDN"
]);
var printCdnWarning = createWarningPrinter([
  "Since you haven't set a value for `useCdn`, we will deliver content using our",
  "global, edge-cached API-CDN. If you wish to have content delivered faster, set",
  "`useCdn: false` to use the Live API. Note: You may incur higher costs using the live API."
]);
var printCdnPreviewDraftsWarning = createWarningPrinter([
  "The Sanity client is configured with the `perspective` set to `drafts` or `previewDrafts`, which doesn't support the API-CDN.",
  "The Live API will be used instead. Set `useCdn: false` in your configuration to hide this warning."
]);
var printPreviewDraftsDeprecationWarning = createWarningPrinter([
  "The `previewDrafts` perspective has been renamed to  `drafts` and will be removed in a future API version"
]);
var printBrowserTokenWarning = createWarningPrinter([
  "You have configured Sanity client to use a token in the browser. This may cause unintentional security issues.",
  `See ${generateHelpUrl(
    "js-client-browser-token"
  )} for more information and how to hide this warning.`
]);
var printCredentialedTokenWarning = createWarningPrinter([
  "You have configured Sanity client to use a token, but also provided `withCredentials: true`.",
  "This is no longer supported - only token will be used - remove `withCredentials: true`."
]);
var printNoApiVersionSpecifiedWarning = createWarningPrinter([
  "Using the Sanity client without specifying an API version is deprecated.",
  `See ${generateHelpUrl("js-client-api-version")}`
]);
var printNoDefaultExport = createWarningPrinter([
  "The default export of @sanity/client has been deprecated. Use the named export `createClient` instead."
]);
var printCreateVersionWithBaseIdWarning = createWarningPrinter([
  "You have called `createVersion()` with a defined `document`. The recommended approach is to provide a `baseId` and `releaseId` instead."
]);
var defaultCdnHost = "apicdn.sanity.io";
var defaultConfig = {
  apiHost: "https://api.sanity.io",
  apiVersion: "1",
  useProjectHostname: true,
  stega: { enabled: false }
};
var LOCALHOSTS = ["localhost", "127.0.0.1", "0.0.0.0"];
var isLocal = (host) => LOCALHOSTS.indexOf(host) !== -1;
function validateApiVersion(apiVersion) {
  if (apiVersion === "1" || apiVersion === "X")
    return;
  const apiDate = new Date(apiVersion);
  if (!(/^\d{4}-\d{2}-\d{2}$/.test(apiVersion) && apiDate instanceof Date && apiDate.getTime() > 0))
    throw new Error("Invalid API version string, expected `1` or date in format `YYYY-MM-DD`");
}
function validateApiPerspective(perspective) {
  if (Array.isArray(perspective) && perspective.length > 1 && perspective.includes("raw"))
    throw new TypeError(
      'Invalid API perspective value: "raw". The raw-perspective can not be combined with other perspectives'
    );
}
var initConfig = (config, prevConfig) => {
  const specifiedConfig = {
    ...prevConfig,
    ...config,
    stega: {
      ...typeof prevConfig.stega == "boolean" ? { enabled: prevConfig.stega } : prevConfig.stega || defaultConfig.stega,
      ...typeof config.stega == "boolean" ? { enabled: config.stega } : config.stega || {}
    }
  };
  specifiedConfig.apiVersion || printNoApiVersionSpecifiedWarning();
  const newConfig = {
    ...defaultConfig,
    ...specifiedConfig
  }, projectBased = newConfig.useProjectHostname && !newConfig["~experimental_resource"];
  if (typeof Promise > "u") {
    const helpUrl = generateHelpUrl("js-client-promise-polyfill");
    throw new Error(`No native Promise-implementation found, polyfill needed - see ${helpUrl}`);
  }
  if (projectBased && !newConfig.projectId)
    throw new Error("Configuration must contain `projectId`");
  if (newConfig["~experimental_resource"] && resourceConfig(newConfig), typeof newConfig.perspective < "u" && validateApiPerspective(newConfig.perspective), "encodeSourceMap" in newConfig)
    throw new Error(
      "It looks like you're using options meant for '@sanity/preview-kit/client'. 'encodeSourceMap' is not supported in '@sanity/client'. Did you mean 'stega.enabled'?"
    );
  if ("encodeSourceMapAtPath" in newConfig)
    throw new Error(
      "It looks like you're using options meant for '@sanity/preview-kit/client'. 'encodeSourceMapAtPath' is not supported in '@sanity/client'. Did you mean 'stega.filter'?"
    );
  if (typeof newConfig.stega.enabled != "boolean")
    throw new Error(`stega.enabled must be a boolean, received ${newConfig.stega.enabled}`);
  if (newConfig.stega.enabled && newConfig.stega.studioUrl === void 0)
    throw new Error("stega.studioUrl must be defined when stega.enabled is true");
  if (newConfig.stega.enabled && typeof newConfig.stega.studioUrl != "string" && typeof newConfig.stega.studioUrl != "function")
    throw new Error(
      `stega.studioUrl must be a string or a function, received ${newConfig.stega.studioUrl}`
    );
  const isBrowser = typeof window < "u" && window.location && window.location.hostname, isLocalhost = isBrowser && isLocal(window.location.hostname), hasToken = !!newConfig.token;
  newConfig.withCredentials && hasToken && (printCredentialedTokenWarning(), newConfig.withCredentials = false), isBrowser && isLocalhost && hasToken && newConfig.ignoreBrowserTokenWarning !== true ? printBrowserTokenWarning() : typeof newConfig.useCdn > "u" && printCdnWarning(), projectBased && projectId(newConfig.projectId), newConfig.dataset && dataset(newConfig.dataset), "requestTagPrefix" in newConfig && (newConfig.requestTagPrefix = newConfig.requestTagPrefix ? requestTag(newConfig.requestTagPrefix).replace(/\.+$/, "") : void 0), newConfig.apiVersion = `${newConfig.apiVersion}`.replace(/^v/, ""), newConfig.isDefaultApi = newConfig.apiHost === defaultConfig.apiHost, newConfig.useCdn === true && newConfig.withCredentials && printCdnAndWithCredentialsWarning(), newConfig.useCdn = newConfig.useCdn !== false && !newConfig.withCredentials, validateApiVersion(newConfig.apiVersion);
  const hostParts = newConfig.apiHost.split("://", 2), protocol = hostParts[0], host = hostParts[1], cdnHost = newConfig.isDefaultApi ? defaultCdnHost : host;
  return projectBased ? (newConfig.url = `${protocol}://${newConfig.projectId}.${host}/v${newConfig.apiVersion}`, newConfig.cdnUrl = `${protocol}://${newConfig.projectId}.${cdnHost}/v${newConfig.apiVersion}`) : (newConfig.url = `${newConfig.apiHost}/v${newConfig.apiVersion}`, newConfig.cdnUrl = newConfig.url), newConfig;
};

// ../node_modules/.pnpm/nanoid@3.3.11/node_modules/nanoid/index.js
var import_crypto = __toESM(require("crypto"), 1);
var POOL_SIZE_MULTIPLIER = 128;
var pool;
var poolOffset;
var fillPool = (bytes) => {
  if (!pool || pool.length < bytes) {
    pool = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER);
    import_crypto.default.randomFillSync(pool);
    poolOffset = 0;
  } else if (poolOffset + bytes > pool.length) {
    import_crypto.default.randomFillSync(pool);
    poolOffset = 0;
  }
  poolOffset += bytes;
};
var random = (bytes) => {
  fillPool(bytes |= 0);
  return pool.subarray(poolOffset - bytes, poolOffset);
};
var customRandom = (alphabet, defaultSize, getRandom) => {
  let mask = (2 << 31 - Math.clz32(alphabet.length - 1 | 1)) - 1;
  let step = Math.ceil(1.6 * mask * defaultSize / alphabet.length);
  return (size = defaultSize) => {
    let id = "";
    while (true) {
      let bytes = getRandom(step);
      let i2 = step;
      while (i2--) {
        id += alphabet[bytes[i2] & mask] || "";
        if (id.length === size) return id;
      }
    }
  };
};
var customAlphabet = (alphabet, size = 21) => customRandom(alphabet, size, random);

// ../node_modules/.pnpm/@sanity+client@7.10.0/node_modules/@sanity/client/dist/index.js
var NEWLINE = /\r\n|[\n\r\u2028\u2029]/;
function codeFrame(query, location2, message) {
  const lines = query.split(NEWLINE), loc = {
    start: columnToLine(location2.start, lines),
    end: location2.end ? columnToLine(location2.end, lines) : void 0
  }, { start, end, markerLines } = getMarkerLines(loc, lines), numberMaxWidth = `${end}`.length;
  return query.split(NEWLINE, end).slice(start, end).map((line, index) => {
    const number = start + 1 + index, gutter = ` ${` ${number}`.slice(-numberMaxWidth)} |`, hasMarker = markerLines[number], lastMarkerLine = !markerLines[number + 1];
    if (!hasMarker)
      return ` ${gutter}${line.length > 0 ? ` ${line}` : ""}`;
    let markerLine = "";
    if (Array.isArray(hasMarker)) {
      const markerSpacing = line.slice(0, Math.max(hasMarker[0] - 1, 0)).replace(/[^\t]/g, " "), numberOfMarkers = hasMarker[1] || 1;
      markerLine = [
        `
 `,
        gutter.replace(/\d/g, " "),
        " ",
        markerSpacing,
        "^".repeat(numberOfMarkers)
      ].join(""), lastMarkerLine && message && (markerLine += " " + message);
    }
    return [">", gutter, line.length > 0 ? ` ${line}` : "", markerLine].join("");
  }).join(`
`);
}
function getMarkerLines(loc, source) {
  const startLoc = { ...loc.start }, endLoc = { ...startLoc, ...loc.end }, linesAbove = 2, linesBelow = 3, startLine = startLoc.line ?? -1, startColumn = startLoc.column ?? 0, endLine = endLoc.line, endColumn = endLoc.column;
  let start = Math.max(startLine - (linesAbove + 1), 0), end = Math.min(source.length, endLine + linesBelow);
  startLine === -1 && (start = 0), endLine === -1 && (end = source.length);
  const lineDiff = endLine - startLine, markerLines = {};
  if (lineDiff)
    for (let i2 = 0; i2 <= lineDiff; i2++) {
      const lineNumber = i2 + startLine;
      if (!startColumn)
        markerLines[lineNumber] = true;
      else if (i2 === 0) {
        const sourceLength = source[lineNumber - 1].length;
        markerLines[lineNumber] = [startColumn, sourceLength - startColumn + 1];
      } else if (i2 === lineDiff)
        markerLines[lineNumber] = [0, endColumn];
      else {
        const sourceLength = source[lineNumber - i2].length;
        markerLines[lineNumber] = [0, sourceLength];
      }
    }
  else
    startColumn === endColumn ? startColumn ? markerLines[startLine] = [startColumn, 0] : markerLines[startLine] = true : markerLines[startLine] = [startColumn, endColumn - startColumn];
  return { start, end, markerLines };
}
function columnToLine(column, lines) {
  let offset = 0;
  for (let i2 = 0; i2 < lines.length; i2++) {
    const lineLength = lines[i2].length + 1;
    if (offset + lineLength > column)
      return {
        line: i2 + 1,
        // 1-based line
        column: column - offset
        // 0-based column
      };
    offset += lineLength;
  }
  return {
    line: lines.length,
    column: lines[lines.length - 1]?.length ?? 0
  };
}
var MAX_ITEMS_IN_ERROR_MESSAGE = 5;
var ClientError = class extends Error {
  response;
  statusCode = 400;
  responseBody;
  details;
  constructor(res, context) {
    const props = extractErrorProps(res, context);
    super(props.message), Object.assign(this, props);
  }
};
var ServerError = class extends Error {
  response;
  statusCode = 500;
  responseBody;
  details;
  constructor(res) {
    const props = extractErrorProps(res);
    super(props.message), Object.assign(this, props);
  }
};
function extractErrorProps(res, context) {
  const body = res.body, props = {
    response: res,
    statusCode: res.statusCode,
    responseBody: stringifyBody(body, res),
    message: "",
    details: void 0
  };
  if (!isRecord(body))
    return props.message = httpErrorMessage(res, body), props;
  const error = body.error;
  if (typeof error == "string" && typeof body.message == "string")
    return props.message = `${error} - ${body.message}`, props;
  if (typeof error != "object" || error === null)
    return typeof error == "string" ? props.message = error : typeof body.message == "string" ? props.message = body.message : props.message = httpErrorMessage(res, body), props;
  if (isMutationError(error) || isActionError(error)) {
    const allItems = error.items || [], items = allItems.slice(0, MAX_ITEMS_IN_ERROR_MESSAGE).map((item) => item.error?.description).filter(Boolean);
    let itemsStr = items.length ? `:
- ${items.join(`
- `)}` : "";
    return allItems.length > MAX_ITEMS_IN_ERROR_MESSAGE && (itemsStr += `
...and ${allItems.length - MAX_ITEMS_IN_ERROR_MESSAGE} more`), props.message = `${error.description}${itemsStr}`, props.details = body.error, props;
  }
  if (isQueryParseError(error)) {
    const tag = context?.options?.query?.tag;
    return props.message = formatQueryParseError(error, tag), props.details = body.error, props;
  }
  return "description" in error && typeof error.description == "string" ? (props.message = error.description, props.details = error, props) : (props.message = httpErrorMessage(res, body), props);
}
function isMutationError(error) {
  return "type" in error && error.type === "mutationError" && "description" in error && typeof error.description == "string";
}
function isActionError(error) {
  return "type" in error && error.type === "actionError" && "description" in error && typeof error.description == "string";
}
function isQueryParseError(error) {
  return isRecord(error) && error.type === "queryParseError" && typeof error.query == "string" && typeof error.start == "number" && typeof error.end == "number";
}
function formatQueryParseError(error, tag) {
  const { query, start, end, description } = error;
  if (!query || typeof start > "u")
    return `GROQ query parse error: ${description}`;
  const withTag = tag ? `

Tag: ${tag}` : "";
  return `GROQ query parse error:
${codeFrame(query, { start, end }, description)}${withTag}`;
}
function httpErrorMessage(res, body) {
  const details = typeof body == "string" ? ` (${sliceWithEllipsis(body, 100)})` : "", statusMessage = res.statusMessage ? ` ${res.statusMessage}` : "";
  return `${res.method}-request to ${res.url} resulted in HTTP ${res.statusCode}${statusMessage}${details}`;
}
function stringifyBody(body, res) {
  return (res.headers["content-type"] || "").toLowerCase().indexOf("application/json") !== -1 ? JSON.stringify(body, null, 2) : body;
}
function sliceWithEllipsis(str, max) {
  return str.length > max ? `${str.slice(0, max)}\u2026` : str;
}
var CorsOriginError = class extends Error {
  projectId;
  addOriginUrl;
  constructor({ projectId: projectId2 }) {
    super("CorsOriginError"), this.name = "CorsOriginError", this.projectId = projectId2;
    const url = new URL(`https://sanity.io/manage/project/${projectId2}/api`);
    if (typeof location < "u") {
      const { origin } = location;
      url.searchParams.set("cors", "add"), url.searchParams.set("origin", origin), this.addOriginUrl = url, this.message = `The current origin is not allowed to connect to the Live Content API. Add it here: ${url}`;
    } else
      this.message = `The current origin is not allowed to connect to the Live Content API. Change your configuration here: ${url}`;
  }
};
var httpError = {
  onResponse: (res, context) => {
    if (res.statusCode >= 500)
      throw new ServerError(res);
    if (res.statusCode >= 400)
      throw new ClientError(res, context);
    return res;
  }
};
function printWarnings(config = {}) {
  const seen = {}, shouldIgnoreWarning = (message) => config.ignoreWarnings === void 0 ? false : (Array.isArray(config.ignoreWarnings) ? config.ignoreWarnings : [config.ignoreWarnings]).some((pattern) => typeof pattern == "string" ? message.includes(pattern) : pattern instanceof RegExp ? pattern.test(message) : false);
  return {
    onResponse: (res) => {
      const warn = res.headers["x-sanity-warning"], warnings = Array.isArray(warn) ? warn : [warn];
      for (const msg of warnings)
        !msg || seen[msg] || shouldIgnoreWarning(msg) || (seen[msg] = true, console.warn(msg));
      return res;
    }
  };
}
function defineHttpRequest(envMiddleware, config = {}) {
  return o4([
    ee({ shouldRetry }),
    ...envMiddleware,
    printWarnings(config),
    B(),
    D(),
    V(),
    httpError,
    G({ implementation: import_rxjs.Observable })
  ]);
}
function shouldRetry(err, attempt, options) {
  if (options.maxRetries === 0) return false;
  const isSafe = options.method === "GET" || options.method === "HEAD", isQuery2 = (options.uri || options.url).startsWith("/data/query"), isRetriableResponse = err.response && (err.response.statusCode === 429 || err.response.statusCode === 502 || err.response.statusCode === 503);
  return (isSafe || isQuery2) && isRetriableResponse ? true : ee.shouldRetry(err, attempt, options);
}
var ConnectionFailedError = class extends Error {
  name = "ConnectionFailedError";
};
var DisconnectError = class extends Error {
  name = "DisconnectError";
  reason;
  constructor(message, reason, options = {}) {
    super(message, options), this.reason = reason;
  }
};
var ChannelError = class extends Error {
  name = "ChannelError";
  data;
  constructor(message, data) {
    super(message), this.data = data;
  }
};
var MessageError = class extends Error {
  name = "MessageError";
  data;
  constructor(message, data, options = {}) {
    super(message, options), this.data = data;
  }
};
var MessageParseError = class extends Error {
  name = "MessageParseError";
};
var REQUIRED_EVENTS = ["channelError", "disconnect"];
function connectEventSource(initEventSource, events) {
  return (0, import_rxjs.defer)(() => {
    const es = initEventSource();
    return (0, import_rxjs.isObservable)(es) ? es : (0, import_rxjs.of)(es);
  }).pipe((0, import_rxjs.mergeMap)((es) => connectWithESInstance(es, events)));
}
function connectWithESInstance(es, events) {
  return new import_rxjs.Observable((observer) => {
    const emitOpen = events.includes("open"), emitReconnect = events.includes("reconnect");
    function onError(evt) {
      if ("data" in evt) {
        const [parseError, event] = parseEvent(evt);
        observer.error(
          parseError ? new MessageParseError("Unable to parse EventSource error message", { cause: event }) : new MessageError((event?.data).message, event)
        );
        return;
      }
      es.readyState === es.CLOSED ? observer.error(new ConnectionFailedError("EventSource connection failed")) : emitReconnect && observer.next({ type: "reconnect" });
    }
    function onOpen() {
      observer.next({ type: "open" });
    }
    function onMessage(message) {
      const [parseError, event] = parseEvent(message);
      if (parseError) {
        observer.error(
          new MessageParseError("Unable to parse EventSource message", { cause: parseError })
        );
        return;
      }
      if (message.type === "channelError") {
        const tag = new URL(es.url).searchParams.get("tag");
        observer.error(new ChannelError(extractErrorMessage(event?.data, tag), event.data));
        return;
      }
      if (message.type === "disconnect") {
        observer.error(
          new DisconnectError(
            `Server disconnected client: ${event.data?.reason || "unknown error"}`
          )
        );
        return;
      }
      observer.next({
        type: message.type,
        id: message.lastEventId,
        ...event.data ? { data: event.data } : {}
      });
    }
    es.addEventListener("error", onError), emitOpen && es.addEventListener("open", onOpen);
    const cleanedEvents = [.../* @__PURE__ */ new Set([...REQUIRED_EVENTS, ...events])].filter((type) => type !== "error" && type !== "open" && type !== "reconnect");
    return cleanedEvents.forEach((type) => es.addEventListener(type, onMessage)), () => {
      es.removeEventListener("error", onError), emitOpen && es.removeEventListener("open", onOpen), cleanedEvents.forEach((type) => es.removeEventListener(type, onMessage)), es.close();
    };
  });
}
function parseEvent(message) {
  try {
    const data = typeof message.data == "string" && JSON.parse(message.data);
    return [
      null,
      {
        type: message.type,
        id: message.lastEventId,
        ...isEmptyObject(data) ? {} : { data }
      }
    ];
  } catch (err) {
    return [err, null];
  }
}
function extractErrorMessage(err, tag) {
  const error = err.error;
  return error ? isQueryParseError(error) ? formatQueryParseError(error, tag) : error.description ? error.description : typeof error == "string" ? error : JSON.stringify(error, null, 2) : err.message || "Unknown listener error";
}
function isEmptyObject(data) {
  for (const _2 in data)
    return false;
  return true;
}
function getSelection(sel) {
  if (typeof sel == "string")
    return { id: sel };
  if (Array.isArray(sel))
    return { query: "*[_id in $ids]", params: { ids: sel } };
  if (typeof sel == "object" && sel !== null && "query" in sel && typeof sel.query == "string")
    return "params" in sel && typeof sel.params == "object" && sel.params !== null ? { query: sel.query, params: sel.params } : { query: sel.query };
  const selectionOpts = [
    "* Document ID (<docId>)",
    "* Array of document IDs",
    "* Object containing `query`"
  ].join(`
`);
  throw new Error(`Unknown selection - must be one of:

${selectionOpts}`);
}
var BasePatch = class {
  selection;
  operations;
  constructor(selection, operations = {}) {
    this.selection = selection, this.operations = operations;
  }
  /**
   * Sets the given attributes to the document. Does NOT merge objects.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs - Attributes to set. To set a deep attribute, use JSONMatch, eg: \{"nested.prop": "value"\}
   */
  set(attrs) {
    return this._assign("set", attrs);
  }
  /**
   * Sets the given attributes to the document if they are not currently set. Does NOT merge objects.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs - Attributes to set. To set a deep attribute, use JSONMatch, eg: \{"nested.prop": "value"\}
   */
  setIfMissing(attrs) {
    return this._assign("setIfMissing", attrs);
  }
  /**
   * Performs a "diff-match-patch" operation on the string attributes provided.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs - Attributes to perform operation on. To set a deep attribute, use JSONMatch, eg: \{"nested.prop": "dmp"\}
   */
  diffMatchPatch(attrs) {
    return validateObject("diffMatchPatch", attrs), this._assign("diffMatchPatch", attrs);
  }
  /**
   * Unsets the attribute paths provided.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs - Attribute paths to unset.
   */
  unset(attrs) {
    if (!Array.isArray(attrs))
      throw new Error("unset(attrs) takes an array of attributes to unset, non-array given");
    return this.operations = Object.assign({}, this.operations, { unset: attrs }), this;
  }
  /**
   * Increment a numeric value. Each entry in the argument is either an attribute or a JSON path. The value may be a positive or negative integer or floating-point value. The operation will fail if target value is not a numeric value, or doesn't exist.
   *
   * @param attrs - Object of attribute paths to increment, values representing the number to increment by.
   */
  inc(attrs) {
    return this._assign("inc", attrs);
  }
  /**
   * Decrement a numeric value. Each entry in the argument is either an attribute or a JSON path. The value may be a positive or negative integer or floating-point value. The operation will fail if target value is not a numeric value, or doesn't exist.
   *
   * @param attrs - Object of attribute paths to decrement, values representing the number to decrement by.
   */
  dec(attrs) {
    return this._assign("dec", attrs);
  }
  /**
   * Provides methods for modifying arrays, by inserting, appending and replacing elements via a JSONPath expression.
   *
   * @param at - Location to insert at, relative to the given selector, or 'replace' the matched path
   * @param selector - JSONPath expression, eg `comments[-1]` or `blocks[_key=="abc123"]`
   * @param items - Array of items to insert/replace
   */
  insert(at, selector, items) {
    return validateInsert(at, selector, items), this._assign("insert", { [at]: selector, items });
  }
  /**
   * Append the given items to the array at the given JSONPath
   *
   * @param selector - Attribute/path to append to, eg `comments` or `person.hobbies`
   * @param items - Array of items to append to the array
   */
  append(selector, items) {
    return this.insert("after", `${selector}[-1]`, items);
  }
  /**
   * Prepend the given items to the array at the given JSONPath
   *
   * @param selector - Attribute/path to prepend to, eg `comments` or `person.hobbies`
   * @param items - Array of items to prepend to the array
   */
  prepend(selector, items) {
    return this.insert("before", `${selector}[0]`, items);
  }
  /**
   * Change the contents of an array by removing existing elements and/or adding new elements.
   *
   * @param selector - Attribute or JSONPath expression for array
   * @param start - Index at which to start changing the array (with origin 0). If greater than the length of the array, actual starting index will be set to the length of the array. If negative, will begin that many elements from the end of the array (with origin -1) and will be set to 0 if absolute value is greater than the length of the array.x
   * @param deleteCount - An integer indicating the number of old array elements to remove.
   * @param items - The elements to add to the array, beginning at the start index. If you don't specify any elements, splice() will only remove elements from the array.
   */
  splice(selector, start, deleteCount, items) {
    const delAll = typeof deleteCount > "u" || deleteCount === -1, startIndex = start < 0 ? start - 1 : start, delCount = delAll ? -1 : Math.max(0, start + deleteCount), delRange = startIndex < 0 && delCount >= 0 ? "" : delCount, rangeSelector = `${selector}[${startIndex}:${delRange}]`;
    return this.insert("replace", rangeSelector, items || []);
  }
  /**
   * Adds a revision clause, preventing the document from being patched if the `_rev` property does not match the given value
   *
   * @param rev - Revision to lock the patch to
   */
  ifRevisionId(rev) {
    return this.operations.ifRevisionID = rev, this;
  }
  /**
   * Return a plain JSON representation of the patch
   */
  serialize() {
    return { ...getSelection(this.selection), ...this.operations };
  }
  /**
   * Return a plain JSON representation of the patch
   */
  toJSON() {
    return this.serialize();
  }
  /**
   * Clears the patch of all operations
   */
  reset() {
    return this.operations = {}, this;
  }
  _assign(op, props, merge2 = true) {
    return validateObject(op, props), this.operations = Object.assign({}, this.operations, {
      [op]: Object.assign({}, merge2 && this.operations[op] || {}, props)
    }), this;
  }
  _set(op, props) {
    return this._assign(op, props, false);
  }
};
var ObservablePatch = class _ObservablePatch extends BasePatch {
  #client;
  constructor(selection, operations, client2) {
    super(selection, operations), this.#client = client2;
  }
  /**
   * Clones the patch
   */
  clone() {
    return new _ObservablePatch(this.selection, { ...this.operations }, this.#client);
  }
  commit(options) {
    if (!this.#client)
      throw new Error(
        "No `client` passed to patch, either provide one or pass the patch to a clients `mutate()` method"
      );
    const returnFirst = typeof this.selection == "string", opts = Object.assign({ returnFirst, returnDocuments: true }, options);
    return this.#client.mutate({ patch: this.serialize() }, opts);
  }
};
var Patch = class _Patch extends BasePatch {
  #client;
  constructor(selection, operations, client2) {
    super(selection, operations), this.#client = client2;
  }
  /**
   * Clones the patch
   */
  clone() {
    return new _Patch(this.selection, { ...this.operations }, this.#client);
  }
  commit(options) {
    if (!this.#client)
      throw new Error(
        "No `client` passed to patch, either provide one or pass the patch to a clients `mutate()` method"
      );
    const returnFirst = typeof this.selection == "string", opts = Object.assign({ returnFirst, returnDocuments: true }, options);
    return this.#client.mutate({ patch: this.serialize() }, opts);
  }
};
var defaultMutateOptions = { returnDocuments: false };
var BaseTransaction = class {
  operations;
  trxId;
  constructor(operations = [], transactionId) {
    this.operations = operations, this.trxId = transactionId;
  }
  /**
   * Creates a new Sanity document. If `_id` is provided and already exists, the mutation will fail. If no `_id` is given, one will automatically be generated by the database.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param doc - Document to create. Requires a `_type` property.
   */
  create(doc) {
    return validateObject("create", doc), this._add({ create: doc });
  }
  /**
   * Creates a new Sanity document. If a document with the same `_id` already exists, the create operation will be ignored.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param doc - Document to create if it does not already exist. Requires `_id` and `_type` properties.
   */
  createIfNotExists(doc) {
    const op = "createIfNotExists";
    return validateObject(op, doc), requireDocumentId(op, doc), this._add({ [op]: doc });
  }
  /**
   * Creates a new Sanity document, or replaces an existing one if the same `_id` is already used.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param doc - Document to create or replace. Requires `_id` and `_type` properties.
   */
  createOrReplace(doc) {
    const op = "createOrReplace";
    return validateObject(op, doc), requireDocumentId(op, doc), this._add({ [op]: doc });
  }
  /**
   * Deletes the document with the given document ID
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param documentId - Document ID to delete
   */
  delete(documentId) {
    return validateDocumentId("delete", documentId), this._add({ delete: { id: documentId } });
  }
  transactionId(id) {
    return id ? (this.trxId = id, this) : this.trxId;
  }
  /**
   * Return a plain JSON representation of the transaction
   */
  serialize() {
    return [...this.operations];
  }
  /**
   * Return a plain JSON representation of the transaction
   */
  toJSON() {
    return this.serialize();
  }
  /**
   * Clears the transaction of all operations
   */
  reset() {
    return this.operations = [], this;
  }
  _add(mut) {
    return this.operations.push(mut), this;
  }
};
var Transaction = class _Transaction extends BaseTransaction {
  #client;
  constructor(operations, client2, transactionId) {
    super(operations, transactionId), this.#client = client2;
  }
  /**
   * Clones the transaction
   */
  clone() {
    return new _Transaction([...this.operations], this.#client, this.trxId);
  }
  commit(options) {
    if (!this.#client)
      throw new Error(
        "No `client` passed to transaction, either provide one or pass the transaction to a clients `mutate()` method"
      );
    return this.#client.mutate(
      this.serialize(),
      Object.assign({ transactionId: this.trxId }, defaultMutateOptions, options || {})
    );
  }
  patch(patchOrDocumentId, patchOps) {
    const isBuilder = typeof patchOps == "function", isPatch = typeof patchOrDocumentId != "string" && patchOrDocumentId instanceof Patch, isMutationSelection = typeof patchOrDocumentId == "object" && ("query" in patchOrDocumentId || "id" in patchOrDocumentId);
    if (isPatch)
      return this._add({ patch: patchOrDocumentId.serialize() });
    if (isBuilder) {
      const patch = patchOps(new Patch(patchOrDocumentId, {}, this.#client));
      if (!(patch instanceof Patch))
        throw new Error("function passed to `patch()` must return the patch");
      return this._add({ patch: patch.serialize() });
    }
    if (isMutationSelection) {
      const patch = new Patch(patchOrDocumentId, patchOps || {}, this.#client);
      return this._add({ patch: patch.serialize() });
    }
    return this._add({ patch: { id: patchOrDocumentId, ...patchOps } });
  }
};
var ObservableTransaction = class _ObservableTransaction extends BaseTransaction {
  #client;
  constructor(operations, client2, transactionId) {
    super(operations, transactionId), this.#client = client2;
  }
  /**
   * Clones the transaction
   */
  clone() {
    return new _ObservableTransaction([...this.operations], this.#client, this.trxId);
  }
  commit(options) {
    if (!this.#client)
      throw new Error(
        "No `client` passed to transaction, either provide one or pass the transaction to a clients `mutate()` method"
      );
    return this.#client.mutate(
      this.serialize(),
      Object.assign({ transactionId: this.trxId }, defaultMutateOptions, options || {})
    );
  }
  patch(patchOrDocumentId, patchOps) {
    const isBuilder = typeof patchOps == "function";
    if (typeof patchOrDocumentId != "string" && patchOrDocumentId instanceof ObservablePatch)
      return this._add({ patch: patchOrDocumentId.serialize() });
    if (isBuilder) {
      const patch = patchOps(new ObservablePatch(patchOrDocumentId, {}, this.#client));
      if (!(patch instanceof ObservablePatch))
        throw new Error("function passed to `patch()` must return the patch");
      return this._add({ patch: patch.serialize() });
    }
    return this._add({ patch: { id: patchOrDocumentId, ...patchOps } });
  }
};
var projectHeader = "X-Sanity-Project-ID";
function requestOptions(config, overrides = {}) {
  const headers2 = {};
  config.headers && Object.assign(headers2, config.headers);
  const token = overrides.token || config.token;
  token && (headers2.Authorization = `Bearer ${token}`), !overrides.useGlobalApi && !config.useProjectHostname && config.projectId && (headers2[projectHeader] = config.projectId);
  const withCredentials = !!(typeof overrides.withCredentials > "u" ? config.withCredentials : overrides.withCredentials), timeout = typeof overrides.timeout > "u" ? config.timeout : overrides.timeout;
  return Object.assign({}, overrides, {
    headers: Object.assign({}, headers2, overrides.headers || {}),
    timeout: typeof timeout > "u" ? 5 * 60 * 1e3 : timeout,
    proxy: overrides.proxy || config.proxy,
    json: true,
    withCredentials,
    fetch: typeof overrides.fetch == "object" && typeof config.fetch == "object" ? { ...config.fetch, ...overrides.fetch } : overrides.fetch || config.fetch
  });
}
var encodeQueryString = ({
  query,
  params = {},
  options = {}
}) => {
  const searchParams = new URLSearchParams(), { tag, includeMutations, returnQuery, ...opts } = options;
  tag && searchParams.append("tag", tag), searchParams.append("query", query);
  for (const [key, value] of Object.entries(params))
    value !== void 0 && searchParams.append(`$${key}`, JSON.stringify(value));
  for (const [key, value] of Object.entries(opts))
    value && searchParams.append(key, `${value}`);
  return returnQuery === false && searchParams.append("returnQuery", "false"), includeMutations === false && searchParams.append("includeMutations", "false"), `?${searchParams}`;
};
var excludeFalsey = (param, defValue) => param === false ? void 0 : typeof param > "u" ? defValue : param;
var getMutationQuery = (options = {}) => ({
  dryRun: options.dryRun,
  returnIds: true,
  returnDocuments: excludeFalsey(options.returnDocuments, true),
  visibility: options.visibility || "sync",
  autoGenerateArrayKeys: options.autoGenerateArrayKeys,
  skipCrossDatasetReferenceValidation: options.skipCrossDatasetReferenceValidation
});
var isResponse = (event) => event.type === "response";
var getBody = (event) => event.body;
var indexBy = (docs, attr) => docs.reduce((indexed, doc) => (indexed[attr(doc)] = doc, indexed), /* @__PURE__ */ Object.create(null));
var getQuerySizeLimit = 11264;
function _fetch(client2, httpRequest, _stega, query, _params = {}, options = {}) {
  const stega = "stega" in options ? {
    ..._stega || {},
    ...typeof options.stega == "boolean" ? { enabled: options.stega } : options.stega || {}
  } : _stega, params = stega.enabled ? stegaClean(_params) : _params, mapResponse = options.filterResponse === false ? (res) => res : (res) => res.result, { cache, next, ...opts } = {
    // Opt out of setting a `signal` on an internal `fetch` if one isn't provided.
    // This is necessary in React Server Components to avoid opting out of Request Memoization.
    useAbortSignal: typeof options.signal < "u",
    // Set `resultSourceMap' when stega is enabled, as it's required for encoding.
    resultSourceMap: stega.enabled ? "withKeyArraySelector" : options.resultSourceMap,
    ...options,
    // Default to not returning the query, unless `filterResponse` is `false`,
    // or `returnQuery` is explicitly set. `true` is the default in Content Lake, so skip if truthy
    returnQuery: options.filterResponse === false && options.returnQuery !== false
  }, reqOpts = typeof cache < "u" || typeof next < "u" ? { ...opts, fetch: { cache, next } } : opts, $request = _dataRequest(client2, httpRequest, "query", { query, params }, reqOpts);
  return stega.enabled ? $request.pipe(
    (0, import_operators.combineLatestWith)(
      (0, import_rxjs.from)(
        Promise.resolve().then(() => (init_stegaEncodeSourceMap(), stegaEncodeSourceMap_exports)).then(function(n5) {
          return n5.stegaEncodeSourceMap$1;
        }).then(
          ({ stegaEncodeSourceMap: stegaEncodeSourceMap2 }) => stegaEncodeSourceMap2
        )
      )
    ),
    (0, import_operators.map)(
      ([res, stegaEncodeSourceMap2]) => {
        const result = stegaEncodeSourceMap2(res.result, res.resultSourceMap, stega);
        return mapResponse({ ...res, result });
      }
    )
  ) : $request.pipe((0, import_operators.map)(mapResponse));
}
function _getDocument(client2, httpRequest, id, opts = {}) {
  const docId = (() => {
    if (!opts.releaseId)
      return id;
    const versionId = getVersionFromId(id);
    if (!versionId) {
      if (isDraftId(id))
        throw new Error(
          `The document ID (\`${id}\`) is a draft, but \`options.releaseId\` is set as \`${opts.releaseId}\``
        );
      return getVersionId(id, opts.releaseId);
    }
    if (versionId !== opts.releaseId)
      throw new Error(
        `The document ID (\`${id}\`) is already a version of \`${versionId}\` release, but this does not match the provided \`options.releaseId\` (\`${opts.releaseId}\`)`
      );
    return id;
  })(), options = {
    uri: _getDataUrl(client2, "doc", docId),
    json: true,
    tag: opts.tag,
    signal: opts.signal
  };
  return _requestObservable(client2, httpRequest, options).pipe(
    (0, import_operators.filter)(isResponse),
    (0, import_operators.map)((event) => event.body.documents && event.body.documents[0])
  );
}
function _getDocuments(client2, httpRequest, ids, opts = {}) {
  const options = {
    uri: _getDataUrl(client2, "doc", ids.join(",")),
    json: true,
    tag: opts.tag,
    signal: opts.signal
  };
  return _requestObservable(client2, httpRequest, options).pipe(
    (0, import_operators.filter)(isResponse),
    (0, import_operators.map)((event) => {
      const indexed = indexBy(event.body.documents || [], (doc) => doc._id);
      return ids.map((id) => indexed[id] || null);
    })
  );
}
function _getReleaseDocuments(client2, httpRequest, releaseId, opts = {}) {
  return _dataRequest(
    client2,
    httpRequest,
    "query",
    {
      query: "*[sanity::partOfRelease($releaseId)]",
      params: {
        releaseId
      }
    },
    opts
  );
}
function _createIfNotExists(client2, httpRequest, doc, options) {
  return requireDocumentId("createIfNotExists", doc), _create(client2, httpRequest, doc, "createIfNotExists", options);
}
function _createOrReplace(client2, httpRequest, doc, options) {
  return requireDocumentId("createOrReplace", doc), _create(client2, httpRequest, doc, "createOrReplace", options);
}
function _createVersion(client2, httpRequest, doc, publishedId, options) {
  return requireDocumentId("createVersion", doc), requireDocumentType("createVersion", doc), printCreateVersionWithBaseIdWarning(), _action(client2, httpRequest, {
    actionType: "sanity.action.document.version.create",
    publishedId,
    document: doc
  }, options);
}
function _createVersionFromBase(client2, httpRequest, publishedId, baseId, releaseId, ifBaseRevisionId, options) {
  if (!baseId)
    throw new Error("`createVersion()` requires `baseId` when no `document` is provided");
  if (!publishedId)
    throw new Error("`createVersion()` requires `publishedId` when `baseId` is provided");
  validateDocumentId("createVersion", baseId), validateDocumentId("createVersion", publishedId);
  const createVersionAction = {
    actionType: "sanity.action.document.version.create",
    publishedId,
    baseId,
    versionId: releaseId ? getVersionId(publishedId, releaseId) : getDraftId(publishedId),
    ifBaseRevisionId
  };
  return _action(client2, httpRequest, createVersionAction, options);
}
function _delete(client2, httpRequest, selection, options) {
  return _dataRequest(
    client2,
    httpRequest,
    "mutate",
    { mutations: [{ delete: getSelection(selection) }] },
    options
  );
}
function _discardVersion(client2, httpRequest, versionId, purge = false, options) {
  return _action(client2, httpRequest, {
    actionType: "sanity.action.document.version.discard",
    versionId,
    purge
  }, options);
}
function _replaceVersion(client2, httpRequest, doc, options) {
  return requireDocumentId("replaceVersion", doc), requireDocumentType("replaceVersion", doc), _action(client2, httpRequest, {
    actionType: "sanity.action.document.version.replace",
    document: doc
  }, options);
}
function _unpublishVersion(client2, httpRequest, versionId, publishedId, options) {
  return _action(client2, httpRequest, {
    actionType: "sanity.action.document.version.unpublish",
    versionId,
    publishedId
  }, options);
}
function _mutate(client2, httpRequest, mutations, options) {
  let mut;
  mutations instanceof Patch || mutations instanceof ObservablePatch ? mut = { patch: mutations.serialize() } : mutations instanceof Transaction || mutations instanceof ObservableTransaction ? mut = mutations.serialize() : mut = mutations;
  const muts = Array.isArray(mut) ? mut : [mut], transactionId = options && options.transactionId || void 0;
  return _dataRequest(client2, httpRequest, "mutate", { mutations: muts, transactionId }, options);
}
function _action(client2, httpRequest, actions, options) {
  const acts = Array.isArray(actions) ? actions : [actions], transactionId = options && options.transactionId || void 0, skipCrossDatasetReferenceValidation = options && options.skipCrossDatasetReferenceValidation || void 0, dryRun = options && options.dryRun || void 0;
  return _dataRequest(
    client2,
    httpRequest,
    "actions",
    { actions: acts, transactionId, skipCrossDatasetReferenceValidation, dryRun },
    options
  );
}
function _dataRequest(client2, httpRequest, endpoint, body, options = {}) {
  const isMutation = endpoint === "mutate", isAction = endpoint === "actions", isQuery2 = endpoint === "query", strQuery = isMutation || isAction ? "" : encodeQueryString(body), useGet = !isMutation && !isAction && strQuery.length < getQuerySizeLimit, stringQuery = useGet ? strQuery : "", returnFirst = options.returnFirst, { timeout, token, tag, headers: headers2, returnQuery, lastLiveEventId, cacheMode } = options, uri = _getDataUrl(client2, endpoint, stringQuery), reqOptions = {
    method: useGet ? "GET" : "POST",
    uri,
    json: true,
    body: useGet ? void 0 : body,
    query: isMutation && getMutationQuery(options),
    timeout,
    headers: headers2,
    token,
    tag,
    returnQuery,
    perspective: options.perspective,
    resultSourceMap: options.resultSourceMap,
    lastLiveEventId: Array.isArray(lastLiveEventId) ? lastLiveEventId[0] : lastLiveEventId,
    cacheMode,
    canUseCdn: isQuery2,
    signal: options.signal,
    fetch: options.fetch,
    useAbortSignal: options.useAbortSignal,
    useCdn: options.useCdn
  };
  return _requestObservable(client2, httpRequest, reqOptions).pipe(
    (0, import_operators.filter)(isResponse),
    (0, import_operators.map)(getBody),
    (0, import_operators.map)((res) => {
      if (!isMutation)
        return res;
      const results = res.results || [];
      if (options.returnDocuments)
        return returnFirst ? results[0] && results[0].document : results.map((mut) => mut.document);
      const key = returnFirst ? "documentId" : "documentIds", ids = returnFirst ? results[0] && results[0].id : results.map((mut) => mut.id);
      return {
        transactionId: res.transactionId,
        results,
        [key]: ids
      };
    })
  );
}
function _create(client2, httpRequest, doc, op, options = {}) {
  const mutation = { [op]: doc }, opts = Object.assign({ returnFirst: true, returnDocuments: true }, options);
  return _dataRequest(client2, httpRequest, "mutate", { mutations: [mutation] }, opts);
}
var hasDataConfig = (client2) => client2.config().dataset !== void 0 && client2.config().projectId !== void 0 || client2.config()["~experimental_resource"] !== void 0;
var isQuery = (client2, uri) => hasDataConfig(client2) && uri.startsWith(_getDataUrl(client2, "query"));
var isMutate = (client2, uri) => hasDataConfig(client2) && uri.startsWith(_getDataUrl(client2, "mutate"));
var isDoc = (client2, uri) => hasDataConfig(client2) && uri.startsWith(_getDataUrl(client2, "doc", ""));
var isListener = (client2, uri) => hasDataConfig(client2) && uri.startsWith(_getDataUrl(client2, "listen"));
var isHistory = (client2, uri) => hasDataConfig(client2) && uri.startsWith(_getDataUrl(client2, "history", ""));
var isData = (client2, uri) => uri.startsWith("/data/") || isQuery(client2, uri) || isMutate(client2, uri) || isDoc(client2, uri) || isListener(client2, uri) || isHistory(client2, uri);
function _requestObservable(client2, httpRequest, options) {
  const uri = options.url || options.uri, config = client2.config(), canUseCdn = typeof options.canUseCdn > "u" ? ["GET", "HEAD"].indexOf(options.method || "GET") >= 0 && isData(client2, uri) : options.canUseCdn;
  let useCdn = (options.useCdn ?? config.useCdn) && canUseCdn;
  const tag = options.tag && config.requestTagPrefix ? [config.requestTagPrefix, options.tag].join(".") : options.tag || config.requestTagPrefix;
  if (tag && options.tag !== null && (options.query = { tag: requestTag(tag), ...options.query }), ["GET", "HEAD", "POST"].indexOf(options.method || "GET") >= 0 && isQuery(client2, uri)) {
    const resultSourceMap = options.resultSourceMap ?? config.resultSourceMap;
    resultSourceMap !== void 0 && resultSourceMap !== false && (options.query = { resultSourceMap, ...options.query });
    const perspectiveOption = options.perspective || config.perspective;
    typeof perspectiveOption < "u" && (perspectiveOption === "previewDrafts" && printPreviewDraftsDeprecationWarning(), validateApiPerspective(perspectiveOption), options.query = {
      perspective: Array.isArray(perspectiveOption) ? perspectiveOption.join(",") : perspectiveOption,
      ...options.query
    }, (Array.isArray(perspectiveOption) && perspectiveOption.length > 0 || // previewDrafts was renamed to drafts, but keep for backwards compat
    perspectiveOption === "previewDrafts" || perspectiveOption === "drafts") && useCdn && (useCdn = false, printCdnPreviewDraftsWarning())), options.lastLiveEventId && (options.query = { ...options.query, lastLiveEventId: options.lastLiveEventId }), options.returnQuery === false && (options.query = { returnQuery: "false", ...options.query }), useCdn && options.cacheMode == "noStale" && (options.query = { cacheMode: "noStale", ...options.query });
  }
  const reqOptions = requestOptions(
    config,
    Object.assign({}, options, {
      url: _getUrl(client2, uri, useCdn)
    })
  ), request = new import_rxjs.Observable(
    (subscriber) => httpRequest(reqOptions, config.requester).subscribe(subscriber)
  );
  return options.signal ? request.pipe(_withAbortSignal(options.signal)) : request;
}
function _request(client2, httpRequest, options) {
  return _requestObservable(client2, httpRequest, options).pipe(
    (0, import_operators.filter)((event) => event.type === "response"),
    (0, import_operators.map)((event) => event.body)
  );
}
function _getDataUrl(client2, operation, path) {
  const config = client2.config();
  if (config["~experimental_resource"]) {
    resourceConfig(config);
    const resourceBase = resourceDataBase(config), uri2 = path !== void 0 ? `${operation}/${path}` : operation;
    return `${resourceBase}/${uri2}`.replace(/\/($|\?)/, "$1");
  }
  const catalog = hasDataset(config), baseUri = `/${operation}/${catalog}`;
  return `/data${path !== void 0 ? `${baseUri}/${path}` : baseUri}`.replace(/\/($|\?)/, "$1");
}
function _getUrl(client2, uri, canUseCdn = false) {
  const { url, cdnUrl } = client2.config();
  return `${canUseCdn ? cdnUrl : url}/${uri.replace(/^\//, "")}`;
}
function _withAbortSignal(signal) {
  return (input) => new import_rxjs.Observable((observer) => {
    const abort = () => observer.error(_createAbortError(signal));
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const subscription = input.subscribe(observer);
    return signal.addEventListener("abort", abort), () => {
      signal.removeEventListener("abort", abort), subscription.unsubscribe();
    };
  });
}
var isDomExceptionSupported = !!globalThis.DOMException;
function _createAbortError(signal) {
  if (isDomExceptionSupported)
    return new DOMException(signal?.reason ?? "The operation was aborted.", "AbortError");
  const error = new Error(signal?.reason ?? "The operation was aborted.");
  return error.name = "AbortError", error;
}
var resourceDataBase = (config) => {
  if (!config["~experimental_resource"])
    throw new Error("`resource` must be provided to perform resource queries");
  const { type, id } = config["~experimental_resource"];
  switch (type) {
    case "dataset": {
      const segments = id.split(".");
      if (segments.length !== 2)
        throw new Error('Dataset ID must be in the format "project.dataset"');
      return `/projects/${segments[0]}/datasets/${segments[1]}`;
    }
    case "canvas":
      return `/canvases/${id}`;
    case "media-library":
      return `/media-libraries/${id}`;
    case "dashboard":
      return `/dashboards/${id}`;
    default:
      throw new Error(`Unsupported resource type: ${type.toString()}`);
  }
};
function _generate(client2, httpRequest, request) {
  const dataset2 = hasDataset(client2.config());
  return _request(client2, httpRequest, {
    method: "POST",
    uri: `/agent/action/generate/${dataset2}`,
    body: request
  });
}
function _patch(client2, httpRequest, request) {
  const dataset2 = hasDataset(client2.config());
  return _request(client2, httpRequest, {
    method: "POST",
    uri: `/agent/action/patch/${dataset2}`,
    body: request
  });
}
function _prompt(client2, httpRequest, request) {
  const dataset2 = hasDataset(client2.config());
  return _request(client2, httpRequest, {
    method: "POST",
    uri: `/agent/action/prompt/${dataset2}`,
    body: request
  });
}
function _transform(client2, httpRequest, request) {
  const dataset2 = hasDataset(client2.config());
  return _request(client2, httpRequest, {
    method: "POST",
    uri: `/agent/action/transform/${dataset2}`,
    body: request
  });
}
function _translate(client2, httpRequest, request) {
  const dataset2 = hasDataset(client2.config());
  return _request(client2, httpRequest, {
    method: "POST",
    uri: `/agent/action/translate/${dataset2}`,
    body: request
  });
}
var ObservableAgentsActionClient = class {
  #client;
  #httpRequest;
  constructor(client2, httpRequest) {
    this.#client = client2, this.#httpRequest = httpRequest;
  }
  /**
   * Run an instruction to generate content in a target document.
   * @param request - instruction request
   */
  generate(request) {
    return _generate(this.#client, this.#httpRequest, request);
  }
  /**
   * Transform a target document based on a source.
   * @param request - translation request
   */
  transform(request) {
    return _transform(this.#client, this.#httpRequest, request);
  }
  /**
   * Translate a target document based on a source.
   * @param request - translation request
   */
  translate(request) {
    return _translate(this.#client, this.#httpRequest, request);
  }
};
var AgentActionsClient = class {
  #client;
  #httpRequest;
  constructor(client2, httpRequest) {
    this.#client = client2, this.#httpRequest = httpRequest;
  }
  /**
   * Run an instruction to generate content in a target document.
   * @param request - instruction request
   */
  generate(request) {
    return (0, import_rxjs.lastValueFrom)(_generate(this.#client, this.#httpRequest, request));
  }
  /**
   * Transform a target document based on a source.
   * @param request - translation request
   */
  transform(request) {
    return (0, import_rxjs.lastValueFrom)(_transform(this.#client, this.#httpRequest, request));
  }
  /**
   * Translate a target document based on a source.
   * @param request - translation request
   */
  translate(request) {
    return (0, import_rxjs.lastValueFrom)(_translate(this.#client, this.#httpRequest, request));
  }
  /**
   * Run a raw instruction and return the result either as text or json
   * @param request - prompt request
   */
  prompt(request) {
    return (0, import_rxjs.lastValueFrom)(_prompt(this.#client, this.#httpRequest, request));
  }
  /**
   * Patch a document using a schema aware API.
   * Does not use an LLM, but uses the schema to ensure paths and values matches the schema.
   * @param request - instruction request
   */
  patch(request) {
    return (0, import_rxjs.lastValueFrom)(_patch(this.#client, this.#httpRequest, request));
  }
};
var ObservableAssetsClient = class {
  #client;
  #httpRequest;
  constructor(client2, httpRequest) {
    this.#client = client2, this.#httpRequest = httpRequest;
  }
  upload(assetType, body, options) {
    return _upload(this.#client, this.#httpRequest, assetType, body, options);
  }
};
var AssetsClient = class {
  #client;
  #httpRequest;
  constructor(client2, httpRequest) {
    this.#client = client2, this.#httpRequest = httpRequest;
  }
  upload(assetType, body, options) {
    const observable2 = _upload(this.#client, this.#httpRequest, assetType, body, options);
    return (0, import_rxjs.lastValueFrom)(
      observable2.pipe(
        (0, import_operators.filter)((event) => event.type === "response"),
        (0, import_operators.map)(
          (event) => event.body.document
        )
      )
    );
  }
};
function _upload(client2, httpRequest, assetType, body, opts = {}) {
  validateAssetType(assetType);
  let meta = opts.extract || void 0;
  meta && !meta.length && (meta = ["none"]);
  const config = client2.config(), options = optionsFromFile(opts, body), { tag, label, title, description, creditLine, filename, source } = options, query = {
    label,
    title,
    description,
    filename,
    meta,
    creditLine
  };
  return source && (query.sourceId = source.id, query.sourceName = source.name, query.sourceUrl = source.url), _requestObservable(client2, httpRequest, {
    tag,
    method: "POST",
    timeout: options.timeout || 0,
    uri: buildAssetUploadUrl(config, assetType),
    headers: options.contentType ? { "Content-Type": options.contentType } : {},
    query,
    body
  });
}
function buildAssetUploadUrl(config, assetType) {
  const assetTypeEndpoint = assetType === "image" ? "images" : "files";
  if (config["~experimental_resource"]) {
    const { type, id } = config["~experimental_resource"];
    switch (type) {
      case "dataset":
        throw new Error(
          "Assets are not supported for dataset resources, yet. Configure the client with `{projectId: <projectId>, dataset: <datasetId>}` instead."
        );
      case "canvas":
        return `/canvases/${id}/assets/${assetTypeEndpoint}`;
      case "media-library":
        return `/media-libraries/${id}/upload`;
      case "dashboard":
        return `/dashboards/${id}/assets/${assetTypeEndpoint}`;
      default:
        throw new Error(`Unsupported resource type: ${type.toString()}`);
    }
  }
  const dataset2 = hasDataset(config);
  return `assets/${assetTypeEndpoint}/${dataset2}`;
}
function optionsFromFile(opts, file) {
  return typeof File > "u" || !(file instanceof File) ? opts : Object.assign(
    {
      filename: opts.preserveFilename === false ? void 0 : file.name,
      contentType: file.type
    },
    opts
  );
}
var defaults = (obj, defaults2) => Object.keys(defaults2).concat(Object.keys(obj)).reduce((target, prop) => (target[prop] = typeof obj[prop] > "u" ? defaults2[prop] : obj[prop], target), {});
var pick = (obj, props) => props.reduce((selection, prop) => (typeof obj[prop] > "u" || (selection[prop] = obj[prop]), selection), {});
var eventSourcePolyfill = (0, import_rxjs.defer)(() => Promise.resolve().then(() => __toESM(require_node3(), 1))).pipe(
  (0, import_operators.map)(({ default: EventSource2 }) => EventSource2),
  (0, import_rxjs.shareReplay)(1)
);
function reconnectOnConnectionFailure() {
  return function(source) {
    return source.pipe(
      (0, import_rxjs.catchError)((err, caught) => err instanceof ConnectionFailedError ? (0, import_rxjs.concat)((0, import_rxjs.of)({ type: "reconnect" }), (0, import_rxjs.timer)(1e3).pipe((0, import_rxjs.mergeMap)(() => caught))) : (0, import_rxjs.throwError)(() => err))
    );
  };
}
var MAX_URL_LENGTH = 14800;
var possibleOptions = [
  "includePreviousRevision",
  "includeResult",
  "includeMutations",
  "includeAllVersions",
  "visibility",
  "effectFormat",
  "tag"
];
var defaultOptions = {
  includeResult: true
};
function _listen(query, params, opts = {}) {
  const { url, token, withCredentials, requestTagPrefix, headers: configHeaders } = this.config(), tag = opts.tag && requestTagPrefix ? [requestTagPrefix, opts.tag].join(".") : opts.tag, options = { ...defaults(opts, defaultOptions), tag }, listenOpts = pick(options, possibleOptions), qs = encodeQueryString({ query, params, options: { tag, ...listenOpts } }), uri = `${url}${_getDataUrl(this, "listen", qs)}`;
  if (uri.length > MAX_URL_LENGTH)
    return (0, import_rxjs.throwError)(() => new Error("Query too large for listener"));
  const listenFor = options.events ? options.events : ["mutation"], esOptions = {};
  return withCredentials && (esOptions.withCredentials = true), (token || configHeaders) && (esOptions.headers = {}, token && (esOptions.headers.Authorization = `Bearer ${token}`), configHeaders && Object.assign(esOptions.headers, configHeaders)), connectEventSource(() => (
    // use polyfill if there is no global EventSource or if we need to set headers
    (typeof EventSource > "u" || esOptions.headers ? eventSourcePolyfill : (0, import_rxjs.of)(EventSource)).pipe((0, import_operators.map)((EventSource2) => new EventSource2(uri, esOptions)))
  ), listenFor).pipe(
    reconnectOnConnectionFailure(),
    (0, import_operators.filter)((event) => listenFor.includes(event.type)),
    (0, import_operators.map)(
      (event) => ({
        type: event.type,
        ..."data" in event ? event.data : {}
      })
    )
  );
}
function shareReplayLatest(configOrPredicate, config) {
  return _shareReplayLatest(
    typeof configOrPredicate == "function" ? { predicate: configOrPredicate, ...config } : configOrPredicate
  );
}
function _shareReplayLatest(config) {
  return (source) => {
    let latest, emitted = false;
    const { predicate, ...shareConfig } = config, wrapped = source.pipe(
      (0, import_rxjs.tap)((value) => {
        config.predicate(value) && (emitted = true, latest = value);
      }),
      (0, import_rxjs.finalize)(() => {
        emitted = false, latest = void 0;
      }),
      (0, import_rxjs.share)(shareConfig)
    ), emitLatest = new import_rxjs.Observable((subscriber) => {
      emitted && subscriber.next(
        // this cast is safe because of the emitted check which asserts that we got T from the source
        latest
      ), subscriber.complete();
    });
    return (0, import_rxjs.merge)(wrapped, emitLatest);
  };
}
var requiredApiVersion = "2021-03-25";
var LiveClient = class {
  #client;
  constructor(client2) {
    this.#client = client2;
  }
  /**
   * Requires `apiVersion` to be `2021-03-25` or later.
   */
  events({
    includeDrafts = false,
    tag: _tag
  } = {}) {
    resourceGuard("live", this.#client.config());
    const {
      projectId: projectId2,
      apiVersion: _apiVersion,
      token,
      withCredentials,
      requestTagPrefix,
      headers: configHeaders
    } = this.#client.config(), apiVersion = _apiVersion.replace(/^v/, "");
    if (apiVersion !== "X" && apiVersion < requiredApiVersion)
      throw new Error(
        `The live events API requires API version ${requiredApiVersion} or later. The current API version is ${apiVersion}. Please update your API version to use this feature.`
      );
    if (includeDrafts && !token && !withCredentials)
      throw new Error(
        "The live events API requires a token or withCredentials when 'includeDrafts: true'. Please update your client configuration. The token should have the lowest possible access role."
      );
    const path = _getDataUrl(this.#client, "live/events"), url = new URL(this.#client.getUrl(path, false)), tag = _tag && requestTagPrefix ? [requestTagPrefix, _tag].join(".") : _tag;
    tag && url.searchParams.set("tag", tag), includeDrafts && url.searchParams.set("includeDrafts", "true");
    const esOptions = {};
    includeDrafts && withCredentials && (esOptions.withCredentials = true), (includeDrafts && token || configHeaders) && (esOptions.headers = {}, includeDrafts && token && (esOptions.headers.Authorization = `Bearer ${token}`), configHeaders && Object.assign(esOptions.headers, configHeaders));
    const key = `${url.href}::${JSON.stringify(esOptions)}`, existing = eventsCache.get(key);
    if (existing)
      return existing;
    const events = connectEventSource(() => (
      // use polyfill if there is no global EventSource or if we need to set headers
      (typeof EventSource > "u" || esOptions.headers ? eventSourcePolyfill : (0, import_rxjs.of)(EventSource)).pipe((0, import_operators.map)((EventSource2) => new EventSource2(url.href, esOptions)))
    ), [
      "message",
      "restart",
      "welcome",
      "reconnect",
      "goaway"
    ]).pipe(
      reconnectOnConnectionFailure(),
      (0, import_operators.map)((event) => {
        if (event.type === "message") {
          const { data, ...rest } = event;
          return { ...rest, tags: data.tags };
        }
        return event;
      })
    ), checkCors = fetchObservable(url, {
      method: "OPTIONS",
      mode: "cors",
      credentials: esOptions.withCredentials ? "include" : "omit",
      headers: esOptions.headers
    }).pipe(
      (0, import_rxjs.mergeMap)(() => import_rxjs.EMPTY),
      (0, import_rxjs.catchError)(() => {
        throw new CorsOriginError({ projectId: projectId2 });
      })
    ), observable2 = (0, import_rxjs.concat)(checkCors, events).pipe(
      (0, import_operators.finalize)(() => eventsCache.delete(key)),
      shareReplayLatest({
        predicate: (event) => event.type === "welcome"
      })
    );
    return eventsCache.set(key, observable2), observable2;
  }
};
function fetchObservable(url, init) {
  return new import_rxjs.Observable((observer) => {
    const controller = new AbortController(), signal = controller.signal;
    return fetch(url, { ...init, signal: controller.signal }).then(
      (response) => {
        observer.next(response), observer.complete();
      },
      (err) => {
        signal.aborted || observer.error(err);
      }
    ), () => controller.abort();
  });
}
var eventsCache = /* @__PURE__ */ new Map();
var ObservableDatasetsClient = class {
  #client;
  #httpRequest;
  constructor(client2, httpRequest) {
    this.#client = client2, this.#httpRequest = httpRequest;
  }
  /**
   * Create a new dataset with the given name
   *
   * @param name - Name of the dataset to create
   * @param options - Options for the dataset
   */
  create(name2, options) {
    return _modify(this.#client, this.#httpRequest, "PUT", name2, options);
  }
  /**
   * Edit a dataset with the given name
   *
   * @param name - Name of the dataset to edit
   * @param options - New options for the dataset
   */
  edit(name2, options) {
    return _modify(this.#client, this.#httpRequest, "PATCH", name2, options);
  }
  /**
   * Delete a dataset with the given name
   *
   * @param name - Name of the dataset to delete
   */
  delete(name2) {
    return _modify(this.#client, this.#httpRequest, "DELETE", name2);
  }
  /**
   * Fetch a list of datasets for the configured project
   */
  list() {
    resourceGuard("dataset", this.#client.config());
    const config = this.#client.config(), projectId2 = config.projectId;
    let uri = "/datasets";
    return config.useProjectHostname === false && (uri = `/projects/${projectId2}/datasets`), _request(this.#client, this.#httpRequest, {
      uri,
      tag: null
    });
  }
};
var DatasetsClient = class {
  #client;
  #httpRequest;
  constructor(client2, httpRequest) {
    this.#client = client2, this.#httpRequest = httpRequest;
  }
  /**
   * Create a new dataset with the given name
   *
   * @param name - Name of the dataset to create
   * @param options - Options for the dataset
   */
  create(name2, options) {
    return resourceGuard("dataset", this.#client.config()), (0, import_rxjs.lastValueFrom)(
      _modify(this.#client, this.#httpRequest, "PUT", name2, options)
    );
  }
  /**
   * Edit a dataset with the given name
   *
   * @param name - Name of the dataset to edit
   * @param options - New options for the dataset
   */
  edit(name2, options) {
    return resourceGuard("dataset", this.#client.config()), (0, import_rxjs.lastValueFrom)(
      _modify(this.#client, this.#httpRequest, "PATCH", name2, options)
    );
  }
  /**
   * Delete a dataset with the given name
   *
   * @param name - Name of the dataset to delete
   */
  delete(name2) {
    return resourceGuard("dataset", this.#client.config()), (0, import_rxjs.lastValueFrom)(_modify(this.#client, this.#httpRequest, "DELETE", name2));
  }
  /**
   * Fetch a list of datasets for the configured project
   */
  list() {
    resourceGuard("dataset", this.#client.config());
    const config = this.#client.config(), projectId2 = config.projectId;
    let uri = "/datasets";
    return config.useProjectHostname === false && (uri = `/projects/${projectId2}/datasets`), (0, import_rxjs.lastValueFrom)(
      _request(this.#client, this.#httpRequest, { uri, tag: null })
    );
  }
};
function _modify(client2, httpRequest, method, name2, options) {
  return resourceGuard("dataset", client2.config()), dataset(name2), _request(client2, httpRequest, {
    method,
    uri: `/datasets/${name2}`,
    body: options,
    tag: null
  });
}
var ObservableProjectsClient = class {
  #client;
  #httpRequest;
  constructor(client2, httpRequest) {
    this.#client = client2, this.#httpRequest = httpRequest;
  }
  list(options) {
    const query = {}, uri = "/projects";
    return options?.includeMembers === false && (query.includeMembers = "false"), options?.organizationId && (query.organizationId = options.organizationId), _request(this.#client, this.#httpRequest, { uri, query });
  }
  /**
   * Fetch a project by project ID
   *
   * @param projectId - ID of the project to fetch
   */
  getById(projectId2) {
    return _request(this.#client, this.#httpRequest, { uri: `/projects/${projectId2}` });
  }
};
var ProjectsClient = class {
  #client;
  #httpRequest;
  constructor(client2, httpRequest) {
    this.#client = client2, this.#httpRequest = httpRequest;
  }
  list(options) {
    const query = {}, uri = "/projects";
    return options?.includeMembers === false && (query.includeMembers = "false"), options?.organizationId && (query.organizationId = options.organizationId), (0, import_rxjs.lastValueFrom)(_request(this.#client, this.#httpRequest, { uri, query }));
  }
  /**
   * Fetch a project by project ID
   *
   * @param projectId - ID of the project to fetch
   */
  getById(projectId2) {
    return (0, import_rxjs.lastValueFrom)(
      _request(this.#client, this.#httpRequest, { uri: `/projects/${projectId2}` })
    );
  }
};
var generateReleaseId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  8
);
var getDocumentVersionId = (publishedId, releaseId) => releaseId ? getVersionId(publishedId, releaseId) : getDraftId(publishedId);
function deriveDocumentVersionId(op, {
  releaseId,
  publishedId,
  document: document2
}) {
  if (publishedId && document2._id) {
    const versionId = getDocumentVersionId(publishedId, releaseId);
    return validateVersionIdMatch(versionId, document2), versionId;
  }
  if (document2._id) {
    const isDraft = isDraftId(document2._id), isVersion = isVersionId(document2._id);
    if (!isDraft && !isVersion)
      throw new Error(
        `\`${op}()\` requires a document with an \`_id\` that is a version or draft ID`
      );
    if (releaseId) {
      if (isDraft)
        throw new Error(
          `\`${op}()\` was called with a document ID (\`${document2._id}\`) that is a draft ID, but a release ID (\`${releaseId}\`) was also provided.`
        );
      const builtVersionId = getVersionFromId(document2._id);
      if (builtVersionId !== releaseId)
        throw new Error(
          `\`${op}()\` was called with a document ID (\`${document2._id}\`) that is a version ID, but the release ID (\`${releaseId}\`) does not match the document's version ID (\`${builtVersionId}\`).`
        );
    }
    return document2._id;
  }
  if (publishedId)
    return getDocumentVersionId(publishedId, releaseId);
  throw new Error(`\`${op}()\` requires either a publishedId or a document with an \`_id\``);
}
var getArgs = (releaseOrOptions, maybeOptions) => {
  if (typeof releaseOrOptions == "object" && releaseOrOptions !== null && ("releaseId" in releaseOrOptions || "metadata" in releaseOrOptions)) {
    const { releaseId = generateReleaseId(), metadata = {} } = releaseOrOptions;
    return [releaseId, metadata, maybeOptions];
  }
  return [generateReleaseId(), {}, releaseOrOptions];
};
var createRelease = (releaseOrOptions, maybeOptions) => {
  const [releaseId, metadata, options] = getArgs(releaseOrOptions, maybeOptions), finalMetadata = {
    ...metadata,
    releaseType: metadata.releaseType || "undecided"
  };
  return { action: {
    actionType: "sanity.action.release.create",
    releaseId,
    metadata: finalMetadata
  }, options };
};
var ObservableReleasesClient = class {
  #client;
  #httpRequest;
  constructor(client2, httpRequest) {
    this.#client = client2, this.#httpRequest = httpRequest;
  }
  /**
   * @public
   *
   * Retrieve a release by id.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to retrieve.
   * @param options - Additional query options including abort signal and query tag.
   * @returns An observable that resolves to the release document {@link ReleaseDocument}.
   *
   * @example Retrieving a release by id
   * ```ts
   * client.observable.releases.get({releaseId: 'my-release'}).pipe(
   *   tap((release) => console.log(release)),
   *   // {
   *   //   _id: '_.releases.my-release',
   *   //   name: 'my-release'
   *   //   _type: 'system.release',
   *   //   metadata: {releaseType: 'asap'},
   *   //   _createdAt: '2021-01-01T00:00:00.000Z',
   *   //   ...
   *   // }
   * ).subscribe()
   * ```
   */
  get({ releaseId }, options) {
    return _getDocument(
      this.#client,
      this.#httpRequest,
      `_.releases.${releaseId}`,
      options
    );
  }
  create(releaseOrOptions, maybeOptions) {
    const { action, options } = createRelease(releaseOrOptions, maybeOptions), { releaseId, metadata } = action;
    return _action(this.#client, this.#httpRequest, action, options).pipe(
      (0, import_rxjs.map)((actionResult) => ({
        ...actionResult,
        releaseId,
        metadata
      }))
    );
  }
  /**
   * @public
   *
   * Edits an existing release, updating the metadata.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to edit.
   *   - `patch` - The patch operation to apply on the release metadata {@link PatchMutationOperation}.
   * @param options - Additional action options.
   * @returns An observable that resolves to the `transactionId`.
   */
  edit({ releaseId, patch }, options) {
    const editAction = {
      actionType: "sanity.action.release.edit",
      releaseId,
      patch
    };
    return _action(this.#client, this.#httpRequest, editAction, options);
  }
  /**
   * @public
   *
   * Publishes all documents in a release at once. For larger releases the effect of the publish
   * will be visible immediately when querying but the removal of the `versions.<releasesId>.*`
   * documents and creation of the corresponding published documents with the new content may
   * take some time.
   *
   * During this period both the source and target documents are locked and cannot be
   * modified through any other means.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to publish.
   * @param options - Additional action options.
   * @returns An observable that resolves to the `transactionId`.
   */
  publish({ releaseId }, options) {
    const publishAction = {
      actionType: "sanity.action.release.publish",
      releaseId
    };
    return _action(this.#client, this.#httpRequest, publishAction, options);
  }
  /**
   * @public
   *
   * An archive action removes an active release. The documents that comprise the release
   * are deleted and therefore no longer queryable.
   *
   * While the documents remain in retention the last version can still be accessed using document history endpoint.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to archive.
   * @param options - Additional action options.
   * @returns An observable that resolves to the `transactionId`.
   */
  archive({ releaseId }, options) {
    const archiveAction = {
      actionType: "sanity.action.release.archive",
      releaseId
    };
    return _action(this.#client, this.#httpRequest, archiveAction, options);
  }
  /**
   * @public
   *
   * An unarchive action restores an archived release and all documents
   * with the content they had just prior to archiving.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to unarchive.
   * @param options - Additional action options.
   * @returns An observable that resolves to the `transactionId`.
   */
  unarchive({ releaseId }, options) {
    const unarchiveAction = {
      actionType: "sanity.action.release.unarchive",
      releaseId
    };
    return _action(this.#client, this.#httpRequest, unarchiveAction, options);
  }
  /**
   * @public
   *
   * A schedule action queues a release for publishing at the given future time.
   * The release is locked such that no documents in the release can be modified and
   * no documents that it references can be deleted as this would make the publish fail.
   * At the given time, the same logic as for the publish action is triggered.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to schedule.
   *   - `publishAt` - The serialised date and time to publish the release. If the `publishAt` is in the past, the release will be published immediately.
   * @param options - Additional action options.
   * @returns An observable that resolves to the `transactionId`.
   */
  schedule({ releaseId, publishAt }, options) {
    const scheduleAction = {
      actionType: "sanity.action.release.schedule",
      releaseId,
      publishAt
    };
    return _action(this.#client, this.#httpRequest, scheduleAction, options);
  }
  /**
   * @public
   *
   * An unschedule action stops a release from being published.
   * The documents in the release are considered unlocked and can be edited again.
   * This may fail if another release is scheduled to be published after this one and
   * has a reference to a document created by this one.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to unschedule.
   * @param options - Additional action options.
   * @returns An observable that resolves to the `transactionId`.
   */
  unschedule({ releaseId }, options) {
    const unscheduleAction = {
      actionType: "sanity.action.release.unschedule",
      releaseId
    };
    return _action(this.#client, this.#httpRequest, unscheduleAction, options);
  }
  /**
   * @public
   *
   * A delete action removes a published or archived release.
   * The backing system document will be removed from the dataset.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to delete.
   * @param options - Additional action options.
   * @returns An observable that resolves to the `transactionId`.
   */
  delete({ releaseId }, options) {
    const deleteAction = {
      actionType: "sanity.action.release.delete",
      releaseId
    };
    return _action(this.#client, this.#httpRequest, deleteAction, options);
  }
  /**
   * @public
   *
   * Fetch the documents in a release by release id.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to fetch documents for.
   * @param options - Additional mutation options {@link BaseMutationOptions}.
   * @returns An observable that resolves to the documents in the release.
   */
  fetchDocuments({ releaseId }, options) {
    return _getReleaseDocuments(this.#client, this.#httpRequest, releaseId, options);
  }
};
var ReleasesClient = class {
  #client;
  #httpRequest;
  constructor(client2, httpRequest) {
    this.#client = client2, this.#httpRequest = httpRequest;
  }
  /**
   * @public
   *
   * Retrieve a release by id.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to retrieve.
   * @param options - Additional query options including abort signal and query tag.
   * @returns A promise that resolves to the release document {@link ReleaseDocument}.
   *
   * @example Retrieving a release by id
   * ```ts
   * const release = await client.releases.get({releaseId: 'my-release'})
   * console.log(release)
   * // {
   * //   _id: '_.releases.my-release',
   * //   name: 'my-release'
   * //   _type: 'system.release',
   * //   metadata: {releaseType: 'asap'},
   * //   _createdAt: '2021-01-01T00:00:00.000Z',
   * //   ...
   * // }
   * ```
   */
  get({ releaseId }, options) {
    return (0, import_rxjs.lastValueFrom)(
      _getDocument(
        this.#client,
        this.#httpRequest,
        `_.releases.${releaseId}`,
        options
      )
    );
  }
  async create(releaseOrOptions, maybeOptions) {
    const { action, options } = createRelease(releaseOrOptions, maybeOptions), { releaseId, metadata } = action;
    return { ...await (0, import_rxjs.lastValueFrom)(
      _action(this.#client, this.#httpRequest, action, options)
    ), releaseId, metadata };
  }
  /**
   * @public
   *
   * Edits an existing release, updating the metadata.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to edit.
   *   - `patch` - The patch operation to apply on the release metadata {@link PatchMutationOperation}.
   * @param options - Additional action options.
   * @returns A promise that resolves to the `transactionId`.
   */
  edit({ releaseId, patch }, options) {
    const editAction = {
      actionType: "sanity.action.release.edit",
      releaseId,
      patch
    };
    return (0, import_rxjs.lastValueFrom)(_action(this.#client, this.#httpRequest, editAction, options));
  }
  /**
   * @public
   *
   * Publishes all documents in a release at once. For larger releases the effect of the publish
   * will be visible immediately when querying but the removal of the `versions.<releasesId>.*`
   * documents and creation of the corresponding published documents with the new content may
   * take some time.
   *
   * During this period both the source and target documents are locked and cannot be
   * modified through any other means.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to publish.
   * @param options - Additional action options.
   * @returns A promise that resolves to the `transactionId`.
   */
  publish({ releaseId }, options) {
    const publishAction = {
      actionType: "sanity.action.release.publish",
      releaseId
    };
    return (0, import_rxjs.lastValueFrom)(_action(this.#client, this.#httpRequest, publishAction, options));
  }
  /**
   * @public
   *
   * An archive action removes an active release. The documents that comprise the release
   * are deleted and therefore no longer queryable.
   *
   * While the documents remain in retention the last version can still be accessed using document history endpoint.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to archive.
   * @param options - Additional action options.
   * @returns A promise that resolves to the `transactionId`.
   */
  archive({ releaseId }, options) {
    const archiveAction = {
      actionType: "sanity.action.release.archive",
      releaseId
    };
    return (0, import_rxjs.lastValueFrom)(_action(this.#client, this.#httpRequest, archiveAction, options));
  }
  /**
   * @public
   *
   * An unarchive action restores an archived release and all documents
   * with the content they had just prior to archiving.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to unarchive.
   * @param options - Additional action options.
   * @returns A promise that resolves to the `transactionId`.
   */
  unarchive({ releaseId }, options) {
    const unarchiveAction = {
      actionType: "sanity.action.release.unarchive",
      releaseId
    };
    return (0, import_rxjs.lastValueFrom)(_action(this.#client, this.#httpRequest, unarchiveAction, options));
  }
  /**
   * @public
   *
   * A schedule action queues a release for publishing at the given future time.
   * The release is locked such that no documents in the release can be modified and
   * no documents that it references can be deleted as this would make the publish fail.
   * At the given time, the same logic as for the publish action is triggered.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to schedule.
   *   - `publishAt` - The serialised date and time to publish the release. If the `publishAt` is in the past, the release will be published immediately.
   * @param options - Additional action options.
   * @returns A promise that resolves to the `transactionId`.
   */
  schedule({ releaseId, publishAt }, options) {
    const scheduleAction = {
      actionType: "sanity.action.release.schedule",
      releaseId,
      publishAt
    };
    return (0, import_rxjs.lastValueFrom)(_action(this.#client, this.#httpRequest, scheduleAction, options));
  }
  /**
   * @public
   *
   * An unschedule action stops a release from being published.
   * The documents in the release are considered unlocked and can be edited again.
   * This may fail if another release is scheduled to be published after this one and
   * has a reference to a document created by this one.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to unschedule.
   * @param options - Additional action options.
   * @returns A promise that resolves to the `transactionId`.
   */
  unschedule({ releaseId }, options) {
    const unscheduleAction = {
      actionType: "sanity.action.release.unschedule",
      releaseId
    };
    return (0, import_rxjs.lastValueFrom)(_action(this.#client, this.#httpRequest, unscheduleAction, options));
  }
  /**
   * @public
   *
   * A delete action removes a published or archived release.
   * The backing system document will be removed from the dataset.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to delete.
   * @param options - Additional action options.
   * @returns A promise that resolves to the `transactionId`.
   */
  delete({ releaseId }, options) {
    const deleteAction = {
      actionType: "sanity.action.release.delete",
      releaseId
    };
    return (0, import_rxjs.lastValueFrom)(_action(this.#client, this.#httpRequest, deleteAction, options));
  }
  /**
   * @public
   *
   * Fetch the documents in a release by release id.
   *
   * @category Releases
   *
   * @param params - Release action parameters:
   *   - `releaseId` - The id of the release to fetch documents for.
   * @param options - Additional mutation options {@link BaseMutationOptions}.
   * @returns A promise that resolves to the documents in the release.
   */
  fetchDocuments({ releaseId }, options) {
    return (0, import_rxjs.lastValueFrom)(_getReleaseDocuments(this.#client, this.#httpRequest, releaseId, options));
  }
};
var ObservableUsersClient = class {
  #client;
  #httpRequest;
  constructor(client2, httpRequest) {
    this.#client = client2, this.#httpRequest = httpRequest;
  }
  /**
   * Fetch a user by user ID
   *
   * @param id - User ID of the user to fetch. If `me` is provided, a minimal response including the users role is returned.
   */
  getById(id) {
    return _request(
      this.#client,
      this.#httpRequest,
      { uri: `/users/${id}` }
    );
  }
};
var UsersClient = class {
  #client;
  #httpRequest;
  constructor(client2, httpRequest) {
    this.#client = client2, this.#httpRequest = httpRequest;
  }
  /**
   * Fetch a user by user ID
   *
   * @param id - User ID of the user to fetch. If `me` is provided, a minimal response including the users role is returned.
   */
  getById(id) {
    return (0, import_rxjs.lastValueFrom)(
      _request(this.#client, this.#httpRequest, {
        uri: `/users/${id}`
      })
    );
  }
};
var ObservableSanityClient = class _ObservableSanityClient {
  assets;
  datasets;
  live;
  projects;
  users;
  agent;
  releases;
  /**
   * Private properties
   */
  #clientConfig;
  #httpRequest;
  /**
   * Instance properties
   */
  listen = _listen;
  constructor(httpRequest, config = defaultConfig) {
    this.config(config), this.#httpRequest = httpRequest, this.assets = new ObservableAssetsClient(this, this.#httpRequest), this.datasets = new ObservableDatasetsClient(this, this.#httpRequest), this.live = new LiveClient(this), this.projects = new ObservableProjectsClient(this, this.#httpRequest), this.users = new ObservableUsersClient(this, this.#httpRequest), this.agent = {
      action: new ObservableAgentsActionClient(this, this.#httpRequest)
    }, this.releases = new ObservableReleasesClient(this, this.#httpRequest);
  }
  /**
   * Clone the client - returns a new instance
   */
  clone() {
    return new _ObservableSanityClient(this.#httpRequest, this.config());
  }
  config(newConfig) {
    if (newConfig === void 0)
      return { ...this.#clientConfig };
    if (this.#clientConfig && this.#clientConfig.allowReconfigure === false)
      throw new Error(
        "Existing client instance cannot be reconfigured - use `withConfig(newConfig)` to return a new client"
      );
    return this.#clientConfig = initConfig(newConfig, this.#clientConfig || {}), this;
  }
  /**
   * Clone the client with a new (partial) configuration.
   *
   * @param newConfig - New client configuration properties, shallowly merged with existing configuration
   */
  withConfig(newConfig) {
    const thisConfig = this.config();
    return new _ObservableSanityClient(this.#httpRequest, {
      ...thisConfig,
      ...newConfig,
      stega: {
        ...thisConfig.stega || {},
        ...typeof newConfig?.stega == "boolean" ? { enabled: newConfig.stega } : newConfig?.stega || {}
      }
    });
  }
  fetch(query, params, options) {
    return _fetch(
      this,
      this.#httpRequest,
      this.#clientConfig.stega,
      query,
      params,
      options
    );
  }
  /**
   * Fetch a single document with the given ID.
   *
   * @param id - Document ID to fetch
   * @param options - Request options
   */
  getDocument(id, options) {
    return _getDocument(this, this.#httpRequest, id, options);
  }
  /**
   * Fetch multiple documents in one request.
   * Should be used sparingly - performing a query is usually a better option.
   * The order/position of documents is preserved based on the original array of IDs.
   * If any of the documents are missing, they will be replaced by a `null` entry in the returned array
   *
   * @param ids - Document IDs to fetch
   * @param options - Request options
   */
  getDocuments(ids, options) {
    return _getDocuments(this, this.#httpRequest, ids, options);
  }
  create(document2, options) {
    return _create(this, this.#httpRequest, document2, "create", options);
  }
  createIfNotExists(document2, options) {
    return _createIfNotExists(this, this.#httpRequest, document2, options);
  }
  createOrReplace(document2, options) {
    return _createOrReplace(this, this.#httpRequest, document2, options);
  }
  createVersion({
    document: document2,
    publishedId,
    releaseId,
    baseId,
    ifBaseRevisionId
  }, options) {
    if (!document2)
      return _createVersionFromBase(
        this,
        this.#httpRequest,
        publishedId,
        baseId,
        releaseId,
        ifBaseRevisionId,
        options
      );
    const documentVersionId = deriveDocumentVersionId("createVersion", {
      document: document2,
      publishedId,
      releaseId
    }), documentVersion = { ...document2, _id: documentVersionId }, versionPublishedId = publishedId || getPublishedId(document2._id);
    return _createVersion(
      this,
      this.#httpRequest,
      documentVersion,
      versionPublishedId,
      options
    );
  }
  delete(selection, options) {
    return _delete(this, this.#httpRequest, selection, options);
  }
  /**
   * @public
   *
   * Deletes the draft or release version of a document.
   *
   * @remarks
   * * Discarding a version with no `releaseId` will discard the draft version of the published document.
   * * If the draft or release version does not exist, any error will throw.
   *
   * @param params - Version action parameters:
   *   - `releaseId` - The ID of the release to discard the document from.
   *   - `publishedId` - The published ID of the document to discard.
   * @param purge - if `true` the document history is also discarded.
   * @param options - Additional action options.
   * @returns an observable that resolves to the `transactionId`.
   *
   * @example Discarding a release version of a document
   * ```ts
   * client.observable.discardVersion({publishedId: 'myDocument', releaseId: 'myRelease'})
   * // The document with the ID `versions.myRelease.myDocument` will be discarded.
   * ```
   *
   * @example Discarding a draft version of a document
   * ```ts
   * client.observable.discardVersion({publishedId: 'myDocument'})
   * // The document with the ID `drafts.myDocument` will be discarded.
   * ```
   */
  discardVersion({ releaseId, publishedId }, purge, options) {
    const documentVersionId = getDocumentVersionId(publishedId, releaseId);
    return _discardVersion(this, this.#httpRequest, documentVersionId, purge, options);
  }
  replaceVersion({
    document: document2,
    publishedId,
    releaseId
  }, options) {
    const documentVersionId = deriveDocumentVersionId("replaceVersion", {
      document: document2,
      publishedId,
      releaseId
    }), documentVersion = { ...document2, _id: documentVersionId };
    return _replaceVersion(this, this.#httpRequest, documentVersion, options);
  }
  /**
   * @public
   *
   * Used to indicate when a document within a release should be unpublished when
   * the release is run.
   *
   * @remarks
   * * If the published document does not exist, an error will be thrown.
   *
   * @param params - Version action parameters:
   *   - `releaseId` - The ID of the release to unpublish the document from.
   *   - `publishedId` - The published ID of the document to unpublish.
   * @param options - Additional action options.
   * @returns an observable that resolves to the `transactionId`.
   *
   * @example Unpublishing a release version of a published document
   * ```ts
   * client.observable.unpublishVersion({publishedId: 'myDocument', releaseId: 'myRelease'})
   * // The document with the ID `versions.myRelease.myDocument` will be unpublished. when `myRelease` is run.
   * ```
   */
  unpublishVersion({ releaseId, publishedId }, options) {
    const versionId = getVersionId(publishedId, releaseId);
    return _unpublishVersion(this, this.#httpRequest, versionId, publishedId, options);
  }
  mutate(operations, options) {
    return _mutate(this, this.#httpRequest, operations, options);
  }
  /**
   * Create a new buildable patch of operations to perform
   *
   * @param selection - Document ID, an array of document IDs, or an object with `query` and optional `params`, defining which document(s) to patch
   * @param operations - Optional object of patch operations to initialize the patch instance with
   * @returns Patch instance - call `.commit()` to perform the operations defined
   */
  patch(selection, operations) {
    return new ObservablePatch(selection, operations, this);
  }
  /**
   * Create a new transaction of mutations
   *
   * @param operations - Optional array of mutation operations to initialize the transaction instance with
   */
  transaction(operations) {
    return new ObservableTransaction(operations, this);
  }
  /**
   * Perform action operations against the configured dataset
   *
   * @param operations - Action operation(s) to execute
   * @param options - Action options
   */
  action(operations, options) {
    return _action(this, this.#httpRequest, operations, options);
  }
  /**
   * Perform an HTTP request against the Sanity API
   *
   * @param options - Request options
   */
  request(options) {
    return _request(this, this.#httpRequest, options);
  }
  /**
   * Get a Sanity API URL for the URI provided
   *
   * @param uri - URI/path to build URL for
   * @param canUseCdn - Whether or not to allow using the API CDN for this route
   */
  getUrl(uri, canUseCdn) {
    return _getUrl(this, uri, canUseCdn);
  }
  /**
   * Get a Sanity API URL for the data operation and path provided
   *
   * @param operation - Data operation (eg `query`, `mutate`, `listen` or similar)
   * @param path - Path to append after the operation
   */
  getDataUrl(operation, path) {
    return _getDataUrl(this, operation, path);
  }
};
var SanityClient = class _SanityClient {
  assets;
  datasets;
  live;
  projects;
  users;
  agent;
  releases;
  /**
   * Observable version of the Sanity client, with the same configuration as the promise-based one
   */
  observable;
  /**
   * Private properties
   */
  #clientConfig;
  #httpRequest;
  /**
   * Instance properties
   */
  listen = _listen;
  constructor(httpRequest, config = defaultConfig) {
    this.config(config), this.#httpRequest = httpRequest, this.assets = new AssetsClient(this, this.#httpRequest), this.datasets = new DatasetsClient(this, this.#httpRequest), this.live = new LiveClient(this), this.projects = new ProjectsClient(this, this.#httpRequest), this.users = new UsersClient(this, this.#httpRequest), this.agent = {
      action: new AgentActionsClient(this, this.#httpRequest)
    }, this.releases = new ReleasesClient(this, this.#httpRequest), this.observable = new ObservableSanityClient(httpRequest, config);
  }
  /**
   * Clone the client - returns a new instance
   */
  clone() {
    return new _SanityClient(this.#httpRequest, this.config());
  }
  config(newConfig) {
    if (newConfig === void 0)
      return { ...this.#clientConfig };
    if (this.#clientConfig && this.#clientConfig.allowReconfigure === false)
      throw new Error(
        "Existing client instance cannot be reconfigured - use `withConfig(newConfig)` to return a new client"
      );
    return this.observable && this.observable.config(newConfig), this.#clientConfig = initConfig(newConfig, this.#clientConfig || {}), this;
  }
  /**
   * Clone the client with a new (partial) configuration.
   *
   * @param newConfig - New client configuration properties, shallowly merged with existing configuration
   */
  withConfig(newConfig) {
    const thisConfig = this.config();
    return new _SanityClient(this.#httpRequest, {
      ...thisConfig,
      ...newConfig,
      stega: {
        ...thisConfig.stega || {},
        ...typeof newConfig?.stega == "boolean" ? { enabled: newConfig.stega } : newConfig?.stega || {}
      }
    });
  }
  fetch(query, params, options) {
    return (0, import_rxjs.lastValueFrom)(
      _fetch(
        this,
        this.#httpRequest,
        this.#clientConfig.stega,
        query,
        params,
        options
      )
    );
  }
  /**
   * Fetch a single document with the given ID.
   *
   * @param id - Document ID to fetch
   * @param options - Request options
   */
  getDocument(id, options) {
    return (0, import_rxjs.lastValueFrom)(_getDocument(this, this.#httpRequest, id, options));
  }
  /**
   * Fetch multiple documents in one request.
   * Should be used sparingly - performing a query is usually a better option.
   * The order/position of documents is preserved based on the original array of IDs.
   * If any of the documents are missing, they will be replaced by a `null` entry in the returned array
   *
   * @param ids - Document IDs to fetch
   * @param options - Request options
   */
  getDocuments(ids, options) {
    return (0, import_rxjs.lastValueFrom)(_getDocuments(this, this.#httpRequest, ids, options));
  }
  create(document2, options) {
    return (0, import_rxjs.lastValueFrom)(
      _create(this, this.#httpRequest, document2, "create", options)
    );
  }
  createIfNotExists(document2, options) {
    return (0, import_rxjs.lastValueFrom)(
      _createIfNotExists(this, this.#httpRequest, document2, options)
    );
  }
  createOrReplace(document2, options) {
    return (0, import_rxjs.lastValueFrom)(
      _createOrReplace(this, this.#httpRequest, document2, options)
    );
  }
  createVersion({
    document: document2,
    publishedId,
    releaseId,
    baseId,
    ifBaseRevisionId
  }, options) {
    if (!document2)
      return (0, import_rxjs.firstValueFrom)(
        _createVersionFromBase(
          this,
          this.#httpRequest,
          publishedId,
          baseId,
          releaseId,
          ifBaseRevisionId,
          options
        )
      );
    const documentVersionId = deriveDocumentVersionId("createVersion", {
      document: document2,
      publishedId,
      releaseId
    }), documentVersion = { ...document2, _id: documentVersionId }, versionPublishedId = publishedId || getPublishedId(document2._id);
    return (0, import_rxjs.firstValueFrom)(
      _createVersion(
        this,
        this.#httpRequest,
        documentVersion,
        versionPublishedId,
        options
      )
    );
  }
  delete(selection, options) {
    return (0, import_rxjs.lastValueFrom)(_delete(this, this.#httpRequest, selection, options));
  }
  /**
   * @public
   *
   * Deletes the draft or release version of a document.
   *
   * @remarks
   * * Discarding a version with no `releaseId` will discard the draft version of the published document.
   * * If the draft or release version does not exist, any error will throw.
   *
   * @param params - Version action parameters:
   *   - `releaseId` - The ID of the release to discard the document from.
   *   - `publishedId` - The published ID of the document to discard.
   * @param purge - if `true` the document history is also discarded.
   * @param options - Additional action options.
   * @returns a promise that resolves to the `transactionId`.
   *
   * @example Discarding a release version of a document
   * ```ts
   * client.discardVersion({publishedId: 'myDocument', releaseId: 'myRelease'})
   * // The document with the ID `versions.myRelease.myDocument` will be discarded.
   * ```
   *
   * @example Discarding a draft version of a document
   * ```ts
   * client.discardVersion({publishedId: 'myDocument'})
   * // The document with the ID `drafts.myDocument` will be discarded.
   * ```
   */
  discardVersion({ releaseId, publishedId }, purge, options) {
    const documentVersionId = getDocumentVersionId(publishedId, releaseId);
    return (0, import_rxjs.lastValueFrom)(
      _discardVersion(this, this.#httpRequest, documentVersionId, purge, options)
    );
  }
  replaceVersion({
    document: document2,
    publishedId,
    releaseId
  }, options) {
    const documentVersionId = deriveDocumentVersionId("replaceVersion", {
      document: document2,
      publishedId,
      releaseId
    }), documentVersion = { ...document2, _id: documentVersionId };
    return (0, import_rxjs.firstValueFrom)(
      _replaceVersion(this, this.#httpRequest, documentVersion, options)
    );
  }
  /**
   * @public
   *
   * Used to indicate when a document within a release should be unpublished when
   * the release is run.
   *
   * @remarks
   * * If the published document does not exist, an error will be thrown.
   *
   * @param params - Version action parameters:
   *   - `releaseId` - The ID of the release to unpublish the document from.
   *   - `publishedId` - The published ID of the document to unpublish.
   * @param options - Additional action options.
   * @returns a promise that resolves to the `transactionId`.
   *
   * @example Unpublishing a release version of a published document
   * ```ts
   * await client.unpublishVersion({publishedId: 'myDocument', releaseId: 'myRelease'})
   * // The document with the ID `versions.myRelease.myDocument` will be unpublished. when `myRelease` is run.
   * ```
   */
  unpublishVersion({ releaseId, publishedId }, options) {
    const versionId = getVersionId(publishedId, releaseId);
    return (0, import_rxjs.lastValueFrom)(
      _unpublishVersion(this, this.#httpRequest, versionId, publishedId, options)
    );
  }
  mutate(operations, options) {
    return (0, import_rxjs.lastValueFrom)(_mutate(this, this.#httpRequest, operations, options));
  }
  /**
   * Create a new buildable patch of operations to perform
   *
   * @param selection - Document ID, an array of document IDs, or an object with `query` and optional `params`, defining which document(s) to patch
   * @param operations - Optional object of patch operations to initialize the patch instance with
   * @returns Patch instance - call `.commit()` to perform the operations defined
   */
  patch(documentId, operations) {
    return new Patch(documentId, operations, this);
  }
  /**
   * Create a new transaction of mutations
   *
   * @param operations - Optional array of mutation operations to initialize the transaction instance with
   */
  transaction(operations) {
    return new Transaction(operations, this);
  }
  /**
   * Perform action operations against the configured dataset
   * Returns a promise that resolves to the transaction result
   *
   * @param operations - Action operation(s) to execute
   * @param options - Action options
   */
  action(operations, options) {
    return (0, import_rxjs.lastValueFrom)(_action(this, this.#httpRequest, operations, options));
  }
  /**
   * Perform a request against the Sanity API
   * NOTE: Only use this for Sanity API endpoints, not for your own APIs!
   *
   * @param options - Request options
   * @returns Promise resolving to the response body
   */
  request(options) {
    return (0, import_rxjs.lastValueFrom)(_request(this, this.#httpRequest, options));
  }
  /**
   * Perform an HTTP request a `/data` sub-endpoint
   * NOTE: Considered internal, thus marked as deprecated. Use `request` instead.
   *
   * @deprecated - Use `request()` or your own HTTP library instead
   * @param endpoint - Endpoint to hit (mutate, query etc)
   * @param body - Request body
   * @param options - Request options
   * @internal
   */
  dataRequest(endpoint, body, options) {
    return (0, import_rxjs.lastValueFrom)(_dataRequest(this, this.#httpRequest, endpoint, body, options));
  }
  /**
   * Get a Sanity API URL for the URI provided
   *
   * @param uri - URI/path to build URL for
   * @param canUseCdn - Whether or not to allow using the API CDN for this route
   */
  getUrl(uri, canUseCdn) {
    return _getUrl(this, uri, canUseCdn);
  }
  /**
   * Get a Sanity API URL for the data operation and path provided
   *
   * @param operation - Data operation (eg `query`, `mutate`, `listen` or similar)
   * @param path - Path to append after the operation
   */
  getDataUrl(operation, path) {
    return _getDataUrl(this, operation, path);
  }
};
function defineCreateClientExports(envMiddleware, ClassConstructor) {
  return { requester: defineHttpRequest(envMiddleware), createClient: (config) => {
    const clientRequester = defineHttpRequest(envMiddleware, {
      ignoreWarnings: config.ignoreWarnings
    });
    return new ClassConstructor(
      (options, requester2) => (requester2 || clientRequester)({
        maxRedirects: 0,
        maxRetries: config.maxRetries,
        retryDelay: config.retryDelay,
        ...options
      }),
      config
    );
  } };
}
function defineDeprecatedCreateClient(createClient22) {
  return function(config) {
    return printNoDefaultExport(), createClient22(config);
  };
}
var name = "@sanity/client";
var version = "7.10.0";
var middleware = [
  S({ verbose: true, namespace: "sanity:client" }),
  I({ "User-Agent": `${name} ${version}` }),
  // Enable keep-alive, and in addition limit the number of sockets that can be opened.
  // This avoids opening too many connections to the server if someone tries to execute
  // a bunch of requests in parallel. It's recommended to have a concurrency limit
  // at a "higher limit" (i.e. you shouldn't actually execute hundreds of requests in parallel),
  // and this is mainly to minimize the impact for the network and server.
  //
  // We're currently matching the same defaults as browsers:
  // https://stackoverflow.com/questions/26003756/is-there-a-limit-practical-or-otherwise-to-the-number-of-web-sockets-a-page-op
  l2({
    keepAlive: true,
    maxSockets: 30,
    maxTotalSockets: 256
  })
];
var exp = defineCreateClientExports(middleware, SanityClient);
var requester = exp.requester;
var createClient = exp.createClient;
var deprecatedCreateClient = defineDeprecatedCreateClient(createClient);

// src/lib/sanity/client.ts
var import_image_url = __toESM(require_node4(), 1);
var createClient2 = createClient || deprecatedCreateClient?.createClient;
var client = createClient2({
  // Fallback to dummy values if env vars are not set, which is common in test environments
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "projectId",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "dataset",
  apiVersion: "2024-01-01",
  useCdn: false
  // Typically false for tests and server-side logic
});
var imageUrlBuilder = import_image_url.default.default || import_image_url.default;
var builder = imageUrlBuilder(client);

// src/utils/api-response.ts
var import_response = __toESM(require_response(), 1);
var ApiResponseHandler = {
  success: (data, message) => {
    return import_response.NextResponse.json(
      { success: true, data, message }
    );
  },
  error: (error, status = 400, details) => {
    const payload = { success: false, error };
    if (details !== void 0) payload.details = details;
    return import_response.NextResponse.json(payload, { status });
  },
  notFound: (resource) => {
    const msg = resource ? `${resource} not found` : "Resource not found";
    return import_response.NextResponse.json(
      { success: false, error: msg },
      { status: 404 }
    );
  },
  unauthorized: () => {
    return import_response.NextResponse.json(
      { success: false, error: "Unauthorized access" },
      { status: 401 }
    );
  },
  forbidden: () => {
    return import_response.NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }
};

// src/utils/sanitize.ts
function sanitizeBasic(input, maxLen = 200) {
  if (typeof input !== "string") return "";
  const trimmed = input.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}
function escapeGroqLiteral(input) {
  if (typeof input !== "string") return "";
  return JSON.stringify(input).slice(1, -1);
}
function escapeGroqMatch(input) {
  if (typeof input !== "string") return "";
  const jsonEscaped = JSON.stringify(input).slice(1, -1);
  return jsonEscaped.replace(/([.*+?^${}()|[\]\\])/g, "\\$1");
}
function sanitizeStringArray(value, opts) {
  const maxLen = opts?.maxLen ?? 100;
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  const out = arr.map((v3) => sanitizeBasic(String(v3), maxLen)).filter((v3) => v3.length > 0);
  return Array.from(new Set(out));
}
function clampInt(n5, { min = 1, max = 100 } = {}) {
  if (!Number.isFinite(n5)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n5)));
}

// app/api/search/route.ts
var LISTING_FIELDS = `
  _id,
  name,
  "slug": slug,
  category,
  "primaryImage": primaryImage{..., asset->},
  "galleryImages": galleryImages[]{..., asset->},
  "location": city->{ _id, name, "slug": slug.current, country },
  priceRange,
  moderation,
  shortDescription,
  longDescription,
  ecoFeatures,
  amenities
`;
function buildWhereClause({
  q: q2,
  categories,
  destinations,
  amenities,
  nomadFeatures
}) {
  const MAX_ARRAY_SIZE = 50;
  const MAX_STRING_LENGTH = 200;
  if (categories.length > MAX_ARRAY_SIZE || destinations.length > MAX_ARRAY_SIZE || amenities.length > MAX_ARRAY_SIZE || nomadFeatures.length > MAX_ARRAY_SIZE) {
    throw new Error("Too many filter values provided");
  }
  if (q2.length > MAX_STRING_LENGTH) {
    throw new Error("Search query too long");
  }
  const filters = ['_type == "listing"', 'moderation.status == "published"'];
  if (q2) {
    const pattern = escapeGroqMatch(q2.toLowerCase());
    filters.push("(" + [
      `lower(name) match "*${pattern}*"`,
      `lower(coalesce(slug.current, slug)) match "*${pattern}*"`,
      `lower(category) match "*${pattern}*"`,
      `lower(city->name) match "*${pattern}*"`,
      `lower(city->country) match "*${pattern}*"`,
      `lower(shortDescription) match "*${pattern}*"`
    ].join(" || ") + ")");
  }
  if (categories.length) {
    const group = categories.map((c4) => `category == "${escapeGroqLiteral(c4)}"`).join(" || ");
    filters.push(`(${group})`);
  }
  if (destinations.length) {
    const eq = destinations.map((d2) => `city->name == "${escapeGroqLiteral(d2)}"`).join(" || ");
    const match = destinations.map((d2) => `city->name match "*${escapeGroqMatch(d2)}*"`).join(" || ");
    filters.push(`((${eq}) || (${match}))`);
  }
  if (amenities.length) {
    const eq = amenities.map((a3) => `amenities[] == "${escapeGroqLiteral(a3)}"`).join(" || ");
    const nfs = amenities.map((a3) => `array::contains(digitalNomadFeatures[]->name, "${escapeGroqLiteral(a3)}")`).join(" || ");
    filters.push(`(${eq})`);
    filters.push(`(${nfs})`);
  }
  if (nomadFeatures.length) {
    const nfs = nomadFeatures.map((nf) => `array::contains(digitalNomadFeatures[]->name, "${escapeGroqLiteral(nf)}")`).join(" || ");
    filters.push(`(${nfs})`);
  }
  return filters.join(" && ");
}
function buildQuery({
  q: q2,
  categories,
  destinations,
  amenities,
  nomadFeatures,
  start,
  end
}) {
  const where = buildWhereClause({ q: q2, categories, destinations, amenities, nomadFeatures });
  const fields = `{${LISTING_FIELDS}}`;
  const query = `*[${where}] | order(_createdAt desc, _id desc)[${start}...${end}] ${fields}`;
  const countQuery = `count(*[${where}])`;
  return { query, countQuery };
}
async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q2 = sanitizeBasic(searchParams.get("q") || "");
    const page = clampInt(Number.parseInt(searchParams.get("page") ?? "1", 10) || 1, { min: 1, max: 1e5 });
    const limit = clampInt(Number.parseInt(searchParams.get("limit") ?? "12", 10) || 12, { min: 1, max: 100 });
    const categories = sanitizeStringArray(searchParams.getAll("category"));
    const destinations = sanitizeStringArray(searchParams.getAll("destination"));
    const amenities = sanitizeStringArray(searchParams.getAll("amenities"));
    const nomadFeatures = sanitizeStringArray(searchParams.getAll("nomadFeatures"));
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    const { query, countQuery } = buildQuery({
      q: q2,
      categories,
      destinations,
      amenities,
      nomadFeatures,
      start,
      end
    });
    const [results, total] = await Promise.all([
      client.fetch(query),
      client.fetch(countQuery)
    ]);
    return ApiResponseHandler.success({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        hasMore: page * limit < total
      },
      filters: {
        query: q2,
        category: categories,
        destination: destinations,
        amenities,
        nomadFeatures
      }
    });
  } catch (error) {
    console.error("Search GET error:", error);
    return ApiResponseHandler.error("Search failed", 400);
  }
}
async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return ApiResponseHandler.error("Failed to perform search", 400);
    }
    const q2 = sanitizeBasic(String(body.query ?? ""));
    const page = clampInt(Number(body.page ?? 1), { min: 1, max: 1e5 });
    const limit = clampInt(Number(body.limit ?? 12), { min: 1, max: 100 });
    const categories = sanitizeStringArray(body.category);
    const destinations = sanitizeStringArray(body.destination);
    const amenities = sanitizeStringArray(body.amenities);
    const nomadFeatures = sanitizeStringArray(body.nomadFeatures);
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    const { query, countQuery } = buildQuery({ q: q2, categories, destinations, amenities, nomadFeatures, start, end });
    const [results, total] = await Promise.all([
      client.fetch(query),
      client.fetch(countQuery)
    ]);
    return ApiResponseHandler.success({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        hasMore: page * limit < total
      },
      filters: {
        query: q2,
        category: categories,
        destination: destinations,
        amenities,
        nomadFeatures
      }
    });
  } catch (error) {
    console.error("Search POST error:", error);
    return ApiResponseHandler.error("Failed to perform search");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GET,
  POST
});
/*! Bundled license information:

safe-buffer/index.js:
  (*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
