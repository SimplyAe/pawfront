import Link from "next/link";
import { T } from "@/i18n";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#2f2f3b",
        borderTop: "1px solid #3a3a4e",
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
          pawinput &mdash; <T k="footer.tagline" /> &mdash;{" "}
          <Link
            href="/leaderboard"
            style={{ color: "rgba(255,255,255,0.5)", textDecoration: "underline" }}
          >
            <T k="footer.leaderboard" />
          </Link>
        </p>
      </div>
    </footer>
  );
}
