/**
 * GameStateManager - Central singleton managing all game state
 * Handles flags, counters, inventory, room states, and persistence
 */

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string; // sprite key
  combinableWith?: string[]; // IDs of items it can combine with
  combineResult?: string; // ID of resulting item when combined
}

export interface RoomState {
  hasVisited: boolean;
  objectStates: Record<string, unknown>;
  characterPositions?: Record<string, { x: number; y: number }>;
}

export interface GameSaveData {
  flags: Record<string, boolean>;
  counters: Record<string, number>;
  inventory: InventoryItem[];
  roomStates: Record<string, RoomState>;
  currentRoom: string;
  timestamp: number;
}

class GameStateManager {
  private static instance: GameStateManager;

  // Game state
  private flags: Map<string, boolean> = new Map();
  private counters: Map<string, number> = new Map();
  private inventory: InventoryItem[] = [];
  private roomStates: Map<string, RoomState> = new Map();
  private currentRoom: string = '';

  // Event callbacks
  private onInventoryChange: (() => void)[] = [];
  private onFlagChange: ((flag: string, value: boolean) => void)[] = [];

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  // ===== FLAGS =====

  setFlag(name: string, value: boolean): void {
    this.flags.set(name, value);
    this.onFlagChange.forEach(cb => cb(name, value));
  }

  getFlag(name: string): boolean {
    return this.flags.get(name) ?? false;
  }

  hasFlag(name: string): boolean {
    return this.flags.has(name) && this.flags.get(name) === true;
  }

  // ===== COUNTERS =====

  setCounter(name: string, value: number): void {
    this.counters.set(name, value);
  }

  getCounter(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  incrementCounter(name: string, amount: number = 1): number {
    const newValue = this.getCounter(name) + amount;
    this.setCounter(name, newValue);
    return newValue;
  }

  // ===== INVENTORY =====

  addItem(item: InventoryItem): boolean {
    if (this.hasItem(item.id)) {
      return false; // Already have it
    }
    this.inventory.push(item);
    this.onInventoryChange.forEach(cb => cb());
    return true;
  }

  removeItem(itemId: string): boolean {
    const index = this.inventory.findIndex(item => item.id === itemId);
    if (index === -1) {
      return false;
    }
    this.inventory.splice(index, 1);
    this.onInventoryChange.forEach(cb => cb());
    return true;
  }

  hasItem(itemId: string): boolean {
    return this.inventory.some(item => item.id === itemId);
  }

  getItem(itemId: string): InventoryItem | undefined {
    return this.inventory.find(item => item.id === itemId);
  }

  getInventory(): InventoryItem[] {
    return [...this.inventory];
  }

  combineItems(itemId1: string, itemId2: string, resultItem: InventoryItem): boolean {
    const item1 = this.getItem(itemId1);
    const item2 = this.getItem(itemId2);

    if (!item1 || !item2) {
      return false;
    }

    // Check if items can be combined
    const canCombine =
      item1.combinableWith?.includes(itemId2) ||
      item2.combinableWith?.includes(itemId1);

    if (!canCombine) {
      return false;
    }

    // Remove both items, add result
    this.removeItem(itemId1);
    this.removeItem(itemId2);
    this.addItem(resultItem);

    return true;
  }

  // ===== ROOM STATE =====

  setCurrentRoom(roomId: string): void {
    this.currentRoom = roomId;

    // Mark room as visited
    const state = this.getRoomState(roomId);
    state.hasVisited = true;
    this.roomStates.set(roomId, state);
  }

  getCurrentRoom(): string {
    return this.currentRoom;
  }

  getRoomState(roomId: string): RoomState {
    if (!this.roomStates.has(roomId)) {
      this.roomStates.set(roomId, {
        hasVisited: false,
        objectStates: {},
        characterPositions: {},
      });
    }
    return this.roomStates.get(roomId)!;
  }

  setRoomObjectState(roomId: string, objectId: string, state: unknown): void {
    const roomState = this.getRoomState(roomId);
    roomState.objectStates[objectId] = state;
  }

  getRoomObjectState<T>(roomId: string, objectId: string): T | undefined {
    const roomState = this.getRoomState(roomId);
    return roomState.objectStates[objectId] as T | undefined;
  }

  hasVisitedRoom(roomId: string): boolean {
    return this.getRoomState(roomId).hasVisited;
  }

  // ===== EVENT SUBSCRIPTIONS =====

  onInventoryChanged(callback: () => void): void {
    this.onInventoryChange.push(callback);
  }

  onFlagChanged(callback: (flag: string, value: boolean) => void): void {
    this.onFlagChange.push(callback);
  }

  // ===== PERSISTENCE =====

  save(slot: string = 'autosave'): void {
    const saveData: GameSaveData = {
      flags: Object.fromEntries(this.flags),
      counters: Object.fromEntries(this.counters),
      inventory: this.inventory,
      roomStates: Object.fromEntries(this.roomStates),
      currentRoom: this.currentRoom,
      timestamp: Date.now(),
    };

    localStorage.setItem(`tarzan_adventure_${slot}`, JSON.stringify(saveData));
  }

  load(slot: string = 'autosave'): boolean {
    const data = localStorage.getItem(`tarzan_adventure_${slot}`);
    if (!data) {
      return false;
    }

    try {
      const saveData: GameSaveData = JSON.parse(data);

      this.flags = new Map(Object.entries(saveData.flags));
      this.counters = new Map(Object.entries(saveData.counters));
      this.inventory = saveData.inventory;
      this.roomStates = new Map(Object.entries(saveData.roomStates));
      this.currentRoom = saveData.currentRoom;

      this.onInventoryChange.forEach(cb => cb());

      return true;
    } catch {
      console.error('Failed to load save data');
      return false;
    }
  }

  hasSave(slot: string = 'autosave'): boolean {
    return localStorage.getItem(`tarzan_adventure_${slot}`) !== null;
  }

  deleteSave(slot: string): void {
    localStorage.removeItem(`tarzan_adventure_${slot}`);
  }

  // ===== RESET =====

  reset(): void {
    this.flags.clear();
    this.counters.clear();
    this.inventory = [];
    this.roomStates.clear();
    this.currentRoom = '';
    this.onInventoryChange.forEach(cb => cb());
  }
}

// Export singleton instance
export const gameState = GameStateManager.getInstance();
export default GameStateManager;
