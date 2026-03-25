import { useState, useEffect, useCallback } from "react";

// ============================================================
// CONSTANTS
// ============================================================
const GHT_ADDRESS  = "0x0000000000000000000000000000000000000001"; // TODO: Replace with real GHT on Soneium
const UHT_ADDRESS  = "0x0000000000000000000000000000000000000002"; // TODO: Replace with real UHT on Soneium
const USDT_ADDRESS = "0x0000000000000000000000000000000000000003"; // TODO: Replace with real USDT on Soneium
const USDC_ADDRESS = "0x0000000000000000000000000000000000000004"; // TODO: Replace with real USDC on Soneium
const USDS_ADDRESS = "0x0000000000000000000000000000000000000005"; // TODO: Replace with real USDS on Soneium
const FEE_RECIPIENT = "0xYOUR_WALLET_ADDRESS_HERE";                // TODO: Replace with your wallet
const CONVENIENCE_FEE = 0.5; // 0.5% fee on all swaps
const SONEIUM_CHAIN_ID = 1868; // Soneium mainnet chain ID

const TOKEN_LIST = [
  { chainId: SONEIUM_CHAIN_ID, address: GHT_ADDRESS,  symbol: "GHT",  name: "Green Health Token",  decimals: 18, logoURI: "" },
  { chainId: SONEIUM_CHAIN_ID, address: UHT_ADDRESS,  symbol: "UHT",  name: "Ultra Health Token",  decimals: 18, logoURI: "" },
  { chainId: SONEIUM_CHAIN_ID, address: USDT_ADDRESS, symbol: "USDT", name: "Tether USD",           decimals: 6,  logoURI: "" },
  { chainId: SONEIUM_CHAIN_ID, address: USDC_ADDRESS, symbol: "USDC", name: "USD Coin",             decimals: 6,  logoURI: "" },
  { chainId: SONEIUM_CHAIN_ID, address: USDS_ADDRESS, symbol: "USDS", name: "Sky USD",              decimals: 18, logoURI: "" },
];

const MOCK_LISTINGS = [
  { id: 1, type: "sell", user: "takuya_h3", rank: "🥇 Gold", score: 342, amount: 5000, token: "GHT", rate: 0.082, total: 410, currency: "USDT", time: "8分前", chat: "よろしくお願いします🙏" },
  { id: 2, type: "buy",  user: "keisuke_w3", rank: "💎 Diamond", score: 521, amount: 10000, token: "GHT", rate: 0.080, total: 800, currency: "USDT", time: "25分前", chat: null },
  { id: 3, type: "sell", user: "yumi_move", rank: "🥈 Silver", score: 187, amount: 2000, token: "GHT", rate: 0.085, total: 170, currency: "USDC", time: "1時間前", chat: "急ぎで売りたいです" },
  { id: 4, type: "sell", user: "health_dao", rank: "💎 Diamond", score: 688, amount: 20000, token: "GHT", rate: 0.079, total: 1580, currency: "USDS", time: "2時間前", chat: null },
];

const MOCK_CHAT = [
  { type: "system", text: "takuya_h3 と yumi_move のマッチングが成立しました", time: "14:22", auto: false },
  { type: "system", text: "yumi_move が 410 USDT を送金しました", time: "14:28", auto: true },
  { type: "left",  user: "yumi_move", rank: "🥈 Silver", text: "よろしくお願いします！ウォレットアドレス教えていただけますか？", time: "14:23" },
  { type: "right", user: "takuya_h3", rank: "🥇 Gold",   text: "よろしくお願いします🙏 0x1a2b...3c4d に送ってください", time: "14:24" },
];

