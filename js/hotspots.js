/**
 * Hotspot System for A-Frame Video Sphere
 * Uses spherical coordinates (radius, azimuth, elevation) for consistent positioning
 */

/**
 * Spherical coordinates:
 * - radius: distance from center (consistent for all hotspots in layout)
 * - azimuth: horizontal rotation in degrees (0-360, where 0 = front, 90 = right, 180 = back, 270 = left)
 * - elevation: vertical rotation in degrees (-90 = bottom, 0 = center, 90 = top)
 */

/** Audio track per space (concat, solstice, or duet). Played when entering that space. */
const SPACE_AUDIO = {
  entrance: "#concat",
  funnel: "#solstice",
  heart: "#duet",
  lookout: "#concat",
  bottoms: "#solstice",
};

const SPACE_TITLES = {
  entrance: "Entrance",
  funnel: "Funnel",
  heart: "Heart",
  lookout: "Lookout",
  bottoms: "Bottoms",
};

const SPACE_INFO = {
  entrance:
    "The threshold into Doors. Take a moment to look around, listen, and select a marker in the landscape when you are ready to move deeper into the site.",
  funnel:
    "An enveloping sound field shaped by stream recordings, contact microphones, and granular textures. Turning through the space reveals routes into the surrounding landscape.",
  heart:
    "A resonant listening space where sound and place meet. Its musical character is inspired by physical locations and trees within the site.",
  lookout:
    "A quieter place for observation and context. The restrained interaction leaves room to attend to the wider landscape and its layered history.",
  bottoms:
    "An archive embedded in the landscape. This area gathers trail-camera images, soundscape compositions, plant knowledge, and other traces of the site.",
};

// Adjust this value to make the sphere-to-sphere blink faster or slower.
const SPHERE_TRANSITION_DURATION_MS = 1700;

/**
 * Keep an entity's local +Z face aligned with the active camera.
 *
 * The hotspot container is parented to the video sphere, which can have its own
 * rotation. Converting the camera's world quaternion into the hotspot's parent
 * space keeps the entire hotspot (button and label) facing the viewer.
 */
AFRAME.registerComponent("face-camera", {
  init() {
    this.cameraWorldPosition = new THREE.Vector3();
    this.cameraParentPosition = new THREE.Vector3();
    this.lookAtMatrix = new THREE.Matrix4();
  },

  tick() {
    const camera = this.el.sceneEl && this.el.sceneEl.camera;
    const parent = this.el.object3D.parent;
    if (!camera || !parent) return;

    camera.getWorldPosition(this.cameraWorldPosition);
    this.cameraParentPosition.copy(this.cameraWorldPosition);
    parent.worldToLocal(this.cameraParentPosition);

    // Build the facing rotation entirely in the hotspot parent's coordinate
    // space. This avoids Object3D.lookAt's limitations with rotated parents.
    this.lookAtMatrix.lookAt(
      this.el.object3D.position,
      this.cameraParentPosition,
      this.el.object3D.up,
    );
    this.el.object3D.quaternion.setFromRotationMatrix(this.lookAtMatrix);
  },
});

// Decorative A-Frame text can sit in front of a hotspot and become the first
// raycast intersection. Disable raycasting on those meshes so the cursor reaches
// the actual button surface behind them.
AFRAME.registerComponent("raycast-pass-through", {
  init() {
    const disableRaycast = () => {
      this.el.object3D.traverse((object) => {
        if (object.isMesh) object.raycast = () => {};
      });
    };
    this.el.addEventListener("object3dset", disableRaycast);
    disableRaycast();
  },
});

AFRAME.registerComponent("ui-depth-order", {
  schema: { order: { type: "number", default: 1 } },
  init() {
    const applyOrder = () => {
      this.el.object3D.traverse((object) => {
        object.renderOrder = this.data.order;
        if (object.material) {
          object.material.depthTest = false;
          object.material.depthWrite = false;
          object.material.needsUpdate = true;
        }
      });
    };
    this.el.addEventListener("object3dset", applyOrder);
    applyOrder();
  },
});

/**
 * Add information POIs to an area's `infoHotspots` array. Each POI needs a
 * unique id, spherical azimuth/elevation, title, and description. `label` and
 * `color` are optional.
 */
