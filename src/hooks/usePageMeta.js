import { useEffect } from "react";

const ensureMetaTag = (selector, attrs) => {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement("meta");
    Object.entries(attrs).forEach(([key, value]) => {
      if (key !== "content") {
        tag.setAttribute(key, value);
      }
    });
    document.head.appendChild(tag);
  }

  return tag;
};

export const usePageMeta = ({
  title,
  description,
  image = "/kumpul-mark.svg",
  url,
}) => {
  useEffect(() => {
    const previousTitle = document.title;
    const titleValue = title || "Kumpul";
    const descriptionValue =
      description || "Plan events, vote on options, and keep payments in sync.";
    const pageUrl = url || window.location.href;
    const imageUrl = image.startsWith("http")
      ? image
      : `${window.location.origin}${image}`;

    document.title = titleValue;

    const descriptionTag = ensureMetaTag('meta[name="description"]', {
      name: "description",
    });
    descriptionTag.setAttribute("content", descriptionValue);

    const ogTitleTag = ensureMetaTag('meta[property="og:title"]', {
      property: "og:title",
    });
    ogTitleTag.setAttribute("content", titleValue);

    const ogDescriptionTag = ensureMetaTag('meta[property="og:description"]', {
      property: "og:description",
    });
    ogDescriptionTag.setAttribute("content", descriptionValue);

    const ogTypeTag = ensureMetaTag('meta[property="og:type"]', {
      property: "og:type",
    });
    ogTypeTag.setAttribute("content", "website");

    const ogUrlTag = ensureMetaTag('meta[property="og:url"]', {
      property: "og:url",
    });
    ogUrlTag.setAttribute("content", pageUrl);

    const ogImageTag = ensureMetaTag('meta[property="og:image"]', {
      property: "og:image",
    });
    ogImageTag.setAttribute("content", imageUrl);

    const twitterCardTag = ensureMetaTag('meta[name="twitter:card"]', {
      name: "twitter:card",
    });
    twitterCardTag.setAttribute("content", "summary_large_image");

    const twitterTitleTag = ensureMetaTag('meta[name="twitter:title"]', {
      name: "twitter:title",
    });
    twitterTitleTag.setAttribute("content", titleValue);

    const twitterDescriptionTag = ensureMetaTag(
      'meta[name="twitter:description"]',
      {
        name: "twitter:description",
      },
    );
    twitterDescriptionTag.setAttribute("content", descriptionValue);

    const twitterImageTag = ensureMetaTag('meta[name="twitter:image"]', {
      name: "twitter:image",
    });
    twitterImageTag.setAttribute("content", imageUrl);

    return () => {
      document.title = previousTitle;
    };
  }, [description, image, title, url]);
};

export default usePageMeta;
