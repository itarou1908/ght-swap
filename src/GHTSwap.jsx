import { useState, useEffect, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAIruU_1qvOy_UqbGeMLSrY6WU00fGNnWg",
  authDomain: "ght-swap.firebaseapp.com",
  projectId: "ght-swap",
  storageBucket: "ght-swap.firebasestorage.app",
  messagingSenderId: "504697434612",
  appId: "1:504697434612:web:b097d0f0aaa5a477d149a1"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const FEE_RECIPIENT = "0x44e9EeD2DD184946b711c7E524a80E0CEE5f7311";
const CONVENIENCE_FEE = 0.5;
const MOCK_LISTINGS = [
  { id:1, type:"sell", user:"0x1a2b...3c4d", rank:"🥇 Gold", score:342, amount:5000, rate:0.082, total:410, currency:"USDT", time:"8分前", chat:"よろしくお願いします🙏" },
  { id:2, type:"buy",  user:"0x9f8e...7d6c", rank:"💎 Diamond", score:521, amount:10000, rate:0.080, total:800, currency:"USDT", time:"25分前", chat:null },
  { id:3, type:"sell", user:"0x5e4f...2a1b", rank:"🥈 Silver", score:187, amount:2000, rate:0.085, total:170, currency:"USDC", time:"1時間前", chat:"急ぎで売りたいです" },
];

function SafetyPopup({ show, onConfirm, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center", opacity:show?1:0, pointerEvents:show?"all":"none", transition:"opacity 0.25s" }}>
      <div style={{ background:"#13151f", borderRadius:"24px 24px 0 0", borderTop:"1px solid #1e2133", padding:"2rem 1.5rem 2.5rem", width:"100%", maxWidth:480, transform:show?"translateY(0)":"translateY(100%)", transition:"transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ width:36, height:4, background:"#1e2133", borderRadius:2, margin:"0 auto 1.5rem" }} />
        <div style={{ fontSize:36, textAlign:"center", marginBottom:12 }}>🔒</div>
        <div style={{ fontSize:18, fontWeight:700, textAlign:"center", marginBottom:12, color:"#f0f0f0" }}>ウォレット接続について</div>
        <div style={{ background:"#0a1a0f", border:"1px solid #16a34a", borderRadius:12, padding:"14px 16px", marginBottom:16 }}>
          {[
            ["✅","アドレスの確認のみ","0x...という番号を読むだけです"],
            ["✅","資産には一切触れません","トークンの移動・承認は行いません"],
            ["✅","ユーザー識別に使用","ニックネームの代わりになります"],
            ["❌","秘密鍵は不要","秘密鍵を求めるサービスは詐欺です"],
          ].map(([icon,title,desc]) => (
            <div key={title} style={{ display:"flex", gap:10, marginBottom:10 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#86efac" }}>{title}</div>
                <div style={{ fontSize:12, color:"#555", marginTop:1 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:"#1a1d2a", border:"1px solid #ff007a44", borderRadius:12, padding:"10px 14px", marginBottom:20, display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>🦄</span>
          <div style={{ fontSize:12, color:"#888", lineHeight:1.5 }}>実際のスワップはUniswap Protocolが実行します。GHT Swapは資産に触れません。</div>
        </div>
        <button onClick={onConfirm} style={{ width:"100%", padding:13, borderRadius:12, fontSize:15, fontWeight:700, background:"linear-gradient(135deg,#f0a500,#e06b00)", border:"none", color:"white", cursor:"pointer" }}>理解しました・ウォレットを接続する</button>
        <button onClick={onClose} style={{ width:"100%", padding:10, marginTop:8, borderRadius:12, fontSize:14, background:"none", border:"none", color:"#444", cursor:"pointer" }}>キャンセル</button>
      </div>
    </div>
  );
}
function DonationModal({ show, onClose }) {
    const [selected, setSelected] = useState("1");
    const [done, setDone] = useState(false);
    if (done) return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
        <div style={{ background:"#13151f", borderRadius:"24px 24px 0 0", borderTop:"1px solid #1e2133", padding:"2rem 1.5rem 2.5rem", width:"100%", maxWidth:480 }}>
          <div style={{ textAlign:"center", padding:"2rem 0" }}>
            <div style={{ fontSize:48 }}>💛</div>
            <div style={{ fontSize:18, fontWeight:700, marginTop:12, color:"#f0f0f0" }}>ありがとうございます！</div>
            <div style={{ fontSize:13, color:"#666", marginTop:6 }}>💛 サポーターバッジが付与されました</div>
            <button onClick={() => { setDone(false); onClose(); }} style={{ marginTop:20, padding:"10px 32px", borderRadius:12, fontSize:15, fontWeight:700, background:"linear-gradient(135deg,#f0a500,#e06b00)", border:"none", color:"white", cursor:"pointer" }}>閉じる</button>
          </div>
        </div>
      </div>
    );
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center", opacity:show?1:0, pointerEvents:show?"all":"none", transition:"opacity 0.25s" }}>
        <div style={{ background:"#13151f", borderRadius:"24px 24px 0 0", borderTop:"1px solid #1e2133", padding:"2rem 1.5rem 2.5rem", width:"100%", maxWidth:480, transform:show?"translateY(0)":"translateY(100%)", transition:"transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div style={{ width:36, height:4, background:"#1e2133", borderRadius:2, margin:"0 auto 1.5rem" }} />
          <div style={{ fontSize:40, textAlign:"center", marginBottom:10 }}>🎉</div>
          <div style={{ fontSize:18, fontWeight:700, textAlign:"center", marginBottom:6, color:"#f0f0f0" }}>スワップ完了！</div>
          <div style={{ fontSize:13, color:"#555", textAlign:"center", lineHeight:1.6, marginBottom:20 }}>GHT Swapはコミュニティ有志で運営しています。<br />開発・サーバー維持のためご支援いただけますか？</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
            {[["1","コーヒー1杯"],["3","おすすめ ✨"],["5","大感謝🙏"]].map(([amt,label]) => (
              <button key={amt} onClick={() => setSelected(amt)}
                style={{ padding:"12px 8px", border:`1.5px solid ${selected===amt?"#f0a500":"#1e2133"}`, borderRadius:10, background:selected===amt?"#1e1a0f":"#1a1d2a", fontSize:15, fontWeight:700, color:selected===amt?"#f0a500":"#888", cursor:"pointer", textAlign:"center" }}>
                ${amt}<span style={{ fontSize:10, display:"block", marginTop:2, opacity:0.65 }}>{label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setDone(true)} style={{ width:"100%", padding:13, borderRadius:12, fontSize:15, fontWeight:700, background:"linear-gradient(135deg,#f0a500,#e06b00)", border:"none", color:"white", cursor:"pointer", marginBottom:8 }}>${selected} を寄付する ✨</button>
          <button onClick={onClose} style={{ width:"100%", padding:10, borderRadius:12, fontSize:14, background:"none", border:"none", color:"#444", cursor:"pointer" }}>今回はスキップ</button>
          <div style={{ fontSize:11, color:"#333", textAlign:"center", marginTop:6 }}>寄付は任意です。寄付者には 💛 サポーターバッジが付与されます。</div>
        </div>
      </div>
    );
  }
  
  function SwapWidget({ defaultFrom="GHT", defaultTo="USDT", onComplete }) {
    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);
    const [amount, setAmount] = useState("");
    const tokens = ["GHT","UHT","USDT","USDC","USDS"];
    const rates = { GHT:0.0842, UHT:0.12, USDT:1, USDC:1, USDS:1 };
    const output = amount ? ((parseFloat(amount)*rates[from])/rates[to]).toFixed(4) : "";
    return (
      <div>
        <div style={{ background:"#0a0f1a", border:"1px solid #ff007a44", borderRadius:12, padding:"10px 14px", marginBottom:10, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, background:"#ff007a", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>🦄</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#ff007a" }}>Powered by Uniswap Protocol</div>
            <div style={{ fontSize:11, color:"#555", marginTop:1 }}>監査済み・詐欺不可能なアトミックスワップ</div>
          </div>
        </div>
        <div style={{ background:"#1a1d2a", border:"1px solid #1e2133", borderRadius:16, padding:16 }}>
          <div style={{ background:"#13151f", borderRadius:12, padding:"12px 14px", marginBottom:6 }}>
            <div style={{ fontSize:11, color:"#444", marginBottom:6 }}>売る / 渡す</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)}
                style={{ fontSize:22, fontWeight:700, color:"#f0a500", background:"none", border:"none", padding:0, flex:1, outline:"none" }} />
              <select value={from} onChange={e => setFrom(e.target.value)}
                style={{ background:"#1e2133", border:"1px solid #2a2d3a", borderRadius:20, padding:"6px 12px", color:"#f0f0f0", fontSize:14, fontWeight:700, cursor:"pointer", outline:"none" }}>
                {tokens.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"center", margin:"4px 0" }}>
            <button onClick={() => { setFrom(to); setTo(from); }}
              style={{ width:30, height:30, borderRadius:"50%", background:"#1e2133", border:"1px solid #2a2d3a", color:"#f0a500", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>⇅</button>
          </div>
          <div style={{ background:"#13151f", borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ fontSize:11, color:"#444", marginBottom:6 }}>受け取る</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ fontSize:22, fontWeight:700, color:"#4ade80", flex:1 }}>{output||"0"}</div>
              <select value={to} onChange={e => setTo(e.target.value)}
                style={{ background:"#1e2133", border:"1px solid #2a2d3a", borderRadius:20, padding:"6px 12px", color:"#f0f0f0", fontSize:14, fontWeight:700, cursor:"pointer", outline:"none" }}>
                {tokens.filter(t => t!==from).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {amount && (
            <div style={{ background:"#13151f", borderRadius:8, padding:"8px 12px", marginBottom:10, display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:"#555" }}>サービス手数料</span>
              <span style={{ fontSize:12, color:"#f0a500" }}>{CONVENIENCE_FEE}% → {FEE_RECIPIENT.slice(0,6)}...{FEE_RECIPIENT.slice(-4)}</span>
            </div>
          )}
          <button onClick={onComplete} style={{ width:"100%", padding:13, borderRadius:12, fontSize:15, fontWeight:700, background:"linear-gradient(135deg,#f0a500,#e06b00)", border:"none", color:"white", cursor:"pointer" }}>
            ウォレットでスワップを承認 🦄
          </button>
          <div style={{ fontSize:11, color:"#333", textAlign:"center", marginTop:8 }}>Uniswap Protocol 上で直接実行 · アトミックスワップ</div>
        </div>
      </div>
    );
  }
  
  function ChatBubble({ msg, myAddress }) {
    const isMe = msg.address === myAddress;
    const isSystem = msg.type === "system";
    const shortAddr = (addr) => addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : "??";
    if (isSystem) return (
      <div style={{ display:"flex", justifyContent:"center" }}>
        <div style={{ background:msg.auto?"#0f2a1a":"#1e2133", borderRadius:10, padding:"5px 12px", fontSize:11, color:msg.auto?"#4ade80":"#555", fontStyle:msg.auto?"normal":"italic", textAlign:"center", maxWidth:"90%", fontWeight:msg.auto?500:400 }}>
          {msg.auto?"✅ ":""}{msg.text}
        </div>
      </div>
    );
    return (
      <div style={{ display:"flex", alignItems:"flex-end", gap:7, flexDirection:isMe?"row-reverse":"row" }}>
        <div style={{ width:28, height:28, borderRadius:"50%", background:isMe?"#1e1a0f":"#1e2a3a", color:isMe?"#f0a500":"#60a5fa", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, flexShrink:0 }}>
          {shortAddr(msg.address).slice(0,4)}
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:isMe?"flex-end":"flex-start" }}>
          <div style={{ fontSize:10, color:"#444", marginBottom:3, display:"flex", gap:5, flexDirection:isMe?"row-reverse":"row" }}>
            <span>{shortAddr(msg.address)}</span>
          </div>
          <div style={{ background:isMe?"#f0a500":"#2a2d3a", borderRadius:isMe?"14px 4px 14px 14px":"4px 14px 14px 14px", padding:"9px 12px", fontSize:13, color:isMe?"#1a1000":"#e0e0e0", fontWeight:isMe?500:400, lineHeight:1.5, maxWidth:"72%" }}>
            {msg.text}
          </div>
          <div style={{ fontSize:10, color:"#333", marginTop:3 }}>{msg.time}</div>
        </div>
      </div>
    );
  }
  export default function GHTSwap() {
    const [screen, setScreen] = useState("browse");
    const [showSafety, setShowSafety] = useState(false);
    const [showDonation, setShowDonation] = useState(false);
    const [showSwap, setShowSwap] = useState(false);
    const [selectedListing, setSelectedListing] = useState(null);
    const [hoveredListing, setHoveredListing] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [viewers, setViewers] = useState(18);
    const [price, setPrice] = useState(0.0842);
    const [timerSecs, setTimerSecs] = useState(23*3600+47*60+15);
    const [dealType, setDealType] = useState("sell");
    const [amount, setAmount] = useState("");
    const [rate, setRate] = useState("");
    const [walletAddress, setWalletAddress] = useState(null);
    const chatEndRef = useRef(null);
    const listing = selectedListing || MOCK_LISTINGS[0];
    const dealId = `deal-${listing.id}`;
    const shortAddr = (addr) => addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : "";
    const getTime = () => { const d=new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
    const formatTimer = (s) => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`; };
    const total = amount&&rate ? (parseFloat(amount)*parseFloat(rate)).toFixed(2) : null;
  
    useEffect(() => {
      if (screen!=="deal") return;
      const q = query(collection(db,"chats",dealId,"messages"), orderBy("createdAt"));
      const unsub = onSnapshot(q, (snap) => {
        setChatMessages(snap.docs.map(d => ({ id:d.id, ...d.data() })));
      });
      return unsub;
    }, [screen, dealId]);
  
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMessages]);
  
    useEffect(() => {
      const t1 = setInterval(() => setTimerSecs(s => s>0?s-1:0), 1000);
      const t2 = setInterval(() => setPrice(p => Math.max(0.075,Math.min(0.095,p+(Math.random()-0.5)*0.0003))), 6000);
      const t3 = setInterval(() => setViewers(v => Math.max(10,v+Math.floor(Math.random()*3)-1)), 4000);
      return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
    }, []);
  
    const sendChat = useCallback(async () => {
      if (!chatInput.trim()||!walletAddress) return;
      await addDoc(collection(db,"chats",dealId,"messages"), {
        type:"user", address:walletAddress, text:chatInput.trim(), time:getTime(), auto:false, createdAt:serverTimestamp(),
      });
      setChatInput("");
    }, [chatInput, walletAddress, dealId]);
  
    const reportStep = useCallback(async (text) => {
      if (!walletAddress) return;
      await addDoc(collection(db,"chats",dealId,"messages"), {
        type:"system", text:`${shortAddr(walletAddress)} が ${text}`, time:getTime(), auto:true, createdAt:serverTimestamp(),
      });
    }, [walletAddress, dealId]);
  
    const connectWallet = async () => {
      if (typeof window.ethereum !== "undefined") {
        const accounts = await window.ethereum.request({ method:"eth_requestAccounts" });
        setWalletAddress(accounts[0]);
        setShowSafety(false);
      } else {
        alert("MetaMaskをインストールしてください。\nhttps://metamask.io");
      }
    };
  
    const inp = { width:"100%", fontSize:14, padding:"9px 11px", border:"1px solid #1e2133", borderRadius:8, background:"#1a1d2a", color:"#f0f0f0", outline:"none", boxSizing:"border-box" };
    const btnP = { width:"100%", padding:13, borderRadius:12, fontSize:15, fontWeight:700, background:"linear-gradient(135deg,#f0a500,#e06b00)", border:"none", color:"white", cursor:"pointer" };
  
    return (
      <div style={{ fontFamily:"'DM Sans','Hiragino Sans',sans-serif", background:"#0a0c12", color:"#f0f0f0", minHeight:"100vh", maxWidth:480, margin:"0 auto", position:"relative" }}>
  
        {/* BROWSE */}
        <div style={{ display:screen==="browse"?"block":"none", paddingBottom:80 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", background:"#13151f", borderBottom:"1px solid #1e2133", position:"sticky", top:0, zIndex:10 }}>
            <div style={{ width:32, height:32, background:"linear-gradient(135deg,#f0a500,#e06b00)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"white", flexShrink:0 }}>G</div>
            <div style={{ fontSize:16, fontWeight:800, flex:1 }}>GHT Swap</div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#f0a500" }}>${price.toFixed(4)}</div>
              {walletAddress
                ? <button onClick={() => setWalletAddress(null)} style={{ fontSize:10, background:"#0f2a1a", border:"1px solid #16a34a", borderRadius:10, padding:"2px 8px", color:"#4ade80", cursor:"pointer" }}>{shortAddr(walletAddress)} ✓</button>
                : <button onClick={() => setShowSafety(true)} style={{ fontSize:10, background:"#1e1a0f", border:"1px solid #f0a500", borderRadius:10, padding:"2px 8px", color:"#f0a500", cursor:"pointer" }}>接続する</button>
              }
            </div>
          </div>
          <div style={{ background:"linear-gradient(135deg,#2a0a0a,#3a0f0f)", borderBottom:"1px solid #7f1d1d", padding:"10px 16px", display:"flex", gap:8 }}>
            <span style={{ fontSize:16, flexShrink:0 }}>🚨</span>
            <div style={{ fontSize:12, color:"#fca5a5", lineHeight:1.6 }}><strong style={{ color:"#fecaca" }}>MEXC GHT上場廃止検討中・入金停止中</strong><br />P2PでGHTを安全に売買できます。スワップはUniswap Protocolが執行するため詐欺不可能です。</div>
          </div>
          <div style={{ background:"#0a1a0f", border:"1px solid #16a34a", borderRadius:10, padding:"10px 14px", margin:"10px 16px 0", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>🦄</span>
            <div><div style={{ fontSize:12, fontWeight:700, color:"#4ade80" }}>Uniswap Protocol で保護されています</div><div style={{ fontSize:11, color:"#555", marginTop:1 }}>全スワップはアトミック実行・詐欺不可能・監査済み</div></div>
          </div>
          <div style={{ background:"#13151f", border:"1px solid #1e2133", borderRadius:14, margin:"10px 16px", padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, background:"linear-gradient(135deg,#f0a500,#e06b00)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"white" }}>G</div>
                <div><div style={{ fontSize:15, fontWeight:800 }}>GHT</div><div style={{ fontSize:11, color:"#444" }}>Green Health Token</div></div>
              </div>
              <div style={{ textAlign:"right" }}><div style={{ fontSize:26, fontWeight:800, color:"#f0a500" }}>${price.toFixed(4)}</div><div style={{ fontSize:11, color:"#444" }}>≈ ¥{(price*150).toFixed(1)} / GHT</div></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, borderTop:"1px solid #1e2133", paddingTop:10 }}>
              {[["24h高値","$0.0891","#4ade80"],["24h安値","$0.0801","#f87171"],["出来高","248K","#f0a500"]].map(([l,v,c]) => (
                <div key={l} style={{ textAlign:"center" }}><div style={{ fontSize:10, color:"#444", marginBottom:2 }}>{l}</div><div style={{ fontSize:13, fontWeight:600, color:c }}>{v}</div></div>
              ))}
            </div>
          </div>
          <div style={{ fontSize:11, color:"#444", letterSpacing:"0.07em", textTransform:"uppercase", padding:"14px 16px 6px" }}>P2P 取引リスト</div>
          {MOCK_LISTINGS.map(l => (
            <div key={l.id}
              style={{ background:"#13151f", border:`1px solid ${hoveredListing===l.id?"#f0a500":"#1e2133"}`, borderRadius:14, margin:"0 16px 10px", padding:"14px 16px", cursor:"pointer", transition:"border-color 0.12s" }}
              onMouseEnter={() => setHoveredListing(l.id)} onMouseLeave={() => setHoveredListing(null)}
              onClick={() => { setSelectedListing(l); setShowSwap(false); setScreen("deal"); }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:5, background:l.type==="sell"?"#0f2a1a":"#2a0f0f", color:l.type==="sell"?"#4ade80":"#f87171", border:`1px solid ${l.type==="sell"?"#16a34a":"#7f1d1d"}` }}>{l.type==="sell"?"売り":"買い"}</span>
                  <span style={{ fontSize:18, fontWeight:800 }}>{l.amount.toLocaleString()}</span>
                  <span style={{ fontSize:13, color:"#f0a500", fontWeight:600 }}>GHT</span>
                </div>
                <span style={{ fontSize:11, color:"#333" }}>{l.time}</span>
              </div>
              <div style={{ fontSize:13, marginBottom:6 }}><span style={{ color:"#555" }}>レート </span><strong>1 GHT = ${l.rate} {l.currency}</strong><span style={{ fontSize:11, color:l.rate<price?"#4ade80":"#f87171", marginLeft:6 }}>{l.rate<price?"▼ 割安":"▲ 割高"}</span></div>
              <div style={{ fontSize:12, color:"#555", marginBottom:8 }}>合計 <strong style={{ color:l.type==="sell"?"#4ade80":"#f87171" }}>{l.total} {l.currency}</strong></div>
              {l.chat && <div style={{ background:"#1a1d2a", borderRadius:8, padding:"7px 10px", fontSize:12, color:"#555", marginBottom:8 }}><div style={{ fontSize:10, color:"#333", marginBottom:2 }}>💬 最新チャット</div>{l.user}：{l.chat}</div>}
              <div style={{ display:"flex", alignItems:"center", gap:6, paddingTop:10, borderTop:"1px solid #1e2133" }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:"#1a2030", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#f0a500" }}>{l.user.slice(0,4)}</div>
                <span style={{ fontSize:12, color:"#555", flex:1 }}>{l.user}</span>
                <span style={{ fontSize:11, background:"#1a1d2a", border:"1px solid #1e2133", borderRadius:10, padding:"2px 8px", color:"#666" }}>{l.rank} · {l.score}pt</span>
              </div>
            </div>
          ))}
        </div>
  
        {/* POST */}
        <div style={{ display:screen==="post"?"block":"none", paddingBottom:80 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", background:"#13151f", borderBottom:"1px solid #1e2133", position:"sticky", top:0, zIndex:10 }}>
            <div style={{ width:32, height:32, background:"linear-gradient(135deg,#f0a500,#e06b00)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"white" }}>G</div>
            <div style={{ fontSize:16, fontWeight:800 }}>取引を掲載する</div>
          </div>
          {!walletAddress && <div style={{ background:"#1e1a0f", border:"1px solid #f0a500", borderRadius:10, padding:"12px 16px", margin:"10px 16px", fontSize:13, color:"#f0a500", textAlign:"center" }}>⚠️ 掲載にはウォレット接続が必要です<button onClick={() => setShowSafety(true)} style={{ display:"block", margin:"8px auto 0", padding:"6px 16px", borderRadius:8, background:"#f0a500", border:"none", color:"#1a1000", fontWeight:700, cursor:"pointer", fontSize:13 }}>接続する</button></div>}
          <div style={{ fontSize:11, color:"#444", letterSpacing:"0.07em", textTransform:"uppercase", padding:"14px 16px 6px" }}>取引タイプ</div>
          <div style={{ padding:"0 16px", marginBottom:10, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[["sell","GHT を売る"],["buy","GHT を買う"]].map(([type,label]) => (
              <div key={type} onClick={() => setDealType(type)} style={{ border:`1px solid ${dealType===type?"#f0a500":"#1e2133"}`, borderRadius:10, padding:"10px 12px", display:"flex", alignItems:"center", gap:8, cursor:"pointer", background:dealType===type?"#1e1a0f":"#13151f" }}>
                <div style={{ width:12, height:12, borderRadius:"50%", background:dealType===type?"#f0a500":"none", border:`1.5px solid ${dealType===type?"#f0a500":"#444"}` }} />
                <span style={{ fontSize:14, fontWeight:700, color:dealType===type?"#f0a500":"#888" }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ background:"#13151f", border:"1px solid #1e2133", borderRadius:14, padding:"14px 16px", margin:"0 16px 10px" }}>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, color:"#555", marginBottom:4 }}>GHT 数量</div>
              <div style={{ position:"relative" }}><input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...inp, paddingRight:52, fontSize:18, fontWeight:700, color:"#f0a500" }} /><span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:13, fontWeight:700, color:"#f0a500" }}>GHT</span></div>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, color:"#555", marginBottom:4 }}>希望レート（per GHT）</div>
              <div style={{ position:"relative" }}><input type="number" placeholder="0.0842" step="0.0001" value={rate} onChange={e => setRate(e.target.value)} style={{ ...inp, paddingRight:52 }} /><span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"#555" }}>USDT</span></div>
              <div style={{ fontSize:11, color:"#444", marginTop:4 }}>参考レート <span style={{ color:"#f0a500" }}>${price.toFixed(4)}</span></div>
            </div>
            <div style={{ borderTop:"1px solid #1e2133", paddingTop:12 }}>
              <div style={{ fontSize:12, color:"#555", marginBottom:4 }}>合計（自動計算）</div>
              <div style={{ fontSize:22, fontWeight:800, color:dealType==="sell"?"#4ade80":"#f87171" }}>{total?`${total} USDT`:"— USDT"}</div>
            </div>
          </div>
          <div style={{ padding:"0 16px 1rem" }}>
            <button onClick={() => walletAddress?setScreen("deal"):setShowSafety(true)} style={{ ...btnP, ...(dealType==="buy"?{ background:"linear-gradient(135deg,#dc2626,#b91c1c)" }:{ background:"linear-gradient(135deg,#16a34a,#15803d)" }) }}>
              {dealType==="sell"?"売り注文を掲載する":"買い注文を掲載する"}
            </button>
            <div style={{ fontSize:12, color:"#333", textAlign:"center", marginTop:8 }}>スワップ時に{CONVENIENCE_FEE}%の手数料が自動徴収されます</div>
          </div>
        </div>
  
        {/* DEAL */}
        <div style={{ display:screen==="deal"?"block":"none", paddingBottom:80 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", background:"#13151f", borderBottom:"1px solid #1e2133", position:"sticky", top:0, zIndex:10 }}>
            <div style={{ width:32, height:32, background:"linear-gradient(135deg,#f0a500,#e06b00)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"white" }}>G</div>
            <div style={{ fontSize:16, fontWeight:800, flex:1 }}>取引中</div>
            <div style={{ fontSize:11, color:"#444" }}>👀 {viewers}人が閲覧中</div>
          </div>
          <div style={{ background:"#13151f", borderBottom:"1px solid #1e2133", padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <span>⏱</span><span style={{ fontSize:13, color:"#555", flex:1 }}>残り時間</span>
            <span style={{ fontSize:15, fontWeight:700, color:"#f0a500", fontVariantNumeric:"tabular-nums" }}>{formatTimer(timerSecs)}</span>
          </div>
          <div style={{ background:"#13151f", border:"1px solid #1e2133", borderRadius:14, padding:"14px 16px", margin:"10px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div><div style={{ fontSize:24, fontWeight:800, color:"#f0a500" }}>{listing.amount.toLocaleString()} GHT</div><div style={{ fontSize:12, color:"#444" }}>{listing.user} が売る</div></div>
              <div style={{ fontSize:22, color:"#333" }}>→</div>
              <div style={{ textAlign:"right" }}><div style={{ fontSize:24, fontWeight:800, color:"#4ade80" }}>{listing.total} {listing.currency}</div><div style={{ fontSize:12, color:"#444" }}>が支払われる</div></div>
            </div>
            <div style={{ background:"#0a0f1a", border:"1px solid #ff007a44", borderRadius:8, padding:"8px 12px", display:"flex", alignItems:"center", gap:8 }}>
              <span>🦄</span><span style={{ fontSize:12, color:"#ff007a" }}>Uniswap Protocol で実行 · アトミックスワップ · 詐欺不可能</span>
            </div>
          </div>
          <div style={{ margin:"0 16px" }}>
            <div style={{ fontSize:11, color:"#444", letterSpacing:"0.07em", textTransform:"uppercase", padding:"14px 0 6px" }}>取引ステップ</div>
            {[
              { title:"マッチング成立", desc:"条件に合意しました", state:"done" },
              { title:"🦄 Uniswap でスワップ実行", desc:"双方がUniswapでトークンをスワップします。アトミックなので詐欺不可能です", state:showSwap?"done":"active", action:() => setShowSwap(true) },
              { title:"取引完了 🎉", desc:"スワップ完了後に評価の入力をお願いします", state:"idle" },
            ].map((step,i) => (
              <div key={i} style={{ display:"flex", gap:12 }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", border:`${step.state==="active"?2:1.5}px solid ${step.state==="done"?"#16a34a":step.state==="active"?"#f0a500":"#333"}`, background:step.state==="done"?"#16a34a":"#13151f", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color:step.state==="done"?"white":step.state==="active"?"#f0a500":"#444", flexShrink:0 }}>{step.state==="done"?"✓":i+1}</div>
                  {i<2 && <div style={{ width:1.5, flex:1, background:"#1e2133", margin:"3px 0", minHeight:20 }} />}
                </div>
                <div style={{ flex:1, paddingBottom:16, paddingTop:3 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#f0f0f0" }}>{step.title}</div>
                  <div style={{ fontSize:12, color:"#444", marginTop:2, lineHeight:1.4 }}>{step.desc}</div>
                  {step.action && !showSwap && <button onClick={step.action} style={{ marginTop:8, padding:"8px 16px", borderRadius:8, fontSize:13, fontWeight:600, background:"#f0a500", border:"none", color:"#1a1000", cursor:"pointer" }}>🦄 Uniswapでスワップする</button>}
                </div>
              </div>
            ))}
          </div>
          {showSwap && <div style={{ padding:"0 16px" }}><SwapWidget defaultFrom="GHT" defaultTo={listing.currency} onComplete={async () => { await reportStep("Uniswapでのスワップを完了しました"); setShowSwap(false); setShowDonation(true); }} /></div>}
          <div style={{ padding:"0 16px", marginTop:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:600, flex:1 }}>公開チャット</div>
              <div style={{ display:"flex", alignItems:"center", gap:4, background:"#3a1a1a", borderRadius:10, padding:"3px 8px" }}><div style={{ width:6, height:6, borderRadius:"50%", background:"#f87171" }} /><span style={{ fontSize:11, color:"#f87171", fontWeight:600 }}>LIVE</span></div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5, background:"#1e1a0f", border:"1px solid #3a2e00", borderRadius:8, padding:"7px 10px", marginBottom:8, fontSize:12, color:"#a07820" }}>
              <span>👀</span><span>全ユーザーが閲覧できます。逃げた場合は信頼スコアに影響します。</span>
            </div>
            <div style={{ background:"#1a1d2a", border:"1px solid #1e2133", borderRadius:14, padding:"12px 10px", display:"flex", flexDirection:"column", gap:10, maxHeight:280, overflowY:"auto" }}>
              {chatMessages.length===0 && <div style={{ textAlign:"center", fontSize:12, color:"#333", padding:"20px 0" }}>まだメッセージがありません</div>}
              {chatMessages.map((msg,i) => <ChatBubble key={msg.id||i} msg={msg} myAddress={walletAddress} />)}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 10px", background:"#13151f", border:"1px solid #1e2133", borderRadius:10, margin:"6px 0" }}>
              <span style={{ fontSize:12 }}>👀</span><span style={{ fontSize:11, color:"#333", flex:1 }}>{viewers}人が閲覧中</span>
            </div>
            {walletAddress ? (
              <div style={{ background:"#13151f", border:"1px solid #1e2133", borderRadius:14, padding:"10px 12px" }}>
                <div style={{ fontSize:11, color:"#333", marginBottom:6 }}>{shortAddr(walletAddress)} として送信</div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&sendChat()} placeholder="メッセージを入力..." style={{ ...inp, flex:1, borderRadius:20 }} />
                  <button onClick={sendChat} style={{ width:36, height:36, borderRadius:"50%", background:"#f0a500", border:"none", color:"#1a1000", cursor:"pointer", fontSize:16, fontWeight:700 }}>↑</button>
                </div>
              </div>
            ) : (
              <div style={{ background:"#13151f", border:"1px solid #1e2133", borderRadius:14, padding:"14px", textAlign:"center" }}>
                <div style={{ fontSize:13, color:"#555", marginBottom:8 }}>チャットにはウォレット接続が必要です</div>
                <button onClick={() => setShowSafety(true)} style={{ padding:"8px 20px", borderRadius:8, background:"#f0a500", border:"none", color:"#1a1000", fontWeight:700, cursor:"pointer", fontSize:13 }}>接続する</button>
              </div>
            )}
          </div>
        </div>
  
        {/* TRUST */}
        <div style={{ display:screen==="trust"?"block":"none", paddingBottom:80 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", background:"#13151f", borderBottom:"1px solid #1e2133", position:"sticky", top:0, zIndex:10 }}>
            <div style={{ width:32, height:32, background:"linear-gradient(135deg,#f0a500,#e06b00)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"white" }}>G</div>
            <div style={{ fontSize:16, fontWeight:800 }}>信頼スコア</div>
          </div>
          {walletAddress ? (
            <>
              <div style={{ background:"linear-gradient(135deg,#1e1a0f,#2a2000)", border:"1px solid #3a2e00", margin:"10px 16px", borderRadius:16, padding:"1.5rem", textAlign:"center" }}>
                <div style={{ fontSize:52, fontWeight:800, color:"#f0a500", lineHeight:1 }}>187</div>
                <div style={{ fontSize:13, color:"#666", marginTop:4 }}>信頼スコア</div>
                <div style={{ fontSize:13, color:"#555", marginTop:6 }}>{shortAddr(walletAddress)}</div>
                <div style={{ fontSize:22, marginTop:10 }}>🥈</div>
                <div style={{ fontSize:14, fontWeight:600, marginTop:2, color:"#f0f0f0" }}>Silver ランク</div>
                <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:4, height:6, marginTop:14 }}><div style={{ background:"#f0a500", borderRadius:4, height:6, width:"62%" }} /></div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#555", marginTop:4 }}><span>Silver 150pt</span><span>Gold まで 113pt</span></div>
              </div>
              <div style={{ fontSize:11, color:"#444", letterSpacing:"0.07em", textTransform:"uppercase", padding:"14px 16px 6px" }}>ランク別 取引制限</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, margin:"0 16px 10px" }}>
                {[["🔰","New","0〜49","1日1件\n先に動く義務",false],["🥉","Bronze","50〜149","1日3件まで",false],["🥈","Silver","150〜299","制限なし ✓",true],["🥇","Gold+","300〜","制限なし\nバッジ表示",false]].map(([icon,name,score,limit,current]) => (
                  <div key={name} style={{ background:current?"#1e1a0f":"#13151f", border:`1px solid ${current?"#f0a500":"#1e2133"}`, borderRadius:12, padding:"10px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:20 }}>{icon}</div>
                    <div style={{ fontSize:11, fontWeight:600, marginTop:4, color:"#ccc" }}>{name}</div>
                    <div style={{ fontSize:10, color:"#444", marginTop:2 }}>{score}pt</div>
                    <div style={{ fontSize:10, color:current?"#f0a500":"#555", marginTop:4, lineHeight:1.4, whiteSpace:"pre-line" }}>{limit}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding:"3rem 2rem", textAlign:"center" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>⭐</div>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:8, color:"#f0f0f0" }}>ウォレットを接続してください</div>
              <div style={{ fontSize:13, color:"#555", marginBottom:20 }}>信頼スコアはウォレットアドレスと紐付けられます</div>
              <button onClick={() => setShowSafety(true)} style={btnP}>ウォレットを接続する</button>
            </div>
          )}
        </div>
  
        {/* BOTTOM NAV */}
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#13151f", borderTop:"1px solid #1e2133", display:"flex", zIndex:20 }}>
          {[["browse","📊","相場"],["post","➕","掲載"],["deal","🤝","取引中"],["trust","⭐","スコア"]].map(([id,icon,label]) => (
            <button key={id} onClick={() => setScreen(id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"10px 0 14px", cursor:"pointer", border:"none", background:"none", color:screen===id?"#f0a500":"#444", fontSize:10 }}>
              <span style={{ fontSize:20 }}>{icon}</span><span>{label}</span>
            </button>
          ))}
        </div>
  
        <SafetyPopup show={showSafety} onConfirm={connectWallet} onClose={() => setShowSafety(false)} />
        <DonationModal show={showDonation} onClose={() => setShowDonation(false)} />
      </div>
    );
  }