const HOTSPOT_LAYOUTS = {
  entrance: {
    //
    radius: 250,
    orientation: -90, // yaw (Y-axis) degrees to align this video's forward direction
    hotspots: [
      {
        id: "entrance-door",
        azimuth: 90,
        elevation: 1,
        label: "To Funnel",
        color: "#00839a",
        onClick: () => window.hotspotManager.changeVideo("funnel"),
      },
    ],
    // infoHotspots: [
    //   {
    //     id: "entrance-info-threshold",
    //     azimuth: 20,
    //     elevation: 3,
    //     title: "The Threshold",
    //     description:
    //       "This entrance marks the transition from the surrounding world into the recorded landscape. Pause here to notice how the site changes through image and sound.",
    //   },
    // ],
  },
  funnel: {
    radius: 250,
    orientation: 0,
    hotspots: [
      {
        id: "funnel-top",
        azimuth: 270,
        elevation: 1,
        label: "To Entrance",
        color: "#95E1D3",
        onClick: () => window.hotspotManager.changeVideo("entrance"),
      },
      {
        id: "funnel-bottom",
        azimuth: 90,
        elevation: 1,
        label: "To Bottoms",
        color: "#F38181",
        onClick: () => window.hotspotManager.changeVideo("bottoms"),
      },
      {
        id: "funnel-heart",
        azimuth: 105,
        elevation: 1,
        label: "To Heart",
        color: "#F38181",
        onClick: () => window.hotspotManager.changeVideo("heart"),
      },
      {
        id: "funnel-lookout",
        azimuth: 40,
        elevation: 1,
        label: "To Lookout",
        color: "#AA96DA",
        onClick: () => window.hotspotManager.changeVideo("lookout"),
      },
    ],
    infoHotspots: [
      {
        id: "funnel-info-sound-field",
        azimuth: 180,
        elevation: 5,
        title: "Sound Field",
        description:
          "Funnel combines stream recordings, contact microphones, and granular textures into an enveloping field. Turning through the space changes how these layers are perceived.",
      },
    ],
  },
  heart: {
    radius: 250,
    orientation: 0,
    hotspots: [
      {
        id: "heart-center",
        azimuth: 90,
        elevation: 1,
        label: "To Bottoms",
        color: "#ff0000",
        onClick: () => window.hotspotManager.changeVideo("bottoms"),
      },
      {
        id: "heart-left",
        azimuth: 0,
        elevation: 1,
        label: "To Lookout",
        color: "#FFB6C1",
        onClick: () => window.hotspotManager.changeVideo("lookout"),
      },
      {
        id: "heart-right",
        azimuth: 270,
        elevation: 1,
        label: "To Funnel",
        color: "#FFC0CB",
        onClick: () => window.hotspotManager.changeVideo("funnel"),
      },
    ],
    infoHotspots: [
      {
        id: "heart-info-resonance",
        azimuth: 150,
        elevation: 4,
        title: "Site Resonance",
        description:
          "The musical character of Heart is inspired by physical locations and trees within the site, treating the landscape as a resonant instrument.",
      },
    ],
  },
  lookout: {
    radius: 250,
    orientation: 0,
    hotspots: [
      {
        id: "lookout-vista",
        azimuth: -45,
        elevation: 1,
        label: "To Funnel",
        color: "#FFD700",
        onClick: () => window.hotspotManager.changeVideo("funnel"),
      },
      {
        id: "lookout-ground",
        azimuth: 200,
        elevation: 1,
        label: "To Bottoms",
        color: "#ff8c00",
        onClick: () => window.hotspotManager.changeVideo("bottoms"),
      },
      {
        id: "lookout-sky",
        azimuth: 280,
        elevation: 1,
        label: "To Heart",
        color: "#87CEEB",
        onClick: () => window.hotspotManager.changeVideo("heart"),
      },
    ],
    infoHotspots: [
      {
        id: "lookout-info-observation",
        azimuth: 100,
        elevation: 6,
        title: "A Place to Observe",
        description:
          "Lookout is intentionally quiet and restrained, offering a place to attend to the wider landscape and the histories layered within it.",
      },
    ],
  },
  bottoms: {
    radius: 250,
    orientation: 0,
    hotspots: [
      {
        id: "bottoms-water",
        azimuth: 270,
        elevation: 1,
        label: "To Heart",
        color: "#00CED1",
        onClick: () => window.hotspotManager.changeVideo("heart"),
      },
      {
        id: "bottoms-rocks",
        azimuth: -60,
        elevation: 1,
        label: "To Lookout",
        color: "#ff0000",
        onClick: () => window.hotspotManager.changeVideo("lookout"),
      },
    ],
    infoHotspots: [
      {
        id: "bottoms-info-archive",
        azimuth: 40,
        elevation: 4,
        title: "Living Archive",
        description:
          "Bottoms gathers traces of the site, including trail-camera images, soundscape compositions, plant knowledge, and other forms of shared observation.",
      },
    ],
  },
};

