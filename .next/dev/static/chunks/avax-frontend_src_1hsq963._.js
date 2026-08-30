(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/avax-frontend/src/app/nuvari/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>KaiPlayground
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$src$2f$shared$2f$operationSchemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/src/shared/operationSchemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__useConnection__as__useAccount$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useConnection.js [app-client] (ecmascript) <export useConnection as useAccount>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useSendTransaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useSwitchChain$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useSwitchChain.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$chains$2f$definitions$2f$avalancheFuji$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/chains/definitions/avalancheFuji.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseEther$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/unit/parseEther.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/shield.mjs [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/lock.mjs [app-client] (ecmascript) <export default as Lock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/users.mjs [app-client] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/search.mjs [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/play.mjs [app-client] (ecmascript) <export default as Play>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$terminal$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TerminalSquare$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/square-terminal.mjs [app-client] (ecmascript) <export default as TerminalSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-client] (ecmascript) <export default as Loader>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/external-link.mjs [app-client] (ecmascript) <export default as ExternalLink>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$code$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Code$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/code.mjs [app-client] (ecmascript) <export default as Code>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/file-text.mjs [app-client] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/sparkles.mjs [app-client] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/zap.mjs [app-client] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2d$open$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BookOpen$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/book-open.mjs [app-client] (ecmascript) <export default as BookOpen>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2d$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/rotate-ccw-clock.mjs [app-client] (ecmascript) <export default as History>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/settings.mjs [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/database.mjs [app-client] (ecmascript) <export default as Database>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/circle-check-big.mjs [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/circle-x.mjs [app-client] (ecmascript) <export default as XCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/briefcase.mjs [app-client] (ecmascript) <export default as Briefcase>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
const FUJI_CHAIN_ID = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$chains$2f$definitions$2f$avalancheFuji$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["avalancheFuji"].id;
const TREASURY_ADDRESS = "0xB13727161583e38185530755a1A96D00fcCae870";
const POLICY_FEE_AVAX = "0.0001";
// ═══════════════════════════════════════════════════════════
// OPERATIONS REGISTRY — full 70+ ops across 3 services
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// NAV SECTIONS
// ═══════════════════════════════════════════════════════════
const NAV = [
    {
        id: "quick-start",
        label: "Quick Start",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"], {
            size: 15
        }, void 0, false, {
            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
            lineNumber: 44,
            columnNumber: 61
        }, ("TURBOPACK compile-time value", void 0)),
        color: "#c9a24b"
    },
    {
        id: "build-policy",
        label: "Build Policy",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
            size: 15
        }, void 0, false, {
            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
            lineNumber: 45,
            columnNumber: 62
        }, ("TURBOPACK compile-time value", void 0)),
        color: "#e84142"
    },
    {
        id: "insurance",
        label: "Insurance Service",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
            size: 15
        }, void 0, false, {
            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
            lineNumber: 46,
            columnNumber: 62
        }, ("TURBOPACK compile-time value", void 0)),
        color: "#3b82f6"
    },
    {
        id: "trust",
        label: "Trust Service",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
            size: 15
        }, void 0, false, {
            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
            lineNumber: 47,
            columnNumber: 62
        }, ("TURBOPACK compile-time value", void 0)),
        color: "#f59e0b"
    },
    {
        id: "pension",
        label: "Pension Service",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__["Lock"], {
            size: 15
        }, void 0, false, {
            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
            lineNumber: 48,
            columnNumber: 62
        }, ("TURBOPACK compile-time value", void 0)),
        color: "#8b5cf6"
    },
    {
        id: "templates",
        label: "Policy Templates",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2d$open$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BookOpen$3e$__["BookOpen"], {
            size: 15
        }, void 0, false, {
            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
            lineNumber: 49,
            columnNumber: 62
        }, ("TURBOPACK compile-time value", void 0)),
        color: "#22c55e"
    },
    {
        id: "automation",
        label: "Automation Service",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
            size: 15
        }, void 0, false, {
            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
            lineNumber: 50,
            columnNumber: 62
        }, ("TURBOPACK compile-time value", void 0)),
        color: "#a855f7"
    },
    {
        id: "execution",
        label: "Execution History",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2d$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__["History"], {
            size: 15
        }, void 0, false, {
            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
            lineNumber: 51,
            columnNumber: 62
        }, ("TURBOPACK compile-time value", void 0)),
        color: "#06b6d4"
    },
    {
        id: "queries",
        label: "Queries",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"], {
            size: 15
        }, void 0, false, {
            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
            lineNumber: 52,
            columnNumber: 62
        }, ("TURBOPACK compile-time value", void 0))
    },
    {
        id: "my-policies",
        label: "My Policies",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__["Briefcase"], {
            size: 15
        }, void 0, false, {
            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
            lineNumber: 53,
            columnNumber: 62
        }, ("TURBOPACK compile-time value", void 0)),
        color: "#f43f5e"
    },
    {
        id: "admin",
        label: "Administration",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
            size: 15
        }, void 0, false, {
            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
            lineNumber: 54,
            columnNumber: 62
        }, ("TURBOPACK compile-time value", void 0))
    }
];
function KaiPlayground() {
    _s();
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__useConnection__as__useAccount$3e$__["useAccount"])();
    const { sendTransactionAsync } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSendTransaction"])();
    const { switchChainAsync } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useSwitchChain$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSwitchChain"])();
    const [activeSection, setActiveSection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("quick-start");
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("transaction");
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [selectedOp, setSelectedOp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$src$2f$shared$2f$operationSchemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OPERATIONS"][0]);
    const [formValues, setFormValues] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [customParams, setCustomParams] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isRunning, setIsRunning] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [terminal, setTerminal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [execHistory, setExecHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [policies, setPolicies] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [currentExec, setCurrentExec] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [rightTab, setRightTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("terminal");
    const [aiPrompt, setAiPrompt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [aiDraft, setAiDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [aiLoading, setAiLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [aiAvailable, setAiAvailable] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null); // null = unchecked
    // Build-Policy state (unified from /policy page)
    const [bpTemplate, setBpTemplate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("pension");
    const [bpFields, setBpFields] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [bpSubmitting, setBpSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [bpStatus, setBpStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [bpTxUrl, setBpTxUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const termRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lineId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const log = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "KaiPlayground.useCallback[log]": (type, text, link)=>{
            lineId.current++;
            const ts = new Date().toLocaleTimeString("en-GB", {
                hour12: false
            });
            setTerminal({
                "KaiPlayground.useCallback[log]": (prev)=>[
                        ...prev,
                        {
                            id: lineId.current,
                            type,
                            text,
                            link,
                            ts
                        }
                    ]
            }["KaiPlayground.useCallback[log]"]);
        }
    }["KaiPlayground.useCallback[log]"], []);
    // Scroll terminal to bottom
    const fetchPolicies = async ()=>{
        try {
            const res = await fetch("/api/policies");
            if (res.ok) {
                const data = await res.json();
                setPolicies(data.policies || []);
            }
        } catch (err) {}
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "KaiPlayground.useEffect": ()=>{
            fetchPolicies();
            termRef.current?.scrollTo({
                top: termRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }["KaiPlayground.useEffect"], [
        terminal
    ]);
    // Load op form defaults
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "KaiPlayground.useEffect": ()=>{
            if (!selectedOp) return;
            const vals = {};
            // Apply template if available
            if (selectedOp.template) Object.assign(vals, selectedOp.template);
            // Apply field defaults (overriding only if not in template)
            selectedOp.fields.forEach({
                "KaiPlayground.useEffect": (f)=>{
                    if (!(f.key in vals)) vals[f.key] = f.default;
                }
            }["KaiPlayground.useEffect"]);
            setFormValues(vals);
            setCustomParams([]);
        }
    }["KaiPlayground.useEffect"], [
        selectedOp
    ]);
    // Filtered ops for current section
    const filteredOps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "KaiPlayground.useMemo[filteredOps]": ()=>{
            let ops = [];
            if (activeSection === "quick-start") ops = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$src$2f$shared$2f$operationSchemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OPERATIONS"].filter({
                "KaiPlayground.useMemo[filteredOps]": (o)=>o.category === "quick"
            }["KaiPlayground.useMemo[filteredOps]"]);
            else if (activeSection === "build-policy") return [];
            else if (activeSection === "templates") ops = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$src$2f$shared$2f$operationSchemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OPERATIONS"].filter({
                "KaiPlayground.useMemo[filteredOps]": (o)=>o.category === "template"
            }["KaiPlayground.useMemo[filteredOps]"]);
            else if (activeSection === "automation") ops = [];
            else if (activeSection === "queries") ops = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$src$2f$shared$2f$operationSchemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OPERATIONS"].filter({
                "KaiPlayground.useMemo[filteredOps]": (o)=>o.category === "query"
            }["KaiPlayground.useMemo[filteredOps]"]);
            else if (activeSection === "execution") return [];
            else if (activeSection === "admin") return [];
            else {
                ops = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$src$2f$shared$2f$operationSchemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OPERATIONS"].filter({
                    "KaiPlayground.useMemo[filteredOps]": (o)=>o.service === activeSection && (o.category === activeTab || activeTab === "transaction" && o.category === "quick")
                }["KaiPlayground.useMemo[filteredOps]"]);
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return ops.filter({
                    "KaiPlayground.useMemo[filteredOps]": (o)=>o.name.toLowerCase().includes(q) || o.description.toLowerCase().includes(q)
                }["KaiPlayground.useMemo[filteredOps]"]);
            }
            return ops;
        }
    }["KaiPlayground.useMemo[filteredOps]"], [
        activeSection,
        activeTab,
        searchQuery
    ]);
    const globalSearchResults = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "KaiPlayground.useMemo[globalSearchResults]": ()=>{
            if (!searchQuery.trim()) return [];
            const q = searchQuery.toLowerCase();
            return __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$src$2f$shared$2f$operationSchemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OPERATIONS"].filter({
                "KaiPlayground.useMemo[globalSearchResults]": (o)=>o.name.toLowerCase().includes(q) || o.description.toLowerCase().includes(q)
            }["KaiPlayground.useMemo[globalSearchResults]"]).slice(0, 12);
        }
    }["KaiPlayground.useMemo[globalSearchResults]"], [
        searchQuery
    ]);
    const accentColor = NAV.find((n)=>n.id === activeSection)?.color ?? "#c9a24b";
    const askPolicyAssistant = async ()=>{
        if (!aiPrompt.trim() || aiLoading) return;
        setAiLoading(true);
        setAiDraft("");
        try {
            // Quick health check first
            const health = await fetch("http://127.0.0.1:8000/health", {
                signal: AbortSignal.timeout(2000)
            }).catch(()=>null);
            if (!health?.ok) {
                setAiAvailable(false);
                setAiDraft("ℹ️ AI assistant offline — start the agent server to enable suggestions.\nYour policy will still work without it.");
                return;
            }
            setAiAvailable(true);
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: `Help configure this ${selectedOp?.name || "policy"}. Give concise, practical field recommendations for: ${aiPrompt}`,
                    rag: true,
                    stream: false
                })
            });
            const data = await response.json();
            setAiDraft(data.text || data.response || "No recommendation returned.");
        } catch  {
            setAiDraft("ℹ️ AI assistant unavailable. Your policy works without it.");
        } finally{
            setAiLoading(false);
        }
    };
    // ── Create Policy Flow ─────────────────────────────────
    const handleExecute = async ()=>{
        if (!selectedOp) return;
        setIsRunning(true);
        setRightTab("terminal");
        const owner = address || formValues.owner || formValues.settlor || formValues.memberAccount || __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$src$2f$shared$2f$operationSchemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OWNER_ACCOUNT"];
        const exec = {
            id: `exec_${Math.random().toString(36).slice(2, 10)}`,
            opName: selectedOp.name,
            policyId: `pol_${Math.random().toString(36).slice(2, 10)}`,
            status: "running",
            logs: [],
            startedAt: new Date().toISOString(),
            payerAccount: owner,
            txHash: ""
        };
        setCurrentExec(exec);
        try {
            if (!address) throw new Error("Connect a wallet before creating a policy.");
            await switchChainAsync({
                chainId: FUJI_CHAIN_ID
            });
            log("info", `[Policy] ${selectedOp.name} prepared for Avalanche Fuji Testnet`);
            log("info", `Treasury: ${TREASURY_ADDRESS}`);
            const txHash = await sendTransactionAsync({
                to: TREASURY_ADDRESS,
                value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseEther$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseEther"])(POLICY_FEE_AVAX)
            });
            exec.txId = txHash;
            exec.txHash = txHash;
            exec.explorerUrl = `https://testnet.snowtrace.io/tx/${txHash}`;
            exec.avaxFee = `${POLICY_FEE_AVAX} AVAX`;
            exec.platformFee = `${POLICY_FEE_AVAX} AVAX`;
            const saved = await fetch("/api/policies", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    owner,
                    serviceType: selectedOp.service,
                    config: {
                        operation: selectedOp.id,
                        ...formValues,
                        customParams
                    },
                    paymentAmount: Number(POLICY_FEE_AVAX),
                    paymentTxHash: txHash
                })
            });
            if (!saved.ok) throw new Error("Policy backend could not save the transaction.");
            exec.status = "completed";
            exec.confirmedAt = new Date().toISOString();
            exec.finishedAt = new Date().toISOString();
            log("success", `[Policy] ${exec.policyId} registered after treasury payment`);
            log("info", `Transaction: ${txHash}`);
            setCurrentExec({
                ...exec
            });
            setExecHistory((prev)=>[
                    {
                        ...exec
                    },
                    ...prev
                ]);
            setRightTab("result");
        } catch (err) {
            log("error", `[Error] ${err.message}`);
            exec.status = "failed";
            exec.finishedAt = new Date().toISOString();
            setCurrentExec({
                ...exec
            });
            setExecHistory((prev)=>[
                    {
                        ...exec
                    },
                    ...prev
                ]);
        } finally{
            setIsRunning(false);
        }
    };
    // ── Helpers ───────────────────────────────────────────
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "KaiPlayground.useEffect": ()=>{
            if (activeSection === "my-policies") fetchPolicies();
        }
    }["KaiPlayground.useEffect"], [
        activeSection
    ]);
    const selectOp = (op)=>{
        setSelectedOp(op);
        // auto-navigate to correct section
        if (op.category === "template") setActiveSection("templates");
        else if (op.category === "quick") setActiveSection("quick-start");
        else if (op.category === "query") setActiveSection("queries");
        else setActiveSection(op.service);
    };
    const payload = {
        network: "testnet",
        serviceType: selectedOp?.service,
        operationId: selectedOp?.id,
        timestamp: new Date().toISOString(),
        parameters: {
            ...formValues,
            ...customParams.reduce((a, c)=>{
                if (c.key.trim()) a[c.key] = c.value;
                return a;
            }, {})
        }
    };
    // ── STATUS COLOR ──────────────────────────────────────
    const statusColor = (s)=>s === "completed" ? "#22c55e" : s === "failed" ? "#ef4444" : s === "running" ? "#f59e0b" : "#60a5fa";
    // ═══════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            height: "100vh",
            background: "#080c09",
            color: "#fff",
            fontFamily: "'Inter',system-ui,sans-serif",
            overflow: "hidden"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    flex: 1,
                    minHeight: 0,
                    width: "100%",
                    maxWidth: "1600px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: "220px",
                            flexShrink: 0,
                            borderRight: "1px solid rgba(255,255,255,0.07)",
                            display: "flex",
                            flexDirection: "column",
                            background: "#0b0f0c"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: "16px 16px 12px",
                                    borderBottom: "1px solid rgba(255,255,255,0.06)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    fontSize: "16px",
                                                    fontWeight: "900",
                                                    letterSpacing: "-0.5px"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            color: "#e84142"
                                                        },
                                                        children: "KAI"
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 285,
                                                        columnNumber: 15
                                                    }, this),
                                                    "VAX"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 284,
                                                columnNumber: 13
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    fontSize: "9px",
                                                    background: "rgba(232,65,66,0.15)",
                                                    border: "1px solid rgba(232,65,66,0.3)",
                                                    color: "#e84142",
                                                    borderRadius: "4px",
                                                    padding: "1px 5px",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px"
                                                },
                                                children: "Playground"
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 287,
                                                columnNumber: 13
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 283,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: "10px",
                                            color: "rgba(255,255,255,0.25)",
                                            marginTop: "4px"
                                        },
                                        children: "Policy Execution Engine"
                                    }, void 0, false, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 289,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 282,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: "10px 12px",
                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                    position: "relative"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "7px",
                                            background: "rgba(255,255,255,0.05)",
                                            border: "1px solid rgba(255,255,255,0.09)",
                                            borderRadius: "6px",
                                            padding: "6px 10px"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                                size: 12,
                                                color: "rgba(255,255,255,0.35)"
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 295,
                                                columnNumber: 13
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                placeholder: "Search operations…",
                                                value: searchQuery,
                                                onChange: (e)=>setSearchQuery(e.target.value),
                                                style: {
                                                    background: "none",
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: "12px",
                                                    color: "#fff",
                                                    width: "100%",
                                                    "::placeholder": {
                                                        color: "rgba(255,255,255,0.3)"
                                                    }
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 296,
                                                columnNumber: 13
                                            }, this),
                                            searchQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setSearchQuery(""),
                                                style: {
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: "rgba(255,255,255,0.3)",
                                                    padding: 0
                                                },
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                    size: 11
                                                }, void 0, false, {
                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                    lineNumber: 303,
                                                    columnNumber: 177
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 303,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 294,
                                        columnNumber: 11
                                    }, this),
                                    searchQuery && globalSearchResults.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            position: "absolute",
                                            top: "100%",
                                            left: "12px",
                                            right: "12px",
                                            background: "#131a14",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "8px",
                                            zIndex: 50,
                                            maxHeight: "260px",
                                            overflowY: "auto",
                                            boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
                                        },
                                        children: globalSearchResults.map((op)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>{
                                                    selectOp(op);
                                                    setSearchQuery("");
                                                },
                                                style: {
                                                    width: "100%",
                                                    background: "none",
                                                    border: "none",
                                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                                    padding: "10px 12px",
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                    display: "block"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            fontSize: "12px",
                                                            color: "#fff",
                                                            fontWeight: "500"
                                                        },
                                                        children: op.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 312,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            fontSize: "10px",
                                                            color: "rgba(255,255,255,0.35)",
                                                            marginTop: "2px"
                                                        },
                                                        children: [
                                                            op.service,
                                                            " · ",
                                                            op.category
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 313,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, op.id, true, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 310,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 308,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 293,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    flex: 1,
                                    overflowY: "auto",
                                    padding: "8px"
                                },
                                children: NAV.map((nav)=>{
                                    const isActive = activeSection === nav.id;
                                    const color = nav.color ?? "rgba(255,255,255,0.5)";
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            setActiveSection(nav.id);
                                            setSearchQuery("");
                                        },
                                        style: {
                                            width: "100%",
                                            background: isActive ? `${color}12` : "transparent",
                                            border: `1px solid ${isActive ? color + "30" : "transparent"}`,
                                            borderRadius: "6px",
                                            padding: "8px 10px",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            color: isActive ? color : "rgba(255,255,255,0.45)",
                                            marginBottom: "2px",
                                            transition: "all 0.15s"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    color: isActive ? color : "rgba(255,255,255,0.3)"
                                                },
                                                children: nav.icon
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 328,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    fontSize: "12px",
                                                    fontWeight: isActive ? "600" : "400"
                                                },
                                                children: nav.label
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 329,
                                                columnNumber: 17
                                            }, this),
                                            nav.id === "execution" && execHistory.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    marginLeft: "auto",
                                                    background: isActive ? color + "30" : "rgba(255,255,255,0.1)",
                                                    borderRadius: "20px",
                                                    padding: "1px 6px",
                                                    fontSize: "10px",
                                                    color: isActive ? color : "rgba(255,255,255,0.4)"
                                                },
                                                children: execHistory.length
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 331,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, nav.id, true, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 326,
                                        columnNumber: 15
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 321,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: "10px 12px",
                                    borderTop: "1px solid rgba(255,255,255,0.06)",
                                    fontSize: "10px"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "5px",
                                            marginBottom: "4px",
                                            color: "rgba(255,255,255,0.4)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: "6px",
                                                    height: "6px",
                                                    borderRadius: "50%",
                                                    background: "#22c55e"
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 341,
                                                columnNumber: 13
                                            }, this),
                                            "Avalanche Fuji Testnet"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 340,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            color: "rgba(255,255,255,0.2)"
                                        },
                                        children: "Wallet connected · Treasury enabled"
                                    }, void 0, false, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 344,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 339,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 279,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: "260px",
                            flexShrink: 0,
                            borderRight: "1px solid rgba(255,255,255,0.07)",
                            display: "flex",
                            flexDirection: "column",
                            background: "#0c100d"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: "12px 14px",
                                    borderBottom: "1px solid rgba(255,255,255,0.06)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            marginBottom: "2px"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    color: accentColor
                                                },
                                                children: NAV.find((n)=>n.id === activeSection)?.icon
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 354,
                                                columnNumber: 13
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    fontSize: "13px",
                                                    fontWeight: "700",
                                                    color: "#fff"
                                                },
                                                children: NAV.find((n)=>n.id === activeSection)?.label
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 355,
                                                columnNumber: 13
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 353,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: "11px",
                                            color: "rgba(255,255,255,0.3)"
                                        },
                                        children: activeSection === "insurance" ? "24 operations" : activeSection === "trust" ? "18 operations" : activeSection === "pension" ? "15 operations" : activeSection === "templates" ? "11 templates" : ""
                                    }, void 0, false, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 357,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 352,
                                columnNumber: 9
                            }, this),
                            [
                                "insurance",
                                "trust",
                                "pension",
                                "queries"
                            ].includes(activeSection) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                                    padding: "0 14px"
                                },
                                children: [
                                    "transaction",
                                    "query"
                                ].map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setActiveTab(tab),
                                        style: {
                                            flex: 1,
                                            background: "none",
                                            border: "none",
                                            borderBottom: `2px solid ${activeTab === tab ? accentColor : "transparent"}`,
                                            padding: "8px 0",
                                            fontSize: "11px",
                                            fontWeight: activeTab === tab ? "600" : "400",
                                            color: activeTab === tab ? accentColor : "rgba(255,255,255,0.35)",
                                            cursor: "pointer",
                                            textTransform: "capitalize",
                                            transition: "all 0.15s"
                                        },
                                        children: tab === "transaction" ? "Transactions" : "Queries"
                                    }, tab, false, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 366,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 364,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    flex: 1,
                                    overflowY: "auto",
                                    padding: "8px"
                                },
                                children: activeSection === "build-policy" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        padding: "10px"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: "10px",
                                                color: "rgba(255,255,255,0.3)",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                marginBottom: "10px"
                                            },
                                            children: "Policy Types"
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 378,
                                            columnNumber: 15
                                        }, this),
                                        [
                                            {
                                                id: "pension",
                                                icon: "🏦",
                                                label: "KAIVAX Pension",
                                                color: "#A78BFA"
                                            },
                                            {
                                                id: "trust",
                                                icon: "🤝",
                                                label: "KAI Trust",
                                                color: "#FFD700"
                                            },
                                            {
                                                id: "crop",
                                                icon: "🌾",
                                                label: "Crop Insurance",
                                                color: "#EAB308"
                                            },
                                            {
                                                id: "forest",
                                                icon: "🌲",
                                                label: "Forest Protection",
                                                color: "#22C55E"
                                            },
                                            {
                                                id: "medical",
                                                icon: "🏥",
                                                label: "Medical Pool",
                                                color: "#EF4444"
                                            },
                                            {
                                                id: "rwa",
                                                icon: "🏗️",
                                                label: "RWA Tokenization",
                                                color: "#F97316"
                                            },
                                            {
                                                id: "honey",
                                                icon: "🍯",
                                                label: "Honey Reserve",
                                                color: "#F59E0B"
                                            },
                                            {
                                                id: "milk",
                                                icon: "🥛",
                                                label: "Milk Pool",
                                                color: "#60A5FA"
                                            },
                                            {
                                                id: "seeds",
                                                icon: "🌱",
                                                label: "Seed Bank",
                                                color: "#86EFAC"
                                            },
                                            {
                                                id: "recipe",
                                                icon: "📜",
                                                label: "Recipe IP Vault",
                                                color: "#F97316"
                                            }
                                        ].map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>{
                                                    setBpTemplate(t.id);
                                                    setBpFields({});
                                                    setBpStatus("");
                                                },
                                                style: {
                                                    width: "100%",
                                                    background: bpTemplate === t.id ? `${t.color}18` : "rgba(255,255,255,0.02)",
                                                    border: `1px solid ${bpTemplate === t.id ? t.color + "40" : "rgba(255,255,255,0.05)"}`,
                                                    borderRadius: "6px",
                                                    padding: "9px 11px",
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                    marginBottom: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    transition: "all 0.15s"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: t.icon
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 393,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: "12px",
                                                            fontWeight: "600",
                                                            color: bpTemplate === t.id ? t.color : "#d4d4d4"
                                                        },
                                                        children: t.label
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 394,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, t.id, true, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 391,
                                                columnNumber: 17
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                    lineNumber: 377,
                                    columnNumber: 13
                                }, this) : activeSection === "execution" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: "10px",
                                                color: "rgba(255,255,255,0.3)",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                padding: "4px 6px 8px"
                                            },
                                            children: "Execution History"
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 400,
                                            columnNumber: 15
                                        }, this),
                                        execHistory.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                padding: "20px 10px",
                                                textAlign: "center",
                                                color: "rgba(255,255,255,0.2)",
                                                fontSize: "12px"
                                            },
                                            children: "No executions yet"
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 402,
                                            columnNumber: 17
                                        }, this) : execHistory.map((ex, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>{
                                                    setCurrentExec(ex);
                                                    setRightTab("result");
                                                },
                                                style: {
                                                    width: "100%",
                                                    background: "rgba(255,255,255,0.03)",
                                                    border: "1px solid rgba(255,255,255,0.07)",
                                                    borderRadius: "6px",
                                                    padding: "10px",
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                    marginBottom: "6px",
                                                    display: "block"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            marginBottom: "3px"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    fontSize: "11px",
                                                                    fontWeight: "600",
                                                                    color: "#fff"
                                                                },
                                                                children: [
                                                                    "#",
                                                                    execHistory.length - i,
                                                                    " ",
                                                                    ex.opName
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                lineNumber: 407,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    fontSize: "10px",
                                                                    color: statusColor(ex.status),
                                                                    textTransform: "uppercase"
                                                                },
                                                                children: ex.status
                                                            }, void 0, false, {
                                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                lineNumber: 408,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 406,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            fontSize: "10px",
                                                            color: "rgba(255,255,255,0.3)",
                                                            fontFamily: "monospace"
                                                        },
                                                        children: ex.policyId || "—"
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 410,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, ex.id, true, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 404,
                                                columnNumber: 17
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                    lineNumber: 399,
                                    columnNumber: 13
                                }, this) : activeSection === "automation" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        padding: "20px 10px",
                                        textAlign: "center"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                            size: 24,
                                            color: "#a855f7",
                                            style: {
                                                margin: "0 auto 8px"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 416,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: "12px",
                                                color: "rgba(255,255,255,0.4)",
                                                marginBottom: "4px"
                                            },
                                            children: "Automation Engine"
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 417,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: "11px",
                                                color: "rgba(255,255,255,0.2)"
                                            },
                                            children: "Event-driven policy triggers coming in v2"
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 418,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                    lineNumber: 415,
                                    columnNumber: 13
                                }, this) : activeSection === "admin" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        padding: "16px 10px"
                                    },
                                    children: [
                                        [
                                            "Network",
                                            "Avalanche Fuji Testnet"
                                        ],
                                        [
                                            "Treasury",
                                            TREASURY_ADDRESS
                                        ],
                                        [
                                            "Engine Wallet",
                                            __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$src$2f$shared$2f$operationSchemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KAI_ACCOUNT"]
                                        ]
                                    ].map(([k, v])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                display: "flex",
                                                justifyContent: "space-between",
                                                fontSize: "11px",
                                                padding: "6px 0",
                                                borderBottom: "1px solid rgba(255,255,255,0.05)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    style: {
                                                        color: "rgba(255,255,255,0.4)"
                                                    },
                                                    children: k
                                                }, void 0, false, {
                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                    lineNumber: 424,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    style: {
                                                        color: "rgba(255,255,255,0.7)",
                                                        fontFamily: "monospace"
                                                    },
                                                    children: v
                                                }, void 0, false, {
                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                    lineNumber: 425,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, k, true, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 423,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                    lineNumber: 421,
                                    columnNumber: 13
                                }, this) : activeSection === "my-policies" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        padding: "10px"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: "10px",
                                                color: "rgba(255,255,255,0.3)",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                marginBottom: "8px"
                                            },
                                            children: "Active Policies"
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 431,
                                            columnNumber: 15
                                        }, this),
                                        policies.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                padding: "20px 10px",
                                                textAlign: "center",
                                                color: "rgba(255,255,255,0.2)",
                                                fontSize: "12px"
                                            },
                                            children: "No policies found"
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 433,
                                            columnNumber: 17
                                        }, this) : policies.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>{
                                                    setSelectedOp(null);
                                                    setRightTab("payload");
                                                    setCurrentExec(null);
                                                },
                                                style: {
                                                    width: "100%",
                                                    background: "rgba(255,255,255,0.03)",
                                                    border: "1px solid rgba(255,255,255,0.07)",
                                                    borderRadius: "6px",
                                                    padding: "10px",
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                    marginBottom: "6px",
                                                    display: "block"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            marginBottom: "3px"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    fontSize: "11px",
                                                                    fontWeight: "600",
                                                                    color: "#fff"
                                                                },
                                                                children: p.config?.policyTitle || p.config?.planTitle || p.config?.trustName || p.policyId
                                                            }, void 0, false, {
                                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                lineNumber: 442,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    fontSize: "10px",
                                                                    color: "#22c55e",
                                                                    textTransform: "uppercase"
                                                                },
                                                                children: p.status
                                                            }, void 0, false, {
                                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                lineNumber: 443,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 441,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            fontSize: "10px",
                                                            color: "rgba(255,255,255,0.3)",
                                                            fontFamily: "monospace"
                                                        },
                                                        children: p.serviceType
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 445,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, p.policyId, true, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 435,
                                                columnNumber: 17
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                    lineNumber: 430,
                                    columnNumber: 13
                                }, this) : filteredOps.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        padding: "20px 10px",
                                        textAlign: "center",
                                        color: "rgba(255,255,255,0.2)",
                                        fontSize: "12px"
                                    },
                                    children: "No operations found"
                                }, void 0, false, {
                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                    lineNumber: 450,
                                    columnNumber: 13
                                }, this) : filteredOps.map((op)=>{
                                    const isSelected = selectedOp?.id === op.id;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>selectOp(op),
                                        style: {
                                            width: "100%",
                                            background: isSelected ? `${accentColor}18` : "rgba(255,255,255,0.02)",
                                            border: `1px solid ${isSelected ? accentColor + "40" : "rgba(255,255,255,0.05)"}`,
                                            borderRadius: "6px",
                                            padding: "10px 12px",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            marginBottom: "4px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            transition: "all 0.15s"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                            marginBottom: "2px"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    fontSize: "12px",
                                                                    fontWeight: "600",
                                                                    color: isSelected ? accentColor : "#d4d4d4"
                                                                },
                                                                children: op.name
                                                            }, void 0, false, {
                                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                lineNumber: 459,
                                                                columnNumber: 23
                                                            }, this),
                                                            op.badge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    fontSize: "9px",
                                                                    background: `${accentColor}20`,
                                                                    color: accentColor,
                                                                    borderRadius: "3px",
                                                                    padding: "1px 5px"
                                                                },
                                                                children: op.badge
                                                            }, void 0, false, {
                                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                lineNumber: 460,
                                                                columnNumber: 36
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 458,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            fontSize: "10px",
                                                            color: "rgba(255,255,255,0.3)"
                                                        },
                                                        children: op.category === "template" ? "Template" : op.fields.length + " params"
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 462,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 457,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                size: 13,
                                                color: isSelected ? accentColor : "rgba(255,255,255,0.2)"
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 466,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, op.id, true, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 455,
                                        columnNumber: 17
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 375,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 349,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            minWidth: 0,
                            borderRight: "1px solid rgba(255,255,255,0.07)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: "14px 20px",
                                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    background: "rgba(255,255,255,0.01)",
                                    flexShrink: 0
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    marginBottom: "3px"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            color: accentColor
                                                        },
                                                        children: NAV.find((n)=>n.id === activeSection)?.icon
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 481,
                                                        columnNumber: 15
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        style: {
                                                            margin: 0,
                                                            fontSize: "15px",
                                                            fontWeight: "700"
                                                        },
                                                        children: selectedOp?.name ?? "Select an Operation"
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 482,
                                                        columnNumber: 15
                                                    }, this),
                                                    selectedOp?.badge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: "10px",
                                                            background: `${accentColor}20`,
                                                            color: accentColor,
                                                            borderRadius: "4px",
                                                            padding: "2px 7px"
                                                        },
                                                        children: selectedOp.badge
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 483,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 480,
                                                columnNumber: 13
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    margin: 0,
                                                    fontSize: "12px",
                                                    color: "rgba(255,255,255,0.4)"
                                                },
                                                children: selectedOp?.description ?? "Choose an operation from the left panel"
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 485,
                                                columnNumber: 13
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 479,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            gap: "10px",
                                            alignItems: "center"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: "flex",
                                                    background: "rgba(255,255,255,0.06)",
                                                    borderRadius: "6px",
                                                    padding: "2px"
                                                },
                                                children: [
                                                    "form",
                                                    "payload"
                                                ].map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setRightTab(t),
                                                        style: {
                                                            background: rightTab === t ? "rgba(255,255,255,0.12)" : "transparent",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            color: rightTab === t ? "#fff" : "rgba(255,255,255,0.4)",
                                                            padding: "4px 10px",
                                                            borderRadius: "4px",
                                                            fontSize: "11px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "4px"
                                                        },
                                                        children: t === "form" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"], {
                                                                    size: 11
                                                                }, void 0, false, {
                                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                    lineNumber: 494,
                                                                    columnNumber: 37
                                                                }, this),
                                                                " Configure"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                            lineNumber: 494,
                                                            columnNumber: 35
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$code$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Code$3e$__["Code"], {
                                                                    size: 11
                                                                }, void 0, false, {
                                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                    lineNumber: 494,
                                                                    columnNumber: 77
                                                                }, this),
                                                                " Payload"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                            lineNumber: 494,
                                                            columnNumber: 75
                                                        }, this)
                                                    }, t, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 492,
                                                        columnNumber: 17
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 490,
                                                columnNumber: 13
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: handleExecute,
                                                disabled: isRunning || !selectedOp,
                                                style: {
                                                    background: accentColor,
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "7px",
                                                    padding: "9px 22px",
                                                    fontSize: "13px",
                                                    fontWeight: "700",
                                                    cursor: isRunning ? "not-allowed" : "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    opacity: isRunning ? 0.7 : 1,
                                                    transition: "opacity 0.2s"
                                                },
                                                children: isRunning ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                                                            size: 14,
                                                            style: {
                                                                animation: "spin 1s linear infinite"
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                            lineNumber: 501,
                                                            columnNumber: 30
                                                        }, this),
                                                        " Running…"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                    lineNumber: 501,
                                                    columnNumber: 28
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                                            size: 14
                                                        }, void 0, false, {
                                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                            lineNumber: 501,
                                                            columnNumber: 115
                                                        }, this),
                                                        " Execute"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                    lineNumber: 501,
                                                    columnNumber: 113
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 499,
                                                columnNumber: 13
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 488,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 478,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    flex: 1,
                                    overflowY: "auto",
                                    padding: "20px"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            maxWidth: "520px",
                                            marginBottom: "18px",
                                            padding: "12px",
                                            background: "rgba(59,130,246,0.08)",
                                            border: "1px solid rgba(96,165,250,0.25)",
                                            borderRadius: "8px"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    marginBottom: "8px"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                                        size: 13,
                                                        color: "#60a5fa"
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 510,
                                                        columnNumber: 15
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            color: "#60a5fa"
                                                        },
                                                        children: "Policy Assistant"
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 511,
                                                        columnNumber: 15
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            fontSize: "9px",
                                                            color: "rgba(255,255,255,0.25)",
                                                            marginLeft: "auto"
                                                        },
                                                        children: aiAvailable === false ? "● offline" : aiAvailable === true ? "● online" : "optional"
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 512,
                                                        columnNumber: 15
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 509,
                                                columnNumber: 13
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: "flex",
                                                    gap: "7px"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        value: aiPrompt,
                                                        onChange: (e)=>setAiPrompt(e.target.value),
                                                        onKeyDown: (e)=>{
                                                            if (e.key === "Enter") askPolicyAssistant();
                                                        },
                                                        placeholder: "Describe what you need — AI will suggest field values…",
                                                        style: {
                                                            flex: 1,
                                                            background: "rgba(0,0,0,0.25)",
                                                            border: "1px solid rgba(255,255,255,0.12)",
                                                            borderRadius: "6px",
                                                            padding: "8px 10px",
                                                            fontSize: "12px",
                                                            color: "#fff",
                                                            outline: "none"
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 517,
                                                        columnNumber: 15
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: askPolicyAssistant,
                                                        disabled: aiLoading || !aiPrompt.trim(),
                                                        style: {
                                                            background: aiAvailable === false ? "rgba(255,255,255,0.08)" : "#2563eb",
                                                            color: "#fff",
                                                            border: "none",
                                                            borderRadius: "6px",
                                                            padding: "8px 12px",
                                                            fontSize: "11px",
                                                            cursor: aiLoading || !aiPrompt.trim() ? "not-allowed" : "pointer",
                                                            opacity: aiLoading ? 0.6 : 1
                                                        },
                                                        children: aiLoading ? "Thinking…" : "Ask AI"
                                                    }, void 0, false, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 519,
                                                        columnNumber: 15
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 516,
                                                columnNumber: 13
                                            }, this),
                                            aiDraft && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    whiteSpace: "pre-wrap",
                                                    marginTop: "9px",
                                                    fontSize: "11px",
                                                    lineHeight: 1.5,
                                                    color: aiDraft.startsWith("ℹ️") ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)"
                                                },
                                                children: aiDraft
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 523,
                                                columnNumber: 25
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 508,
                                        columnNumber: 11
                                    }, this),
                                    activeSection === "build-policy" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BuildPolicyPanel, {
                                        templateId: bpTemplate,
                                        fields: bpFields,
                                        setFields: setBpFields,
                                        status: bpStatus,
                                        setStatus: setBpStatus,
                                        txUrl: bpTxUrl,
                                        setTxUrl: setBpTxUrl,
                                        submitting: bpSubmitting,
                                        setSubmitting: setBpSubmitting,
                                        address: address,
                                        sendTransactionAsync: sendTransactionAsync,
                                        switchChainAsync: switchChainAsync,
                                        policies: policies,
                                        refreshPolicies: fetchPolicies
                                    }, void 0, false, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 527,
                                        columnNumber: 13
                                    }, this) : rightTab === "payload" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                        style: {
                                            background: "rgba(0,0,0,0.4)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "8px",
                                            padding: "16px",
                                            fontFamily: "'JetBrains Mono',monospace",
                                            fontSize: "12px",
                                            color: "#60a5fa",
                                            lineHeight: "1.6",
                                            overflow: "auto",
                                            margin: 0
                                        },
                                        children: JSON.stringify(payload, null, 2)
                                    }, void 0, false, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 544,
                                        columnNumber: 13
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            maxWidth: "520px",
                                            display: "grid",
                                            gap: "14px"
                                        },
                                        children: [
                                            selectedOp?.category === "template" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    background: `${accentColor}12`,
                                                    border: `1px solid ${accentColor}30`,
                                                    borderRadius: "8px",
                                                    padding: "14px 16px"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                            marginBottom: "6px"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                                                size: 14,
                                                                color: accentColor
                                                            }, void 0, false, {
                                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                lineNumber: 552,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    fontSize: "12px",
                                                                    fontWeight: "600",
                                                                    color: accentColor
                                                                },
                                                                children: "Template Auto-Configured"
                                                            }, void 0, false, {
                                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                lineNumber: 553,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 551,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        style: {
                                                            margin: 0,
                                                            fontSize: "12px",
                                                            color: "rgba(255,255,255,0.5)"
                                                        },
                                                        children: [
                                                            "All fields have been pre-filled with ",
                                                            selectedOp.name,
                                                            " defaults. Review below and click Execute to deploy."
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 555,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 550,
                                                columnNumber: 17
                                            }, this) : null,
                                            selectedOp?.fields.map((field)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            style: {
                                                                display: "block",
                                                                fontSize: "12px",
                                                                fontWeight: "500",
                                                                color: "rgba(255,255,255,0.65)",
                                                                marginBottom: "5px"
                                                            },
                                                            children: [
                                                                field.label,
                                                                field.required && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    style: {
                                                                        color: accentColor,
                                                                        marginLeft: "3px"
                                                                    },
                                                                    children: "*"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                    lineNumber: 563,
                                                                    columnNumber: 40
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                            lineNumber: 561,
                                                            columnNumber: 19
                                                        }, this),
                                                        field.type === "text" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "text",
                                                            value: formValues[field.key] ?? "",
                                                            onChange: (e)=>setFormValues((p)=>({
                                                                        ...p,
                                                                        [field.key]: e.target.value
                                                                    })),
                                                            style: {
                                                                width: "100%",
                                                                background: "rgba(255,255,255,0.05)",
                                                                border: "1px solid rgba(255,255,255,0.12)",
                                                                borderRadius: "6px",
                                                                padding: "8px 12px",
                                                                fontSize: "13px",
                                                                color: "#fff",
                                                                outline: "none",
                                                                boxSizing: "border-box"
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                            lineNumber: 567,
                                                            columnNumber: 21
                                                        }, this),
                                                        field.type === "number" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "number",
                                                            value: formValues[field.key] ?? 0,
                                                            onChange: (e)=>setFormValues((p)=>({
                                                                        ...p,
                                                                        [field.key]: parseFloat(e.target.value)
                                                                    })),
                                                            style: {
                                                                width: "100%",
                                                                background: "rgba(255,255,255,0.05)",
                                                                border: "1px solid rgba(255,255,255,0.12)",
                                                                borderRadius: "6px",
                                                                padding: "8px 12px",
                                                                fontSize: "13px",
                                                                color: "#fff",
                                                                outline: "none",
                                                                boxSizing: "border-box"
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                            lineNumber: 571,
                                                            columnNumber: 21
                                                        }, this),
                                                        field.type === "select" && field.options && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                            value: formValues[field.key] ?? field.default,
                                                            onChange: (e)=>setFormValues((p)=>({
                                                                        ...p,
                                                                        [field.key]: e.target.value
                                                                    })),
                                                            style: {
                                                                width: "100%",
                                                                background: "#111815",
                                                                border: "1px solid rgba(255,255,255,0.12)",
                                                                borderRadius: "6px",
                                                                padding: "8px 12px",
                                                                fontSize: "13px",
                                                                color: "#fff",
                                                                outline: "none",
                                                                boxSizing: "border-box"
                                                            },
                                                            children: field.options.map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                    value: opt,
                                                                    children: opt
                                                                }, opt, false, {
                                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                    lineNumber: 577,
                                                                    columnNumber: 49
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                            lineNumber: 575,
                                                            columnNumber: 21
                                                        }, this),
                                                        field.type === "boolean" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            onClick: ()=>setFormValues((p)=>({
                                                                        ...p,
                                                                        [field.key]: !p[field.key]
                                                                    })),
                                                            style: {
                                                                background: formValues[field.key] ? `${accentColor}25` : "rgba(255,255,255,0.07)",
                                                                border: `1px solid ${formValues[field.key] ? accentColor : "rgba(255,255,255,0.15)"}`,
                                                                borderRadius: "20px",
                                                                padding: "5px 16px",
                                                                fontSize: "12px",
                                                                color: formValues[field.key] ? accentColor : "rgba(255,255,255,0.4)",
                                                                cursor: "pointer"
                                                            },
                                                            children: formValues[field.key] ? "✓ ENABLED" : "DISABLED"
                                                        }, void 0, false, {
                                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                            lineNumber: 581,
                                                            columnNumber: 21
                                                        }, this),
                                                        field.hint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                fontSize: "10px",
                                                                color: "rgba(255,255,255,0.3)",
                                                                marginTop: "3px"
                                                            },
                                                            children: field.hint
                                                        }, void 0, false, {
                                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                            lineNumber: 586,
                                                            columnNumber: 34
                                                        }, this)
                                                    ]
                                                }, field.key, true, {
                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                    lineNumber: 560,
                                                    columnNumber: 17
                                                }, this)),
                                            selectedOp && selectedOp.category !== "template" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    marginTop: "8px",
                                                    paddingTop: "14px",
                                                    borderTop: "1px solid rgba(255,255,255,0.07)"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            marginBottom: "10px"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    fontSize: "12px",
                                                                    color: "rgba(255,255,255,0.5)"
                                                                },
                                                                children: "Custom Policy Attributes"
                                                            }, void 0, false, {
                                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                lineNumber: 594,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>setCustomParams((p)=>[
                                                                            ...p,
                                                                            {
                                                                                key: `attr_${p.length + 1}`,
                                                                                value: ""
                                                                            }
                                                                        ]),
                                                                style: {
                                                                    background: "rgba(255,255,255,0.06)",
                                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                                    borderRadius: "5px",
                                                                    padding: "4px 9px",
                                                                    fontSize: "11px",
                                                                    color: "rgba(255,255,255,0.5)",
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "4px"
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                                        size: 11
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                        lineNumber: 597,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    " Add Attribute"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                lineNumber: 595,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                        lineNumber: 593,
                                                        columnNumber: 19
                                                    }, this),
                                                    customParams.map((cp, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                display: "flex",
                                                                gap: "8px",
                                                                marginBottom: "7px",
                                                                alignItems: "center"
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "text",
                                                                    placeholder: "key",
                                                                    value: cp.key,
                                                                    onChange: (e)=>setCustomParams((p)=>p.map((x, j)=>j === i ? {
                                                                                    ...x,
                                                                                    key: e.target.value
                                                                                } : x)),
                                                                    style: {
                                                                        flex: 1,
                                                                        background: "rgba(255,255,255,0.05)",
                                                                        border: "1px solid rgba(255,255,255,0.1)",
                                                                        borderRadius: "5px",
                                                                        padding: "6px 10px",
                                                                        fontSize: "11px",
                                                                        color: "#fff",
                                                                        outline: "none"
                                                                    }
                                                                }, void 0, false, {
                                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                    lineNumber: 602,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "text",
                                                                    placeholder: "value",
                                                                    value: cp.value,
                                                                    onChange: (e)=>setCustomParams((p)=>p.map((x, j)=>j === i ? {
                                                                                    ...x,
                                                                                    value: e.target.value
                                                                                } : x)),
                                                                    style: {
                                                                        flex: 1,
                                                                        background: "rgba(255,255,255,0.05)",
                                                                        border: "1px solid rgba(255,255,255,0.1)",
                                                                        borderRadius: "5px",
                                                                        padding: "6px 10px",
                                                                        fontSize: "11px",
                                                                        color: "#fff",
                                                                        outline: "none"
                                                                    }
                                                                }, void 0, false, {
                                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                    lineNumber: 604,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>setCustomParams((p)=>p.filter((_, j)=>j !== i)),
                                                                    style: {
                                                                        background: "none",
                                                                        border: "none",
                                                                        color: "rgba(255,255,255,0.3)",
                                                                        cursor: "pointer"
                                                                    },
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                                        size: 13
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                        lineNumber: 606,
                                                                        columnNumber: 188
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                                    lineNumber: 606,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, i, true, {
                                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                            lineNumber: 601,
                                                            columnNumber: 21
                                                        }, this))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 592,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 548,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 507,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: "10px 20px",
                                    borderTop: "1px solid rgba(255,255,255,0.06)",
                                    background: "rgba(255,255,255,0.01)",
                                    display: "flex",
                                    gap: "16px",
                                    flexShrink: 0
                                },
                                children: [
                                    [
                                        "Fuji",
                                        "Avalanche testnet"
                                    ],
                                    [
                                        "Wallet",
                                        "User-signed"
                                    ],
                                    [
                                        "Treasury",
                                        TREASURY_ADDRESS
                                    ],
                                    [
                                        "AI",
                                        aiAvailable === false ? "offline (optional)" : aiAvailable === true ? "online" : "optional"
                                    ]
                                ].map(([k, v])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: "10px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "1px"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    color: "rgba(255,255,255,0.5)",
                                                    fontWeight: "600"
                                                },
                                                children: k
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 619,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    color: "rgba(255,255,255,0.25)"
                                                },
                                                children: v
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 620,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, k, true, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 618,
                                        columnNumber: 13
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 616,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 475,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                lineNumber: 276,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    height: "280px",
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    background: "#0a0e0b",
                    borderTop: "1px solid rgba(255,255,255,0.1)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            borderBottom: "1px solid rgba(255,255,255,0.07)",
                            flexShrink: 0
                        },
                        children: [
                            "terminal",
                            "result"
                        ].map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setRightTab(t),
                                style: {
                                    flex: 1,
                                    background: "none",
                                    border: "none",
                                    borderBottom: `2px solid ${rightTab === t ? accentColor : "transparent"}`,
                                    padding: "10px 8px",
                                    fontSize: "11px",
                                    fontWeight: rightTab === t ? "600" : "400",
                                    color: rightTab === t ? accentColor : "rgba(255,255,255,0.35)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "5px",
                                    transition: "all 0.15s"
                                },
                                children: t === "terminal" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$terminal$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TerminalSquare$3e$__["TerminalSquare"], {
                                            size: 12
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 635,
                                            columnNumber: 37
                                        }, this),
                                        " Activity"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                    lineNumber: 635,
                                    columnNumber: 35
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                            size: 12
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 635,
                                            columnNumber: 82
                                        }, this),
                                        " Result"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                    lineNumber: 635,
                                    columnNumber: 80
                                }, this)
                            }, t, false, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 633,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 631,
                        columnNumber: 9
                    }, this),
                    rightTab === "terminal" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: termRef,
                        style: {
                            flex: 1,
                            overflowY: "auto",
                            padding: "12px 14px",
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: "11px",
                            lineHeight: "1.6"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    color: "rgba(255,255,255,0.2)",
                                    marginBottom: "10px"
                                },
                                children: "// KAI Policy Workspace · Avalanche Fuji"
                            }, void 0, false, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 642,
                                columnNumber: 13
                            }, this),
                            terminal.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    color: "rgba(255,255,255,0.2)"
                                },
                                children: "Select an operation and click Execute to begin."
                            }, void 0, false, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 643,
                                columnNumber: 39
                            }, this),
                            terminal.map((l)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        marginBottom: "3px",
                                        wordBreak: "break-all"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: {
                                                color: "rgba(255,255,255,0.2)",
                                                marginRight: "6px",
                                                fontSize: "10px"
                                            },
                                            children: l.ts
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 646,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: {
                                                color: l.type === "cmd" ? "#c9a24b" : l.type === "success" ? "#22c55e" : l.type === "warn" ? "#f59e0b" : l.type === "error" ? "#ef4444" : l.type === "receipt" ? "#60a5fa" : "rgba(255,255,255,0.55)"
                                            },
                                            children: [
                                                l.type === "cmd" && "$ ",
                                                l.text
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 647,
                                            columnNumber: 17
                                        }, this),
                                        l.link && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: l.link.url,
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            style: {
                                                color: "#60a5fa",
                                                textDecoration: "underline",
                                                marginLeft: "6px",
                                                fontSize: "11px"
                                            },
                                            children: [
                                                l.link.label,
                                                " ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__["ExternalLink"], {
                                                    size: 9,
                                                    style: {
                                                        verticalAlign: "middle"
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                    lineNumber: 653,
                                                    columnNumber: 36
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 652,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, l.id, true, {
                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                    lineNumber: 645,
                                    columnNumber: 15
                                }, this)),
                            isRunning && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    color: "#a78bfa",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    marginTop: "6px"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                                        size: 12,
                                        style: {
                                            animation: "spin 1s linear infinite"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 660,
                                        columnNumber: 17
                                    }, this),
                                    " Waiting for wallet confirmation…"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 659,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 641,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            flex: 1,
                            overflowY: "auto",
                            padding: "14px"
                        },
                        children: !currentExec ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                textAlign: "center",
                                padding: "40px 20px",
                                color: "rgba(255,255,255,0.2)",
                                fontSize: "12px"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                    size: 28,
                                    color: "rgba(255,255,255,0.1)",
                                    style: {
                                        display: "block",
                                        margin: "0 auto 10px"
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                    lineNumber: 668,
                                    columnNumber: 17
                                }, this),
                                "Execute an operation to see results here"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                            lineNumber: 667,
                            columnNumber: 15
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: "grid",
                                gap: "10px"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        background: `${statusColor(currentExec.status)}15`,
                                        border: `1px solid ${statusColor(currentExec.status)}40`,
                                        borderRadius: "8px",
                                        padding: "12px 14px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px"
                                    },
                                    children: [
                                        currentExec.status === "completed" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                            size: 18,
                                            color: "#22c55e"
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 675,
                                            columnNumber: 57
                                        }, this) : currentExec.status === "failed" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__["XCircle"], {
                                            size: 18,
                                            color: "#ef4444"
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 675,
                                            columnNumber: 135
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                                            size: 18,
                                            color: "#f59e0b",
                                            style: {
                                                animation: "spin 1s linear infinite"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 675,
                                            columnNumber: 175
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: "13px",
                                                        fontWeight: "700",
                                                        color: statusColor(currentExec.status),
                                                        textTransform: "uppercase"
                                                    },
                                                    children: currentExec.status
                                                }, void 0, false, {
                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                    lineNumber: 677,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: "11px",
                                                        color: "rgba(255,255,255,0.4)"
                                                    },
                                                    children: currentExec.opName
                                                }, void 0, false, {
                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                    lineNumber: 678,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 676,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                    lineNumber: 674,
                                    columnNumber: 17
                                }, this),
                                currentExec.explorerUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: currentExec.explorerUrl,
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    style: {
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        background: "rgba(59,130,246,0.1)",
                                        border: "1px solid rgba(59,130,246,0.25)",
                                        borderRadius: "7px",
                                        padding: "10px 14px",
                                        textDecoration: "none"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#60a5fa"
                                                    },
                                                    children: "Open Fuji Transaction"
                                                }, void 0, false, {
                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                    lineNumber: 687,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: "10px",
                                                        color: "rgba(255,255,255,0.35)"
                                                    },
                                                    children: "View on Snowtrace"
                                                }, void 0, false, {
                                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                    lineNumber: 688,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 686,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__["ExternalLink"], {
                                            size: 14,
                                            color: "#60a5fa"
                                        }, void 0, false, {
                                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                            lineNumber: 690,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                    lineNumber: 684,
                                    columnNumber: 19
                                }, this),
                                [
                                    [
                                        "ID",
                                        currentExec.txId || currentExec.id
                                    ],
                                    [
                                        "Type",
                                        "Crypto Transfer"
                                    ],
                                    [
                                        "Confirmed at",
                                        currentExec.confirmedAt ? currentExec.confirmedAt.slice(0, 19).replace("T", " ") : "—"
                                    ],
                                    [
                                        "Transaction Hash",
                                        currentExec.txHash || "—"
                                    ],
                                    [
                                        "Network",
                                        "Avalanche Fuji"
                                    ],
                                    [
                                        "Treasury",
                                        TREASURY_ADDRESS
                                    ],
                                    [
                                        "Memo",
                                        currentExec.opName
                                    ],
                                    [
                                        "Payer Account",
                                        currentExec.payerAccount || "—"
                                    ],
                                    [
                                        "AVAX Fee",
                                        currentExec.avaxFee || "—"
                                    ],
                                    [
                                        "Policy ID",
                                        currentExec.policyId || "—"
                                    ],
                                    [
                                        "Treasury Payment",
                                        currentExec.platformFee || "—"
                                    ]
                                ].map(([k, v])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "11px",
                                            padding: "7px 0",
                                            borderBottom: "1px solid rgba(255,255,255,0.05)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    color: "rgba(255,255,255,0.4)"
                                                },
                                                children: k
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 708,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    color: "rgba(255,255,255,0.8)",
                                                    fontFamily: "monospace"
                                                },
                                                children: v
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 709,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, k, true, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 707,
                                        columnNumber: 19
                                    }, this))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                            lineNumber: 672,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 665,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                lineNumber: 628,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                children: `@keyframes spin { to { transform: rotate(360deg); } }`
            }, void 0, false, {
                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                lineNumber: 720,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
        lineNumber: 275,
        columnNumber: 5
    }, this);
}
_s(KaiPlayground, "e4zMhVjMycyraTl2+WuD8ZKWWzA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__useConnection__as__useAccount$3e$__["useAccount"],
        __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSendTransaction"],
        __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useSwitchChain$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSwitchChain"]
    ];
});
_c = KaiPlayground;
// ─── SERVICE TEMPLATES for Build Policy ──────────────────────────────────────
const BP_TEMPLATES = {
    pension: {
        icon: "🏦",
        label: "KAIVAX Pension",
        color: "#A78BFA",
        fields: [
            {
                key: "vestingYears",
                label: "Vesting period (years)",
                placeholder: "5",
                type: "number"
            },
            {
                key: "monthlyDeposit",
                label: "Monthly deposit (NVR)",
                placeholder: "100",
                type: "number"
            },
            {
                key: "beneficiary",
                label: "Beneficiary address",
                placeholder: "0x…"
            }
        ]
    },
    trust: {
        icon: "🤝",
        label: "KAI Trust",
        color: "#FFD700",
        fields: [
            {
                key: "lockYears",
                label: "Lock duration (years)",
                placeholder: "5",
                type: "number"
            },
            {
                key: "amount",
                label: "Trust amount (NVR)",
                placeholder: "1000",
                type: "number"
            },
            {
                key: "beneficiary",
                label: "Beneficiary address",
                placeholder: "0x…"
            }
        ]
    },
    crop: {
        icon: "🌾",
        label: "Crop Insurance",
        color: "#EAB308",
        fields: [
            {
                key: "cropType",
                label: "Crop type",
                placeholder: "Maize"
            },
            {
                key: "hectares",
                label: "Area (hectares)",
                placeholder: "10",
                type: "number"
            },
            {
                key: "season",
                label: "Season (YYYY)",
                placeholder: "2026",
                type: "number"
            }
        ]
    },
    forest: {
        icon: "🌲",
        label: "Forest Protection",
        color: "#22C55E",
        fields: [
            {
                key: "forestId",
                label: "Forest ID / parcel",
                placeholder: "KE-001"
            },
            {
                key: "hectares",
                label: "Hectares covered",
                placeholder: "50",
                type: "number"
            },
            {
                key: "duration",
                label: "Coverage (months)",
                placeholder: "12",
                type: "number"
            }
        ]
    },
    medical: {
        icon: "🏥",
        label: "Medical Pool",
        color: "#EF4444",
        fields: [
            {
                key: "members",
                label: "Pool members",
                placeholder: "100",
                type: "number"
            },
            {
                key: "coverageUsd",
                label: "Max coverage (USD)",
                placeholder: "500",
                type: "number"
            },
            {
                key: "duration",
                label: "Policy duration (mo)",
                placeholder: "12",
                type: "number"
            }
        ]
    },
    rwa: {
        icon: "🏗️",
        label: "RWA Tokenization",
        color: "#F97316",
        fields: [
            {
                key: "assetType",
                label: "Asset type",
                placeholder: "Land"
            },
            {
                key: "valuationUsd",
                label: "Valuation (USD)",
                placeholder: "10000",
                type: "number"
            },
            {
                key: "location",
                label: "Location / parcel ID",
                placeholder: "Nairobi, KE-042"
            }
        ]
    },
    honey: {
        icon: "🍯",
        label: "Honey Reserve",
        color: "#F59E0B",
        fields: [
            {
                key: "community",
                label: "Community name",
                placeholder: "Turkana Beekeepers"
            },
            {
                key: "kgTarget",
                label: "Target (kg)",
                placeholder: "500",
                type: "number"
            },
            {
                key: "season",
                label: "Harvest season",
                placeholder: "2026"
            }
        ]
    },
    milk: {
        icon: "🥛",
        label: "Pastoral Milk Pool",
        color: "#60A5FA",
        fields: [
            {
                key: "cooperative",
                label: "Co-op name",
                placeholder: "Maasai Dairy Coop"
            },
            {
                key: "litresDaily",
                label: "Daily litres",
                placeholder: "200",
                type: "number"
            },
            {
                key: "duration",
                label: "Duration (months)",
                placeholder: "6",
                type: "number"
            }
        ]
    },
    seeds: {
        icon: "🌱",
        label: "Heritage Seed Bank",
        color: "#86EFAC",
        fields: [
            {
                key: "variety",
                label: "Crop variety",
                placeholder: "Njahi Beans"
            },
            {
                key: "kgStored",
                label: "Kg to store",
                placeholder: "50",
                type: "number"
            },
            {
                key: "location",
                label: "Storage location",
                placeholder: "Meru, Kenya"
            }
        ]
    },
    recipe: {
        icon: "📜",
        label: "Recipe IP Vault",
        color: "#F97316",
        fields: [
            {
                key: "recipeName",
                label: "Recipe / method name",
                placeholder: "Fermented Uji"
            },
            {
                key: "community",
                label: "Community owner",
                placeholder: "Luo Heritage Group"
            },
            {
                key: "licenseType",
                label: "License type",
                placeholder: "Community Commons"
            }
        ]
    }
};
const POLICY_FEE_BP = "0.0001";
const TREASURY_BP = "0xB13727161583e38185530755a1A96D00fcCae870";
function BuildPolicyPanel({ templateId, fields, setFields, status, setStatus, txUrl, setTxUrl, submitting, setSubmitting, address, sendTransactionAsync, switchChainAsync, policies, refreshPolicies }) {
    const tmpl = BP_TEMPLATES[templateId];
    if (!tmpl) return null;
    const myPolicies = policies.filter((p)=>p.owner?.toLowerCase() === address?.toLowerCase());
    const handleCreate = async ()=>{
        if (!address) {
            setStatus("⚠️ Connect your wallet first.");
            return;
        }
        const missing = tmpl.fields.find((f)=>!fields[f.key]?.trim());
        if (missing) {
            setStatus(`⚠️ Fill in "${missing.label}"`);
            return;
        }
        setSubmitting(true);
        setStatus("Switching to Avalanche Fuji…");
        setTxUrl(null);
        try {
            await switchChainAsync({
                chainId: 43113
            });
            setStatus(`Paying ${POLICY_FEE_BP} AVAX registration fee…`);
            const txHash = await sendTransactionAsync({
                to: TREASURY_BP,
                value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseEther$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseEther"])(POLICY_FEE_BP)
            });
            setTxUrl(`https://testnet.snowtrace.io/tx/${txHash}`);
            setStatus("Saving policy…");
            const res = await fetch("/api/policies", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    owner: address,
                    serviceType: templateId,
                    config: fields,
                    paymentAmount: Number(POLICY_FEE_BP),
                    paymentTxHash: txHash
                })
            });
            if (!res.ok) throw new Error("API error");
            const { policy } = await res.json();
            setStatus(`✅ Policy ${policy.policyId} created on Fuji!`);
            setFields({});
            refreshPolicies();
        } catch (e) {
            setStatus(`❌ ${e.message?.slice(0, 100)}`);
        } finally{
            setSubmitting(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: "20px",
            maxWidth: "620px",
            display: "flex",
            flexDirection: "column",
            gap: 16
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 800,
                            color: "#fff"
                        },
                        children: "🛡️ Build a Policy"
                    }, void 0, false, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 816,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            margin: "4px 0 0",
                            fontSize: 11,
                            color: "rgba(255,255,255,0.4)"
                        },
                        children: [
                            "Create on-chain KAIVAX policies · ",
                            POLICY_FEE_BP,
                            " AVAX per registration · Fuji Snowtrace"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 817,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                lineNumber: 815,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    gap: 8
                },
                children: [
                    {
                        label: "My Policies",
                        val: myPolicies.length,
                        c: "#e84142"
                    },
                    {
                        label: "Total Policies",
                        val: policies.length,
                        c: "#A78BFA"
                    },
                    {
                        label: "Fee",
                        val: `${POLICY_FEE_BP} AVAX`,
                        c: "#22C55E"
                    }
                ].map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            flex: 1,
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${s.c}25`,
                            borderRadius: 10,
                            padding: "10px 12px",
                            textAlign: "center"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    fontSize: 16,
                                    fontWeight: 900,
                                    color: s.c,
                                    margin: 0
                                },
                                children: s.val
                            }, void 0, false, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 826,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    fontSize: 9,
                                    color: "rgba(255,255,255,0.35)",
                                    margin: "2px 0 0",
                                    fontWeight: 700
                                },
                                children: s.label
                            }, void 0, false, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 827,
                                columnNumber: 13
                            }, this)
                        ]
                    }, s.label, true, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 825,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                lineNumber: 823,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    background: "rgba(0,0,0,0.25)",
                    border: `1px solid ${tmpl.color}30`,
                    borderRadius: 12,
                    padding: 16
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 14
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: 20
                                },
                                children: tmpl.icon
                            }, void 0, false, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 835,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: tmpl.color
                                },
                                children: tmpl.label
                            }, void 0, false, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 836,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 834,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            gap: 10
                        },
                        children: tmpl.fields.map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        style: {
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: "rgba(255,255,255,0.4)",
                                            display: "block",
                                            marginBottom: 4,
                                            letterSpacing: 0.5
                                        },
                                        children: f.label.toUpperCase()
                                    }, void 0, false, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 841,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: f.type ?? "text",
                                        placeholder: f.placeholder,
                                        value: fields[f.key] ?? "",
                                        onChange: (e)=>setFields({
                                                ...fields,
                                                [f.key]: e.target.value
                                            }),
                                        style: {
                                            width: "100%",
                                            background: "rgba(0,0,0,0.3)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: 8,
                                            padding: "9px 12px",
                                            fontSize: 13,
                                            color: "#fff",
                                            outline: "none",
                                            fontFamily: "inherit",
                                            boxSizing: "border-box"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 842,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, f.key, true, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 840,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 838,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                lineNumber: 833,
                columnNumber: 7
            }, this),
            status && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontSize: 11,
                    background: status.startsWith("❌") ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.08)",
                    border: `1px solid ${status.startsWith("❌") ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.2)"}`,
                    color: "#fff"
                },
                children: [
                    status,
                    txUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: txUrl,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        style: {
                            marginLeft: 8,
                            color: "#60a5fa",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4
                        },
                        children: [
                            "Snowtrace ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__["ExternalLink"], {
                                size: 11
                            }, void 0, false, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 857,
                                columnNumber: 23
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 856,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                lineNumber: 852,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleCreate,
                disabled: submitting,
                style: {
                    padding: "12px",
                    borderRadius: 10,
                    border: "none",
                    fontWeight: 800,
                    fontSize: 14,
                    background: submitting ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg,${tmpl.color},${tmpl.color}bb)`,
                    color: [
                        "#FFD700",
                        "#EAB308",
                        "#22C55E",
                        "#86EFAC"
                    ].includes(tmpl.color) ? "#1B4332" : "#fff",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1
                },
                children: submitting ? "⏳ Signing…" : `🛡️ Create ${tmpl.label} · ${POLICY_FEE_BP} AVAX`
            }, void 0, false, {
                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                lineNumber: 863,
                columnNumber: 7
            }, this),
            myPolicies.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            fontSize: 11,
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.4)",
                            margin: "4px 0 8px",
                            letterSpacing: 1
                        },
                        children: [
                            "MY POLICIES (",
                            myPolicies.length,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 875,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            gap: 6
                        },
                        children: myPolicies.slice(0, 5).map((p)=>{
                            const t = BP_TEMPLATES[p.serviceType];
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    borderRadius: 10,
                                    padding: "10px 14px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: 18
                                        },
                                        children: t?.icon ?? "📄"
                                    }, void 0, false, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 881,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            flex: 1
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    color: "#fff",
                                                    margin: 0
                                                },
                                                children: t?.label ?? p.serviceType
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 883,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    fontSize: 10,
                                                    fontFamily: "monospace",
                                                    color: "rgba(255,255,255,0.3)",
                                                    margin: "2px 0 0"
                                                },
                                                children: p.policyId
                                            }, void 0, false, {
                                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                                lineNumber: 884,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 882,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: 10,
                                            fontWeight: 700,
                                            padding: "2px 8px",
                                            borderRadius: 6,
                                            background: p.status === "active" ? "rgba(34,197,94,0.12)" : "rgba(255,215,0,0.1)",
                                            color: p.status === "active" ? "#22C55E" : "#FFD700",
                                            border: `1px solid ${p.status === "active" ? "rgba(34,197,94,0.3)" : "rgba(255,215,0,0.25)"}`
                                        },
                                        children: p.status === "active" ? "● ACTIVE" : "○ DRAFT"
                                    }, void 0, false, {
                                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                        lineNumber: 886,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, p.policyId, true, {
                                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                                lineNumber: 880,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                        lineNumber: 876,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
                lineNumber: 874,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/avax-frontend/src/app/nuvari/page.tsx",
        lineNumber: 812,
        columnNumber: 5
    }, this);
}
_c1 = BuildPolicyPanel;
var _c, _c1;
__turbopack_context__.k.register(_c, "KaiPlayground");
__turbopack_context__.k.register(_c1, "BuildPolicyPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/avax-frontend/src/shared/operationSchemas.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "KAI_ACCOUNT",
    ()=>KAI_ACCOUNT,
    "OPERATIONS",
    ()=>OPERATIONS,
    "OPERATION_SCHEMAS",
    ()=>OPERATION_SCHEMAS,
    "OWNER_ACCOUNT",
    ()=>OWNER_ACCOUNT
]);
const KAI_ACCOUNT = "0xB13727161583e38185530755a1A96D00fcCae870";
const OWNER_ACCOUNT = "0xB13727161583e38185530755a1A96D00fcCae870";
const OPERATIONS = [
    // ── Quick Start ──────────────────────────────────────────
    {
        id: "qs_create_insurance",
        name: "Create Insurance Policy",
        category: "quick",
        service: "insurance",
        description: "Quickly create a basic insurance policy.",
        badge: "Popular",
        fields: [
            {
                key: "title",
                label: "Policy Title",
                type: "text",
                default: "My Insurance Policy",
                required: true
            },
            {
                key: "coverageType",
                label: "Coverage Type",
                type: "select",
                default: "Group Health",
                options: [
                    "Group Health",
                    "Motor",
                    "Life",
                    "Crop",
                    "Property",
                    "Travel"
                ]
            },
            {
                key: "premium",
                label: "Premium (AVAX)",
                type: "number",
                default: 0.001
            }
        ]
    },
    {
        id: "qs_create_trust",
        name: "Create Family Trust",
        category: "quick",
        service: "trust",
        description: "Quickly set up a programmable family trust.",
        badge: "Popular",
        fields: [
            {
                key: "trustName",
                label: "Trust Name",
                type: "text",
                default: "KAI Family Trust",
                required: true
            },
            {
                key: "settlor",
                label: "Settlor Account",
                type: "text",
                default: OWNER_ACCOUNT
            },
            {
                key: "fundingAmount",
                label: "Initial Funding (AVAX)",
                type: "number",
                default: 0.01
            }
        ]
    },
    {
        id: "qs_create_pension",
        name: "Create Pension Plan",
        category: "quick",
        service: "pension",
        description: "Quickly start a personal or employer pension plan.",
        fields: [
            {
                key: "planTitle",
                label: "Plan Title",
                type: "text",
                default: "SME Pension Vault",
                required: true
            },
            {
                key: "contribution",
                label: "Contribution (AVAX)",
                type: "number",
                default: 0.005
            },
            {
                key: "vestingCliff",
                label: "Vesting Cliff (Months)",
                type: "number",
                default: 24
            }
        ]
    },
    {
        id: "qs_execute_policy",
        name: "Execute Policy",
        category: "quick",
        service: "all",
        description: "Execute any existing policy by ID.",
        fields: [
            {
                key: "policyId",
                label: "Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "memo",
                label: "Execution Memo",
                type: "text",
                default: "Manual execution via KAI Playground"
            }
        ]
    },
    // ── Insurance: Transactions ───────────────────────────────
    {
        id: "ins_create",
        name: "Create Policy",
        category: "transaction",
        service: "insurance",
        description: "Initialize an on-chain insurance policy with premium schedules and beneficiaries.",
        fields: [
            {
                key: "policyTitle",
                label: "Policy Title",
                type: "text",
                default: "CFA Group Health Cover",
                required: true
            },
            {
                key: "coverageType",
                label: "Coverage Type",
                type: "select",
                default: "Group Health",
                options: [
                    "Group Health",
                    "Motor",
                    "Life",
                    "Crop & Climate Index",
                    "SME Asset Protection",
                    "Travel",
                    "Property"
                ]
            },
            {
                key: "owner",
                label: "Owner Wallet Address",
                type: "text",
                default: OWNER_ACCOUNT,
                hint: "Avalanche EVM wallet address"
            },
            {
                key: "beneficiary",
                label: "Beneficiary Group / Account",
                type: "text",
                default: "CFA Member Pool"
            },
            {
                key: "premium",
                label: "Premium (AVAX)",
                type: "number",
                default: 0.001,
                required: true
            },
            {
                key: "maxClaim",
                label: "Max Claim Limit (AVAX)",
                type: "number",
                default: 0.1
            },
            {
                key: "gracePeriod",
                label: "Grace Period (Days)",
                type: "number",
                default: 14
            },
            {
                key: "autoRenew",
                label: "Enable Auto Renewal",
                type: "boolean",
                default: true
            }
        ]
    },
    {
        id: "ins_update",
        name: "Update Policy",
        category: "transaction",
        service: "insurance",
        description: "Update configuration of an existing insurance policy.",
        fields: [
            {
                key: "policyId",
                label: "Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "premium",
                label: "New Premium (AVAX)",
                type: "number",
                default: 0.001
            },
            {
                key: "maxClaim",
                label: "New Max Claim (AVAX)",
                type: "number",
                default: 0.1
            }
        ]
    },
    {
        id: "ins_add_coverage",
        name: "Add Coverage",
        category: "transaction",
        service: "insurance",
        description: "Extend an existing policy with additional coverage layers.",
        fields: [
            {
                key: "policyId",
                label: "Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "coverageType",
                label: "Coverage Type",
                type: "select",
                default: "Maternity",
                options: [
                    "Maternity",
                    "Dental",
                    "Optical",
                    "Inpatient",
                    "Outpatient",
                    "Critical Illness"
                ]
            },
            {
                key: "coverageLimit",
                label: "Coverage Limit (AVAX)",
                type: "number",
                default: 0.1
            }
        ]
    },
    {
        id: "ins_add_beneficiary",
        name: "Add Beneficiary",
        category: "transaction",
        service: "insurance",
        description: "Attach a beneficiary account to an insurance policy.",
        fields: [
            {
                key: "policyId",
                label: "Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "beneficiaryAccount",
                label: "Beneficiary Wallet Address",
                type: "text",
                default: ""
            },
            {
                key: "allocationPercent",
                label: "Allocation (%)",
                type: "number",
                default: 100
            }
        ]
    },
    {
        id: "ins_configure_claims",
        name: "Configure Claim Rules",
        category: "transaction",
        service: "insurance",
        description: "Set automated claim approval logic and assessor requirements.",
        fields: [
            {
                key: "policyId",
                label: "Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "assessorAccount",
                label: "Claims Assessor Account",
                type: "text",
                default: KAI_ACCOUNT
            },
            {
                key: "requireEventProof",
                label: "Require Event Proof",
                type: "boolean",
                default: true
            },
            {
                key: "autoApproveBelow",
                label: "Auto-Approve Claims Below (AVAX)",
                type: "number",
                default: 0.01
            },
            {
                key: "gracePeriod",
                label: "Grace Period (Days)",
                type: "number",
                default: 7
            }
        ]
    },
    {
        id: "ins_pause",
        name: "Pause Policy",
        category: "transaction",
        service: "insurance",
        description: "Temporarily suspend premium collection and claim processing.",
        fields: [
            {
                key: "policyId",
                label: "Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "reason",
                label: "Pause Reason",
                type: "text",
                default: "Pending review"
            }
        ]
    },
    {
        id: "ins_resume",
        name: "Resume Policy",
        category: "transaction",
        service: "insurance",
        description: "Reactivate a paused insurance policy.",
        fields: [
            {
                key: "policyId",
                label: "Policy ID",
                type: "text",
                default: "pol_",
                required: true
            }
        ]
    },
    {
        id: "ins_terminate",
        name: "Terminate Policy",
        category: "transaction",
        service: "insurance",
        description: "Permanently close an insurance policy and settle outstanding claims.",
        fields: [
            {
                key: "policyId",
                label: "Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "settlementAccount",
                label: "Settlement Account",
                type: "text",
                default: OWNER_ACCOUNT
            },
            {
                key: "reason",
                label: "Termination Reason",
                type: "text",
                default: "Policy matured"
            }
        ]
    },
    {
        id: "ins_set_premium_schedule",
        name: "Set Premium Schedule",
        category: "transaction",
        service: "insurance",
        description: "Define or update the premium collection schedule and amounts.",
        fields: [
            {
                key: "policyId",
                label: "Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "frequency",
                label: "Billing Frequency",
                type: "select",
                default: "Monthly",
                options: [
                    "Daily",
                    "Weekly",
                    "Monthly",
                    "Quarterly",
                    "Annually"
                ]
            },
            {
                key: "amount",
                label: "Premium Amount (AVAX)",
                type: "number",
                default: 0.001
            },
            {
                key: "startDate",
                label: "First Billing Date",
                type: "text",
                default: "2026-08-01"
            }
        ]
    },
    {
        id: "ins_calculate_premium",
        name: "Calculate Premium",
        category: "transaction",
        service: "insurance",
        description: "Compute premium based on risk profile and coverage type.",
        fields: [
            {
                key: "coverageType",
                label: "Coverage Type",
                type: "select",
                default: "Group Health",
                options: [
                    "Group Health",
                    "Motor",
                    "Life",
                    "Crop",
                    "Property"
                ]
            },
            {
                key: "memberCount",
                label: "Number of Members",
                type: "number",
                default: 10
            },
            {
                key: "ageRange",
                label: "Average Age Range",
                type: "select",
                default: "25-35",
                options: [
                    "18-25",
                    "25-35",
                    "35-45",
                    "45-55",
                    "55+"
                ]
            },
            {
                key: "riskLevel",
                label: "Risk Level",
                type: "select",
                default: "Medium",
                options: [
                    "Low",
                    "Medium",
                    "High"
                ]
            }
        ]
    },
    // Insurance Queries
    {
        id: "ins_get_policy",
        name: "Get Policy",
        category: "query",
        service: "insurance",
        description: "Retrieve policy details and current status.",
        fields: [
            {
                key: "policyId",
                label: "Policy ID",
                type: "text",
                default: "pol_",
                required: true
            }
        ]
    },
    {
        id: "ins_get_claims",
        name: "Get Claims",
        category: "query",
        service: "insurance",
        description: "List all claims submitted against a policy.",
        fields: [
            {
                key: "policyId",
                label: "Policy ID",
                type: "text",
                default: "pol_"
            },
            {
                key: "status",
                label: "Filter by Status",
                type: "select",
                default: "all",
                options: [
                    "all",
                    "pending",
                    "approved",
                    "rejected",
                    "paid"
                ]
            }
        ]
    },
    {
        id: "ins_get_audit_log",
        name: "Get Policy Audit Log",
        category: "query",
        service: "insurance",
        description: "Retrieve the full policy activity history.",
        fields: [
            {
                key: "policyId",
                label: "Policy ID",
                type: "text",
                default: "pol_"
            }
        ]
    },
    // ── Trust: Transactions ───────────────────────────────────
    {
        id: "trs_create",
        name: "Create Trust",
        category: "transaction",
        service: "trust",
        description: "Initialize a programmable multi-signature trust with settlor, trustees, and asset backing.",
        fields: [
            {
                key: "trustName",
                label: "Trust Name",
                type: "text",
                default: "KAI Family Asset Trust",
                required: true
            },
            {
                key: "trustType",
                label: "Trust Type",
                type: "select",
                default: "Family Trust",
                options: [
                    "Family Trust",
                    "Estate Trust",
                    "Investment Trust",
                    "Charitable Trust",
                    "Education Trust",
                    "SME Escrow"
                ]
            },
            {
                key: "settlor",
                label: "Settlor Account ID",
                type: "text",
                default: OWNER_ACCOUNT,
                hint: "Account funding the trust"
            },
            {
                key: "trustee",
                label: "Primary Trustee Account",
                type: "text",
                default: KAI_ACCOUNT
            },
            {
                key: "beneficiary",
                label: "Beneficiary Wallet Address",
                type: "text",
                default: ""
            },
            {
                key: "fundingAmount",
                label: "Initial Asset Value (AVAX)",
                type: "number",
                default: 0.01,
                required: true
            },
            {
                key: "autoReleaseOnMilestone",
                label: "Enable Milestone Auto-Release",
                type: "boolean",
                default: true
            },
            {
                key: "requireMultiSig",
                label: "Require Multi-Sig Approval",
                type: "boolean",
                default: false
            }
        ]
    },
    {
        id: "trs_add_trustee",
        name: "Add Co-Trustee",
        category: "transaction",
        service: "trust",
        description: "Attach an additional trustee for multi-sig governance.",
        fields: [
            {
                key: "trustId",
                label: "Trust Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "trusteeAccount",
                label: "Co-Trustee Wallet Address",
                type: "text",
                default: ""
            },
            {
                key: "sigWeight",
                label: "Signature Weight",
                type: "number",
                default: 1
            },
            {
                key: "threshold",
                label: "Approval Threshold",
                type: "select",
                default: "2-of-3",
                options: [
                    "1-of-1",
                    "1-of-2",
                    "2-of-3",
                    "2-of-4",
                    "3-of-5"
                ]
            }
        ]
    },
    {
        id: "trs_define_distribution",
        name: "Define Distribution Rules",
        category: "transaction",
        service: "trust",
        description: "Set programmable triggers for releasing trust capital to beneficiaries.",
        fields: [
            {
                key: "trustId",
                label: "Trust Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "triggerCondition",
                label: "Trigger Condition",
                type: "select",
                default: "Age Threshold (21 Yrs)",
                options: [
                    "Age Threshold (21 Yrs)",
                    "University Admission Proof",
                    "Marriage Milestone",
                    "Fixed Calendar Date",
                    "Death of Settlor",
                    "Event Proof"
                ]
            },
            {
                key: "payoutType",
                label: "Payout Structure",
                type: "select",
                default: "Monthly Allowance",
                options: [
                    "Monthly Allowance",
                    "Lump Sum (100%)",
                    "Tranche (33/33/34)",
                    "Custom Schedule"
                ]
            },
            {
                key: "amount",
                label: "Release Amount (AVAX)",
                type: "number",
                default: 0.01
            }
        ]
    },
    {
        id: "trs_create_milestone",
        name: "Create Milestone",
        category: "transaction",
        service: "trust",
        description: "Define a milestone event that unlocks trust assets on verified proof.",
        fields: [
            {
                key: "trustId",
                label: "Trust Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "milestoneName",
                label: "Milestone Name",
                type: "text",
                default: "University Enrollment"
            },
            {
                key: "milestoneType",
                label: "Milestone Type",
                type: "select",
                default: "Event Proof",
                options: [
                    "Event Proof",
                    "Date Reached",
                    "Oracle Feed",
                    "Manual Approval"
                ]
            },
            {
                key: "releaseAmount",
                label: "Release Amount on Achievement (AVAX)",
                type: "number",
                default: 0.01
            }
        ]
    },
    {
        id: "trs_lock_assets",
        name: "Lock Trust Assets",
        category: "transaction",
        service: "trust",
        description: "Immutably time-lock trust assets until conditions are met on-chain.",
        fields: [
            {
                key: "trustId",
                label: "Trust Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "timelockMonths",
                label: "Timelock Duration (Months)",
                type: "number",
                default: 12
            },
            {
                key: "antiTamper",
                label: "Enable Anti-Tamper Guard",
                type: "boolean",
                default: true
            }
        ]
    },
    {
        id: "trs_attach_assets",
        name: "Attach Assets",
        category: "transaction",
        service: "trust",
        description: "Lock additional AVAX or ERC-20 tokens into the trust vault.",
        fields: [
            {
                key: "trustId",
                label: "Trust Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "assetType",
                label: "Asset Type",
                type: "select",
                default: "AVAX",
                options: [
                    "AVAX",
                    "ERC-20 Token",
                    "NFT"
                ]
            },
            {
                key: "amount",
                label: "Amount",
                type: "number",
                default: 100
            },
            {
                key: "tokenAddress",
                label: "Token Contract (if applicable)",
                type: "text",
                default: ""
            }
        ]
    },
    {
        id: "trs_suspend",
        name: "Suspend Trust",
        category: "transaction",
        service: "trust",
        description: "Temporarily freeze all trust operations pending review.",
        fields: [
            {
                key: "trustId",
                label: "Trust Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "reason",
                label: "Suspension Reason",
                type: "text",
                default: "Legal review in progress"
            }
        ]
    },
    {
        id: "trs_deploy",
        name: "Deploy Trust On-Chain",
        category: "transaction",
        service: "trust",
        description: "Finalize trust configuration for permanent activation on Avalanche.",
        fields: [
            {
                key: "trustId",
                label: "Trust Policy ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "confirmImmutability",
                label: "Confirm Immutability After Deployment",
                type: "boolean",
                default: true
            }
        ]
    },
    // Trust Queries
    {
        id: "trs_get_trust",
        name: "Get Trust Details",
        category: "query",
        service: "trust",
        description: "Retrieve full trust configuration, status and beneficiary list.",
        fields: [
            {
                key: "trustId",
                label: "Trust Policy ID",
                type: "text",
                default: "pol_",
                required: true
            }
        ]
    },
    {
        id: "trs_get_audit",
        name: "Get Trust Audit Log",
        category: "query",
        service: "trust",
        description: "Fetch the activity history for all trust events.",
        fields: [
            {
                key: "trustId",
                label: "Trust Policy ID",
                type: "text",
                default: "pol_"
            }
        ]
    },
    {
        id: "trs_get_assets",
        name: "Get Trust Assets",
        category: "query",
        service: "trust",
        description: "View all assets currently locked in the trust vault.",
        fields: [
            {
                key: "trustId",
                label: "Trust Policy ID",
                type: "text",
                default: "pol_"
            }
        ]
    },
    // ── Pension: Transactions ─────────────────────────────────
    {
        id: "pen_create",
        name: "Create Pension Plan",
        category: "transaction",
        service: "pension",
        description: "Set up a time-locked retirement savings vault with employer matching and vesting schedule.",
        fields: [
            {
                key: "planTitle",
                label: "Pension Scheme Title",
                type: "text",
                default: "SME Employee Pension Vault",
                required: true
            },
            {
                key: "planType",
                label: "Plan Type",
                type: "select",
                default: "Corporate Pension",
                options: [
                    "Personal Pension",
                    "Corporate Pension",
                    "SME Pension",
                    "Informal Worker Pension"
                ]
            },
            {
                key: "memberAccount",
                label: "Member Account ID",
                type: "text",
                default: OWNER_ACCOUNT
            },
            {
                key: "employerAccount",
                label: "Employer Account ID",
                type: "text",
                default: KAI_ACCOUNT
            },
            {
                key: "monthlyContribution",
                label: "Deposit (AVAX)",
                type: "number",
                default: 0.005,
                required: true
            },
            {
                key: "employerMatch",
                label: "Employer Match %",
                type: "number",
                default: 50
            },
            {
                key: "vestingCliff",
                label: "Vesting Cliff (Months)",
                type: "number",
                default: 24
            },
            {
                key: "autoInvest",
                label: "Enable Auto Investment",
                type: "boolean",
                default: true
            }
        ]
    },
    {
        id: "pen_add_employer",
        name: "Add Employer",
        category: "transaction",
        service: "pension",
        description: "Link an employer account to a pension plan for contribution matching.",
        fields: [
            {
                key: "planId",
                label: "Pension Plan ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "employerAccount",
                label: "Employer Account ID",
                type: "text",
                default: KAI_ACCOUNT
            },
            {
                key: "matchPercent",
                label: "Employer Match %",
                type: "number",
                default: 50
            },
            {
                key: "matchCap",
                label: "Match Cap (AVAX)",
                type: "number",
                default: 0.01
            }
        ]
    },
    {
        id: "pen_configure_contribution",
        name: "Configure Contribution Rules",
        category: "transaction",
        service: "pension",
        description: "Set contribution amount, frequency, and escalation rules.",
        fields: [
            {
                key: "planId",
                label: "Pension Plan ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "frequency",
                label: "Contribution Frequency",
                type: "select",
                default: "Monthly",
                options: [
                    "Weekly",
                    "Bi-Weekly",
                    "Monthly",
                    "Quarterly"
                ]
            },
            {
                key: "amount",
                label: "Contribution Amount (AVAX)",
                type: "number",
                default: 0.005
            },
            {
                key: "escalationRate",
                label: "Annual Escalation Rate (%)",
                type: "number",
                default: 5
            }
        ]
    },
    {
        id: "pen_attach_strategy",
        name: "Attach Investment Strategy",
        category: "transaction",
        service: "pension",
        description: "Link an on-chain investment strategy to the pension vault.",
        fields: [
            {
                key: "planId",
                label: "Pension Plan ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "strategy",
                label: "Investment Strategy",
                type: "select",
                default: "Balanced",
                options: [
                    "Conservative",
                    "Balanced",
                    "Growth",
                    "Aggressive",
                    "AVAX-Only"
                ]
            },
            {
                key: "rebalanceFrequency",
                label: "Rebalance Frequency",
                type: "select",
                default: "Quarterly",
                options: [
                    "Monthly",
                    "Quarterly",
                    "Annually",
                    "Manual"
                ]
            }
        ]
    },
    {
        id: "pen_withdraw",
        name: "Withdraw",
        category: "transaction",
        service: "pension",
        description: "Process a withdrawal from the pension vault (subject to vesting rules).",
        fields: [
            {
                key: "planId",
                label: "Pension Plan ID",
                type: "text",
                default: "pol_",
                required: true
            },
            {
                key: "amount",
                label: "Withdrawal Amount (AVAX)",
                type: "number",
                default: 0.01
            },
            {
                key: "reason",
                label: "Withdrawal Reason",
                type: "select",
                default: "Retirement",
                options: [
                    "Retirement",
                    "Medical Emergency",
                    "Partial Withdrawal",
                    "Account Closure"
                ]
            }
        ]
    },
    {
        id: "pen_calculate_projection",
        name: "Calculate Retirement Projection",
        category: "transaction",
        service: "pension",
        description: "Project retirement value based on contributions, matching, and growth rate.",
        fields: [
            {
                key: "planId",
                label: "Pension Plan ID",
                type: "text",
                default: "pol_"
            },
            {
                key: "currentBalance",
                label: "Current Balance (AVAX)",
                type: "number",
                default: 0.1
            },
            {
                key: "monthlyContrib",
                label: "Contribution (AVAX)",
                type: "number",
                default: 0.005
            },
            {
                key: "years",
                label: "Years to Retirement",
                type: "number",
                default: 30
            },
            {
                key: "annualReturn",
                label: "Expected Annual Return (%)",
                type: "number",
                default: 8
            }
        ]
    },
    {
        id: "pen_deploy",
        name: "Deploy Pension On-Chain",
        category: "transaction",
        service: "pension",
        description: "Finalize pension plan on Avalanche.",
        fields: [
            {
                key: "planId",
                label: "Pension Plan ID",
                type: "text",
                default: "pol_",
                required: true
            }
        ]
    },
    // Pension Queries
    {
        id: "pen_get_plan",
        name: "Get Pension Plan",
        category: "query",
        service: "pension",
        description: "Retrieve pension plan details and current status.",
        fields: [
            {
                key: "planId",
                label: "Pension Plan ID",
                type: "text",
                default: "pol_",
                required: true
            }
        ]
    },
    {
        id: "pen_get_contributions",
        name: "Contribution History",
        category: "query",
        service: "pension",
        description: "View all recorded contributions.",
        fields: [
            {
                key: "planId",
                label: "Pension Plan ID",
                type: "text",
                default: "pol_"
            }
        ]
    },
    {
        id: "pen_get_projection",
        name: "Retirement Projection",
        category: "query",
        service: "pension",
        description: "View the latest retirement value projection for the plan.",
        fields: [
            {
                key: "planId",
                label: "Pension Plan ID",
                type: "text",
                default: "pol_"
            }
        ]
    },
    // ── Templates (auto-fill) ─────────────────────────────────
    {
        id: "tpl_motor",
        name: "Motor Insurance",
        category: "template",
        service: "insurance",
        description: "Pre-configured motor insurance policy with comprehensive cover and 14-day grace.",
        badge: "🚗 Motor",
        fields: [],
        template: {
            policyTitle: "Comprehensive Motor Cover",
            coverageType: "Motor",
            premium: 200,
            maxClaim: 4000,
            gracePeriod: 14,
            autoRenew: true
        }
    },
    {
        id: "tpl_health",
        name: "Medical Insurance",
        category: "template",
        service: "insurance",
        description: "Group medical cover for SMEs and SACCOs with inpatient/outpatient benefits.",
        badge: "🏥 Medical",
        fields: [],
        template: {
            policyTitle: "SME Group Medical Cover",
            coverageType: "Group Health",
            premium: 350,
            maxClaim: 10000,
            gracePeriod: 7,
            autoRenew: true
        }
    },
    {
        id: "tpl_life",
        name: "Life Insurance",
        category: "template",
        service: "insurance",
        description: "Whole-life policy with beneficiary distribution and funeral benefits.",
        badge: "🫀 Life",
        fields: [],
        template: {
            policyTitle: "Life Cover Plus",
            coverageType: "Life",
            premium: 150,
            maxClaim: 50000,
            gracePeriod: 30,
            autoRenew: false
        }
    },
    {
        id: "tpl_crop",
        name: "Crop & Climate Insurance",
        category: "template",
        service: "insurance",
        description: "Index-based crop insurance for smallholder farmers triggered by verified weather data.",
        badge: "🌾 Crop",
        fields: [],
        template: {
            policyTitle: "Climate Index Crop Cover",
            coverageType: "Crop & Climate Index",
            premium: 80,
            maxClaim: 2000,
            gracePeriod: 0,
            autoRenew: true
        }
    },
    {
        id: "tpl_family_trust",
        name: "Family Trust",
        category: "template",
        service: "trust",
        description: "Standard family trust with age-based milestone releases and multi-sig governance.",
        badge: "👨‍👩‍👧 Family",
        fields: [],
        template: {
            trustName: "Namuye Family Trust",
            trustType: "Family Trust",
            fundingAmount: 1000,
            autoReleaseOnMilestone: true,
            requireMultiSig: true
        }
    },
    {
        id: "tpl_education_trust",
        name: "Education Trust",
        category: "template",
        service: "trust",
        description: "Education-linked trust releasing funds on university admission proof.",
        badge: "🎓 Education",
        fields: [],
        template: {
            trustName: "KAI Education Fund",
            trustType: "Education Trust",
            fundingAmount: 500,
            autoReleaseOnMilestone: true,
            requireMultiSig: false
        }
    },
    {
        id: "tpl_estate_trust",
        name: "Estate Trust",
        category: "template",
        service: "trust",
        description: "Estate management trust with executor multi-sig and scheduled distributions.",
        badge: "🏛 Estate",
        fields: [],
        template: {
            trustName: "Estate Management Trust",
            trustType: "Estate Trust",
            fundingAmount: 5000,
            autoReleaseOnMilestone: false,
            requireMultiSig: true
        }
    },
    {
        id: "tpl_charitable_trust",
        name: "Charitable Trust",
        category: "template",
        service: "trust",
        description: "Charitable trust disbursing funds to verified beneficiary accounts monthly.",
        badge: "❤️ Charity",
        fields: [],
        template: {
            trustName: "KAI Charitable Foundation",
            trustType: "Charitable Trust",
            fundingAmount: 2000,
            autoReleaseOnMilestone: true,
            requireMultiSig: false
        }
    },
    {
        id: "tpl_personal_pension",
        name: "Personal Pension",
        category: "template",
        service: "pension",
        description: "Individual retirement plan with 30-year horizon and auto-invest.",
        badge: "👤 Personal",
        fields: [],
        template: {
            planTitle: "Personal Retirement Vault",
            planType: "Personal Pension",
            monthlyContribution: 200,
            employerMatch: 0,
            vestingCliff: 12,
            autoInvest: true
        }
    },
    {
        id: "tpl_sme_pension",
        name: "SME Pension",
        category: "template",
        service: "pension",
        description: "Corporate pension with 50% employer matching and 2-year vesting cliff.",
        badge: "🏢 SME",
        fields: [],
        template: {
            planTitle: "SME Employee Pension",
            planType: "SME Pension",
            monthlyContribution: 300,
            employerMatch: 50,
            vestingCliff: 24,
            autoInvest: true
        }
    },
    {
        id: "tpl_informal_pension",
        name: "Informal Worker Pension",
        category: "template",
        service: "pension",
        description: "Micro-savings pension for informal workers with weekly low-entry contributions.",
        badge: "👷 Informal",
        fields: [],
        template: {
            planTitle: "Jua Kali Pension Plan",
            planType: "Informal Worker Pension",
            monthlyContribution: 30,
            employerMatch: 0,
            vestingCliff: 6,
            autoInvest: false
        }
    }
];
const OPERATION_SCHEMAS = OPERATIONS.reduce(_c = (acc, op)=>{
    acc[op.id] = op.fields;
    return acc;
}, {});
_c1 = OPERATION_SCHEMAS;
var _c, _c1;
__turbopack_context__.k.register(_c, "OPERATION_SCHEMAS$OPERATIONS.reduce");
__turbopack_context__.k.register(_c1, "OPERATION_SCHEMAS");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=avax-frontend_src_1hsq963._.js.map