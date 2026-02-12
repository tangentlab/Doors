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
  },
  funnel: {
    radius: 250,
    orientation: 0,
    hotspots: [
      {
        id: "funnel-top",
        azimuth: 0,
        elevation: 1,
        label: "To Entrance",
        color: "#95E1D3",
        onClick: () => window.hotspotManager.changeVideo("entrance"),
      },
      {
        id: "funnel-bottom",
        azimuth: 180,
        elevation: 1,
        label: "To Bottoms",
        color: "#F38181",
        onClick: () => window.hotspotManager.changeVideo("heart"),
      },
      {
        id: "funnel-side",
        azimuth: 270,
        elevation: 1,
        label: "To Lookout",
        color: "#AA96DA",
        onClick: () => window.hotspotManager.changeVideo("lookout"),
      },
    ],
  },
  heart: {
    radius: 250,
    orientation: 0,
    hotspots: [
      {
        id: "heart-center",
        azimuth: 0,
        elevation: 1,
        label: "To Bottoms",
        color: "#FF69B4",
        onClick: () => window.hotspotManager.changeVideo("bottoms"),
      },
      {
        id: "heart-left",
        azimuth: 270,
        elevation: 1,
        label: "To Lookout",
        color: "#FFB6C1",
        onClick: () => window.hotspotManager.changeVideo("lookout"),
      },
      {
        id: "heart-right",
        azimuth: 90,
        elevation: 1,
        label: "To Funnel",
        color: "#FFC0CB",
        onClick: () => window.hotspotManager.changeVideo("funnel"),
      },
    ],
  },
  lookout: {
    radius: 250,
    orientation: 0,
    hotspots: [
      {
        id: "lookout-vista",
        azimuth: 0,
        elevation: 1,
        label: "To Funnel",
        color: "#FFD700",
        onClick: () => window.hotspotManager.changeVideo("funnel"),
      },
      {
        id: "lookout-ground",
        azimuth: 90,
        elevation: 1,
        label: "To Bottoms",
        color: "#8B7355",
        onClick: () => window.hotspotManager.changeVideo("bottoms"),
      },
      {
        id: "lookout-sky",
        azimuth: 270,
        elevation: 1,
        label: "To Heart",
        color: "#87CEEB",
        onClick: () => window.hotspotManager.changeVideo("heart"),
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
        azimuth: 90,
        elevation: 1,
        label: "To Lookout",
        color: "#696969",
        onClick: () => window.hotspotManager.changeVideo("lookout"),
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
  }

  setupVideoChangeListener() {
    const videoSphere = document.querySelector("#video-sphere");
    if (!videoSphere) return;

    // Get initial video ID from src attribute
    const initialSrc = videoSphere.getAttribute("src");
    if (initialSrc) {
      this.currentVideoId = initialSrc.replace("#", "");
      this.loadHotspotsForVideo(this.currentVideoId);
      // Apply any orientation specified for this video
      this.applyVideoOrientation(this.currentVideoId);
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
          // Apply orientation for the new video
          this.applyVideoOrientation(videoId);
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

    const { radius, hotspots } = layout;

    // Create hotspots
    hotspots.forEach((hotspot) => {
      this.createHotspot(hotspot, radius);
    });

    this.currentHotspots = hotspots;
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

    // Calculate rotation to face camera (at origin)
    const rotation = this.calculateLookAtRotation(
      cartesian.x,
      cartesian.y,
      cartesian.z,
    );
    hotspot.setAttribute("rotation", rotation);

    // Store spherical data on the element for easy access
    hotspot.hotspotData = hotspotData;
    hotspot.radius = radius;

    // Visual representation (circle)
    const visual = document.createElement("a-circle");
    visual.setAttribute("radius", "5");
    visual.setAttribute("color", hotspotData.color);
    visual.setAttribute("opacity", "0.8");
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

    // Click handler (works for mouse & VR). Also plays a click sound if available
    visual.addEventListener("click", (e) => {
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
    });

    hotspot.appendChild(visual);

    // Optional: Add label (positioned above the hotspot and facing the camera)
    if (hotspotData.label) {
      const label = document.createElement("a-text");
      label.setAttribute("value", hotspotData.label);
      // Position above the visual circle (circle radius is 5)
      label.setAttribute("position", "0 6 0");
      label.setAttribute("align", "center");
      label.setAttribute("anchor", "center");
      label.setAttribute("baseline", "bottom");
      // Wider width so the text is readable and increase scale for larger text
      label.setAttribute("width", "30");
      label.setAttribute("scale", "6 6 6");
      // Keep color consistent with hotspot but use white if no color provided
      label.setAttribute("color", hotspotData.color || "#FFFFFF");
      // Use double-sided so it remains visible from different angles
      label.setAttribute("side", "double");

      // Reverse Y rotation so the text faces the camera (hotspot already faces origin)
      try {
        const rotationParts = rotation.split(" ");
        const rotX = parseFloat(rotationParts[0]) || 0;
        const rotY = (parseFloat(rotationParts[1]) || 0) + 180;
        label.setAttribute("rotation", `${rotX} ${rotY} 0`);
      } catch (err) {
        // Fallback: flip around Y by 180 degrees
        label.setAttribute("rotation", "0 180 0");
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

  // Method to change video
  changeVideo(videoId) {
    const videoSphere = document.querySelector("#video-sphere");
    videoSphere.setAttribute("src", `#${videoId}`);
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

  // Calculate rotation to make entity face origin (0,0,0)
  calculateLookAtRotation(x, y, z) {
    const dx = -x;
    const dy = -y;
    const dz = -z;

    const rotationX =
      Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI);
    const rotationY = Math.atan2(dx, dz) * (180 / Math.PI);

    return `${rotationX} ${rotationY} 0`;
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