/**
 * Convert spherical coordinates to cartesian coordinates
 * @param {number} radius - distance from center
 * @param {number} azimuth - horizontal angle in degrees (0-360)
 * @param {number} elevation - vertical angle in degrees (-90 to 90)
 * @returns {object} cartesian coordinates {x, y, z}
 */
function sphericalToCartesian(radius, azimuth, elevation) {
  const azimuthRad = (azimuth * Math.PI) / 180;
  const elevationRad = (elevation * Math.PI) / 180;

  const x = radius * Math.cos(elevationRad) * Math.sin(azimuthRad);
  const y = radius * Math.sin(elevationRad);
  const z = -radius * Math.cos(elevationRad) * Math.cos(azimuthRad);

  return { x, y, z };
}

class HotspotManager {
  constructor(sceneSelector = "a-scene") {
    this.scene = document.querySelector(sceneSelector);
    this.currentHotspots = [];
    this.hotspotsContainer = null;
    this.currentVideoId = "entrance";
    this.isTransitioning = false;
    /** @type {HTMLAudioElement | null} currently playing hotspot track (concat/solstice/duet) */
    this.currentHotspotAudio = null;
    this.infoButton = document.querySelector("#info-button");
    this.infoBackdrop = document.querySelector("#info-panel-backdrop");
    this.infoPanel = document.querySelector("#info-panel");
    this.infoCloseButton = document.querySelector("#info-close");
    this.infoEyebrow = document.querySelector("#info-panel-eyebrow");
    this.infoHeading = document.querySelector("#info-panel-heading");
    this.infoDescription = document.querySelector("#info-panel-description");
    this.lastInfoFocus = null;
    this.infoCloseTimer = null;

    this.init();
  }

  init() {
    // Create container for hotspots
    this.hotspotsContainer = document.createElement("a-entity");
    this.hotspotsContainer.id = "hotspots-container";

    // Attach the hotspots container to the video sphere so hotspots rotate together with the video content.
    this.videoSphere = document.querySelector("#video-sphere");
    if (this.videoSphere) {
      this.videoSphere.appendChild(this.hotspotsContainer);
    } else {
      this.scene.appendChild(this.hotspotsContainer);
    }

    // Setup event listener for video changes
    this.setupVideoChangeListener();
    this.setupInfoPanel();
  }

