AFRAME.registerComponent("hotspot", {
  schema: {
    color: { default: "#FFF" },
    size: { type: "int", default: 5 },
    label: { type: "string", default: "" },
  },
  init: function () {
    var scene = this.el.sceneEl.object3D; // THREE.Scene
  },
  update: function () {},
  tick: function () {},
  remove: function () {},
  pause: function () {},
  play: function () {},
});