// ============================================================
// STYLES
// ============================================================
const S = {
  app: { fontFamily: "'DM Sans', 'Hiragino Sans', sans-serif", background: "#0a0c12", color: "#f0f0f0", minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative" },
  screen: (active) => ({ display: active ? "block" : "none", paddingBottom: 80 }),

  header: { display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "#13151f", borderBottom: "1px solid #1e2133", position: "sticky", top: 0, zIndex: 10 },
  logo: { width: 32, height: 32, background: "linear-gradient(135deg, #f0a500, #e06b00)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white", flexShrink: 0 },
  headerTitle: { fontSize: 16, fontWeight: 800, flex: 1, letterSpacing: "0.02em" },
  priceChip: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  priceVal: { fontSize: 13, fontWeight: 700, color: "#f0a500" },
  priceChange: { fontSize: 10, color: "#4ade80" },

  urgentBanner: { background: "linear-gradient(135deg, #2a0a0a, #3a0f0f)", borderBottom: "1px solid #7f1d1d", padding: "10px 16px", display: "flex", gap: 8, alignItems: "flex-start" },
  urgentText: { fontSize: 12, color: "#fca5a5", lineHeight: 1.6 },

  securityBadge: { background: "#0a1a0f", border: "1px solid #16a34a", borderRadius: 10, padding: "10px 14px", margin: "10px 16px 0", display: "flex", alignItems: "center", gap: 10 },
  securityIcon: { width: 32, height: 32, background: "#ff007a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
  securityText: { fontSize: 12, color: "#86efac", lineHeight: 1.5 },

  bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#13151f", borderTop: "1px solid #1e2133", display: "flex", zIndex: 20 },
  navItem: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 0 14px", cursor: "pointer", border: "none", background: "none", color: active ? "#f0a500" : "#444", fontSize: 10, transition: "color 0.15s" }),

  card: { background: "#13151f", border: "1px solid #1e2133", borderRadius: 14, padding: "14px 16px", margin: "0 16px 10px" },
  sectionLabel: { fontSize: 11, color: "#444", letterSpacing: "0.07em", textTransform: "uppercase", padding: "14px 16px 6px" },

  priceCard: { background: "#13151f", border: "1px solid #1e2133", borderRadius: 14, margin: "10px 16px", padding: "14px 16px" },
  priceBig: { fontSize: 26, fontWeight: 800, color: "#f0a500" },
  priceStats: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, borderTop: "1px solid #1e2133", paddingTop: 10, marginTop: 10 },
  stat: { textAlign: "center" },
  statLabel: { fontSize: 10, color: "#444", marginBottom: 2 },

  listing: (hovered) => ({ background: "#13151f", border: `1px solid ${hovered ? "#f0a500" : "#1e2133"}`, borderRadius: 14, margin: "0 16px 10px", padding: "14px 16px", cursor: "pointer", transition: "border-color 0.12s" }),
  typeBadge: (type) => ({ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5, letterSpacing: "0.05em", background: type === "sell" ? "#0f2a1a" : "#2a0f0f", color: type === "sell" ? "#4ade80" : "#f87171", border: `1px solid ${type === "sell" ? "#16a34a" : "#7f1d1d"}` }),
  pill: (highlight) => ({ background: highlight ? "#1e1a0f" : "#1a1d2a", border: `1px solid ${highlight ? "#f0a500" : "#1e2133"}`, borderRadius: 6, padding: "3px 9px", fontSize: 11, color: highlight ? "#f0a500" : "#666" }),
  avatar: (color) => ({ width: 22, height: 22, borderRadius: "50%", background: color || "#1a2030", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#f0a500", flexShrink: 0 }),

  // Swap screen
  swapContainer: { margin: "12px 16px 0", background: "#13151f", border: "1px solid #1e2133", borderRadius: 16, overflow: "hidden" },
  swapHeader: { padding: "14px 16px", borderBottom: "1px solid #1e2133", display: "flex", alignItems: "center", gap: 8 },
  uniswapBadge: { display: "flex", alignItems: "center", gap: 6, background: "#ff007a22", border: "1px solid #ff007a66", borderRadius: 8, padding: "4px 10px" },
  feeNote: { fontSize: 11, color: "#555", marginTop: 6, textAlign: "center" },

  // Chat
  chatMessages: { background: "#1a1d2a", border: "1px solid #1e2133", borderRadius: 14, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflowY: "auto" },
  bubbleSystem: { display: "flex", justifyContent: "center" },
  bubbleSystemInner: (auto) => ({ background: auto ? "#0f2a1a" : "#1e2133", borderRadius: 10, padding: "5px 12px", fontSize: 11, color: auto ? "#4ade80" : "#555", fontStyle: auto ? "normal" : "italic", textAlign: "center", maxWidth: "90%", fontWeight: auto ? 500 : 400 }),
  bubbleLeft: { display: "flex", alignItems: "flex-end", gap: 7 },
  bubbleRight: { display: "flex", alignItems: "flex-end", gap: 7, flexDirection: "row-reverse" },
  bubbleAvatarLeft: { width: 28, height: 28, borderRadius: "50%", background: "#1e2a3a", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 },
  bubbleAvatarRight: { width: 28, height: 28, borderRadius: "50%", background: "#1e1a0f", color: "#f0a500", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 },
  bubbleTextLeft: { background: "#2a2d3a", borderRadius: "4px 14px 14px 14px", padding: "9px 12px", fontSize: 13, color: "#e0e0e0", lineHeight: 1.5, maxWidth: "72%" },
  bubbleTextRight: { background: "#f0a500", borderRadius: "14px 4px 14px 14px", padding: "9px 12px", fontSize: 13, color: "#1a1000", fontWeight: 500, lineHeight: 1.5, maxWidth: "72%" },
  bubbleMeta: { fontSize: 10, color: "#444", marginBottom: 3 },
  bubbleTime: { fontSize: 10, color: "#333", marginTop: 3 },

  // Donation
  overlay: (show) => ({ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", opacity: show ? 1 : 0, pointerEvents: show ? "all" : "none", transition: "opacity 0.25s" }),
  donationSheet: (show) => ({ background: "#13151f", borderRadius: "24px 24px 0 0", borderTop: "1px solid #1e2133", padding: "2rem 1.5rem 2.5rem", width: "100%", maxWidth: 480, transform: show ? "translateY(0)" : "translateY(100%)", transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }),
  amtBtn: (selected) => ({ padding: "12px 8px", border: `1.5px solid ${selected ? "#f0a500" : "#1e2133"}`, borderRadius: 10, background: selected ? "#1e1a0f" : "#1a1d2a", fontSize: 15, fontWeight: 700, color: selected ? "#f0a500" : "#888", cursor: "pointer", textAlign: "center", transition: "all 0.12s" }),

  input: { width: "100%", fontSize: 14, padding: "9px 11px", border: "1px solid #1e2133", borderRadius: 8, background: "#1a1d2a", color: "#f0f0f0", outline: "none", boxSizing: "border-box" },
  btnPrimary: { width: "100%", padding: 13, borderRadius: 12, fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg, #f0a500, #e06b00)", border: "none", color: "white", cursor: "pointer" },
  btnSell: { background: "linear-gradient(135deg, #16a34a, #15803d)" },
  btnBuy: { background: "linear-gradient(135deg, #dc2626, #b91c1c)" },

  stepDot: (state) => ({ width: 26, height: 26, borderRadius: "50%", border: `${state === "active" ? 2 : 1.5}px solid ${state === "done" ? "#16a34a" : state === "active" ? "#f0a500" : "#333"}`, background: state === "done" ? "#16a34a" : "#13151f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: state === "done" ? "white" : state === "active" ? "#f0a500" : "#444", flexShrink: 0 }),
  stepLine: { width: 1.5, flex: 1, background: "#1e2133", margin: "3px 0", minHeight: 20 },
};

// ============================================================
// UNISWAP WIDGET PLACEHOLDER (Real widget needs npm build)
// ============================================================
function UniswapWidgetEmbed({ defaultInput, defaultOutput }) {
  const [fromToken, setFromToken] = useState(defaultInput || "GHT");
  const [toToken, setToToken] = useState(defaultOutput || "USDT");
  const [amount, setAmount] = useState("");
  const [showDonation, setShowDonation] = useState(false);

  const tokens = ["GHT", "UHT", "USDT", "USDC", "USDS"];
  const mockRate = { GHT: 0.0842, UHT: 0.12, USDT: 1, USDC: 1, USDS: 1 };
  const fromRate = mockRate[fromToken] || 1;
  const toRate = mockRate[toToken] || 1;
  const outputAmt = amount ? ((parseFloat(amount) * fromRate) / toRate).toFixed(4) : "";

  return (
    <div>
      {/* Uniswap security badge */}
      <div style={{ background: "#0a0f1a", border: "1px solid #ff007a44", borderRadius: 12, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, background: "#ff007a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🦄</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#ff007a" }}>Powered by Uniswap Protocol</div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>監査済み・$100B以上の取引実績・詐欺不可能なアトミックスワップ</div>
        </div>
        <a href="https://uniswap.org" target="_blank" rel="noreferrer" style={{ fontSize: 10, color: "#ff007a", textDecoration: "none", flexShrink: 0 }}>詳細 →</a>
      </div>

      {/* Widget UI */}
      <div style={{ background: "#1a1d2a", border: "1px solid #1e2133", borderRadius: 16, padding: 16 }}>
        {/* From */}
        <div style={{ background: "#13151f", borderRadius: 12, padding: "12px 14px", marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: "#444", marginBottom: 6 }}>売る / 渡す</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ ...S.input, fontSize: 22, fontWeight: 700, color: "#f0a500", background: "none", border: "none", padding: 0, flex: 1 }}
            />
            <select value={fromToken} onChange={e => setFromToken(e.target.value)}
              style={{ background: "#1e2133", border: "1px solid #2a2d3a", borderRadius: 20, padding: "6px 12px", color: "#f0f0f0", fontSize: 14, fontWeight: 700, cursor: "pointer", outline: "none" }}>
              {tokens.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Swap arrow */}
        <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
          <button onClick={() => { setFromToken(toToken); setToToken(fromToken); }}
            style={{ width: 30, height: 30, borderRadius: "50%", background: "#1e2133", border: "1px solid #2a2d3a", color: "#f0a500", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>⇅</button>
        </div>

        {/* To */}
        <div style={{ background: "#13151f", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#444", marginBottom: 6 }}>受け取る</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#4ade80", flex: 1 }}>{outputAmt || "0"}</div>
            <select value={toToken} onChange={e => setToToken(e.target.value)}
              style={{ background: "#1e2133", border: "1px solid #2a2d3a", borderRadius: 20, padding: "6px 12px", color: "#f0f0f0", fontSize: 14, fontWeight: 700, cursor: "pointer", outline: "none" }}>
              {tokens.filter(t => t !== fromToken).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Rate info */}
        {amount && (
          <div style={{ background: "#13151f", borderRadius: 8, padding: "8px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#555" }}>レート</span>
            <span style={{ fontSize: 12, color: "#888" }}>1 {fromToken} = {(fromRate / toRate).toFixed(6)} {toToken}</span>
          </div>
        )}

        {/* Fee note */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: "#555" }}>サービス手数料</span>
          <span style={{ fontSize: 11, color: "#f0a500" }}>{CONVENIENCE_FEE}% (自動徴収)</span>
        </div>

        {/* Swap button */}
        <button
          onClick={() => setShowDonation(true)}
          style={{ ...S.btnPrimary, fontSize: 16 }}>
          ウォレットを接続してスワップ 🦄
        </button>

        <div style={{ fontSize: 11, color: "#333", textAlign: "center", marginTop: 8 }}>
          Uniswap Protocol 上で直接実行 · アトミックスワップ · 詐欺不可能
        </div>
      </div>

      {/* Security details */}
      <div style={{ background: "#0a0f1a", border: "1px solid #1e2133", borderRadius: 12, padding: "12px 14px", marginTop: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#86efac", marginBottom: 8 }}>🔒 なぜ安全なのか？</div>
        {[
          ["アトミックスワップ", "両方のトークンが同時に交換。片方だけ損することは不可能"],
          ["Uniswap監査済み", "$100B以上の取引実績。世界最高水準のセキュリティ"],
          ["非カストディアル", "運営はあなたの資産に一切触れられない"],
          ["オープンソース", "コードは全公開。誰でも検証可能"],
        ].map(([title, desc]) => (
          <div key={title} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "#4ade80", flexShrink: 0 }}>✓</span>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#ccc" }}>{title}：</span>
              <span style={{ fontSize: 12, color: "#555" }}>{desc}</span>
            </div>
          </div>
        ))}
      </div>

      <DonationModal show={showDonation} onClose={() => setShowDonation(false)} />
    </div>
  );
}

// ============================================================
// DONATION MODAL
// ============================================================
function DonationModal({ show, onClose }) {
  const [selected, setSelected] = useState("1");
  const [donated, setDonated] = useState(false);

  if (donated) return (
    <div style={S.overlay(show)}>
      <div style={S.donationSheet(show)}>
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <div style={{ fontSize: 48 }}>💛</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 12, color: "#f0f0f0" }}>ありがとうございます！</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>サポーターバッジが付与されました</div>
          <button onClick={onClose} style={{ ...S.btnPrimary, marginTop: 20, width: "auto", padding: "10px 32px" }}>閉じる</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.overlay(show)}>
      <div style={S.donationSheet(show)}>
        <div style={{ width: 36, height: 4, background: "#1e2133", borderRadius: 2, margin: "0 auto 1.5rem" }} />
        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 10 }}>🎉</div>
        <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 6, color: "#f0f0f0" }}>スワップ完了！</div>
        <div style={{ fontSize: 13, color: "#555", textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
          GHT Swapはコミュニティ有志で運営しています。<br />
          開発・サーバー維持のためご支援いただけますか？
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[["1", "コーヒー1杯"], ["3", "おすすめ ✨"], ["5", "大感謝🙏"]].map(([amt, label]) => (
            <button key={amt} onClick={() => setSelected(amt)} style={S.amtBtn(selected === amt)}>
              ${amt}
              <span style={{ fontSize: 10, display: "block", marginTop: 2, opacity: 0.65 }}>{label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setDonated(true)} style={{ ...S.btnPrimary, marginBottom: 8 }}>
          ${selected} を寄付する ✨
        </button>
        <button onClick={onClose} style={{ width: "100%", padding: 10, borderRadius: 12, fontSize: 14, background: "none", border: "none", color: "#444", cursor: "pointer" }}>
          今回はスキップ
        </button>
        <div style={{ fontSize: 11, color: "#333", textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
          寄付は任意です。寄付者には 💛 サポーターバッジが付与されます。
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CHAT BUBBLE
// ============================================================
function ChatBubble({ msg, myName }) {
  if (msg.type === "system") return (
    <div style={S.bubbleSystem}>
      <div style={S.bubbleSystemInner(msg.auto)}>
        {msg.auto ? "✅ " : ""}{msg.text} · {msg.time}
      </div>
    </div>
  );
  const isMe = msg.user === myName;
  return (
    <div style={isMe ? S.bubbleRight : S.bubbleLeft}>
      <div style={isMe ? S.bubbleAvatarRight : S.bubbleAvatarLeft}>
        {msg.user.substring(0, 2).toUpperCase()}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
        <div style={{ ...S.bubbleMeta, flexDirection: isMe ? "row-reverse" : "row", display: "flex", gap: 5 }}>
          <span>{msg.user}</span><span>{msg.rank}</span>
        </div>
        <div style={isMe ? S.bubbleTextRight : S.bubbleTextLeft}>{msg.text}</div>
        <div style={S.bubbleTime}>{msg.time}</div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function GHTSwap() {
  const [screen, setScreen] = useState("browse");
  const [price, setPrice] = useState(0.0842);
  const [viewers, setViewers] = useState(18);
  const [timerSecs, setTimerSecs] = useState(23 * 3600 + 47 * 60 + 15);
  const [hoveredListing, setHoveredListing] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [chatMessages, setChatMessages] = useState(MOCK_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [dealType, setDealType] = useState("sell");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [showSwap, setShowSwap] = useState(false);
  const myName = "takuya_h3";

  useEffect(() => {
    const t1 = setInterval(() => setTimerSecs(s => s > 0 ? s - 1 : 0), 1000);
    const t2 = setInterval(() => setPrice(p => Math.max(0.075, Math.min(0.095, p + (Math.random() - 0.5) * 0.0003))), 6000);
    const t3 = setInterval(() => setViewers(v => Math.max(10, v + Math.floor(Math.random() * 3) - 1)), 4000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, []);

  const formatTimer = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  const getTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { type: "right", user: myName, rank: "🥇 Gold", text: chatInput.trim(), time: getTime() }]);
    setChatInput("");
  }, [chatInput]);

  const reportStep = useCallback((text) => {
    setChatMessages(prev => [...prev, { type: "system", text: `${myName} が ${text}`, time: getTime(), auto: true }]);
  }, []);

  const total = amount && rate ? (parseFloat(amount) * parseFloat(rate)).toFixed(2) : null;

  // ---- BROWSE ----
  const BrowseScreen = () => (
    <div style={S.screen(screen === "browse")}>
      <div style={S.header}>
        <div style={S.logo}>G</div>
        <div style={S.headerTitle}>GHT Swap</div>
        <div style={S.priceChip}>
          <div style={S.priceVal}>${price.toFixed(4)}</div>
          <div style={S.priceChange}>▲ 2.3%</div>
        </div>
      </div>

      <div style={S.urgentBanner}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>🚨</span>
        <div style={S.urgentText}>
          <strong style={{ color: "#fecaca" }}>MEXC GHT上場廃止検討中・入金停止中</strong><br />
          P2PでGHTを安全に売買できます。スワップはUniswap Protocolが執行するため詐欺不可能です。
        </div>
      </div>

      {/* Price ticker */}
      <div style={S.priceCard}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ ...S.logo, width: 36, height: 36 }}>G</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>GHT</div>
              <div style={{ fontSize: 11, color: "#444" }}>Green Health Token</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={S.priceBig}>${price.toFixed(4)}</div>
            <div style={{ fontSize: 11, color: "#444" }}>≈ ¥{(price * 150).toFixed(1)} / GHT</div>
          </div>
        </div>
        <div style={S.priceStats}>
          {[["24h高値", "$0.0891", "#4ade80"], ["24h安値", "$0.0801", "#f87171"], ["出来高", "248K GHT", "#f0a500"]].map(([l, v, c]) => (
            <div key={l} style={S.stat}>
              <div style={S.statLabel}>{l}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Security badge */}
      <div style={S.securityBadge}>
        <div style={S.securityIcon}>🦄</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>Uniswap Protocol で保護されています</div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>全スワップはUniswap上でアトミック実行。詐欺・ハッキングは構造的に不可能です。</div>
        </div>
      </div>

      <div style={S.sectionLabel}>P2P 取引リスト</div>

      {MOCK_LISTINGS.map(listing => (
        <div key={listing.id}
          style={S.listing(hoveredListing === listing.id)}
          onMouseEnter={() => setHoveredListing(listing.id)}
          onMouseLeave={() => setHoveredListing(null)}
          onClick={() => { setSelectedListing(listing); setScreen("deal"); }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={S.typeBadge(listing.type)}>{listing.type === "sell" ? "売り" : "買い"}</span>
              <div>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{listing.amount.toLocaleString()}</span>
                <span style={{ fontSize: 13, color: "#f0a500", fontWeight: 600, marginLeft: 4 }}>GHT</span>
              </div>
            </div>
            <span style={{ fontSize: 11, color: "#333" }}>{listing.time}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "#555" }}>レート</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>1 GHT = ${listing.rate} {listing.currency}</span>
            <span style={{ fontSize: 11, color: listing.rate < price ? "#4ade80" : "#f87171" }}>
              {listing.rate < price ? "▼ 割安" : "▲ 割高"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>
            合計 <strong style={{ color: listing.type === "sell" ? "#4ade80" : "#f87171" }}>{listing.total} {listing.currency}</strong>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: listing.chat ? 8 : 0 }}>
            <span style={S.pill(true)}>🦄 Uniswap経由</span>
            <span style={S.pill(false)}>{listing.currency}</span>
          </div>
          {listing.chat && (
            <div style={{ background: "#1a1d2a", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#555" }}>
              <div style={{ fontSize: 10, color: "#333", marginBottom: 2 }}>💬 最新チャット</div>
              {listing.user}：{listing.chat}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "1px solid #1e2133" }}>
            <div style={S.avatar()}>{listing.user.substring(0, 2).toUpperCase()}</div>
            <span style={{ fontSize: 12, color: "#555", flex: 1 }}>{listing.user}</span>
            <span style={{ fontSize: 11, background: "#1a1d2a", border: "1px solid #1e2133", borderRadius: 10, padding: "2px 8px", color: "#666" }}>{listing.rank} · {listing.score}pt</span>
          </div>
        </div>
      ))}
    </div>
  );

  // ---- POST ----
  const PostScreen = () => (
    <div style={S.screen(screen === "post")}>
      <div style={S.header}>
        <div style={S.logo}>G</div>
        <div style={S.headerTitle}>取引を掲載する</div>
      </div>

      <div style={S.sectionLabel}>取引タイプ</div>
      <div style={{ padding: "0 16px", marginBottom: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[["sell", "GHT を売る"], ["buy", "GHT を買う"]].map(([type, label]) => (
          <div key={type} onClick={() => setDealType(type)}
            style={{ border: `1px solid ${dealType === type ? "#f0a500" : "#1e2133"}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: dealType === type ? "#1e1a0f" : "#13151f" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: dealType === type ? "#f0a500" : "none", border: `1.5px solid ${dealType === type ? "#f0a500" : "#444"}` }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: dealType === type ? "#f0a500" : "#888" }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={S.sectionLabel}>数量・レート</div>
      <div style={S.card}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>GHT 数量</div>
          <div style={{ position: "relative" }}>
            <input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)}
              style={{ ...S.input, paddingRight: 52, fontSize: 18, fontWeight: 700, color: "#f0a500" }} />
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 700, color: "#f0a500" }}>GHT</span>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>希望レート（USDT/USDC/USDS per GHT）</div>
          <div style={{ position: "relative" }}>
            <input type="number" placeholder="0.0842" step="0.0001" value={rate} onChange={e => setRate(e.target.value)}
              style={{ ...S.input, paddingRight: 52 }} />
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#555" }}>USDT</span>
          </div>
          <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>参考：QuickSwap現在レート <span style={{ color: "#f0a500" }}>${price.toFixed(4)}</span></div>
        </div>
        <div style={{ borderTop: "1px solid #1e2133", paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>合計（自動計算）</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: dealType === "sell" ? "#4ade80" : "#f87171" }}>
            {total ? `${total} USDT` : "— USDT"}
          </div>
        </div>
      </div>

      <div style={S.sectionLabel}>受け取る通貨</div>
      <div style={{ padding: "0 16px", marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["USDT", "USDC", "USDS"].map(token => (
          <div key={token} style={{ border: "1px solid #1e2133", borderRadius: 8, padding: "8px 14px", background: "#13151f", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#888" }}>{token}</div>
        ))}
      </div>

      <div style={S.sectionLabel}>取引期間</div>
      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <select style={{ ...S.input, flex: "0 0 130px" }}>
            <option>12時間</option><option selected>24時間</option><option>48時間</option>
          </select>
          <div style={{ fontSize: 12, color: "#444", lineHeight: 1.4 }}>期間内にUniswapでのスワップを完了する必要があります</div>
        </div>
      </div>

      <div style={{ padding: "0 16px 0.5rem" }}>
        <button onClick={() => setScreen("deal")}
          style={{ ...S.btnPrimary, ...(dealType === "buy" ? S.btnBuy : S.btnSell) }}>
          {dealType === "sell" ? "売り注文を掲載する" : "買い注文を掲載する"}
        </button>
        <div style={{ fontSize: 12, color: "#333", textAlign: "center", marginTop: 8 }}>スワップ時に{CONVENIENCE_FEE}%の手数料が自動徴収されます</div>
      </div>
    </div>
  );

  // ---- DEAL ----
  const DealScreen = () => {
    const listing = selectedListing || MOCK_LISTINGS[0];
    const [stepsDone, setStepsDone] = useState([true, false, false]);

    return (
      <div style={S.screen(screen === "deal")}>
        <div style={S.header}>
          <div style={S.logo}>G</div>
          <div style={S.headerTitle}>取引中</div>
          <div style={{ fontSize: 11, color: "#444" }}>👀 {viewers}人が閲覧中</div>
        </div>

        <div style={{ background: "#13151f", borderBottom: "1px solid #1e2133", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span>⏱</span>
          <span style={{ fontSize: 13, color: "#555", flex: 1 }}>残り時間</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#f0a500", fontVariantNumeric: "tabular-nums" }}>{formatTimer(timerSecs)}</span>
        </div>

        {/* Deal summary */}
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#f0a500" }}>{listing.amount.toLocaleString()} GHT</div>
              <div style={{ fontSize: 12, color: "#444" }}>takuya_h3 が売る</div>
            </div>
            <div style={{ fontSize: 22, color: "#333" }}>→</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#4ade80" }}>{listing.total} {listing.currency}</div>
              <div style={{ fontSize: 12, color: "#444" }}>yumi_move が支払う</div>
            </div>
          </div>
          <div style={{ background: "#1a1d2a", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#555" }}>合意レート</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>1 GHT = ${listing.rate} {listing.currency}</span>
          </div>
          <div style={{ background: "#0a0f1a", border: "1px solid #ff007a44", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>🦄</span>
            <span style={{ fontSize: 12, color: "#ff007a" }}>Uniswap Protocol で実行 · アトミックスワップ</span>
          </div>
        </div>

        {/* Steps */}
        <div style={{ margin: "0 16px" }}>
          <div style={S.sectionLabel}>取引ステップ</div>
          {[
            { title: "マッチング成立", desc: "takuya_h3 と yumi_move が条件に合意しました", done: true, action: null },
            { title: "Uniswap でスワップ実行", desc: "双方がUniswapでトークンをスワップします。アトミックなので詐欺不可能です", done: stepsDone[1], action: () => { setShowSwap(true); } },
            { title: "取引完了 🎉", desc: "スワップ完了後に評価の入力をお願いします", done: stepsDone[2], action: null },
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={S.stepDot(step.done ? "done" : i === 1 && !stepsDone[1] ? "active" : "idle")}>
                  {step.done ? "✓" : i + 1}
                </div>
                {i < 2 && <div style={S.stepLine} />}
              </div>
              <div style={{ flex: 1, paddingBottom: 16, paddingTop: 3 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{step.title}</div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 2, lineHeight: 1.4 }}>{step.desc}</div>
                {step.action && !step.done && (
                  <button onClick={step.action}
                    style={{ marginTop: 8, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#f0a500", border: "none", color: "#1a1000", cursor: "pointer" }}>
                    🦄 Uniswapでスワップする
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Uniswap embed */}
        {showSwap && (
          <div style={{ padding: "0 16px" }}>
            <div style={S.sectionLabel}>Uniswap でスワップを実行</div>
            <UniswapWidgetEmbed defaultInput="GHT" defaultOutput={listing.currency} />
          </div>
        )}

        {/* Public Chat */}
        <div style={{ padding: "0 16px", marginTop: 12 }}>
          <div style={{ ...S.sectionLabel, padding: "10px 0 6px" }}>公開チャット</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>この取引の会話はすべて公開されています</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#3a1a1a", borderRadius: 10, padding: "3px 8px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: 11, color: "#f87171", fontWeight: 600 }}>LIVE</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#1e1a0f", border: "1px solid #3a2e00", borderRadius: 8, padding: "7px 10px", marginBottom: 8, fontSize: 12, color: "#a07820" }}>
            <span>👀</span><span>全ユーザーが閲覧できます。逃げた場合は信頼スコアに影響します。</span>
          </div>
          <div style={S.chatMessages}>
            {chatMessages.map((msg, i) => <ChatBubble key={i} msg={msg} myName={myName} />)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", background: "#13151f", border: "1px solid #1e2133", borderRadius: 10, margin: "6px 0" }}>
            <span style={{ fontSize: 12 }}>👀</span>
            <span style={{ fontSize: 11, color: "#333", flex: 1 }}>{viewers}人が閲覧中</span>
          </div>
          <div style={{ background: "#13151f", border: "1px solid #1e2133", borderRadius: 14, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "#333", marginBottom: 6 }}>takuya_h3 として送信（取引当事者のみ）</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="メッセージを入力..."
                style={{ ...S.input, flex: 1, borderRadius: 20 }} />
              <button onClick={sendChat}
                style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0a500", border: "none", color: "#1a1000", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>↑</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#333", textAlign: "center", marginTop: 6 }}>👀 観覧者はチャットを閲覧のみ可能です</div>
        </div>
      </div>
    );
  };

  // ---- TRUST ----
  const TrustScreen = () => (
    <div style={S.screen(screen === "trust")}>
      <div style={S.header}>
        <div style={S.logo}>G</div>
        <div style={S.headerTitle}>信頼スコア</div>
      </div>
      <div style={{ background: "linear-gradient(135deg, #1e1a0f, #2a2000)", border: "1px solid #3a2e00", margin: "10px 16px", borderRadius: 16, padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#f0a500", lineHeight: 1 }}>187</div>
        <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>信頼スコア</div>
        <div style={{ fontSize: 22, marginTop: 12 }}>🥈</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, color: "#f0f0f0" }}>Silver ランク</div>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 6, marginTop: 14 }}>
          <div style={{ background: "#f0a500", borderRadius: 4, height: 6, width: "62%" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555", marginTop: 4 }}>
          <span>Silver 150pt</span><span>Gold まで 113pt</span>
        </div>
      </div>

      <div style={S.sectionLabel}>ランク別 取引制限</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, margin: "0 16px 10px" }}>
        {[
          ["🔰", "New", "0〜49", "1日1件\n先に動く義務", false],
          ["🥉", "Bronze", "50〜149", "1日3件まで", false],
          ["🥈", "Silver", "150〜299", "制限なし ✓", true],
          ["🥇", "Gold+", "300〜", "制限なし\nバッジ表示", false],
        ].map(([icon, name, score, limit, current]) => (
          <div key={name} style={{ background: current ? "#1e1a0f" : "#13151f", border: `1px solid ${current ? "#f0a500" : "#1e2133"}`, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 20 }}>{icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: "#ccc" }}>{name}</div>
            <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{score}pt</div>
            <div style={{ fontSize: 10, color: current ? "#f0a500" : "#555", marginTop: 4, lineHeight: 1.4, whiteSpace: "pre-line" }}>{limit}</div>
          </div>
        ))}
      </div>

      <div style={S.sectionLabel}>スコア履歴</div>
      <div style={S.card}>
        {[
          ["⭐", "取引完了 + 高評価受信", "2日前", "+15", true],
          ["✅", "取引完了", "5日前", "+10", true],
          ["⚠️", "キャンセル（合意後）", "12日前", "-30", false],
          ["🌱", "アカウント登録", "30日前", "+192", true],
        ].map(([icon, title, date, pts, plus]) => (
          <div key={title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1e2133" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: plus ? "#0f2a1a" : "#2a0f0f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#ccc" }}>{title}</div>
              <div style={{ fontSize: 11, color: "#333", marginTop: 1 }}>{date}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: plus ? "#4ade80" : "#f87171" }}>{pts}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      <BrowseScreen />
      <PostScreen />
      <DealScreen />
      <TrustScreen />

      <div style={S.bottomNav}>
        {[
          ["browse", "📊", "相場"],
          ["post",   "➕", "掲載"],
          ["deal",   "🤝", "取引中"],
          ["trust",  "⭐", "スコア"],
        ].map(([id, icon, label]) => (
          <button key={id} onClick={() => setScreen(id)} style={S.navItem(screen === id)}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
