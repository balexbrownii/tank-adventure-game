import Phaser from 'phaser';
import { Hotspot, HotspotConfig, InteractionVerb } from '../entities/Hotspot';
import { responseGenerator } from '../services/ResponseGenerator';

/**
 * HotspotManager - Manages all interactive hotspots in a scene
 * Handles registration, lookup, and interaction routing
 */
export class HotspotManager {
  private scene: Phaser.Scene;
  private hotspots: Map<string, Hotspot> = new Map();
  private hoveredHotspot: Hotspot | null = null;
  private debugMode: boolean = false;

  // Callbacks
  private onHotspotHover: ((hotspot: Hotspot | null) => void)[] = [];
  private onHotspotClick: ((hotspot: Hotspot, verb: InteractionVerb) => void)[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Register a new hotspot in the scene
   */
  register(config: HotspotConfig): Hotspot {
    const hotspot = new Hotspot(this.scene, config);

    // Set up hover events
    hotspot.on('pointerover', () => {
      this.hoveredHotspot = hotspot;
      this.onHotspotHover.forEach(cb => cb(hotspot));
    });

    hotspot.on('pointerout', () => {
      if (this.hoveredHotspot === hotspot) {
        this.hoveredHotspot = null;
        this.onHotspotHover.forEach(cb => cb(null));
      }
    });

    this.hotspots.set(config.id, hotspot);

    if (this.debugMode) {
      hotspot.showDebug(true);
    }

    return hotspot;
  }

  /**
   * Register multiple hotspots at once
   */
  registerAll(configs: HotspotConfig[]): void {
    for (const config of configs) {
      this.register(config);
    }
  }

  /**
   * Get a hotspot by ID
   */
  get(id: string): Hotspot | undefined {
    return this.hotspots.get(id);
  }

  /**
   * Get the currently hovered hotspot
   */
  getHovered(): Hotspot | null {
    return this.hoveredHotspot;
  }

  /**
   * Get all hotspots
   */
  getAll(): Hotspot[] {
    return Array.from(this.hotspots.values());
  }

  /**
   * Remove a hotspot
   */
  remove(id: string): boolean {
    const hotspot = this.hotspots.get(id);
    if (hotspot) {
      hotspot.destroy();
      this.hotspots.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Clear all hotspots
   */
  clear(): void {
    for (const hotspot of this.hotspots.values()) {
      hotspot.destroy();
    }
    this.hotspots.clear();
    this.hoveredHotspot = null;
  }

  /**
   * Enable/disable a hotspot
   */
  setEnabled(id: string, enabled: boolean): void {
    const hotspot = this.hotspots.get(id);
    if (hotspot) {
      hotspot.setEnabled(enabled);
    }
  }

  /**
   * Execute an action on the currently hovered hotspot
   */
  async interact(verb: InteractionVerb, heldItemId?: string): Promise<string | null> {
    if (!this.hoveredHotspot) {
      return null;
    }

    const baseResponse = await this.hoveredHotspot.executeAction(verb, heldItemId);
    this.onHotspotClick.forEach(cb => cb(this.hoveredHotspot!, verb));

    // Generate dynamic response using Claude Haiku
    const dynamicResponse = await responseGenerator.generate({
      verb,
      target: this.hoveredHotspot.hotspotName,
      baseResponse,
      context: heldItemId ? `Player is holding: ${heldItemId}` : undefined,
    });

    return dynamicResponse;
  }

  /**
   * Execute an action on a specific hotspot by ID
   */
  async interactWith(hotspotId: string, verb: InteractionVerb, heldItemId?: string): Promise<string | null> {
    const hotspot = this.hotspots.get(hotspotId);
    if (!hotspot) {
      return null;
    }

    return await hotspot.executeAction(verb, heldItemId);
  }

  /**
   * Find hotspots at a given point
   */
  getHotspotsAtPoint(x: number, y: number): Hotspot[] {
    const results: Hotspot[] = [];

    for (const hotspot of this.hotspots.values()) {
      if (!hotspot.getEnabled()) continue;

      const bounds = hotspot.getBounds();
      if (bounds.contains(x, y)) {
        results.push(hotspot);
      }
    }

    return results;
  }

  /**
   * Subscribe to hover events
   */
  onHover(callback: (hotspot: Hotspot | null) => void): void {
    this.onHotspotHover.push(callback);
  }

  /**
   * Subscribe to click events
   */
  onClick(callback: (hotspot: Hotspot, verb: InteractionVerb) => void): void {
    this.onHotspotClick.push(callback);
  }

  /**
   * Toggle debug visualization for all hotspots
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    for (const hotspot of this.hotspots.values()) {
      hotspot.showDebug(enabled);
    }
  }

  /**
   * Get current debug mode state
   */
  getDebugMode(): boolean {
    return this.debugMode;
  }

  /**
   * Clean up when scene shuts down
   */
  destroy(): void {
    this.clear();
    this.onHotspotHover = [];
    this.onHotspotClick = [];
  }
}
