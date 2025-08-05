module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require usage of SanityImage helper for Sanity images",
      category: "Best Practices",
    },
    messages: {
      useSanityImage: "Use <SanityImage> for rendering Sanity images. Do not use <img> or <Image> directly with Sanity image objects.",
      requireAlt: "All images must have a valid, descriptive alt attribute.",
      requireFallback: "SanityImage must include fallbackSrc and fallbackAlt props.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (
          (node.name.name === "img" || node.name.name === "Image") &&
          !node.attributes.some(attr => attr.name && attr.name.name === "fallbackAlt")
        ) {
          context.report({ node, messageId: "requireFallback" });
        }
      }
    };
  }
};