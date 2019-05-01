let defaults = {
  clamp: 2,
  truncateChar: '...'
}

class clamp {
  constructor(el, options) {
    this.el = el;
    this.opt = {
      ...defaults,
      ...options
    }
    this.init()
  }

  init() {
    // measurement element is made a child of the clamped element to get it's style
    this.measure = this._createEl('span');
    this._notReflow(this.measure);
    this.lineWidth = this.el.clientWidth;
    this.lineCount = 1;
    this.line;
    this.lineText;
    this.wasNewLine = false;
    // reset to safe starting values
    this.lineStart = 0;
    this.wordStart = 0;

    const clamp = this.opt.clamp;

    if (typeof (this.el.style.webkitLineClamp) != 'undefined') {
      this.el.style.overflow = 'hidden';
      this.el.style.textOverflow = 'ellipsis';
      this.el.style.webkitBoxOrient = 'vertical';
      this.el.style.display = '-webkit-box';
      this.el.style.webkitLineClamp = clamp;
      return;
    }

    // get all the text, remove any line changes
    this.text = (this.el.textContent || this.el.innerText).replace(/\n/g, ' ');
    // make sure the element belongs to the document
    if (!this.el.ownerDocument || !this.el.ownerDocument === document) return;
    // remove all content
    while (this.el.firstChild !== null) {
      this.el.removeChild(this.el.firstChild);
    }
    // add measurement element within so it inherits styles
    this.el.appendChild(this.measure);
    // http://ejohn.org/blog/search-and-dont-replace/
    for(var pos = 0; pos < this.text.length && this.lineCount < this.opt.clamp; pos += 1) {
      // create a text node and place it in the measurement element
      this.measure.appendChild(
        this._createTn(this.text.substr(this.lineStart, pos - this.lineStart))
      );
      // have we exceeded allowed line width?
      if (this.lineWidth <= this.measure.clientWidth) {
        if (this.wasNewLine) {
          // we have a long word so it gets a line of it's own
          this.lineText = this.text.substr(this.lineStart, pos - this.lineStart);
          // next line start position
          this.lineStart = pos;
        } else {
          // grab the text until this word
          this.lineText = this.text.substr(this.lineStart, this.wordStart - this.lineStart);
          // next line start position
          this.lineStart = this.wordStart;
        }
        // create a line element
        this.line = this._createEl('span');
        // add text to the line element
        this.line.appendChild(this._createTn(this.lineText));
        // add the line element to the container
        this.el.appendChild(this.line);
        // yes, we created a new line
        this.wasNewLine = true;
        this.lineCount++;
      } else {
        // did not create a new line
        this.wasNewLine = false;
      }
      // remember last word start position
      this.wordStart = pos;
      // clear measurement element
      this.measure.removeChild(this.measure.firstChild);
    }
    // remove the measurement element from the container
    this.el.removeChild(this.measure);
    // create the last line element
    this.line = this._createEl('span');
    // give styles required for text-overflow to kick in
    this._setStyle(this.line);
    // add all remaining text to the line element
    this.line.appendChild(
      this._createTn(this.text.substr(this.lineStart))
    );
    // add the line element to the container
    this.el.appendChild(this.line);
  }
  
  _createEl(tag) {
    return document.createElement(tag)
  }

  _createTn(node) {
    return document.createTextNode(node)
  }

  _setStyle(el) {
    el.style.display = 'inline-block';
    el.style.overflow = 'hidden';
    el.style.textOverflow = 'ellipsis';
    el.style.whiteSpace = 'nowrap';
    el.style.width = '100%';
  }

  _notReflow(el) {
    el.style.position = 'absolute'; // prevent page reflow
    el.style.whiteSpace = 'pre'; // cross-browser width results
    el.style.visibility = 'hidden'; // prevent drawing
  }
}