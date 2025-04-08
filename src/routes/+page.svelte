<title>Chèn Chữ Ký online</title>

<script lang="ts">
  import { browser } from "$app/environment";
  import { calcRatio, createImage, toDataUrl } from "$lib";
  import Canvas from "./Canvas";
  import { onMount } from 'svelte';
  import { createScreenLogger } from '$lib/debugConsole';
  import { v4 as uuid  } from 'uuid';
  
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

  type Step = "image" | "signature" | "edit" | "preview";
  let step: Step = "image";
  let image: File;
  let signature: File;
  let canvas: Canvas;
  let canvasRef: HTMLCanvasElement;
  let loading: boolean = false;
  let multiplier = 1;
  let downloadUrl = "/favicon.png";

  function panic(msg: string) {
    window.alert(msg);
  }

  async function resolve<T>(promise: Promise<T>): Promise<[null, T] | [Error, null]> {
      try {
          const res = await promise
          return [null, res];
      } catch (err: any) {
          return [err, null];
      }
  }

  async function createCanvas(step: Step, canvasRef: HTMLCanvasElement, image: File, signature: File) {
    if (!browser || step !== "edit" || !canvasRef) return;
    loading = true;

    const imageUrl = await toDataUrl(image);
    const signatureUrl = await toDataUrl(signature);
    const fImage = await createImage(imageUrl);
    const sImage = await createImage(signatureUrl);
    if ( !fImage.width || !fImage.height || !sImage.width || !sImage.height) {
      return panic("Failed to import image and signature");
    }

    const maxW = document.documentElement.clientWidth * 0.95;
    const maxH = document.documentElement.clientHeight * 0.9;
    const ratio = calcRatio(fImage.width, fImage.height, maxW, maxH);
    canvasRef.width = fImage.width * ratio;
    canvasRef.height = fImage.height * ratio;
    canvas = new Canvas("canvas");
    if (!canvas.width || !canvas.height) {
      return panic("Failed to create canvas");
    }

    fImage.set("top", 0);
    fImage.set("left", 0);
    fImage.set("scaleX", ratio);
    fImage.set("scaleY", ratio);
    fImage.set("selectable", false);
    fImage.set("moveCursor", "none");
    fImage.set("hoverCursor", "auto");

    const sRatio = calcRatio(sImage.width, sImage.height, canvas.width, canvas.height) * 0.6;
    const x = canvas.width / 2 - sImage.width / 2 * sRatio;
    const y = canvas.height - sImage.height * sRatio;
    sImage.set("left", x);
    sImage.set("top", y);
    sImage.set("scaleX", sRatio);
    sImage.set("scaleY", sRatio);

    canvas.add(fImage);
    canvas.add(sImage);
    canvas.requestRenderAll();

    multiplier = fImage.width / canvas.width;
    loading = false;
  }

  function loadImage(evt: Event) {
    const target = evt.target as HTMLInputElement;
    const file = target?.files?.[0];
    if (!file) { return; }
    image = file;
    step = "signature";
  }

  function loadSignature(evt: Event) {
    const target = evt.target as HTMLInputElement;
    const file = target?.files?.[0];
    if (!file) { return; }
    signature = file;
    step = "edit";
  }

  function base64ToFile(dataUrl: string, filename: string) {
    // Extract the MIME type and base64 data
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : '';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    // Convert the base64 data to a Uint8Array
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    // Create a new File object
    return new File([u8arr], filename, { type: mime });
  }

  async function preview() {
    loading = true;
    try {
      const imageData = canvas.toDataURL({ format: "jpeg", multiplier, quality: 0.92 });
      const imgFile = base64ToFile(imageData, uuid().split("-")[0]);
      const body = new FormData();
      body.append("image", imgFile);
      const [err1, uploadReq] = await resolve(fetch(
        `${window.location.origin}/api`,
        { method: "POST", body, }
      ));

      if (err1) {
        console.error("upload file");
        throw err1;
      }

      const [err3, res] = await resolve(uploadReq.json());
      if (err3) {
        console.error("parse json");
        throw err3;
      }
      if (!res.fileName) {
        throw new Error("Missing fileName in response body");
      }
      loading = false;
      return window.location.href = `/api/${res.fileName}`;
    } catch(e: any) {
      loading = false;
      console.log(e);
      return panic("Đã có lỗi xảy ra vui lòng thử lại sau! " + e.message);
    }
  }

  $: createCanvas(step, canvasRef, image, signature)
    .catch((e) => {
      console.log(e);
      panic("Lỗi! Không thể khởi tạo trang. Vui lòng thử lại sau.");
    });
</script>

<div class="container">
{#if step === "image"}
  <div class="form-group">
    <label for="image" class="step1">CHỌN ẢNH SẢN PHẨM</label>
    <input type="file" accept="image/*" id="image" on:change={loadImage} />
  </div>
{/if}

{#if step === "signature"}
  <div class="form-group">
    <label for="signature" class="step2">CHỌN CHỮ KÝ</label>
    <input type="file" accept="image/*" id="signature" on:change={loadSignature} />
  </div>
{/if}

{#if step === "edit"}
  <div style={`display: ${loading ? "none" : "block"}`}>
    <div class="fcenter">
      <canvas bind:this={canvasRef} id="canvas"></canvas>
    </div>

    <div class="fcenter">
    <button class="preview-btn history-btn" on:click={() => canvas.undo()}>
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
    <button class="preview-btn history-btn" on:click={() => canvas.redo()} style="transform:matrix(-1, 0, 0, 1, 0, 0);">
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
    </div>

    <div class="fcenter">
      <button class="preview-btn" on:click={preview}>Tải Ảnh</button>
    </div>
  </div>
{/if}

{#if step === "preview"}
  <div class="fcenter">
    <a href={downloadUrl} download>Tải ảnh</a>
  </div>
{/if}
{#if loading}
  <div class="fcenter">
    <div class="loader"></div>
  </div>
{/if}
</div>

<style>
  .fcenter {
    display: flex;
    justify-content: center;
  }
  input {
    display: none;
  }
  label {
    text-align: center;
    position: absolute;
    bottom: 50px;
    margin: 10px;
    padding: 30px;
    min-width: 100px;
  }
  a {
    font-size: 22px;
  }
  .preview-btn {
    text-align: center;
    bottom: 50px;
    margin: 10px;
    padding: 20px;
    min-width: 100px;
    border: none;
    background: #3498bb;
    color: white;
    cursor: pointer;
  }
  .history-btn {
    padding: 10px;
    min-width: 60px;
    background: #000000;
  }
  label.step1 {
    border: 5px lightblue dashed;
  }
  label.step2 {
    border: 5px green dashed;
  }
  label:active {
    background: darkcyan;
    color: white;
  }
  .container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;
  }
  .loader {
    border: 16px solid #f3f3f3;
    border-radius: 50%;
    border-top: 16px solid #3498db;
    width: 100px;
    height: 100px;
    -webkit-animation: spin 2s linear infinite; /* Safari */
    animation: spin 2s linear infinite;
    margin: 10px;
  }

  .form-group {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  /* Safari */
  @-webkit-keyframes spin {
    0% { -webkit-transform: rotate(0deg); }
    100% { -webkit-transform: rotate(360deg); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
