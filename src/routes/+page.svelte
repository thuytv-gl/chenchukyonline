<title>Chèn Chữ Ký online</title>

<script lang="ts">
  import { browser } from "$app/environment";
  import { calcRatio, createImage, toDataUrl } from "$lib";
  import { v4 as uuid  } from 'uuid';

  type Step = "image" | "signature" | "edit" | "preview";
  let step: Step = "image";
  let image: File;
  let signature: File;
  let canvas: fabric.Canvas;
  let canvasRef: HTMLCanvasElement;
  let loading: boolean = false;
  let multiplier = 1;
  let downloadUrl = "/favicon.png";

  function panic(msg: string) {
    console.log(msg);
  }

  async function createCanvas(step: Step, canvasRef: HTMLCanvasElement, image: File, signature: File) {
    if (!browser || step !== "edit" || !canvasRef) return;
    loading = true;
    const { fabric } = await import("fabric");

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
    canvas = new fabric.Canvas("canvas");
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

  async function preview() {
    loading = true;
    try {
      const imageData = canvas.toDataURL({ format: "jpeg", multiplier, quality: 0.92 });
      const img = await fetch(imageData).then(r => r.blob());
      const formData = new FormData();
      const fileName = uuid().split("-").pop() + ".jpeg";
      formData.append("image", img, fileName);
      const response = await fetch("/api", {
        method: "POST",
        body: formData,
        redirect: "manual",
      });

      if (response.ok) {
        const { fileName } = await response.json();
        if (fileName) {
          loading = false;
          return window.location.href = `/api/${fileName}`;
        } else {
          throw new Error("fileName not exists");
        }
      }
      throw new Error("Upload failed");
    } catch(e) {
      loading = false;
      window.alert("Đã có lỗi xảy ra vui lòng thử lại sau! " + e.message);
    }
  }

  $: createCanvas(step, canvasRef, image, signature)
    .catch(() => {
      window.alert("Đã có lỗi xảy ra vui lòng thử lại sau!");
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
      <button class="preview-btn" on:click={preview}>TẢI ẢNH</button>
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
