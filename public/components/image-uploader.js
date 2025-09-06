// Image uploader web component
class ImageUploader extends HTMLElement {
  constructor() {
    super();
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
        <button 
          class="btn" 
          id="uploadButton"
          style="padding-left: 12px; padding-right: 12px;"
        >
          Choose Image...
        </button>
        <input 
          type="file" 
          id="fileInput" 
          accept="image/*" 
          style="display: none;"
        />
      </div>
    `;
  }

  setupEventListeners() {
    const uploadButton = this.querySelector("#uploadButton");
    const fileInput = this.querySelector("#fileInput");

    uploadButton.addEventListener("click", () => {
      // quick flash feedback like reference app
      uploadButton.classList.add("clickyblinky");
      setTimeout(() => uploadButton.classList.remove("clickyblinky"), 300);
      fileInput.click();
    });

    fileInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        // Dispatch upload event with file data
        this.dispatchEvent(
          new CustomEvent("upload", {
            detail: { file },
            bubbles: true,
          })
        );
      }
    });
  }
}

// Register the custom element
customElements.define("image-uploader", ImageUploader);
