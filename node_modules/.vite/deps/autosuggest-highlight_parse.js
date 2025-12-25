import {
  __commonJS
} from "./chunk-V4OQ3NZ2.js";

// node_modules/autosuggest-highlight/parse/index.js
var require_parse = __commonJS({
  "node_modules/autosuggest-highlight/parse/index.js"(exports, module) {
    !function(t, e) {
      "object" == typeof exports && "object" == typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define([], e) : "object" == typeof exports ? exports.AutosuggestHighlightParse = e() : t.AutosuggestHighlightParse = e();
    }(exports, () => {
      return t = { 705: (t2) => {
        t2.exports = function(t3, e2) {
          const h = [];
          return 0 === e2.length ? h.push({ text: t3, highlight: false }) : e2[0][0] > 0 && h.push({ text: t3.slice(0, e2[0][0]), highlight: false }), e2.forEach((i, o) => {
            const s = i[0], r = i[1];
            h.push({ text: t3.slice(s, r), highlight: true }), o === e2.length - 1 ? r < t3.length && h.push({ text: t3.slice(r, t3.length), highlight: false }) : r < e2[o + 1][0] && h.push({ text: t3.slice(r, e2[o + 1][0]), highlight: false });
          }), h;
        };
      } }, e = {}, function h(i) {
        var o = e[i];
        if (void 0 !== o) return o.exports;
        var s = e[i] = { exports: {} };
        return t[i](s, s.exports, h), s.exports;
      }(705);
      var t, e;
    });
  }
});
export default require_parse();
//# sourceMappingURL=autosuggest-highlight_parse.js.map
