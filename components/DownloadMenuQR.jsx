"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const generateMenuPoster = async ({ storefrontUrl, tenant }) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported");
  }

  // ---------------------------------------------------------
  // Canvas
  // ---------------------------------------------------------

  const W = 1080;
  const H = 1080;

  canvas.width = W;
  canvas.height = H;

  // ---------------------------------------------------------
  // Theme colors
  // ---------------------------------------------------------

  const primaryColor = tenant?.primaryColor || "#155B68";

  const secondaryColor = tenant?.accentColor || "#C99A5B";

  const backgroundColor = tenant?.backgroundColor || secondaryColor;

  // ---------------------------------------------------------
  // Background
  // ---------------------------------------------------------

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, W, H);

  // ---------------------------------------------------------
  // Grid
  // ---------------------------------------------------------

  ctx.strokeStyle = primaryColor;
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 2;

  for (let x = 0; x <= W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  for (let y = 0; y <= H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  // ---------------------------------------------------------
  // Bottom section
  // ---------------------------------------------------------

  ctx.fillStyle = primaryColor;

  ctx.fillRect(0, 700, W, H - 700);

  // ---------------------------------------------------------
  // Header
  // ---------------------------------------------------------

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  ctx.fillStyle = primaryColor;

  ctx.font = "bold italic 110px Georgia";

  ctx.fillText("Scan Here", W / 2, 40);

  ctx.font = "italic 76px Georgia";

  ctx.fillText("for the Menu", W / 2, 160);

  // ---------------------------------------------------------
  // Sparkle
  // ---------------------------------------------------------

  const sparkle = (x, y, size) => {
    ctx.fillStyle = secondaryColor;

    ctx.beginPath();

    ctx.moveTo(x, y - size * 2);

    ctx.lineTo(x + size * 0.3, y - size * 0.3);

    ctx.lineTo(x + size * 2, y);

    ctx.lineTo(x + size * 0.3, y + size * 0.3);

    ctx.lineTo(x, y + size * 2);

    ctx.lineTo(x - size * 0.3, y + size * 0.3);

    ctx.lineTo(x - size * 2, y);

    ctx.lineTo(x - size * 0.3, y - size * 0.3);

    ctx.closePath();

    ctx.fill();
  };

  sparkle(150, 710, 20);
  sparkle(930, 710, 18);
  sparkle(250, 1010, 12);

  // ---------------------------------------------------------
  // QR Code
  // ---------------------------------------------------------

  const qrSize = 560;

  const qrX = (W - qrSize) / 2;

  const qrY = 300;

  const qrDataUrl = await QRCode.toDataURL(storefrontUrl, {
    width: qrSize,
    margin: 2,
    errorCorrectionLevel: "H",

    color: {
      dark: primaryColor,
      light: backgroundColor,
    },
  });

  const qrImage = new Image();

  await new Promise((resolve, reject) => {
    qrImage.onload = resolve;
    qrImage.onerror = reject;
    qrImage.src = qrDataUrl;
  });

  // ---------------------------------------------------------
  // QR Frame
  // ---------------------------------------------------------

  ctx.fillStyle = backgroundColor;

  ctx.beginPath();

  ctx.roundRect(qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 16);

  ctx.fill();

  // ---------------------------------------------------------
  // Draw QR
  // ---------------------------------------------------------

  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  // ---------------------------------------------------------
  // Center Logo
  // ---------------------------------------------------------

  const centerX = W / 2;

  const centerY = qrY + qrSize / 2;

  ctx.fillStyle = primaryColor;

  ctx.beginPath();

  ctx.roundRect(centerX - 55, centerY - 55, 110, 110, 14);

  ctx.fill();

  ctx.fillStyle = backgroundColor;

  ctx.textAlign = "center";

  ctx.textBaseline = "middle";

  ctx.font = "bold 18px Arial";

  ctx.fillText("INDOCIA", centerX, centerY - 8);

  ctx.font = "bold 10px Arial";

  ctx.fillText("ONLINE", centerX, centerY + 16);

  // ---------------------------------------------------------
  // Storefront Slug
  // ---------------------------------------------------------

  const slug = tenant?.slug;

  if (slug) {
    ctx.fillStyle = primaryColor;

    ctx.font = "bold 38px Arial";

    ctx.textAlign = "center";

    ctx.textBaseline = "top";

    ctx.fillText(`/${slug}`, W / 2, 885);
  }

  // ---------------------------------------------------------
  // Storefront Name
  // ---------------------------------------------------------

  const storeName = tenant?.name;

  if (storeName) {
    ctx.fillStyle = primaryColor;

    ctx.font = "bold 32px Arial";

    ctx.textAlign = "center";

    ctx.textBaseline = "top";

    ctx.fillText(storeName, W / 2, 935);
  }

  // ---------------------------------------------------------
  // Footer
  // ---------------------------------------------------------

  ctx.fillStyle = backgroundColor;

  ctx.textAlign = "center";

  ctx.textBaseline = "top";

  ctx.font = "bold 28px Arial";

  ctx.fillText(
    storefrontUrl?.replace(/^https?:\/\//, "") || "Menu",
    W / 2,
    990,
  );

  ctx.font = "20px Arial";

  ctx.fillText("Fresh • Delicious • Made with ❤️", W / 2, 1030);

  // ---------------------------------------------------------
  // Return PNG
  // ---------------------------------------------------------

  return canvas.toDataURL("image/png");
};

// =========================================================
// Component
// =========================================================

export default function DownloadMenuQR({ storefrontUrl, tenant }) {
  const [posterUrl, setPosterUrl] = useState("");

  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------
  // Generate poster
  // ---------------------------------------------------------

  useEffect(() => {
    if (!storefrontUrl) {
      setPosterUrl("");
      return;
    }

    let cancelled = false;

    const generate = async () => {
      try {
        setLoading(true);

        const result = await generateMenuPoster({
          storefrontUrl,
          tenant,
        });

        if (!cancelled) {
          setPosterUrl(result);
        }
      } catch (error) {
        console.error("Failed to generate menu QR:", error);

        if (!cancelled) {
          setPosterUrl("");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [storefrontUrl, tenant]);

  // ---------------------------------------------------------
  // Download
  // ---------------------------------------------------------

  const handleDownload = () => {
    if (!posterUrl) {
      return;
    }

    const link = document.createElement("a");

    const safeName = tenant?.name
      ? tenant.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()
      : "menu";

    link.download = `${safeName}-menu-qr.png`;

    link.href = posterUrl;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Poster Preview */}

      <div className="flex justify-center">
        {loading ? (
          <div
            className="
              flex
              aspect-square
              w-full
              max-w-[400px]
              items-center
              justify-center
              rounded-xl
              border
              bg-muted
            "
          >
            <p className="text-sm text-muted-foreground">
              Generating QR poster...
            </p>
          </div>
        ) : posterUrl ? (
          <div
            className="
              w-full
              max-w-[400px]
              overflow-hidden
              rounded-xl
              border
              bg-white
              shadow-sm
            "
          >
            <img
              src={posterUrl}
              alt={`QR menu for ${tenant?.name || "store"}`}
              className="
                block
                h-auto
                w-full
              "
            />
          </div>
        ) : (
          <div
            className="
              flex
              aspect-square
              w-full
              max-w-[400px]
              items-center
              justify-center
              rounded-xl
              border
              bg-muted
            "
          >
            <p className="text-sm text-muted-foreground">
              QR preview unavailable
            </p>
          </div>
        )}
      </div>

      {/* Download Button */}

      <Button
        type="button"
        onClick={handleDownload}
        disabled={!posterUrl || loading}
        className="w-full"
        style={{
          backgroundColor: tenant?.primaryColor || undefined,
        }}
      >
        <Download className="mr-2 h-4 w-4" />

        {loading ? "Generating..." : "Download Menu QR"}
      </Button>
    </div>
  );
}
