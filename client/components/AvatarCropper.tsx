import React, { useEffect, useRef, useState } from "react";

interface Props {
  file: File;
  aspect?: number; // width / height
  onCancel: () => void;
  onCrop: (blob: Blob) => void;
}

// Simple cropper: user can pan image inside fixed square viewport and zoom with range input.
export const AvatarCropper: React.FC<Props> = ({
  file,
  aspect = 1,
  onCancel,
  onCrop,
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setImgLoaded(false);
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, [file]);

  const onImgLoad = () => {
    setImgLoaded(true);
    // center image
    setPos({ x: 0, y: 0 });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleCrop = async () => {
    if (!imgRef.current || !containerRef.current) return;
    const img = imgRef.current;
    const container = containerRef.current;

    const viewportWidth = container.clientWidth;
    const viewportHeight = Math.round(viewportWidth / aspect);

    // create canvas of viewport size
    const canvas = document.createElement("canvas");
    canvas.width = viewportWidth;
    canvas.height = viewportHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Compute image draw parameters
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    // scaled size of the image element
    const displayedW = naturalW * scale;
    const displayedH = naturalH * scale;

    // position of image relative to center of viewport
    const imgLeft = (viewportWidth - displayedW) / 2 + pos.x;
    const imgTop = (viewportHeight - displayedH) / 2 + pos.y;

    // Draw background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the image
    ctx.drawImage(img, imgLeft, imgTop, displayedW, displayedH);

    // Export blob
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.92),
    );
    if (blob) onCrop(blob);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel}></div>
      <div className="relative bg-card rounded-lg p-4 max-w-md w-full z-10">
        <h3 className="font-bold mb-2">Crop Avatar</h3>
        <div
          ref={containerRef}
          className="relative overflow-hidden bg-muted rounded-md w-full"
          style={{ height: "320px" }}
        >
          <img
            ref={imgRef}
            src={URL.createObjectURL(file)}
            alt="to-crop"
            onLoad={onImgLoad}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${scale})`,
              transformOrigin: "center center",
              userSelect: "none",
              touchAction: "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            draggable={false}
          />

          {/* overlay box (visual crop area) */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="border-2 border-white/80 rounded-md w-40 h-40"
              style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.4) inset" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <label className="text-sm">Zoom</label>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="flex-1"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded bg-muted"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="px-4 py-2 rounded bg-primary text-primary-foreground"
          >
            Crop & Gunakan
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropper;
