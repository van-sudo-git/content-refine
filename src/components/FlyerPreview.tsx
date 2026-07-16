import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface FlyerPreviewProps {
  name: string;
  role: string;
  redirectId: string;
  slug: string;
}

// QR points to supabase edge function not heros-redirect
// because flyer-generated redirects live in the main db, not the external redirect project
// TODO: consolidate both redirect systems at some point
const SUPABASE_EDGE_BASE =
  "https://mxhkpmqaoifrufzpqszl.supabase.co/functions/v1/qr-redirect?id=";

const FlyerPreview = ({ name, role, redirectId, slug }: FlyerPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrUrl = `${SUPABASE_EDGE_BASE}${redirectId}`;
  const profileUrl = `nowweseeyou.org/gallery/${slug}`;
  const firstName = name.split(" ")[0];

  // render QR code into the canvas element whenever the redirect ID changes
  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrUrl, {
      width: 260,
      margin: 2,
      color: { dark: "#1a2744", light: "#ffffff" },
    });
  }, [qrUrl]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <button
        onClick={handlePrint}
        className="no-print bg-foreground text-background px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Print Flyer
      </button>

      <div
        id="flyer"
        style={{
          width: "540px",
          margin: "0 auto",
          backgroundColor: "#f5f0e8",
          border: "2.5px solid #1a2744",
          borderRadius: "4px",
          padding: "52px 56px 48px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        {/* platform name at top */}
        <p style={{
          fontSize: "10px",
          fontFamily: "'Arial', sans-serif",
          fontWeight: "700",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#1a2744",
          marginBottom: "14px",
          marginTop: 0,
        }}>
          Now We See You
        </p>

        {/* full width rule like KAC flyer */}
        <div style={{
          borderTop: "1.5px solid #1a2744",
          marginBottom: "32px",
        }} />

        {/* Meet [Name] — personal and inviting */}
        <h1 style={{
          fontSize: "42px",
          fontWeight: "700",
          color: "#1a2744",
          margin: "0 0 8px 0",
          lineHeight: "1.1",
          letterSpacing: "-0.01em",
        }}>
          Meet {name}
        </h1>

        {/* role — understated below the name */}
        <p style={{
          fontSize: "13px",
          color: "#666",
          fontFamily: "'Arial', sans-serif",
          fontStyle: "italic",
          letterSpacing: "0.02em",
          marginTop: 0,
          marginBottom: "36px",
        }}>
          {role}
        </p>

        {/* QR code — large, white background, dominant */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "36px",
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            padding: "16px",
            display: "inline-block",
          }}>
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* bold uppercase CTA like KAC flyer */}
        <p style={{
          fontSize: "13px",
          fontWeight: "700",
          fontFamily: "'Arial', sans-serif",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#1a2744",
          marginBottom: "8px",
          marginTop: 0,
        }}>
          Scan to read {firstName}'s story
        </p>

        <p style={{
          fontSize: "12px",
          color: "#666",
          fontFamily: "'Arial', sans-serif",
          marginBottom: "20px",
          marginTop: 0,
        }}>
          and discover the people who keep our community running
        </p>

        {/* specific profile URL — auto-generated from slug */}
        <p style={{
          fontSize: "12px",
          fontWeight: "700",
          color: "#1a2744",
          fontFamily: "'Arial', sans-serif",
          letterSpacing: "0.02em",
          marginBottom: "20px",
          marginTop: 0,
        }}>
          {profileUrl}
        </p>

        {/* footer */}
        <p style={{
          fontSize: "9px",
          color: "#aaa",
          fontFamily: "'Arial', sans-serif",
          letterSpacing: "0.06em",
          marginTop: 0,
          marginBottom: 0,
        }}>
          A student-led portrait and storytelling project
        </p>
      </div>

      {/* print css — took forever to figure out the @page margin trick removes browser headers/footers */}
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: A4 portrait;
          }
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          #flyer, #flyer * { visibility: visible; }
          #flyer {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border: 2.5px solid #1a2744 !important;
            background-color: #f5f0e8 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default FlyerPreview;