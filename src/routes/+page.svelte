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
  {#if step === "preview"}
    <img
      class="max-w-full max-h-full"
      onload={scrollBottom}
      src={downloadUrl} alt="" />
  {/if}
</div>

<div class="h-[15vh] w-full center flex-col px-10">
  {#if step === "edit"}
    <label for="image" class="w-full text-center"> CHỌN ẢNH </label>
    <input type="file" accept="image/*" id="image" onchange={loadImage} />
    
    {#if hasImage}
      <label for="signature" class="w-full text-center"> CHỌN CHỮ KÝ </label>
      <input type="file" accept="image/*" id="signature" onchange={loadSignature} />
    {/if}

    {#if hasImage && hasSignature}
      <button class="preview-btn w-full text-center" onclick={preview}>TẢI ẢNH</button>
    {/if}
  {/if}

  {#if step === "preview"}
    <div class="center flex-col w-full px-10">
      {#if iOS()}
        <h3 class="text-red-500 text-lg font-medium w-full text-center">
          Nhấn giữ vào ảnh > Nhấn "thêm vào Ảnh..."
        </h3>
      {:else}
        <a class="preview-btn w-full text-center" href={downloadUrl} download>TẢI ẢNH</a>
      {/if}
      <button class="preview-btn bg-red-500 w-full text-center text-white" onclick={() => step = "edit"}>ĐÓNG</button>
    </div>
  {/if}
</div>

<script lang="ts">
  import Canvas from "$lib/Canvas";
  import { browser } from "$app/environment";
  import { calcRatio, createImage, toDataUrl, iOS } from "$lib";

  let hasImage = $state(false);
  let hasSignature = $state(false);
  let canvasRef: HTMLCanvasElement | undefined;
  let canvas: Canvas;

  type Step = "edit" | "preview";
  let step = $state<Step>("edit");
  let multiplier = 1;
  let downloadUrl = $state("/favicon.png");

  $effect(() => {
    if (!canvasRef) return;
    canvas = new Canvas(canvasRef);
  });

  function scrollBottom() {
    window.scrollTo(0, document.body.scrollHeight);
  }

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

    canvas.setDimensions({
      width: fImage.width * ratio,
      height: fImage.height * ratio,
    });

    fImage.set("top", 0);
    fImage.set("left", 0);
    fImage.set("scaleX", ratio);
    fImage.set("scaleY", ratio);
    fImage.set("selectable", false);
    fImage.set("moveCursor", "none");
    fImage.set("hoverCursor", "auto");
    canvas.backgroundImage = fImage;

    canvas.calcOffset();
    canvas.requestRenderAll();

    multiplier = fImage.width / canvas.width;
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
    addImage(file).finally(() => {
      hasImage = true;
      scrollBottom();
    });
  }

  function loadSignature(evt: Event) {
    const target = evt.target as HTMLInputElement;
    const file = target?.files?.[0];
    if (!file) { return; }
    addSignature(file).finally(() => {
      hasSignature = true;
      scrollBottom();
    });
  }

  async function preview() {
    downloadUrl = canvas.toDataURL({ format: "jpeg", multiplier, quality: 0.92 });
    step = "preview";
  }
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
</style>
