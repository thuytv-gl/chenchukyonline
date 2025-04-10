<script lang="ts">
  import { browser } from "$app/environment";
  import Canvas from "$lib/Canvas";
  import { calcRatio, createImage, toDataUrl, iOS } from "$lib";

  type Step = "edit" | "preview";
  let step: Step = "edit";
  let ready: boolean;
  let loading: boolean = false;
  let multiplier = 1;
  let downloadUrl = "/favicon.png";
  let canvasRef: HTMLCanvasElement;
  let canvas: Canvas;

  function panic(msg: string) {
    window.alert(msg);
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

  const handleClick = (label: string) => {
    console.log(`${label} clicked`);
  };

  $: (el?: HTMLCanvasElement) => {
    if (!browser || !el) return;
    canvas = new Canvas(el);
  };
</script>


<style
  .screen {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 600px;
    margin: auto;
    background: #fff;
    border-radius: var(--border-radius);
  }

  .main-content {
    flex: 1;
    background-color: var(--content-bg);
    border-radius: var(--border-radius);
    border: 2px dashed #c8e6c9;
    margin-bottom: 1rem;
    box-shadow: inset 0 0 8px rgba(0,0,0,0.05);
  }

  .footer {
    background-color: var(--footer-bg);
    border-radius: var(--border-radius);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    box-shadow: var(--shadow);
  }

  .btn-group {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .btn {
    flex: 1;
    padding: 0.6rem 1rem;
    border: none;
    border-radius: var(--border-radius);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  .btn-primary {
    background-color: var(--primary);
    color: #fff;
  }

  .btn-primary:hover {
    background-color: var(--primary-dark);
  }

  .btn-secondary {
    background-color: var(--secondary);
    color: #fff;
  }

  .btn-secondary:hover {
    background-color: #636e72;
  }

  .btn-accent {
    background-color: var(--accent);
    color: #fff;
  }

  .btn-accent:hover {
    background-color: #d68910;
  }
</style>

<div class="screen">
  <div class="main-content">
    <canvas on:load={() => console.log("load")} bind:this={canvasRef} id="canvas"></canvas>
  </div>

  <div class="footer">
    <div class="btn-group">
      <button class="btn btn-primary" on:click={() => handleClick('Button 1')}>Button 1</button>
      <button class="btn btn-primary" on:click={() => handleClick('Button 2')}>Button 2</button>
    </div>
    <div class="btn-group">
      <button class="btn btn-secondary" on:click={() => handleClick('Undo')}>Undo</button>
      <button class="btn btn-accent" on:click={() => handleClick('Button 0')}>Button 0</button>
      <button class="btn btn-secondary" on:click={() => handleClick('Redo')}>Redo</button>
    </div>
  </div>

</div>

