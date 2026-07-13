import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface FlyerPreviewProps {
  name: string;
  role: string;
  redirectId: string;
}

const HEROS_REDIRECT_BASE = "https://mxhkpmqaoifrufzpqszl.supabase.co/functions/v1/qr-redirect?id=";

const FlyerPreview = ({ name, role, redirectId }: FlyerPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrUrl = `${HEROS_REDIRECT_BASE}${redirectId}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }
  }, [qrUrl]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      {/* Print button — hidden when printing */}
      <button
        onClick={handlePrint}
        className="no-print bg-foreground text-background px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Print Flyer
      </button>

      {/* Flyer — this is what prints */}
      <div
        id="flyer"
        className="border border-border rounded-xl p-12 text-center space-y-6 bg-white"
        style={{ width: "600px", margin: "0 auto" }}
      >
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          Now We See You
        </p>

        <div className="space-y-1">
          <h2 className="text-4xl font-display text-foreground">{name}</h2>
          <p className="text-lg text-muted-foreground">{role}</p>
        </div>

        <div className="flex justify-center py-4">
          <canvas ref={canvasRef} />
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Scan to read their story</p>
          <p className="text-xs text-muted-foreground">nowweseeyou.org</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          #flyer, #flyer * { visibility: visible; }
          #flyer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            border: none;
          }
        }
      `}</style>
    </div>
  );
};

export default FlyerPreview;