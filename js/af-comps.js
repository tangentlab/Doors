AFRAME.registerComponent("infoicon", {
  schema: {
    linkto: { type: "string", default: "" },
    infogroup: { type: "string", default: "" },
  },
  init() {
    this.el.setAttribute("src", "#info-icon");
    this.el.setAttribute("scale", "0.5 0.5 0.5");
    this.el.setAttribute("look-at", "#cam");
    var data = this.data;

    this.el.addEventListener("click", function () {
      this.setAttribute("scale", "0.7 0.7 0.7");
      this.setAttribute("src", data.infolink);
    });
  },
});

AFRAME.registerComponent("hotspots", {
  init: function () {
    this.el.addEventListener("reloadspots", function (evt) {
      var currspotgroup = document.getElementById(evt.detail.currspots);
      currspotgroup.setAttribute("scale", "0 0 0");

      var newspotgroup = document.getElementById(evt.detail.newspots);
      newspotgroup.setAttribute("scale", "1 1 1");
    });
  },
  update: function () {},
  tick: function () {},
});

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
