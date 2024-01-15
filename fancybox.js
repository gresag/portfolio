// Fancybox Config
Fancybox.bind('[data-fancybox="gallery"]', {
  Hash: false,
  Thumbs: false,

  compact: false,

  contentClick: "toggleCover",
  wheel: "slide",

  Toolbar: {
    display: {
      left: [],
      middle: [],
      right: ["close"],
    },
  },

  Images: {
    Panzoom: {
      panMode: "mousemove",
      mouseMoveFactor: 1.1,
      mouseMoveFriction: 0.12,
    },
  },
});
