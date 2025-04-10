import { fabric } from "fabric";
import type { ICanvasOptions } from "fabric/fabric-impl";

type EvtTuple = [string, () => void];

export default class Canvas extends fabric.Canvas {
  private isEditing: boolean;
  private historyUndo: string[];
  private historyRedo: string[];
  private extraProps: string[];
  private historyNextState: string;
  private historyProcessing: boolean;
  private LISTENT_TO: EvtTuple[];

  constructor(element: HTMLCanvasElement | string | null, options?: ICanvasOptions) {
    super(element, options);
    this.isEditing = false;
    this.historyUndo = [];
    this.historyRedo = [];
    this.extraProps = ['selectable'];
    this.historyNextState = this._historyNext();
    this.historyProcessing = false;
    this.LISTENT_TO = [
        ['object:added', this._historySaveAction.bind(this)],
        ['object:removed', this._historySaveAction.bind(this)],
        ['object:modified', this._historySaveAction.bind(this)],
        ['object:skewing', this._historySaveAction.bind(this)]
    ];
    this._historyEvents();
  }

  onStartEditing(): void { }
  onStopEditing(): void { }

  startEditing(): void {
    this.isEditing = true;
    this.onStartEditing();
  }

  stopEditing(): void {
    this.isEditing = false;
    this.onStopEditing();
    this._historySaveAction();
  }

  initialize = (element: HTMLCanvasElement | string | null, options?: ICanvasOptions): Canvas => {
    super.initialize.call(this, element, options);
    this._historyInit();
    return this;
  }

  dispose(): Canvas {
    super.dispose.call(this);
    this._historyDispose();
    return this;
  }

  /**
   * Returns current state of the string of the canvas
   */
  private _historyNext(): string {
    return JSON.stringify(this.toDatalessJSON(this.extraProps));
  }

  /**
   * Returns an object with fabricjs event mappings
   */
  private _historyEvents() {
    for (const [evt, func] of this.LISTENT_TO) {
      this.on(evt, func);
    }
  }

  /**
   * Initialization of the plugin
   */
  private _historyInit(): void {
    this.historyUndo = [];
    this.historyRedo = [];
    this.extraProps = ['selectable'];
    this.historyNextState = this._historyNext();
    this._historyEvents();
  }

  /**
   * Remove the custom event listeners
   */
  private _historyDispose(): void {
    for (const [evt] of this.LISTENT_TO) {
      this.off(evt);
    }
  }

  /**
   * It pushes the state of the canvas into history stack
   */
  private _historySaveAction(): void {
    if (this.historyProcessing || this.isEditing) return;

    const json = this.historyNextState;
    this.historyUndo.push(json);
    this.historyNextState = this._historyNext();
    this.fire('history:append', { json: json });
  }

  /**
   * Undo to latest history. 
   * Pop the latest state of the history. Re-render.
   * Also, pushes into redo history.
   */
  undo(callback?: () => void): void {
    this.historyProcessing = true;
    const history = this.historyUndo.pop();
    if (history) {
      this.historyRedo.push(this._historyNext());
      this.historyNextState = history;
      this._loadHistory(history, 'history:undo', callback);
    } else {
      this.historyProcessing = false;
    }
  }

  /**
   * Redo to latest undo history.
   */
  redo(callback?: () => void): void {
    this.historyProcessing = true;
    const history = this.historyRedo.pop();
    if (history) {
      this.historyUndo.push(this._historyNext());
      this.historyNextState = history;
      this._loadHistory(history, 'history:redo', callback);
    } else {
      this.historyProcessing = false;
    }
  }

  private _loadHistory(history: string, event: string, callback?: () => void): void {
    this.loadFromJSON(history, () => {
      this.renderAll();
      this.fire(event);
      this.historyProcessing = false;

      if (callback && typeof callback === 'function') callback();
    });
  }

  /**
   * Clear undo and redo history stacks
   */
  clearHistory(): void {
    this.historyUndo = [];
    this.historyRedo = [];
    this.fire('history:clear');
  }

  /**
   * Off the history
   */
  offHistory(): void {
    this.historyProcessing = true;
  }

  /**
   * On the history
   */
  onHistory(): void {
    this.historyProcessing = false;
    this._historySaveAction();
  }
}
