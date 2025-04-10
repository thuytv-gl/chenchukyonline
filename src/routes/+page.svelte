<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from "$app/environment";
  import { calcRatio, createImage, toDataUrl, iOS } from "$lib";
  import Canvas from "$lib/Canvas";

  import { createScreenLogger } from '$lib/debugConsole';

  let debug: boolean = false;
  if (browser) {
    debug = new URLSearchParams(window?.location.href).get("debug") !== null;
  }

  if (debug) {
    let screenLogger: ReturnType<typeof createScreenLogger>;
    
    onMount(() => {
      if (browser) {
        // Only initialize in browser environment
        screenLogger = createScreenLogger({
          position: 'bottom',
          theme: 'dark',
          maxLogs: 100
        });
        
        return () => {
          screenLogger.restore();
        };
      }
    });
  }

  type Step = "edit" | "preview";
  let step: Step = "edit";
  let ready: boolean;
  let canvas: Canvas;
  let canvasRef: HTMLCanvasElement;
  let loading: boolean = false;
  let multiplier = 1;
  let downloadUrl = "/favicon.png";

  function panic(msg: string) {
    window.alert(msg);
  }

  async function createCanvas(canvasRef: HTMLCanvasElement) {
    if (!browser || !canvasRef) return;
    canvas = new Canvas(canvasRef);
  }

  async function addImage(image?: File) {
    if (!browser || !image) return;
    loading = true;

    const imageUrl = await toDataUrl(image);
    const fImage = await createImage(imageUrl);
    const maxW = document.documentElement.clientWidth * 0.8;
    const maxH = document.documentElement.clientHeight * 0.8;

    if (!canvas.width || !canvas.height) {
      return panic("Failed to create canvas");
    }

    if ( !fImage.width || !fImage.height) {
      return panic("Failed to import image");
    }

    const ratio = calcRatio(fImage.width, fImage.height, maxW, maxH);
    const ID = "F_Image";

    canvas.getObjects().forEach((o: any) => {
      if (o.id === ID) {
        canvas.remove(o);
      }
    });

    canvas.setWidth(fImage.width * ratio);
    canvas.setHeight(fImage.height * ratio);
    canvas.calcOffset();

    (fImage as any).id = ID;
    fImage.set("top", 0);
    fImage.set("left", 0);
    fImage.set("scaleX", ratio);
    fImage.set("scaleY", ratio);
    fImage.set("selectable", false);
    fImage.set("moveCursor", "none");
    fImage.set("hoverCursor", "auto");
    canvas.add(fImage);
    canvas.sendToBack(fImage);

    canvas.requestRenderAll();

    multiplier = fImage.width / canvas.width;
    loading = false;
    ready = true;
  }

  async function addSignature(signature?: File) {
    if (!canvas.width || !canvas.height || !signature) {
      return panic("Failed to create canvas");
    }
    const signatureUrl = await toDataUrl(signature);
    const sImage = await createImage(signatureUrl);

    if (!sImage.width || !sImage.height) {
      return panic("Failed to import signature");
    }

    const sRatio = calcRatio(sImage.width, sImage.height, canvas.width, canvas.height) * 0.6;
    const x = canvas.width / 2 - sImage.width / 2 * sRatio;
    const y = canvas.height - sImage.height * sRatio;
    sImage.set("left", x);
    sImage.set("top", y);
    sImage.set("scaleX", sRatio);
    sImage.set("scaleY", sRatio);

    canvas.add(sImage);
    canvas.requestRenderAll();
  }

  function loadImage(evt: Event) {
    const target = evt.target as HTMLInputElement;
    const file = target?.files?.[0];
    if (!file) { return; }
    addImage(file);
  }

  function loadSignature(evt: Event) {
    const target = evt.target as HTMLInputElement;
    const file = target?.files?.[0];
    if (!file) { return; }
    addSignature(file);
  }

  async function preview() {
    downloadUrl = canvas.toDataURL({ format: "jpeg", multiplier, quality: 0.92 });
    step = "preview";
  }

  $: createCanvas(canvasRef)
    .catch((e) => {
      console.log(e);
      panic("Lỗi! Không thể khởi tạo trang. Vui lòng thử lại sau.");
    });
</script>

<h3>
  Chữ Ký 39k <br/>
  Zalo: 038.9393.894
</h3>
<div class="container" hidden={step !== "edit"}>
  <canvas bind:this={canvasRef} id="canvas"></canvas>
</div>

