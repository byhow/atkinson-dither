// Vertical slider web component
class VerticalSlider extends HTMLElement {
  constructor() {
    super();
    this.isDragging = false;
    this.value = 128;
    this.min = 0;
    this.max = 255;
    this.height = 200;
    this.disabled = false;
    this.render();
    this.setupEventListeners();
  }

  static get observedAttributes() {
    return ["value", "min", "max", "height", "disabled"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case "value":
          this.value = parseInt(newValue) || 128;
          break;
        case "min":
          this.min = parseInt(newValue) || 0;
          break;
        case "max":
          this.max = parseInt(newValue) || 255;
          break;
        case "height":
          this.height = parseInt(newValue) || 200;
          break;
        case "disabled":
          this.disabled = newValue !== null;
          break;
      }
      this.render(); // Re-render when attributes change like VerticalRetroSlider
    }
  }

  render() {
    const percentage = ((this.value - this.min) / (this.max - this.min)) * 100;

    this.innerHTML = `
      <div 
        class="mac-slider-vertical" 
        style="height: ${this.height}px; cursor: ${
      this.disabled ? "default" : "pointer"
    }"
        ${this.disabled ? "disabled" : ""}
        id="slider"
      >
        <div 
          class="mac-slider-fill-vertical" 
          style="height: ${percentage}%; bottom: 0"
        ></div>
        <div 
          class="mac-slider-thumb-vertical"
          style="bottom: ${percentage}%; cursor: ${
      this.disabled ? "default" : this.isDragging ? "grabbing" : "grab"
    }"
          id="thumb"
        ></div>
      </div>
    `;
  }

  updateSlider() {
    const percentage = ((this.value - this.min) / (this.max - this.min)) * 100;
    const fill = this.querySelector(".mac-slider-fill-vertical");
    const thumb = this.querySelector(".mac-slider-thumb-vertical");

    if (fill && thumb) {
      fill.style.height = `${percentage}%`;
      thumb.style.bottom = `${percentage}%`;
      thumb.style.cursor = this.disabled
        ? "default"
        : this.isDragging
        ? "grabbing"
        : "grab";
    }
  }

  calculateValue(clientY) {
    const slider = this.querySelector("#slider");
    if (!slider) return this.value;

    const rect = slider.getBoundingClientRect();
    const clickY = clientY - rect.top;
    // Invert Y coordinate so top is max value, bottom is min value
    const newPercentage = Math.max(
      0,
      Math.min(100, ((rect.height - clickY) / rect.height) * 100)
    );
    const newValue = Math.round(
      (newPercentage / 100) * (this.max - this.min) + this.min
    );

    return Math.max(this.min, Math.min(this.max, newValue));
  }

  setupEventListeners() {
    const handleClick = (e) => {
      if (this.disabled || this.isDragging) return;

      const newValue = this.calculateValue(e.clientY);
      this.value = newValue;
      this.updateSlider();
      this.dispatchChangeEvent();
    };

    const handleMouseDown = (e) => {
      if (this.disabled) return;

      e.preventDefault();
      this.isDragging = true;

      const newValue = this.calculateValue(e.clientY);
      this.value = newValue;
      this.updateSlider();
      this.dispatchChangeEvent();
    };

    const handleMouseMove = (e) => {
      if (!this.isDragging || this.disabled) return;

      e.preventDefault();
      const newValue = this.calculateValue(e.clientY);
      this.value = newValue;
      this.updateSlider();
      this.dispatchChangeEvent();
    };

    const handleMouseUp = () => {
      this.isDragging = false;
      this.updateSlider();
    };

    // Add event listeners
    this.addEventListener("click", handleClick);
    this.addEventListener("mousedown", handleMouseDown);

    // Global mouse event listeners for dragging
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Store cleanup function
    this._cleanup = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }

  dispatchChangeEvent() {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: this.value },
        bubbles: true,
      })
    );
  }

  disconnectedCallback() {
    if (this._cleanup) {
      this._cleanup();
    }
  }
}

// Register the custom element
customElements.define("vertical-slider", VerticalSlider);
