/*
 * Clamp.js
 * 参考 https://github.com/josephschmitt/Clamp.js
 */

let defaults = {
  clamp: 2,
  // Split on sentences (periods), hypens, en-dashes, em-dashes, and words (spaces).
  splitOnChars: ['.', '-', '–', '—', ' '],
  truncateChar: '...'
}

class Clamp {
  constructor(element, options) {
    this.el = element;
    this.opt = {
      ...defaults,
      ...options
    };

    if (this.opt.clamp === 'auto') {
      this.opt.clamp = this.getMaxLines();
    }

    this.chunks = null;
    this.lastChunk = null;

    this.splitOnChars = this.opt.splitOnChars.slice(0);
    this.splitChar = this.splitOnChars[0];

    this.init()
  }

  init() {
    const clamp = this.opt.clamp;

    if (typeof (this.el.style.webkitLineClamp) != 'undefined') {
      this.el.style.overflow = 'hidden';
      this.el.style.textOverflow = 'ellipsis';
      this.el.style.webkitBoxOrient = 'vertical';
      this.el.style.display = '-webkit-box';
      this.el.style.webkitLineClamp = clamp;
      return;
    }

    const height = this.getMaxHeight(clamp);
    if (height < this.el.clientHeight) {
      this.truncate(
        this.getLastChild(this.el),
        height
      );
    }
  }

  truncate(target, maxHeight) {
    if (!maxHeight) return;

    //Grab the next chunks
    if (!this.chunks) {
      //If there are more characters to try, grab the next one
      if (this.splitOnChars.length > 0) {
        this.splitChar = this.splitOnChars.shift();
      } else {
        //No characters to chunk by. Go character-by-character
        this.splitChar = '';
      }

      this.chunks = target.nodeValue.replace(/…/, '').split(this.splitChar);
    }

    // If there are chunks left to remove, remove the last one and see if the nodeValue fits.
    if (this.chunks.length > 1) {
      this.lastChunk = this.chunks.pop();
      this.applyEllipsis(
        target,
        this.chunks.join(this.splitChar)
      );
    } else {
      //No more chunks can be removed using this character
      this.chunks = null;
    }

    //Search produced valid chunks
    if (this.chunks) {
      //It fits
      if (this.el.clientHeight < maxHeight) {
        //There's still more characters to try splitting on, not quite done yet
        if (this.splitOnChars.length >= 0 && this.splitChar !== '') {
          this.applyEllipsis(
            target,
            this.chunks.join(this.splitChar) + this.splitChar + this.lastChunk
          );
          this.chunks = null;
        } else {
          return false;
        }
      }
    } else {
      // No valid chunks even when splitting by letter, time to move on to the next node
      if (this.splitChar === '') {
        this.applyEllipsis(target, '');
        target = this.getLastChild(this.el);

        this.reset();
      }
    }

    return this.truncate(target, maxHeight);
  }
  
  reset() {
    this.splitOnChars = this.opt.splitOnChars.slice(0);
    this.splitChar = this.splitOnChars[0];
    this.chunks = null;
    this.lastChunk = null;
  }

  getStyle(elem, prop) {
    if (!window.getComputedStyle) {
      window.getComputedStyle = function (el, pseudo) {
        this.getPropertyValue = function (prop) {
          var re = /(\-([a-z]){1})/g;
          if (prop ==- 'float') prop = 'styleFloat';
          if (re.test(prop)) {
            prop = prop.replace(re, function () {
              return arguments[2].toUpperCase();
            });
          }
          return el.currentStyle && el.currentStyle[prop] ? el.currentStyle[prop] : null;
        }
        return this;
      }
    }

    return window.getComputedStyle(elem, null).getPropertyValue(prop);
  }

  getMaxLines(height) {
    const availHeight = height || this.el.clientHeight;
    const lineHeight = this.getLineHeight(this.el);

    return Math.max(Math.floor(availHeight / lineHeight), 0);
  }

  getMaxHeight(clamp) {
    var lineHeight = this.getLineHeight(this.el);
    return lineHeight * (clamp + 1);
  }

  getLineHeight(el) {
    var lh = this.getStyle(el, 'line-height');
    if (lh == 'normal') {
      lh = parseInt(this.getStyle(el, 'font-size')) * 1.2;
    }
    return parseInt(lh);
  }

  getLastChild(el) {
    //Current element has children, need to go deeper and get last child as a text node
    if (el.lastChild.children && el.lastChild.children.length > 0) {
      return this.getLastChild(Array.prototype.slice.call(el.children).pop());
    } else if (!el.lastChild || !el.lastChild.nodeValue || el.lastChild.nodeValue === '' || el.lastChild.nodeValue === '…') {
      //This is th  e absolute last child, a text node, but something's wrong with it. Remove it and keep trying
      el.lastChild.parentNode.removeChild(el.lastChild);
      return this.getLastChild(this.el);
    } else {
      //This is the last child we want, return it
      return el.lastChild;
    }
  }

  applyEllipsis(el, str) {
    el.nodeValue = str + this.opt.truncateChar;
  }
}