{#if step === "edit"}
  <div class="footer">
    <div class="fcenter">
      <label for="image" class="step1 btn"> CHỌN ẢNH </label>
      <input type="file" accept="image/*" id="image" on:change={loadImage} />
      
      <label for="signature" class="step2 btn"> CHỌN CHỮ KÝ </label>
      <input type="file" accept="image/*" id="signature" on:change={loadSignature} />
    </div>
    <div class="fcenter">
      {#if ready}
        <button class="btn history-btn" on:click={() => canvas.undo()}>
           <svg fill="#ffffff" height="18px" width="18px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 26.676 26.676" xml:space="preserve">
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                 <g>
                    <path d="M26.105,21.891c-0.229,0-0.439-0.131-0.529-0.346l0,0c-0.066-0.156-1.716-3.857-7.885-4.59 c-1.285-0.156-2.824-0.236-4.693-0.25v4.613c0,0.213-0.115,0.406-0.304,0.508c-0.188,0.098-0.413,0.084-0.588-0.033L0.254,13.815 C0.094,13.708,0,13.528,0,13.339c0-0.191,0.094-0.365,0.254-0.477l11.857-7.979c0.175-0.121,0.398-0.129,0.588-0.029 c0.19,0.102,0.303,0.295,0.303,0.502v4.293c2.578,0.336,13.674,2.33,13.674,11.674c0,0.271-0.191,0.508-0.459,0.562 C26.18,21.891,26.141,21.891,26.105,21.891z"></path>
                 </g>
              </g>
           </svg>
        </button>
        <button class="btn" on:click={preview}>TẢI ẢNH</button>
        <button class="btn history-btn" on:click={() => canvas.redo()} style="transform:matrix(-1, 0, 0, 1, 0, 0);">
           <svg fill="#ffffff" height="18px" width="18px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 26.676 26.676" xml:space="preserve" stroke="#ffffff">
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                 <g>
                    <path d="M26.105,21.891c-0.229,0-0.439-0.131-0.529-0.346l0,0c-0.066-0.156-1.716-3.857-7.885-4.59 c-1.285-0.156-2.824-0.236-4.693-0.25v4.613c0,0.213-0.115,0.406-0.304,0.508c-0.188,0.098-0.413,0.084-0.588-0.033L0.254,13.815 C0.094,13.708,0,13.528,0,13.339c0-0.191,0.094-0.365,0.254-0.477l11.857-7.979c0.175-0.121,0.398-0.129,0.588-0.029 c0.19,0.102,0.303,0.295,0.303,0.502v4.293c2.578,0.336,13.674,2.33,13.674,11.674c0,0.271-0.191,0.508-0.459,0.562 C26.18,21.891,26.141,21.891,26.105,21.891z"></path>
                 </g>
              </g>
           </svg>
        </button>
      {/if}
    </div>
  </div>
{/if}

{@html '<!-- Preview Step -->'}
{#if step === "preview"}
  <div class="container">
    <img src={downloadUrl} alt=""/>
  </div>

  <div class="footer">
    <div class="fcenter" style="flex-direction: column;">
        {#if iOS()}
          <h3 style="color: red;font-weight: bold;text-align: center;">
            Nhấn giữ vào ảnh > Thêm vào Ảnh...
          </h3>
        {:else}
        <a class="btn" href={downloadUrl} download>TẢI ẢNH</a>
      {/if}
      <button class="btn danger" on:click={() => step = "edit"}>ĐÓNG</button>
    </div>
  </div>
{/if}

{#if loading}
  <div class="loader-container">
    <div class="loader"></div>
  </div>
{/if}


<style>
  :global(:root) {
    --primary-color: #3498db;
    --accent-color: #2ecc71;
    --danger-color: #e74c3c;
    --text-light: #ffffff;
    --btn-radius: 0.5rem;
    --transition: 0.3s ease;
  }

  :global(html, body) {
    height: 100%;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .container {
    max-height: 80%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: #f8f9fa;
  }

  .footer {
    bottom: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  }

  .preview-img {
    max-height: 90%;
    max-width: 95%;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    object-fit: contain;
  }

  .fcenter {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  input {
    display: none;
  }

  .btn,
  .preview-btn,
  .history-btn,
  .danger {
    font-size: 14px;
    text-align: center;
    margin: 8px;
    padding: 12px 20px;
    min-width: 120px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(74, 144, 226, 0.2);
  }

  .btn {
    background-color: var(--primary-color);
    color: var(--text-light);
  }

  .preview-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(74, 144, 226, 0.3);
  }

  .preview-btn:active {
    transform: translateY(0);
  }

  .history-btn {
    background: #2C3E50;
    min-width: 50px;
    padding: 12px;
  }

  .step {
    justify-content: center;
    align-items: center;
    width: 100%;
    transition: opacity 0.3s ease;
  }

  label.step1 {
    background: #3498DB;
  }

  label.step2 {
    background: #27AE60;
  }

  label:active {
    background: #2980B9;
  }

  .danger {
    background-color: #E74C3C;
  }

  .loader-container {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .loader {
    border: 3px solid #f3f3f3;
    border-radius: 50%;
    border-top: 3px solid #3498db;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin: 10px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  h3 {
    color: #E74C3C;
    font-weight: 600;
    text-align: center;
    margin: 1rem 0;
  }

  canvas {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  *[hidden] {
    display: none !important;
  }
</style>

