<svelte:head>
	<title> Chữ Ký 39k / Zalo:  0389393894 </title>
</svelte:head>

<div class="h-[5vh] w-full border-b center">
  <h1 class="m-auto text-red-600 text-lg font-bold">
    Chữ Ký 39k / Zalo:  0389393894
  </h1>
</div>
<div class="p-5 body h-full w-full center">
  <div class="w-full h-full center" class:hidden={step !== "edit"}>
    <canvas bind:this={canvasRef}></canvas>
  </div>
  <img class="max-w-full max-h-full" class:hidden={step !== "preview"} src={downloadUrl} alt=""/>
</div>

<div class="h-[15vh] w-full center border-t">
  {#if step === "edit"}
    <label for="image" class=""> CHỌN ẢNH </label>
    <input type="file" accept="image/*" id="image" on:change={loadImage} />
    
    <label for="signature" class=""> CHỌN CHỮ KÝ </label>
    <input type="file" accept="image/*" id="signature" on:change={loadSignature} />

    {#if ready}
      <button class="preview-btn" on:click={preview}>TẢI ẢNH</button>
    {/if}
  {/if}

  {#if step === "preview"}
    <div class="center flex-col">
        {#if iOS()}
          <h3 class="text-red-500 text-lg font-medium">
            Nhấn giữ vào ảnh > Nhấn "thêm vào Ảnh..."
          </h3>
        {:else}
        <a class="preview-btn" href={downloadUrl} download>TẢI ẢNH</a>
      {/if}
      <button class="preview-btn danger" on:click={() => step = "edit"}>ĐÓNG</button>
    </div>
  {/if}
</div>

{#if loading}
  <div class="center absolute w-full h-full">
    <div class="loader"></div>
  </div>
{/if}

<script lang="ts">
  import Canvas from "$lib/Canvas";
  import { browser } from "$app/environment";
  import { calcRatio, createImage, toDataUrl, iOS } from "$lib";

  let canvasRef: HTMLCanvasElement | undefined;
  let canvas: Canvas;
  let ready: boolean = false;

  type Step = "edit" | "preview";
  let step: Step = "edit";
  let loading: boolean = false;
  let multiplier = 1;
  let downloadUrl = "/favicon.png";

  function panic(msg: string) {
    window.alert(msg);
  }

  async function addImage(image?: File) {
    if (!browser || !image || !canvas || !canvasRef) return;

    const imageUrl = await toDataUrl(image);
    const fImage = await createImage(imageUrl);
    const maxW = document.documentElement.clientWidth * 0.9;
    const maxH = document.documentElement.clientHeight * 0.9;

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
    canvas.sendObjectToBack(fImage);

    canvas.requestRenderAll();

    multiplier = fImage.width / canvas.width;
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
    loading = true;
    addImage(file).finally(() => {
      loading = false;
    });
  }

  function loadSignature(evt: Event) {
    const target = evt.target as HTMLInputElement;
    const file = target?.files?.[0];
    if (!file) { return; }
    loading = true;
    addSignature(file).finally(() => {
      loading = false;
    });
  }

  async function preview() {
    downloadUrl = canvas.toDataURL({ format: "jpeg", multiplier, quality: 0.92 });
    step = "preview";
  }

  function setupCanvas(ref?: HTMLCanvasElement) {
    if (!ref) return;
    canvas = new Canvas(ref);
  }
  $: setupCanvas(canvasRef);
</script>

<style>
  input {
      display: none;
  }

  label, button {
    padding: 5px;
    border: 1px solid;
    margin: 5px;
  }

  .center {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .hidden {
    display: none !important;
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
</style>
