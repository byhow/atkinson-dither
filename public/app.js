// app.js
function ditherApp() {
  return {
    imageLoaded: false,
    imageData: null,
    ditherValue: 128,
    appliedDitherValue: 128,
    isProcessing: false,
    progress: 0,
    _applyTimer: null,
    hasPending: false,

    async handleImageUpload(event) {
      // Supports both native <input type="file"> and custom <image-uploader>
      const file =
        event?.detail?.file ||
        (event?.target && event.target.files && event.target.files[0]);
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageData = e.target.result;
        this.imageLoaded = true;
        this.ditherValue = 128;
        this.appliedDitherValue = 128;
      };
      reader.readAsDataURL(file);
    },

    // Queue dithering and only apply when not already processing
    updateDither() {
      if (this.isProcessing) {
        this.hasPending = true;
        return;
      }
      if (this._applyTimer) clearTimeout(this._applyTimer);
      this._applyTimer = setTimeout(() => {
        this.appliedDitherValue = this.ditherValue;
        this.hasPending = false;
      }, 200);
    },

    resetImage() {
      this.imageLoaded = false;
      this.imageData = null;
      this.ditherValue = 128;
      this.appliedDitherValue = 128;
      this.progress = 0;
      this.isProcessing = false;
      this.hasPending = false;
      if (this._applyTimer) clearTimeout(this._applyTimer);
    },

    saveImage() {
      const canvas = document.querySelector("dither-canvas");
      const link = document.createElement("a");
      link.download = "dithered-image.png";
      link.href = canvas.getImageData();
      link.click();
    },
  };
}

// Make globally available
window.ditherApp = ditherApp;
