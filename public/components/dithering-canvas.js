// src/components/dither-canvas.js
import { ditherAtkinsonChunked } from "../lib/dithering.js";

class DitherCanvas extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.canvas = null;
    this.ctx = null;
    this.originalImageData = null;
  }

  connectedCallback() {
    this.render();
    this.setupCanvas();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="../styles/custom.css" />
      <canvas class="dither-canvas" width="400" height="300"></canvas>
    `;
  }

  setupCanvas() {
    this.canvas = this.shadowRoot.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
  }

  static get observedAttributes() {
    return ["image-data", "dither-value"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "image-data" && newValue) {
      this.loadImage(newValue);
    }
    if (name === "dither-value" && this.originalImageData) {
      this.applyDither(parseInt(newValue));
    }
  }

  loadImage(imageSrc) {
    const img = new Image();
    img.onload = () => {
      // Keep a relatively fixed drawing area like the reference app
      const maxSize = 384;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const drawW = Math.floor(img.width * scale);
      const drawH = Math.floor(img.height * scale);

      this.canvas.width = drawW;
      this.canvas.height = drawH;
      this.ctx.clearRect(0, 0, drawW, drawH);
      this.ctx.drawImage(img, 0, 0, drawW, drawH);
      this.originalImageData = this.ctx.getImageData(0, 0, drawW, drawH);
      this.applyDither(128);
    };
    img.src = imageSrc;
  }

  applyDither(threshold) {
    if (!this.originalImageData) return;

    // Use shared library implementation
    this.dispatchEvent(new CustomEvent("dither-start", { detail: {} }));
    ditherAtkinsonChunked(this.originalImageData, threshold, {
      onProgress: (progress) => {
        this.dispatchEvent(
          new CustomEvent("dither-progress", { detail: { progress } })
        );
      },
    }).then((dithered) => {
      this.ctx.putImageData(dithered, 0, 0);
      this.dispatchEvent(
        new CustomEvent("dither-complete", { detail: { imageData: dithered } })
      );
    });
  }

  getImageData() {
    return this.canvas.toDataURL();
  }
}

customElements.define("dither-canvas", DitherCanvas);
