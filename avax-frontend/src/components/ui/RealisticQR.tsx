"use client";

import { useEffect, useState } from "react";

/**
 * RealisticQR — a real, standards-compliant QR code rendered as an image.
 *
 * This replaced a hand-drawn 21×21 grid that only *looked* like a QR code
 * (finders + hashed data modules). It had no error correction or format info,
 * so no scanner — including the app's own /pay scanner — could ever decode it.
 * We now generate the matrix with the `qrcode` library, which is the only way
 * the "Receive" QR can actually be scanned.
 */
export default function RealisticQR({
  value,
  size = 210,
  fg = "#1a1a2e",
  bg = "#ffffff",
  label,
}: {
  value: string;
  size?: number;
  fg?: string;
  bg?: string;
  label?: string;
}) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!value) return;

    // Dynamic import keeps the encoder out of the SSR bundle.
    import("qrcode")
      .then((QRCode) =>
        QRCode.toDataURL(value, {
          width: size,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: fg, light: bg },
        }),
      )
      .then((url) => {
        if (!cancelled) {
          setSrc(url);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size, fg, bg]);

  const displaySrc = value ? src : "";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: size + 16,
          height: size + 16,
          padding: 8,
          background: bg,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {displaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displaySrc}
            width={size}
            height={size}
            alt={label ?? "QR code"}
            style={{ display: "block", imageRendering: "pixelated" }}
          />
        ) : (
          <span style={{ fontSize: 11, color: failed ? "#b91c1c" : "#94a3b8" }}>
            {failed ? "Could not create QR" : "Generating…"}
          </span>
        )}
      </div>
      {label && (
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {label}
        </p>
      )}
    </div>
  );
}