  setupInfoPanel() {
    if (!this.infoButton || !this.infoBackdrop || !this.infoCloseButton) return;

    this.infoButton.addEventListener("click", () => this.openInfoPanel());
    this.infoCloseButton.addEventListener("click", () => this.closeInfoPanel());
    this.infoBackdrop.addEventListener("click", (event) => {
      if (event.target === this.infoBackdrop) this.closeInfoPanel();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isInfoPanelOpen()) {
        this.closeInfoPanel();
      }
      if (event.key === "Tab" && this.isInfoPanelOpen()) {
        this.keepInfoFocusInside(event);
      }
    });
  }

  isInfoPanelOpen() {
    return Boolean(this.infoBackdrop?.classList.contains("is-open"));
  }

  openInfoPanel(content = null) {
    if (!this.infoBackdrop) return;
    window.clearTimeout(this.infoCloseTimer);
    this.lastInfoFocus = document.activeElement;
    if (content) {
      if (this.infoEyebrow) {
        this.infoEyebrow.textContent = content.eyebrow || "Point of interest";
      }
      if (this.infoHeading) this.infoHeading.textContent = content.title;
      if (this.infoDescription) {
        this.infoDescription.textContent = content.description;
      }
    } else {
      this.updateInfoPanel(this.currentVideoId);
    }
    this.infoBackdrop.hidden = false;
    window.requestAnimationFrame(() => {
      this.infoBackdrop.classList.add("is-open");
      this.infoButton?.setAttribute("aria-expanded", "true");
      this.infoCloseButton?.focus();
    });
  }

  openInfoHotspot(hotspot) {
    this.openInfoPanel({
      eyebrow: "Point of interest",
      title: hotspot.title,
      description: hotspot.description,
    });
  }

  closeInfoPanel({ restoreFocus = true } = {}) {
    if (!this.infoBackdrop) return;
    this.infoBackdrop.classList.remove("is-open");
    this.infoButton?.setAttribute("aria-expanded", "false");

    const finishClose = () => {
      this.infoBackdrop.hidden = true;
      if (restoreFocus) {
        const focusTarget = this.lastInfoFocus || this.infoButton;
        focusTarget?.focus();
      }
    };

    this.infoCloseTimer = window.setTimeout(finishClose, 180);
  }

  keepInfoFocusInside(event) {
    const focusable = this.infoPanel?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  setupVideoChangeListener() {
    const videoSphere = document.querySelector("#video-sphere");
    if (!videoSphere) return;

    // Get initial video ID from src attribute
    const initialSrc = videoSphere.getAttribute("src");
    if (initialSrc) {
      this.currentVideoId = initialSrc.replace("#", "");
      this.loadHotspotsForVideo(this.currentVideoId);
      this.applyVideoOrientation(this.currentVideoId);
      this.updateSpaceTitle(this.currentVideoId);
      this.playSpaceAudio(this.currentVideoId);
      console.log(
        `HotspotManager: Loaded initial hotspots for "${this.currentVideoId}"`,
      );
    }

    // Listen for video source changes
    const observer = new MutationObserver(() => {
      const currentSrc = videoSphere.getAttribute("src");
      if (currentSrc) {
        const videoId = currentSrc.replace("#", "");
        if (videoId !== this.currentVideoId) {
          this.currentVideoId = videoId;
          this.loadHotspotsForVideo(videoId);
          this.applyVideoOrientation(videoId);
          this.updateSpaceTitle(videoId);
          this.playSpaceAudio(videoId);
          console.log(`HotspotManager: Changed hotspots to "${videoId}"`);
        }
      }
    });

    observer.observe(videoSphere, {
      attributes: true,
      attributeFilter: ["src"],
    });
  }

  loadHotspotsForVideo(videoId) {
    // Clear existing hotspots
    this.clearHotspots();

    // Get hotspots for this video
    const layout = HOTSPOT_LAYOUTS[videoId];
    if (!layout) return;

    const { radius, hotspots = [], infoHotspots = [] } = layout;

    // Create hotspots
    hotspots.forEach((hotspot) => {
      this.createHotspot(hotspot, radius);
    });

    infoHotspots.forEach((hotspot) => {
      this.createHotspot(
        {
          ...hotspot,
          type: "info",
          label: hotspot.label || hotspot.title,
          color: hotspot.color || "#d6deae",
          onClick: () => this.openInfoHotspot(hotspot),
        },
        radius,
      );
    });

    this.currentHotspots = [...hotspots, ...infoHotspots];
    this.currentRadius = radius;
  }

  createHotspot(hotspotData, radius) {
    const hotspot = document.createElement("a-entity");
    hotspot.id = hotspotData.id;
    hotspot.setAttribute("class", "hotspot");

    // Convert spherical to cartesian coordinates
    const cartesian = sphericalToCartesian(
      radius,
      hotspotData.azimuth,
      hotspotData.elevation,
    );
    hotspot.setAttribute(
      "position",
      `${cartesian.x} ${cartesian.y} ${cartesian.z}`,
    );
    hotspot.setAttribute("face-camera", "");

    // Store spherical data on the element for easy access
    hotspot.hotspotData = hotspotData;
    hotspot.radius = radius;

    // One activation handler is shared by every raycastable part of a POI.
    const activateHotspot = (e) => {
      e.stopPropagation();
      const clickSound = document.querySelector("#click-sound");
      if (clickSound) {
        try {
          clickSound.currentTime = 0;
          clickSound.play();
        } catch (err) {
          /* ignore autoplay/security errors */
        }
      }
      hotspotData.onClick();
    };

    // Visual representation (circle)
    const visual = document.createElement("a-circle");
    visual.setAttribute("class", "clickable");
    visual.setAttribute("radius", hotspotData.type === "info" ? "8" : "5");
    visual.setAttribute("color", hotspotData.color);
    visual.setAttribute("opacity", "0.8");
    // A-Frame circles and text have opposite front-face directions. Rendering
    // both sides keeps the button visible and raycastable while its parent
    // billboards toward the camera.
    visual.setAttribute("side", "double");
    visual.setAttribute(
      "animation__scale-in",
      "property: scale; from: 0 0 0; to: 1 1 1; duration: 300; easing: easeInOutQuad",
    );

    // Hover effects
    visual.setAttribute(
      "event-set__mouseenter",
      "scale: 1.3 1.3 1.3; opacity: 1",
    );
    visual.setAttribute("event-set__mouseleave", "scale: 1 1 1; opacity: 0.8");

    // Change OS mouse cursor when hovering hotspots (desktop)
    visual.addEventListener("mouseenter", () => {
      document.body.style.cursor = "pointer";
    });
    visual.addEventListener("mouseleave", () => {
      document.body.style.cursor = "";
    });

    // Mouse down/up visual feedback (scales the visual slightly) — works for mouse and cursor events
    visual.addEventListener("mousedown", () => {
      visual.object3D.scale.set(0.8, 0.8, 0.8);
    });
    visual.addEventListener("mouseup", () => {
      visual.object3D.scale.set(1, 1, 1);
    });

    // Click handler (works for mouse & VR).
    visual.addEventListener("click", activateHotspot);

    if (hotspotData.type !== "info") {
      hotspot.appendChild(visual);
    }

    const infoLabelWidth = hotspotData.label
      ? Math.min(84, Math.max(40, hotspotData.label.length * 4.5))
      : 40;
    const infoIconX = -(infoLabelWidth / 2 + 15);

    if (hotspotData.type === "info") {
      const infoButton = document.createElement("a-circle");
      infoButton.setAttribute("class", "clickable");
      infoButton.setAttribute("radius", "6");
      infoButton.setAttribute("position", `${infoIconX} 11 0.2`);
      infoButton.setAttribute("color", hotspotData.color);
      infoButton.setAttribute("opacity", "0.95");
      infoButton.setAttribute("side", "double");
      infoButton.setAttribute("ui-depth-order", "order: 2");
      infoButton.addEventListener("click", activateHotspot);
      infoButton.addEventListener("mouseenter", () => {
        document.body.style.cursor = "pointer";
      });
      infoButton.addEventListener("mouseleave", () => {
        document.body.style.cursor = "";
      });
      hotspot.appendChild(infoButton);

      const infoGlyph = document.createElement("a-text");
      infoGlyph.setAttribute("value", "i");
      infoGlyph.setAttribute("position", `${infoIconX} 11 0.4`);
      infoGlyph.setAttribute("align", "center");
      infoGlyph.setAttribute("anchor", "center");
      infoGlyph.setAttribute("baseline", "center");
      infoGlyph.setAttribute("width", "18");
      infoGlyph.setAttribute("scale", "10 10 10");
      infoGlyph.setAttribute("color", "#172018");
      infoGlyph.setAttribute("side", "double");
      infoGlyph.setAttribute("raycast-pass-through", "");
      infoGlyph.setAttribute("ui-depth-order", "order: 3");
      hotspot.appendChild(infoGlyph);

      const labelButton = document.createElement("a-plane");
      labelButton.setAttribute("class", "clickable");
      labelButton.setAttribute("width", `${infoLabelWidth}`);
      labelButton.setAttribute("height", "14");
      labelButton.setAttribute("position", "0 11 0");
      labelButton.setAttribute(
        "material",
        "shader: flat; color: #172018; opacity: 0.62; transparent: true",
      );
      labelButton.setAttribute("side", "double");
      labelButton.setAttribute("ui-depth-order", "order: 1");
      labelButton.addEventListener("click", activateHotspot);
      labelButton.addEventListener("mouseenter", () => {
        document.body.style.cursor = "pointer";
      });
      labelButton.addEventListener("mouseleave", () => {
        document.body.style.cursor = "";
      });
      hotspot.appendChild(labelButton);
    }

    // Optional: Add label (positioned above the hotspot and facing the camera)
    if (hotspotData.label) {
      const label = document.createElement("a-text");
      label.setAttribute("value", hotspotData.label);
      // Position above the visual circle (circle radius is 5)
      label.setAttribute(
        "position",
        hotspotData.type === "info" ? "0 11 0.2" : "0 6 0",
      );
      label.setAttribute("align", "center");
      label.setAttribute("anchor", "center");
      label.setAttribute(
        "baseline",
        hotspotData.type === "info" ? "center" : "bottom",
      );
      // Wider width so the text is readable and increase scale for larger text
      label.setAttribute("width", hotspotData.type === "info" ? "38" : "30");
      label.setAttribute("scale", "6 6 6");
      // Keep color consistent with hotspot but use white if no color provided
      label.setAttribute(
        "color",
        hotspotData.type === "info"
          ? "#f3f1e9"
          : hotspotData.color || "#FFFFFF",
      );
      // Use double-sided so it remains visible from different angles
      label.setAttribute("side", "double");
      if (hotspotData.type === "info") {
        label.setAttribute("raycast-pass-through", "");
        label.setAttribute("ui-depth-order", "order: 2");
      }

      hotspot.appendChild(label);
    }

    this.hotspotsContainer.appendChild(hotspot);
  }

  clearHotspots() {
    this.hotspotsContainer.innerHTML = "";
    this.currentHotspots = [];
  }

  // Method to update hotspot position using spherical coordinates
  updateHotspotPosition(hotspotId, azimuth, elevation) {
    const hotspot = document.querySelector(`#${hotspotId}`);
    if (hotspot) {
      const cartesian = sphericalToCartesian(
        hotspot.radius,
        azimuth,
        elevation,
      );
      hotspot.setAttribute(
        "position",
        `${cartesian.x} ${cartesian.y} ${cartesian.z}`,
      );

      // Update in data structure
      if (hotspot.hotspotData) {
        hotspot.hotspotData.azimuth = azimuth;
        hotspot.hotspotData.elevation = elevation;
      }
    }
  }

  // Method to update hotspot radius (distance from center)
  updateHotspotRadius(newRadius) {
    this.currentRadius = newRadius;
    const hotspots = this.hotspotsContainer.querySelectorAll(".hotspot");
    hotspots.forEach((hotspot) => {
      if (hotspot.hotspotData) {
        const cartesian = sphericalToCartesian(
          newRadius,
          hotspot.hotspotData.azimuth,
          hotspot.hotspotData.elevation,
        );
        hotspot.setAttribute(
          "position",
          `${cartesian.x} ${cartesian.y} ${cartesian.z}`,
        );
        hotspot.radius = newRadius;
      }
    });
  }

  // Method to add a new hotspot to current video
  addHotspot(hotspotData) {
    this.createHotspot(hotspotData, this.currentRadius);
    this.currentHotspots.push(hotspotData);
  }

  // Method to get all current hotspots with their spherical coordinates
  getHotspots() {
    return this.currentHotspots;
  }

  // Method to get hotspot by ID
  getHotspotById(hotspotId) {
    const hotspot = document.querySelector(`#${hotspotId}`);
    if (hotspot && hotspot.hotspotData) {
      return {
        ...hotspot.hotspotData,
        radius: hotspot.radius,
      };
    }
    return null;
  }

  updateSpaceTitle(spaceId) {
    const title = document.querySelector("#space-title");
    if (title) title.textContent = SPACE_TITLES[spaceId] || spaceId;
    this.updateInfoPanel(spaceId);
  }

  updateInfoPanel(spaceId) {
    const spaceTitle = SPACE_TITLES[spaceId] || spaceId;
    if (this.infoEyebrow) this.infoEyebrow.textContent = "About this place";
    if (this.infoHeading) this.infoHeading.textContent = spaceTitle;
    if (this.infoDescription) {
      this.infoDescription.textContent =
        SPACE_INFO[spaceId] || "Explore this place through sight and sound.";
    }
    this.infoButton?.setAttribute("aria-label", `About ${spaceTitle}`);
  }

  /**
   * Play the audio track for a space (entrance, funnel, heart, lookout, bottoms).
   * Stops any currently playing space track first.
   */
  playSpaceAudio(spaceId) {
    if (this.currentHotspotAudio) {
      this.currentHotspotAudio.pause();
      this.currentHotspotAudio.currentTime = 0;
      this.currentHotspotAudio = null;
    }
    const audioSelector = SPACE_AUDIO[spaceId];
    if (!audioSelector) return;
    const audioEl = document.querySelector(audioSelector);
    if (audioEl && typeof audioEl.play === "function") {
      try {
        audioEl.currentTime = 0;
        audioEl.play();
        this.currentHotspotAudio = audioEl;
      } catch (err) {
        console.warn("Space audio play failed:", err);
      }
    }
  }

  // Method to change video
  async changeVideo(videoId) {
    if (this.isTransitioning || videoId === this.currentVideoId) return;

    if (this.isInfoPanelOpen()) {
      this.closeInfoPanel({ restoreFocus: false });
    }

    const videoSphere = document.querySelector("#video-sphere");
    const newVideo = document.querySelector(`#${videoId}`);
    const transition = document.querySelector("#sphere-transition");
    if (!videoSphere || !newVideo) return;

    this.isTransitioning = true;
    this.hotspotsContainer.setAttribute("visible", false);
    transition?.style.setProperty(
      "--sphere-transition-duration",
      `${SPHERE_TRANSITION_DURATION_MS}ms`,
    );
    transition?.classList.add("is-active");

    const transitionDuration = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
      ? 160
      : SPHERE_TRANSITION_DURATION_MS;

    // Swap the texture at the moment the iris is fully closed.
    await new Promise((resolve) =>
      window.setTimeout(resolve, transitionDuration / 2),
    );
    videoSphere.setAttribute("src", `#${videoId}`);
    try {
      await newVideo.play();
    } catch (error) {
      console.log("Autoplay prevented:", error);
    }

    await new Promise((resolve) =>
      window.setTimeout(resolve, transitionDuration / 2),
    );
    transition?.classList.remove("is-active");
    this.hotspotsContainer.setAttribute("visible", true);
    this.isTransitioning = false;
  }

  // Apply configured orientation (yaw) for a given video so the forward direction stays consistent
  applyVideoOrientation(videoId) {
    const layout = HOTSPOT_LAYOUTS[videoId];
    if (!layout || typeof layout.orientation === "undefined") return;
    if (!this.videoSphere)
      this.videoSphere = document.querySelector("#video-sphere");
    if (!this.videoSphere) return;
    const yaw = layout.orientation;
    // Set Y rotation; keep X/Z at 0 for typical video spheres
    this.videoSphere.setAttribute("rotation", `0 ${yaw} 0`);
  }

  // Set orientation for a video (degrees yaw) — updates layout and applies immediately if active
  setVideoOrientation(videoId, yawDegrees) {
    if (!HOTSPOT_LAYOUTS[videoId])
      HOTSPOT_LAYOUTS[videoId] = { radius: 250, hotspots: [] };

    HOTSPOT_LAYOUTS[videoId].orientation = yawDegrees;
    if (this.currentVideoId === videoId) this.applyVideoOrientation(videoId);
  }

  // Get orientation for a video (degrees yaw)
  getVideoOrientation(videoId) {
    const layout = HOTSPOT_LAYOUTS[videoId];
    return layout ? layout.orientation : undefined;
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  window.hotspotManager = new HotspotManager("a-scene");

  setTimeout(function () {
    var entranceVideo = document.getElementById("entrance");
    if (entranceVideo) {
      entranceVideo.play().catch(function (error) {
        console.log("Autoplay prevented:", error);
      });
    }
  }, 500);
});
