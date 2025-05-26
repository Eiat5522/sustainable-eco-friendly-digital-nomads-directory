"use client";

import { useRouter } from "next/navigation";

export default function PreviewBanner() {
  const router = useRouter();

  const exitPreview = () => {
    router.push("/api/preview/exit");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white py-2 px-4 flex items-center justify-between">
      <div className="font-medium">
        Preview Mode Active - You&apos;re viewing unpublished content
      </div>
      <button
        onClick={exitPreview}
        className="bg-white text-orange-600 px-3 py-1 rounded font-medium hover:bg-orange-100 transition-colors"
      >
        Exit Preview
      </button>
    </div>
  );
}
