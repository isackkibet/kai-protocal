(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/avax-frontend/node_modules/@noble/hashes/esm/_md.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Chi",
    ()=>Chi,
    "HashMD",
    ()=>HashMD,
    "Maj",
    ()=>Maj,
    "SHA224_IV",
    ()=>SHA224_IV,
    "SHA256_IV",
    ()=>SHA256_IV,
    "SHA384_IV",
    ()=>SHA384_IV,
    "SHA512_IV",
    ()=>SHA512_IV,
    "setBigUint64",
    ()=>setBigUint64
]);
/**
 * Internal Merkle-Damgard hash utils.
 * @module
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@noble/hashes/esm/utils.js [app-client] (ecmascript)");
;
function setBigUint64(view, byteOffset, value, isLE) {
    if (typeof view.setBigUint64 === 'function') return view.setBigUint64(byteOffset, value, isLE);
    const _32n = BigInt(32);
    const _u32_max = BigInt(0xffffffff);
    const wh = Number(value >> _32n & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE ? 4 : 0;
    const l = isLE ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE);
    view.setUint32(byteOffset + l, wl, isLE);
}
function Chi(a, b, c) {
    return a & b ^ ~a & c;
}
function Maj(a, b, c) {
    return a & b ^ a & c ^ b & c;
}
class HashMD extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Hash"] {
    constructor(blockLen, outputLen, padOffset, isLE){
        super();
        this.finished = false;
        this.length = 0;
        this.pos = 0;
        this.destroyed = false;
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE;
        this.buffer = new Uint8Array(blockLen);
        this.view = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createView"])(this.buffer);
    }
    update(data) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["aexists"])(this);
        data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toBytes"])(data);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["abytes"])(data);
        const { view, buffer, blockLen } = this;
        const len = data.length;
        for(let pos = 0; pos < len;){
            const take = Math.min(blockLen - this.pos, len - pos);
            // Fast path: we have at least one block in input, cast it to view and process
            if (take === blockLen) {
                const dataView = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createView"])(data);
                for(; blockLen <= len - pos; pos += blockLen)this.process(dataView, pos);
                continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
                this.process(view, 0);
                this.pos = 0;
            }
        }
        this.length += data.length;
        this.roundClean();
        return this;
    }
    digestInto(out) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["aexists"])(this);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["aoutput"])(out, this);
        this.finished = true;
        // Padding
        // We can avoid allocation of buffer for padding completely if it
        // was previously not allocated here. But it won't change performance.
        const { buffer, view, blockLen, isLE } = this;
        let { pos } = this;
        // append the bit '1' to the message
        buffer[pos++] = 0b10000000;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clean"])(this.buffer.subarray(pos));
        // we have less than padOffset left in buffer, so we cannot put length in
        // current block, need process it and pad again
        if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            pos = 0;
        }
        // Pad until full block byte with zeros
        for(let i = pos; i < blockLen; i++)buffer[i] = 0;
        // Note: sha512 requires length to be 128bit integer, but length in JS will overflow before that
        // You need to write around 2 exabytes (u64_max / 8 / (1024**6)) for this to happen.
        // So we just write lowest 64 bits of that value.
        setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
        this.process(view, 0);
        const oview = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createView"])(out);
        const len = this.outputLen;
        // NOTE: we do division by 4 later, which should be fused in single op with modulo by JIT
        if (len % 4) throw new Error('_sha2: outputLen should be aligned to 32bit');
        const outLen = len / 4;
        const state = this.get();
        if (outLen > state.length) throw new Error('_sha2: outputLen bigger than state');
        for(let i = 0; i < outLen; i++)oview.setUint32(4 * i, state[i], isLE);
    }
    digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
    }
    _cloneInto(to) {
        to || (to = new this.constructor());
        to.set(...this.get());
        const { blockLen, buffer, length, finished, destroyed, pos } = this;
        to.destroyed = destroyed;
        to.finished = finished;
        to.length = length;
        to.pos = pos;
        if (length % blockLen) to.buffer.set(buffer);
        return to;
    }
    clone() {
        return this._cloneInto();
    }
}
const SHA256_IV = /* @__PURE__ */ Uint32Array.from([
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19
]);
const SHA224_IV = /* @__PURE__ */ Uint32Array.from([
    0xc1059ed8,
    0x367cd507,
    0x3070dd17,
    0xf70e5939,
    0xffc00b31,
    0x68581511,
    0x64f98fa7,
    0xbefa4fa4
]);
const SHA384_IV = /* @__PURE__ */ Uint32Array.from([
    0xcbbb9d5d,
    0xc1059ed8,
    0x629a292a,
    0x367cd507,
    0x9159015a,
    0x3070dd17,
    0x152fecd8,
    0xf70e5939,
    0x67332667,
    0xffc00b31,
    0x8eb44a87,
    0x68581511,
    0xdb0c2e0d,
    0x64f98fa7,
    0x47b5481d,
    0xbefa4fa4
]);
const SHA512_IV = /* @__PURE__ */ Uint32Array.from([
    0x6a09e667,
    0xf3bcc908,
    0xbb67ae85,
    0x84caa73b,
    0x3c6ef372,
    0xfe94f82b,
    0xa54ff53a,
    0x5f1d36f1,
    0x510e527f,
    0xade682d1,
    0x9b05688c,
    0x2b3e6c1f,
    0x1f83d9ab,
    0xfb41bd6b,
    0x5be0cd19,
    0x137e2179
]);
}),
"[project]/avax-frontend/node_modules/@noble/hashes/esm/sha2.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SHA224",
    ()=>SHA224,
    "SHA256",
    ()=>SHA256,
    "SHA384",
    ()=>SHA384,
    "SHA512",
    ()=>SHA512,
    "SHA512_224",
    ()=>SHA512_224,
    "SHA512_256",
    ()=>SHA512_256,
    "sha224",
    ()=>sha224,
    "sha256",
    ()=>sha256,
    "sha384",
    ()=>sha384,
    "sha512",
    ()=>sha512,
    "sha512_224",
    ()=>sha512_224,
    "sha512_256",
    ()=>sha512_256
]);
/**
 * SHA2 hash function. A.k.a. sha256, sha384, sha512, sha512_224, sha512_256.
 * SHA256 is the fastest hash implementable in JS, even faster than Blake3.
 * Check out [RFC 4634](https://datatracker.ietf.org/doc/html/rfc4634) and
 * [FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf).
 * @module
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@noble/hashes/esm/_md.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@noble/hashes/esm/_u64.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@noble/hashes/esm/utils.js [app-client] (ecmascript)");
;
;
;
/**
 * Round constants:
 * First 32 bits of fractional parts of the cube roots of the first 64 primes 2..311)
 */ // prettier-ignore
const SHA256_K = /* @__PURE__ */ Uint32Array.from([
    0x428a2f98,
    0x71374491,
    0xb5c0fbcf,
    0xe9b5dba5,
    0x3956c25b,
    0x59f111f1,
    0x923f82a4,
    0xab1c5ed5,
    0xd807aa98,
    0x12835b01,
    0x243185be,
    0x550c7dc3,
    0x72be5d74,
    0x80deb1fe,
    0x9bdc06a7,
    0xc19bf174,
    0xe49b69c1,
    0xefbe4786,
    0x0fc19dc6,
    0x240ca1cc,
    0x2de92c6f,
    0x4a7484aa,
    0x5cb0a9dc,
    0x76f988da,
    0x983e5152,
    0xa831c66d,
    0xb00327c8,
    0xbf597fc7,
    0xc6e00bf3,
    0xd5a79147,
    0x06ca6351,
    0x14292967,
    0x27b70a85,
    0x2e1b2138,
    0x4d2c6dfc,
    0x53380d13,
    0x650a7354,
    0x766a0abb,
    0x81c2c92e,
    0x92722c85,
    0xa2bfe8a1,
    0xa81a664b,
    0xc24b8b70,
    0xc76c51a3,
    0xd192e819,
    0xd6990624,
    0xf40e3585,
    0x106aa070,
    0x19a4c116,
    0x1e376c08,
    0x2748774c,
    0x34b0bcb5,
    0x391c0cb3,
    0x4ed8aa4a,
    0x5b9cca4f,
    0x682e6ff3,
    0x748f82ee,
    0x78a5636f,
    0x84c87814,
    0x8cc70208,
    0x90befffa,
    0xa4506ceb,
    0xbef9a3f7,
    0xc67178f2
]);
/** Reusable temporary buffer. "W" comes straight from spec. */ const SHA256_W = /* @__PURE__ */ new Uint32Array(64);
class SHA256 extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HashMD"] {
    constructor(outputLen = 32){
        super(64, outputLen, 8, false);
        // We cannot use array here since array allows indexing by variable
        // which means optimizer/compiler cannot use registers.
        this.A = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA256_IV"][0] | 0;
        this.B = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA256_IV"][1] | 0;
        this.C = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA256_IV"][2] | 0;
        this.D = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA256_IV"][3] | 0;
        this.E = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA256_IV"][4] | 0;
        this.F = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA256_IV"][5] | 0;
        this.G = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA256_IV"][6] | 0;
        this.H = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA256_IV"][7] | 0;
    }
    get() {
        const { A, B, C, D, E, F, G, H } = this;
        return [
            A,
            B,
            C,
            D,
            E,
            F,
            G,
            H
        ];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G | 0;
        this.H = H | 0;
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array
        for(let i = 0; i < 16; i++, offset += 4)SHA256_W[i] = view.getUint32(offset, false);
        for(let i = 16; i < 64; i++){
            const W15 = SHA256_W[i - 15];
            const W2 = SHA256_W[i - 2];
            const s0 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotr"])(W15, 7) ^ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotr"])(W15, 18) ^ W15 >>> 3;
            const s1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotr"])(W2, 17) ^ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotr"])(W2, 19) ^ W2 >>> 10;
            SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
        }
        // Compression function main loop, 64 rounds
        let { A, B, C, D, E, F, G, H } = this;
        for(let i = 0; i < 64; i++){
            const sigma1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotr"])(E, 6) ^ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotr"])(E, 11) ^ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotr"])(E, 25);
            const T1 = H + sigma1 + (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Chi"])(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
            const sigma0 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotr"])(A, 2) ^ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotr"])(A, 13) ^ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotr"])(A, 22);
            const T2 = sigma0 + (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Maj"])(A, B, C) | 0;
            H = G;
            G = F;
            F = E;
            E = D + T1 | 0;
            D = C;
            C = B;
            B = A;
            A = T1 + T2 | 0;
        }
        // Add the compressed chunk to the current hash value
        A = A + this.A | 0;
        B = B + this.B | 0;
        C = C + this.C | 0;
        D = D + this.D | 0;
        E = E + this.E | 0;
        F = F + this.F | 0;
        G = G + this.G | 0;
        H = H + this.H | 0;
        this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clean"])(SHA256_W);
    }
    destroy() {
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clean"])(this.buffer);
    }
}
class SHA224 extends SHA256 {
    constructor(){
        super(28);
        this.A = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA224_IV"][0] | 0;
        this.B = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA224_IV"][1] | 0;
        this.C = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA224_IV"][2] | 0;
        this.D = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA224_IV"][3] | 0;
        this.E = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA224_IV"][4] | 0;
        this.F = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA224_IV"][5] | 0;
        this.G = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA224_IV"][6] | 0;
        this.H = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA224_IV"][7] | 0;
    }
}
// SHA2-512 is slower than sha256 in js because u64 operations are slow.
// Round contants
// First 32 bits of the fractional parts of the cube roots of the first 80 primes 2..409
// prettier-ignore
const K512 = /* @__PURE__ */ (()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["split"]([
        '0x428a2f98d728ae22',
        '0x7137449123ef65cd',
        '0xb5c0fbcfec4d3b2f',
        '0xe9b5dba58189dbbc',
        '0x3956c25bf348b538',
        '0x59f111f1b605d019',
        '0x923f82a4af194f9b',
        '0xab1c5ed5da6d8118',
        '0xd807aa98a3030242',
        '0x12835b0145706fbe',
        '0x243185be4ee4b28c',
        '0x550c7dc3d5ffb4e2',
        '0x72be5d74f27b896f',
        '0x80deb1fe3b1696b1',
        '0x9bdc06a725c71235',
        '0xc19bf174cf692694',
        '0xe49b69c19ef14ad2',
        '0xefbe4786384f25e3',
        '0x0fc19dc68b8cd5b5',
        '0x240ca1cc77ac9c65',
        '0x2de92c6f592b0275',
        '0x4a7484aa6ea6e483',
        '0x5cb0a9dcbd41fbd4',
        '0x76f988da831153b5',
        '0x983e5152ee66dfab',
        '0xa831c66d2db43210',
        '0xb00327c898fb213f',
        '0xbf597fc7beef0ee4',
        '0xc6e00bf33da88fc2',
        '0xd5a79147930aa725',
        '0x06ca6351e003826f',
        '0x142929670a0e6e70',
        '0x27b70a8546d22ffc',
        '0x2e1b21385c26c926',
        '0x4d2c6dfc5ac42aed',
        '0x53380d139d95b3df',
        '0x650a73548baf63de',
        '0x766a0abb3c77b2a8',
        '0x81c2c92e47edaee6',
        '0x92722c851482353b',
        '0xa2bfe8a14cf10364',
        '0xa81a664bbc423001',
        '0xc24b8b70d0f89791',
        '0xc76c51a30654be30',
        '0xd192e819d6ef5218',
        '0xd69906245565a910',
        '0xf40e35855771202a',
        '0x106aa07032bbd1b8',
        '0x19a4c116b8d2d0c8',
        '0x1e376c085141ab53',
        '0x2748774cdf8eeb99',
        '0x34b0bcb5e19b48a8',
        '0x391c0cb3c5c95a63',
        '0x4ed8aa4ae3418acb',
        '0x5b9cca4f7763e373',
        '0x682e6ff3d6b2b8a3',
        '0x748f82ee5defb2fc',
        '0x78a5636f43172f60',
        '0x84c87814a1f0ab72',
        '0x8cc702081a6439ec',
        '0x90befffa23631e28',
        '0xa4506cebde82bde9',
        '0xbef9a3f7b2c67915',
        '0xc67178f2e372532b',
        '0xca273eceea26619c',
        '0xd186b8c721c0c207',
        '0xeada7dd6cde0eb1e',
        '0xf57d4f7fee6ed178',
        '0x06f067aa72176fba',
        '0x0a637dc5a2c898a6',
        '0x113f9804bef90dae',
        '0x1b710b35131c471b',
        '0x28db77f523047d84',
        '0x32caab7b40c72493',
        '0x3c9ebe0a15c9bebc',
        '0x431d67c49c100d4c',
        '0x4cc5d4becb3e42b6',
        '0x597f299cfc657e2a',
        '0x5fcb6fab3ad6faec',
        '0x6c44198c4a475817'
    ].map((n)=>BigInt(n))))();
const SHA512_Kh = /* @__PURE__ */ (()=>K512[0])();
const SHA512_Kl = /* @__PURE__ */ (()=>K512[1])();
// Reusable temporary buffers
const SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
const SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
class SHA512 extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HashMD"] {
    constructor(outputLen = 64){
        super(128, outputLen, 16, false);
        // We cannot use array here since array allows indexing by variable
        // which means optimizer/compiler cannot use registers.
        // h -- high 32 bits, l -- low 32 bits
        this.Ah = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][0] | 0;
        this.Al = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][1] | 0;
        this.Bh = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][2] | 0;
        this.Bl = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][3] | 0;
        this.Ch = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][4] | 0;
        this.Cl = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][5] | 0;
        this.Dh = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][6] | 0;
        this.Dl = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][7] | 0;
        this.Eh = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][8] | 0;
        this.El = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][9] | 0;
        this.Fh = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][10] | 0;
        this.Fl = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][11] | 0;
        this.Gh = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][12] | 0;
        this.Gl = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][13] | 0;
        this.Hh = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][14] | 0;
        this.Hl = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA512_IV"][15] | 0;
    }
    // prettier-ignore
    get() {
        const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        return [
            Ah,
            Al,
            Bh,
            Bl,
            Ch,
            Cl,
            Dh,
            Dl,
            Eh,
            El,
            Fh,
            Fl,
            Gh,
            Gl,
            Hh,
            Hl
        ];
    }
    // prettier-ignore
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
        this.Ah = Ah | 0;
        this.Al = Al | 0;
        this.Bh = Bh | 0;
        this.Bl = Bl | 0;
        this.Ch = Ch | 0;
        this.Cl = Cl | 0;
        this.Dh = Dh | 0;
        this.Dl = Dl | 0;
        this.Eh = Eh | 0;
        this.El = El | 0;
        this.Fh = Fh | 0;
        this.Fl = Fl | 0;
        this.Gh = Gh | 0;
        this.Gl = Gl | 0;
        this.Hh = Hh | 0;
        this.Hl = Hl | 0;
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 64 words w[16..79] of the message schedule array
        for(let i = 0; i < 16; i++, offset += 4){
            SHA512_W_H[i] = view.getUint32(offset);
            SHA512_W_L[i] = view.getUint32(offset += 4);
        }
        for(let i = 16; i < 80; i++){
            // s0 := (w[i-15] rightrotate 1) xor (w[i-15] rightrotate 8) xor (w[i-15] rightshift 7)
            const W15h = SHA512_W_H[i - 15] | 0;
            const W15l = SHA512_W_L[i - 15] | 0;
            const s0h = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrSH"](W15h, W15l, 1) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrSH"](W15h, W15l, 8) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shrSH"](W15h, W15l, 7);
            const s0l = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrSL"](W15h, W15l, 1) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrSL"](W15h, W15l, 8) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shrSL"](W15h, W15l, 7);
            // s1 := (w[i-2] rightrotate 19) xor (w[i-2] rightrotate 61) xor (w[i-2] rightshift 6)
            const W2h = SHA512_W_H[i - 2] | 0;
            const W2l = SHA512_W_L[i - 2] | 0;
            const s1h = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrSH"](W2h, W2l, 19) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrBH"](W2h, W2l, 61) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shrSH"](W2h, W2l, 6);
            const s1l = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrSL"](W2h, W2l, 19) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrBL"](W2h, W2l, 61) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shrSL"](W2h, W2l, 6);
            // SHA256_W[i] = s0 + s1 + SHA256_W[i - 7] + SHA256_W[i - 16];
            const SUMl = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add4L"](s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
            const SUMh = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add4H"](SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
            SHA512_W_H[i] = SUMh | 0;
            SHA512_W_L[i] = SUMl | 0;
        }
        let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        // Compression function main loop, 80 rounds
        for(let i = 0; i < 80; i++){
            // S1 := (e rightrotate 14) xor (e rightrotate 18) xor (e rightrotate 41)
            const sigma1h = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrSH"](Eh, El, 14) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrSH"](Eh, El, 18) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrBH"](Eh, El, 41);
            const sigma1l = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrSL"](Eh, El, 14) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrSL"](Eh, El, 18) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrBL"](Eh, El, 41);
            //const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const CHIh = Eh & Fh ^ ~Eh & Gh;
            const CHIl = El & Fl ^ ~El & Gl;
            // T1 = H + sigma1 + Chi(E, F, G) + SHA512_K[i] + SHA512_W[i]
            // prettier-ignore
            const T1ll = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add5L"](Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
            const T1h = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add5H"](T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
            const T1l = T1ll | 0;
            // S0 := (a rightrotate 28) xor (a rightrotate 34) xor (a rightrotate 39)
            const sigma0h = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrSH"](Ah, Al, 28) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrBH"](Ah, Al, 34) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrBH"](Ah, Al, 39);
            const sigma0l = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrSL"](Ah, Al, 28) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrBL"](Ah, Al, 34) ^ __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rotrBL"](Ah, Al, 39);
            const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
            const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
            Hh = Gh | 0;
            Hl = Gl | 0;
            Gh = Fh | 0;
            Gl = Fl | 0;
            Fh = Eh | 0;
            Fl = El | 0;
            ({ h: Eh, l: El } = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add"](Dh | 0, Dl | 0, T1h | 0, T1l | 0));
            Dh = Ch | 0;
            Dl = Cl | 0;
            Ch = Bh | 0;
            Cl = Bl | 0;
            Bh = Ah | 0;
            Bl = Al | 0;
            const All = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add3L"](T1l, sigma0l, MAJl);
            Ah = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add3H"](All, T1h, sigma0h, MAJh);
            Al = All | 0;
        }
        // Add the compressed chunk to the current hash value
        ({ h: Ah, l: Al } = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add"](this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
        ({ h: Bh, l: Bl } = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add"](this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
        ({ h: Ch, l: Cl } = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add"](this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
        ({ h: Dh, l: Dl } = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add"](this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
        ({ h: Eh, l: El } = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add"](this.Eh | 0, this.El | 0, Eh | 0, El | 0));
        ({ h: Fh, l: Fl } = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add"](this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
        ({ h: Gh, l: Gl } = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add"](this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
        ({ h: Hh, l: Hl } = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_u64$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["add"](this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
        this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clean"])(SHA512_W_H, SHA512_W_L);
    }
    destroy() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clean"])(this.buffer);
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
}
class SHA384 extends SHA512 {
    constructor(){
        super(48);
        this.Ah = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][0] | 0;
        this.Al = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][1] | 0;
        this.Bh = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][2] | 0;
        this.Bl = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][3] | 0;
        this.Ch = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][4] | 0;
        this.Cl = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][5] | 0;
        this.Dh = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][6] | 0;
        this.Dl = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][7] | 0;
        this.Eh = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][8] | 0;
        this.El = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][9] | 0;
        this.Fh = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][10] | 0;
        this.Fl = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][11] | 0;
        this.Gh = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][12] | 0;
        this.Gl = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][13] | 0;
        this.Hh = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][14] | 0;
        this.Hl = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$_md$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA384_IV"][15] | 0;
    }
}
/**
 * Truncated SHA512/256 and SHA512/224.
 * SHA512_IV is XORed with 0xa5a5a5a5a5a5a5a5, then used as "intermediary" IV of SHA512/t.
 * Then t hashes string to produce result IV.
 * See `test/misc/sha2-gen-iv.js`.
 */ /** SHA512/224 IV */ const T224_IV = /* @__PURE__ */ Uint32Array.from([
    0x8c3d37c8,
    0x19544da2,
    0x73e19966,
    0x89dcd4d6,
    0x1dfab7ae,
    0x32ff9c82,
    0x679dd514,
    0x582f9fcf,
    0x0f6d2b69,
    0x7bd44da8,
    0x77e36f73,
    0x04c48942,
    0x3f9d85a8,
    0x6a1d36c8,
    0x1112e6ad,
    0x91d692a1
]);
/** SHA512/256 IV */ const T256_IV = /* @__PURE__ */ Uint32Array.from([
    0x22312194,
    0xfc2bf72c,
    0x9f555fa3,
    0xc84c64c2,
    0x2393b86b,
    0x6f53b151,
    0x96387719,
    0x5940eabd,
    0x96283ee2,
    0xa88effe3,
    0xbe5e1e25,
    0x53863992,
    0x2b0199fc,
    0x2c85b8aa,
    0x0eb72ddc,
    0x81c52ca2
]);
class SHA512_224 extends SHA512 {
    constructor(){
        super(28);
        this.Ah = T224_IV[0] | 0;
        this.Al = T224_IV[1] | 0;
        this.Bh = T224_IV[2] | 0;
        this.Bl = T224_IV[3] | 0;
        this.Ch = T224_IV[4] | 0;
        this.Cl = T224_IV[5] | 0;
        this.Dh = T224_IV[6] | 0;
        this.Dl = T224_IV[7] | 0;
        this.Eh = T224_IV[8] | 0;
        this.El = T224_IV[9] | 0;
        this.Fh = T224_IV[10] | 0;
        this.Fl = T224_IV[11] | 0;
        this.Gh = T224_IV[12] | 0;
        this.Gl = T224_IV[13] | 0;
        this.Hh = T224_IV[14] | 0;
        this.Hl = T224_IV[15] | 0;
    }
}
class SHA512_256 extends SHA512 {
    constructor(){
        super(32);
        this.Ah = T256_IV[0] | 0;
        this.Al = T256_IV[1] | 0;
        this.Bh = T256_IV[2] | 0;
        this.Bl = T256_IV[3] | 0;
        this.Ch = T256_IV[4] | 0;
        this.Cl = T256_IV[5] | 0;
        this.Dh = T256_IV[6] | 0;
        this.Dl = T256_IV[7] | 0;
        this.Eh = T256_IV[8] | 0;
        this.El = T256_IV[9] | 0;
        this.Fh = T256_IV[10] | 0;
        this.Fl = T256_IV[11] | 0;
        this.Gh = T256_IV[12] | 0;
        this.Gl = T256_IV[13] | 0;
        this.Hh = T256_IV[14] | 0;
        this.Hl = T256_IV[15] | 0;
    }
}
const sha256 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createHasher"])(()=>new SHA256());
const sha224 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createHasher"])(()=>new SHA224());
const sha512 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createHasher"])(()=>new SHA512());
const sha384 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createHasher"])(()=>new SHA384());
const sha512_256 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createHasher"])(()=>new SHA512_256());
const sha512_224 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createHasher"])(()=>new SHA512_224());
}),
"[project]/avax-frontend/node_modules/@noble/hashes/esm/sha256.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SHA224",
    ()=>SHA224,
    "SHA256",
    ()=>SHA256,
    "sha224",
    ()=>sha224,
    "sha256",
    ()=>sha256
]);
/**
 * SHA2-256 a.k.a. sha256. In JS, it is the fastest hash, even faster than Blake3.
 *
 * To break sha256 using birthday attack, attackers need to try 2^128 hashes.
 * BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
 *
 * Check out [FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf).
 * @module
 * @deprecated
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$sha2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@noble/hashes/esm/sha2.js [app-client] (ecmascript)");
;
const SHA256 = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$sha2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA256"];
const sha256 = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$sha2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sha256"];
const SHA224 = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$sha2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SHA224"];
const sha224 = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$sha2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sha224"];
}),
"[project]/avax-frontend/node_modules/@tanstack/query-core/build/modern/mutationObserver.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MutationObserver",
    ()=>MutationObserver
]);
// src/mutationObserver.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$mutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@tanstack/query-core/build/modern/mutation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@tanstack/query-core/build/modern/notifyManager.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$subscribable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@tanstack/query-core/build/modern/subscribable.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@tanstack/query-core/build/modern/utils.js [app-client] (ecmascript)");
;
;
;
;
var MutationObserver = class extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$subscribable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Subscribable"] {
    #client;
    #currentResult = void 0;
    #currentMutation;
    #mutateOptions;
    constructor(client, options){
        super();
        this.#client = client;
        this.setOptions(options);
        this.bindMethods();
        this.#updateResult();
    }
    bindMethods() {
        this.mutate = this.mutate.bind(this);
        this.reset = this.reset.bind(this);
    }
    setOptions(options) {
        const prevOptions = this.options;
        this.options = this.#client.defaultMutationOptions(options);
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shallowEqualObjects"])(this.options, prevOptions)) {
            this.#client.getMutationCache().notify({
                type: "observerOptionsUpdated",
                mutation: this.#currentMutation,
                observer: this
            });
        }
        if (prevOptions?.mutationKey && this.options.mutationKey && (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hashKey"])(prevOptions.mutationKey) !== (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hashKey"])(this.options.mutationKey)) {
            this.reset();
        } else if (this.#currentMutation?.state.status === "pending") {
            this.#currentMutation.setOptions(this.options);
        }
    }
    onUnsubscribe() {
        if (!this.hasListeners()) {
            this.#currentMutation?.removeObserver(this);
        }
    }
    onMutationUpdate(action) {
        this.#updateResult();
        this.#notify(action);
    }
    getCurrentResult() {
        return this.#currentResult;
    }
    reset() {
        this.#currentMutation?.removeObserver(this);
        this.#currentMutation = void 0;
        this.#updateResult();
        this.#notify();
    }
    mutate(variables, options) {
        this.#mutateOptions = options;
        this.#currentMutation?.removeObserver(this);
        this.#currentMutation = this.#client.getMutationCache().build(this.#client, this.options);
        this.#currentMutation.addObserver(this);
        return this.#currentMutation.execute(variables);
    }
    #updateResult() {
        const state = this.#currentMutation?.state ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$mutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultState"])();
        this.#currentResult = {
            ...state,
            isPending: state.status === "pending",
            isSuccess: state.status === "success",
            isError: state.status === "error",
            isIdle: state.status === "idle",
            mutate: this.mutate,
            reset: this.reset
        };
    }
    #notify(action) {
        __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notifyManager"].batch(()=>{
            if (this.#mutateOptions && this.hasListeners()) {
                const variables = this.#currentResult.variables;
                const onMutateResult = this.#currentResult.context;
                const context = {
                    client: this.#client,
                    meta: this.options.meta,
                    mutationKey: this.options.mutationKey
                };
                if (action?.type === "success") {
                    try {
                        this.#mutateOptions.onSuccess?.(action.data, variables, onMutateResult, context);
                    } catch (e) {
                        void Promise.reject(e);
                    }
                    try {
                        this.#mutateOptions.onSettled?.(action.data, null, variables, onMutateResult, context);
                    } catch (e) {
                        void Promise.reject(e);
                    }
                } else if (action?.type === "error") {
                    try {
                        this.#mutateOptions.onError?.(action.error, variables, onMutateResult, context);
                    } catch (e) {
                        void Promise.reject(e);
                    }
                    try {
                        this.#mutateOptions.onSettled?.(void 0, action.error, variables, onMutateResult, context);
                    } catch (e) {
                        void Promise.reject(e);
                    }
                }
            }
            this.listeners.forEach((listener)=>{
                listener(this.#currentResult);
            });
        });
    }
};
;
}),
"[project]/avax-frontend/node_modules/@tanstack/react-query/build/modern/useMutation.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useMutation",
    ()=>useMutation
]);
// src/useMutation.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$mutationObserver$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@tanstack/query-core/build/modern/mutationObserver.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@tanstack/query-core/build/modern/utils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@tanstack/query-core/build/modern/notifyManager.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-client] (ecmascript)");
"use client";
;
;
;
function useMutation(options, queryClient) {
    const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"])(queryClient);
    const [observer] = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]({
        "useMutation.useState": ()=>new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$mutationObserver$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MutationObserver"](client, options)
    }["useMutation.useState"]);
    __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "useMutation.useEffect": ()=>{
            observer.setOptions(options);
        }
    }["useMutation.useEffect"], [
        observer,
        options
    ]);
    const result = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"](__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"]({
        "useMutation.useSyncExternalStore[result]": (onStoreChange)=>observer.subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notifyManager"].batchCalls(onStoreChange))
    }["useMutation.useSyncExternalStore[result]"], [
        observer
    ]), {
        "useMutation.useSyncExternalStore[result]": ()=>observer.getCurrentResult()
    }["useMutation.useSyncExternalStore[result]"], {
        "useMutation.useSyncExternalStore[result]": ()=>observer.getCurrentResult()
    }["useMutation.useSyncExternalStore[result]"]);
    const mutate = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"]({
        "useMutation.useCallback[mutate]": (variables, mutateOptions)=>{
            observer.mutate(variables, mutateOptions).catch(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["noop"]);
        }
    }["useMutation.useCallback[mutate]"], [
        observer
    ]);
    if (result.error && (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shouldThrowError"])(observer.options.throwOnError, [
        result.error
    ])) {
        throw result.error;
    }
    return {
        ...result,
        mutate,
        mutateAsync: result.mutate
    };
}
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/Icon.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Icon
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$defaultAttributes$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/defaultAttributes.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2f$hasA11yProp$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2f$mergeClasses$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$context$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/context.mjs [app-client] (ecmascript)");
"use strict";
"use client";
;
;
;
;
;
const Icon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(({ color, size, strokeWidth, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref)=>{
    const { size: contextSize = 24, strokeWidth: contextStrokeWidth = 2, absoluteStrokeWidth: contextAbsoluteStrokeWidth = false, color: contextColor = "currentColor", className: contextClass = "" } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$context$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLucideContext"])() ?? {};
    const calculatedStrokeWidth = absoluteStrokeWidth ?? contextAbsoluteStrokeWidth ? Number(strokeWidth ?? contextStrokeWidth) * 24 / Number(size ?? contextSize) : strokeWidth ?? contextStrokeWidth;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])("svg", {
        ref,
        ...__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$defaultAttributes$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"],
        width: size ?? contextSize ?? __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$defaultAttributes$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].width,
        height: size ?? contextSize ?? __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$defaultAttributes$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].height,
        stroke: color ?? contextColor,
        strokeWidth: calculatedStrokeWidth,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2f$mergeClasses$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mergeClasses"])("lucide", contextClass, className),
        ...!children && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2f$hasA11yProp$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hasA11yProp"])(rest) && {
            "aria-hidden": "true"
        },
        ...rest
    }, [
        ...iconNode.map(([tag, attrs])=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(tag, attrs)),
        ...Array.isArray(children) ? children : [
            children
        ]
    ]);
});
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/context.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LucideProvider",
    ()=>LucideProvider,
    "useLucideContext",
    ()=>useLucideContext
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
"use strict";
"use client";
;
const LucideContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])({});
function LucideProvider({ children, size, color, strokeWidth, absoluteStrokeWidth, className }) {
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LucideProvider.useMemo[value]": ()=>({
                size,
                color,
                strokeWidth,
                absoluteStrokeWidth,
                className
            })
    }["LucideProvider.useMemo[value]"], [
        size,
        color,
        strokeWidth,
        absoluteStrokeWidth,
        className
    ]);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(LucideContext.Provider, {
        value
    }, children);
}
const useLucideContext = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(LucideContext);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>createLucideIcon
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2f$mergeClasses$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2f$toKebabCase$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2f$toPascalCase$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/shared/src/utils/toPascalCase.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$Icon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/Icon.mjs [app-client] (ecmascript)");
;
;
;
;
;
const createLucideIcon = (iconName, iconNode)=>{
    const Component = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$Icon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            ref,
            iconNode,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2f$mergeClasses$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mergeClasses"])(`lucide-${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2f$toKebabCase$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toKebabCase"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2f$toPascalCase$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toPascalCase"])(iconName))}`, `lucide-${iconName}`, className),
            ...props
        }));
    Component.displayName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2f$toPascalCase$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toPascalCase"])(iconName);
    return Component;
};
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/defaultAttributes.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>defaultAttributes
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var defaultAttributes = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
};
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/book-open.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>BookOpen
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M12 5v16",
            key: "1f6ucr"
        }
    ],
    [
        "path",
        {
            d: "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z",
            key: "1fyvmf"
        }
    ]
];
const BookOpen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("book-open", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/book-open.mjs [app-client] (ecmascript) <export default as BookOpen>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BookOpen",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2d$open$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2d$open$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/book-open.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/briefcase.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Briefcase
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
            key: "jecpp"
        }
    ],
    [
        "rect",
        {
            width: "20",
            height: "14",
            x: "2",
            y: "6",
            rx: "2",
            key: "i6l2r4"
        }
    ]
];
const Briefcase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("briefcase", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/briefcase.mjs [app-client] (ecmascript) <export default as Briefcase>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Briefcase",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/briefcase.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>ChevronRight
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "m9 18 6-6-6-6",
            key: "mthhwq"
        }
    ]
];
const ChevronRight = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("chevron-right", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs [app-client] (ecmascript) <export default as ChevronRight>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChevronRight",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/circle-check-big.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>CircleCheckBig
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M21.801 10A10 10 0 1 1 17 3.335",
            key: "yps3ct"
        }
    ],
    [
        "path",
        {
            d: "m9 11 3 3L22 4",
            key: "1pflzl"
        }
    ]
];
const CircleCheckBig = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("circle-check-big", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/circle-check-big.mjs [app-client] (ecmascript) <export default as CheckCircle>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CheckCircle",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/circle-check-big.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/circle-x.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>CircleX
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "10",
            key: "1mglay"
        }
    ],
    [
        "path",
        {
            d: "m15 9-6 6",
            key: "1uzhvr"
        }
    ],
    [
        "path",
        {
            d: "m9 9 6 6",
            key: "z0biqf"
        }
    ]
];
const CircleX = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("circle-x", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/circle-x.mjs [app-client] (ecmascript) <export default as XCircle>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "XCircle",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/circle-x.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/code.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Code
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "m16 18 6-6-6-6",
            key: "eg8j8"
        }
    ],
    [
        "path",
        {
            d: "m8 6-6 6 6 6",
            key: "ppft3o"
        }
    ]
];
const Code = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("code", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/code.mjs [app-client] (ecmascript) <export default as Code>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Code",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$code$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$code$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/code.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/database.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Database
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "ellipse",
        {
            cx: "12",
            cy: "5",
            rx: "9",
            ry: "3",
            key: "msslwz"
        }
    ],
    [
        "path",
        {
            d: "M3 5V19A9 3 0 0 0 21 19V5",
            key: "1wlel7"
        }
    ],
    [
        "path",
        {
            d: "M3 12A9 3 0 0 0 21 12",
            key: "mv7ke4"
        }
    ]
];
const Database = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("database", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/database.mjs [app-client] (ecmascript) <export default as Database>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Database",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/database.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/external-link.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>ExternalLink
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M15 3h6v6",
            key: "1q9fwt"
        }
    ],
    [
        "path",
        {
            d: "M10 14 21 3",
            key: "gplh6r"
        }
    ],
    [
        "path",
        {
            d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
            key: "a6xqqp"
        }
    ]
];
const ExternalLink = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("external-link", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/external-link.mjs [app-client] (ecmascript) <export default as ExternalLink>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ExternalLink",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/external-link.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/file-text.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>FileText
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
            key: "1oefj6"
        }
    ],
    [
        "path",
        {
            d: "M14 2v5a1 1 0 0 0 1 1h5",
            key: "wfsgrz"
        }
    ],
    [
        "path",
        {
            d: "M10 9H8",
            key: "b1mrlr"
        }
    ],
    [
        "path",
        {
            d: "M16 13H8",
            key: "t4e002"
        }
    ],
    [
        "path",
        {
            d: "M16 17H8",
            key: "z1uh3a"
        }
    ]
];
const FileText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("file-text", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/file-text.mjs [app-client] (ecmascript) <export default as FileText>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FileText",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/file-text.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Loader
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M12 2v4",
            key: "3427ic"
        }
    ],
    [
        "path",
        {
            d: "m16.2 7.8 2.9-2.9",
            key: "r700ao"
        }
    ],
    [
        "path",
        {
            d: "M18 12h4",
            key: "wj9ykh"
        }
    ],
    [
        "path",
        {
            d: "m16.2 16.2 2.9 2.9",
            key: "1bxg5t"
        }
    ],
    [
        "path",
        {
            d: "M12 18v4",
            key: "jadmvz"
        }
    ],
    [
        "path",
        {
            d: "m4.9 19.1 2.9-2.9",
            key: "bwix9q"
        }
    ],
    [
        "path",
        {
            d: "M2 12h4",
            key: "j09sii"
        }
    ],
    [
        "path",
        {
            d: "m4.9 4.9 2.9 2.9",
            key: "giyufr"
        }
    ]
];
const Loader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("loader", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-client] (ecmascript) <export default as Loader>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Loader",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/loader.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/lock.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Lock
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "rect",
        {
            width: "18",
            height: "11",
            x: "3",
            y: "11",
            rx: "2",
            ry: "2",
            key: "1w4ew1"
        }
    ],
    [
        "path",
        {
            d: "M7 11V7a5 5 0 0 1 10 0v4",
            key: "fwvmzm"
        }
    ]
];
const Lock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("lock", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/lock.mjs [app-client] (ecmascript) <export default as Lock>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Lock",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/lock.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/play.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Play
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
            key: "10ikf1"
        }
    ]
];
const Play = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("play", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/play.mjs [app-client] (ecmascript) <export default as Play>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Play",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/play.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Plus
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M5 12h14",
            key: "1ays0h"
        }
    ],
    [
        "path",
        {
            d: "M12 5v14",
            key: "s699le"
        }
    ]
];
const Plus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("plus", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-client] (ecmascript) <export default as Plus>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Plus",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/rotate-ccw-clock.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>RotateCcwClock
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
            key: "1357e3"
        }
    ],
    [
        "path",
        {
            d: "M3 3v5h5",
            key: "1xhq8a"
        }
    ],
    [
        "path",
        {
            d: "M12 7v5l4 2",
            key: "1fdv2h"
        }
    ]
];
const RotateCcwClock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("rotate-ccw-clock", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/rotate-ccw-clock.mjs [app-client] (ecmascript) <export default as History>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "History",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2d$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2d$clock$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/rotate-ccw-clock.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/search.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Search
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "m21 21-4.34-4.34",
            key: "14j7rj"
        }
    ],
    [
        "circle",
        {
            cx: "11",
            cy: "11",
            r: "8",
            key: "4ej97u"
        }
    ]
];
const Search = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("search", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/search.mjs [app-client] (ecmascript) <export default as Search>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Search",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/search.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/settings.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Settings
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
            key: "1i5ecw"
        }
    ],
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "3",
            key: "1v7zrd"
        }
    ]
];
const Settings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("settings", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/settings.mjs [app-client] (ecmascript) <export default as Settings>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Settings",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/settings.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/shield.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Shield
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
            key: "oel41y"
        }
    ]
];
const Shield = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("shield", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/shield.mjs [app-client] (ecmascript) <export default as Shield>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Shield",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/shield.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/sparkles.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Sparkles
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
            key: "1s2grr"
        }
    ],
    [
        "path",
        {
            d: "M20 2v4",
            key: "1rf3ol"
        }
    ],
    [
        "path",
        {
            d: "M22 4h-4",
            key: "gwowj6"
        }
    ],
    [
        "circle",
        {
            cx: "4",
            cy: "20",
            r: "2",
            key: "6kqj1y"
        }
    ]
];
const Sparkles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("sparkles", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/sparkles.mjs [app-client] (ecmascript) <export default as Sparkles>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sparkles",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/sparkles.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/square-terminal.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>SquareTerminal
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "m7 11 2-2-2-2",
            key: "1lz0vl"
        }
    ],
    [
        "path",
        {
            d: "M11 13h4",
            key: "1p7l4v"
        }
    ],
    [
        "rect",
        {
            width: "18",
            height: "18",
            x: "3",
            y: "3",
            rx: "2",
            ry: "2",
            key: "1m3agn"
        }
    ]
];
const SquareTerminal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("square-terminal", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/square-terminal.mjs [app-client] (ecmascript) <export default as TerminalSquare>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TerminalSquare",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$terminal$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$terminal$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/square-terminal.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/users.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Users
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
            key: "1yyitq"
        }
    ],
    [
        "path",
        {
            d: "M16 3.128a4 4 0 0 1 0 7.744",
            key: "16gr8j"
        }
    ],
    [
        "path",
        {
            d: "M22 21v-2a4 4 0 0 0-3-3.87",
            key: "kshegd"
        }
    ],
    [
        "circle",
        {
            cx: "9",
            cy: "7",
            r: "4",
            key: "nufk8"
        }
    ]
];
const Users = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("users", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/users.mjs [app-client] (ecmascript) <export default as Users>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Users",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/users.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>X
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M18 6 6 18",
            key: "1bl5f8"
        }
    ],
    [
        "path",
        {
            d: "m6 6 12 12",
            key: "d8bk6v"
        }
    ]
];
const X = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("x", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "X",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/zap.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Zap
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/createLucideIcon.mjs [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z",
            key: "1v7up4"
        }
    ]
];
const Zap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("zap", __iconNode);
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/zap.mjs [app-client] (ecmascript) <export default as Zap>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Zap",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/icons/zap.mjs [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hasA11yProp",
    ()=>hasA11yProp
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const hasA11yProp = (props)=>{
    for(const prop in props){
        if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
            return true;
        }
    }
    return false;
};
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mergeClasses",
    ()=>mergeClasses
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const mergeClasses = (...classes)=>classes.filter((className, index, array)=>{
        return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
    }).join(" ").trim();
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toCamelCase",
    ()=>toCamelCase
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const toCamelCase = (string)=>string.replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2)=>p2 ? p2.toUpperCase() : p1.toLowerCase());
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toKebabCase",
    ()=>toKebabCase
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const toKebabCase = (string)=>string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
;
}),
"[project]/avax-frontend/node_modules/lucide-react/dist/esm/shared/src/utils/toPascalCase.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toPascalCase",
    ()=>toPascalCase
]);
/**
 * @license lucide-react v1.33.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2f$toCamelCase$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs [app-client] (ecmascript)");
;
const toPascalCase = (string)=>{
    const camelCase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2f$toCamelCase$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toCamelCase"])(string);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
;
}),
"[project]/avax-frontend/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/avax-frontend/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * use-sync-external-store-shim.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function is(x, y) {
        return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
    }
    function useSyncExternalStore$2(subscribe, getSnapshot) {
        didWarnOld18Alpha || void 0 === React.startTransition || (didWarnOld18Alpha = !0, console.error("You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release."));
        var value = getSnapshot();
        if (!didWarnUncachedGetSnapshot) {
            var cachedValue = getSnapshot();
            objectIs(value, cachedValue) || (console.error("The result of getSnapshot should be cached to avoid an infinite loop"), didWarnUncachedGetSnapshot = !0);
        }
        cachedValue = useState({
            inst: {
                value: value,
                getSnapshot: getSnapshot
            }
        });
        var inst = cachedValue[0].inst, forceUpdate = cachedValue[1];
        useLayoutEffect({
            "useSyncExternalStore$2.useLayoutEffect": function() {
                inst.value = value;
                inst.getSnapshot = getSnapshot;
                checkIfSnapshotChanged(inst) && forceUpdate({
                    inst: inst
                });
            }
        }["useSyncExternalStore$2.useLayoutEffect"], [
            subscribe,
            value,
            getSnapshot
        ]);
        useEffect({
            "useSyncExternalStore$2.useEffect": function() {
                checkIfSnapshotChanged(inst) && forceUpdate({
                    inst: inst
                });
                return subscribe({
                    "useSyncExternalStore$2.useEffect": function() {
                        checkIfSnapshotChanged(inst) && forceUpdate({
                            inst: inst
                        });
                    }
                }["useSyncExternalStore$2.useEffect"]);
            }
        }["useSyncExternalStore$2.useEffect"], [
            subscribe
        ]);
        useDebugValue(value);
        return value;
    }
    function checkIfSnapshotChanged(inst) {
        var latestGetSnapshot = inst.getSnapshot;
        inst = inst.value;
        try {
            var nextValue = latestGetSnapshot();
            return !objectIs(inst, nextValue);
        } catch (error) {
            return !0;
        }
    }
    function useSyncExternalStore$1(subscribe, getSnapshot) {
        return getSnapshot();
    }
    "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
    var React = __turbopack_context__.r("[project]/avax-frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), objectIs = "function" === typeof Object.is ? Object.is : is, useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useDebugValue = React.useDebugValue, didWarnOld18Alpha = !1, didWarnUncachedGetSnapshot = !1, shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
    exports.useSyncExternalStore = void 0 !== React.useSyncExternalStore ? React.useSyncExternalStore : shim;
    "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
}();
}),
"[project]/avax-frontend/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/avax-frontend/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * use-sync-external-store-shim/with-selector.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function is(x, y) {
        return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
    }
    "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
    var React = __turbopack_context__.r("[project]/avax-frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), shim = __turbopack_context__.r("[project]/avax-frontend/node_modules/use-sync-external-store/shim/index.js [app-client] (ecmascript)"), objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef = React.useRef, useEffect = React.useEffect, useMemo = React.useMemo, useDebugValue = React.useDebugValue;
    exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
        var instRef = useRef(null);
        if (null === instRef.current) {
            var inst = {
                hasValue: !1,
                value: null
            };
            instRef.current = inst;
        } else inst = instRef.current;
        instRef = useMemo(function() {
            function memoizedSelector(nextSnapshot) {
                if (!hasMemo) {
                    hasMemo = !0;
                    memoizedSnapshot = nextSnapshot;
                    nextSnapshot = selector(nextSnapshot);
                    if (void 0 !== isEqual && inst.hasValue) {
                        var currentSelection = inst.value;
                        if (isEqual(currentSelection, nextSnapshot)) return memoizedSelection = currentSelection;
                    }
                    return memoizedSelection = nextSnapshot;
                }
                currentSelection = memoizedSelection;
                if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
                var nextSelection = selector(nextSnapshot);
                if (void 0 !== isEqual && isEqual(currentSelection, nextSelection)) return memoizedSnapshot = nextSnapshot, currentSelection;
                memoizedSnapshot = nextSnapshot;
                return memoizedSelection = nextSelection;
            }
            var hasMemo = !1, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
            return [
                function() {
                    return memoizedSelector(getSnapshot());
                },
                null === maybeGetServerSnapshot ? void 0 : function() {
                    return memoizedSelector(maybeGetServerSnapshot());
                }
            ];
        }, [
            getSnapshot,
            getServerSnapshot,
            selector,
            isEqual
        ]);
        var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
        useEffect(function() {
            inst.hasValue = !0;
            inst.value = value;
        }, [
            value
        ]);
        useDebugValue(value);
        return value;
    };
    "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
}();
}),
"[project]/avax-frontend/node_modules/use-sync-external-store/shim/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/avax-frontend/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/avax-frontend/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js [app-client] (ecmascript)");
}
}),
"[project]/avax-frontend/node_modules/use-sync-external-store/shim/with-selector.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/avax-frontend/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/avax-frontend/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js [app-client] (ecmascript)");
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/accounts/utils/publicKeyToAddress.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "publicKeyToAddress",
    ()=>publicKeyToAddress
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$address$2f$getAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/address/getAddress.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$hash$2f$keccak256$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/hash/keccak256.js [app-client] (ecmascript)");
;
;
function publicKeyToAddress(publicKey) {
    const address = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$hash$2f$keccak256$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keccak256"])(`0x${publicKey.substring(4)}`).substring(26);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$address$2f$getAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["checksumAddress"])(`0x${address}`);
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/actions/public/estimateFeesPerGas.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "estimateFeesPerGas",
    ()=>estimateFeesPerGas,
    "internal_estimateFeesPerGas",
    ()=>internal_estimateFeesPerGas
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$fee$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/fee.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/getAction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$estimateMaxPriorityFeePerGas$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/estimateMaxPriorityFeePerGas.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getBlock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/getBlock.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getGasPrice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/getGasPrice.js [app-client] (ecmascript)");
;
;
;
;
;
async function estimateFeesPerGas(client, args) {
    return internal_estimateFeesPerGas(client, args);
}
async function internal_estimateFeesPerGas(client, args) {
    const { block: block_, chain = client.chain, request, type = 'eip1559' } = args || {};
    const baseFeeMultiplier = await (async ()=>{
        if (typeof chain?.fees?.baseFeeMultiplier === 'function') return chain.fees.baseFeeMultiplier({
            block: block_,
            client,
            request
        });
        return chain?.fees?.baseFeeMultiplier ?? 1.2;
    })();
    if (baseFeeMultiplier < 1) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$fee$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseFeeScalarError"]();
    const decimals = baseFeeMultiplier.toString().split('.')[1]?.length ?? 0;
    const denominator = 10 ** decimals;
    const multiply = (base)=>base * BigInt(Math.round(baseFeeMultiplier * denominator)) / BigInt(denominator);
    const block = block_ ? block_ : await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getBlock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBlock"], 'getBlock')({});
    if (typeof chain?.fees?.estimateFeesPerGas === 'function') {
        const fees = await chain.fees.estimateFeesPerGas({
            block: block_,
            client,
            multiply,
            request,
            type
        });
        if (fees !== null) return fees;
    }
    if (type === 'eip1559') {
        if (typeof block.baseFeePerGas !== 'bigint') throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$fee$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Eip1559FeesNotSupportedError"]();
        const maxPriorityFeePerGas = typeof request?.maxPriorityFeePerGas === 'bigint' ? request.maxPriorityFeePerGas : await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$estimateMaxPriorityFeePerGas$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["internal_estimateMaxPriorityFeePerGas"])(client, {
            block: block,
            chain,
            request
        });
        const baseFeePerGas = multiply(block.baseFeePerGas);
        const maxFeePerGas = request?.maxFeePerGas ?? baseFeePerGas + maxPriorityFeePerGas;
        return {
            maxFeePerGas,
            maxPriorityFeePerGas
        };
    }
    const gasPrice = request?.gasPrice ?? multiply(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getGasPrice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGasPrice"], 'getGasPrice')({}));
    return {
        gasPrice
    };
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/actions/public/estimateGas.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "estimateGas",
    ()=>estimateGas
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/accounts/utils/parseAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$authorization$2f$recoverAuthorizationAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/authorization/recoverAuthorizationAddress.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toHex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$errors$2f$getEstimateGasError$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/errors/getEstimateGasError.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$extract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/extract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$transactionRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/transactionRequest.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$stateOverride$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/stateOverride.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$transaction$2f$assertRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/transaction/assertRequest.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$wallet$2f$prepareTransactionRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/wallet/prepareTransactionRequest.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
async function estimateGas(client, args) {
    const { account: account_ = client.account, prepare = true } = args;
    const account = account_ ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseAccount"])(account_) : undefined;
    const parameters = (()=>{
        if (Array.isArray(prepare)) return prepare;
        // Some RPC Providers do not compute versioned hashes from blobs. We will need
        // to compute them.
        if (account?.type !== 'local') return [
            'blobVersionedHashes'
        ];
        return undefined;
    })();
    try {
        const to = await (async ()=>{
            // If `to` exists on the parameters, use that.
            if (args.to) return args.to;
            // If no `to` exists, and we are sending a EIP-7702 transaction, use the
            // address of the first authorization in the list.
            if (args.authorizationList && args.authorizationList.length > 0) return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$authorization$2f$recoverAuthorizationAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["recoverAuthorizationAddress"])({
                authorization: args.authorizationList[0]
            }).catch(()=>{
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"]('`to` is required. Could not infer from `authorizationList`');
            });
            // Otherwise, we are sending a deployment transaction.
            return undefined;
        })();
        const { accessList, authorizationList, blobs, blobVersionedHashes, blockNumber, blockTag, data, gas, gasPrice, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, nonce, value, stateOverride, ...rest } = prepare ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$wallet$2f$prepareTransactionRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["prepareTransactionRequest"])(client, {
            ...args,
            parameters,
            to
        }) : args;
        // If we get `gas` back from the prepared transaction request, which is
        // different from the `gas` we provided, it was likely filled by other means
        // during request preparation (e.g. `eth_fillTransaction` or `chain.transactionRequest.prepare`).
        // (e.g. `eth_fillTransaction` or `chain.transactionRequest.prepare`).
        if (gas && args.gas !== gas) return gas;
        const blockNumberHex = typeof blockNumber === 'bigint' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(blockNumber) : undefined;
        const block = blockNumberHex || blockTag;
        const rpcStateOverride = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$stateOverride$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serializeStateOverride"])(stateOverride);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$transaction$2f$assertRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertRequest"])(args);
        const chainFormat = client.chain?.formatters?.transactionRequest?.format;
        const format = chainFormat || __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$transactionRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatTransactionRequest"];
        const request = format({
            // Pick out extra data that might exist on the chain's transaction request type.
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$extract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extract"])(rest, {
                format: chainFormat
            }),
            account,
            accessList,
            authorizationList,
            blobs,
            blobVersionedHashes,
            data,
            gasPrice,
            maxFeePerBlobGas,
            maxFeePerGas,
            maxPriorityFeePerGas,
            nonce,
            to,
            value
        }, 'estimateGas');
        return BigInt(await client.request({
            method: 'eth_estimateGas',
            params: rpcStateOverride ? [
                request,
                block ?? client.experimental_blockTag ?? 'latest',
                rpcStateOverride
            ] : block ? [
                request,
                block
            ] : [
                request
            ]
        }));
    } catch (err) {
        throw (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$errors$2f$getEstimateGasError$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEstimateGasError"])(err, {
            ...args,
            account,
            chain: client.chain
        });
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/actions/public/estimateMaxPriorityFeePerGas.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "estimateMaxPriorityFeePerGas",
    ()=>estimateMaxPriorityFeePerGas,
    "internal_estimateMaxPriorityFeePerGas",
    ()=>internal_estimateMaxPriorityFeePerGas
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$fee$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/fee.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$fromHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/fromHex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/getAction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getBlock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/getBlock.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getGasPrice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/getGasPrice.js [app-client] (ecmascript)");
;
;
;
;
;
async function estimateMaxPriorityFeePerGas(client, args) {
    return internal_estimateMaxPriorityFeePerGas(client, args);
}
async function internal_estimateMaxPriorityFeePerGas(client, args) {
    const { block: block_, chain = client.chain, request } = args || {};
    try {
        const maxPriorityFeePerGas = chain?.fees?.maxPriorityFeePerGas ?? chain?.fees?.defaultPriorityFee;
        if (typeof maxPriorityFeePerGas === 'function') {
            const block = block_ || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getBlock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBlock"], 'getBlock')({});
            const maxPriorityFeePerGas_ = await maxPriorityFeePerGas({
                block,
                client,
                request
            });
            if (maxPriorityFeePerGas_ === null) throw new Error();
            return maxPriorityFeePerGas_;
        }
        if (typeof maxPriorityFeePerGas !== 'undefined') return maxPriorityFeePerGas;
        const maxPriorityFeePerGasHex = await client.request({
            method: 'eth_maxPriorityFeePerGas'
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$fromHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToBigInt"])(maxPriorityFeePerGasHex);
    } catch  {
        // If the RPC Provider does not support `eth_maxPriorityFeePerGas`
        // fall back to calculating it manually via `gasPrice - baseFeePerGas`.
        // See: https://github.com/ethereum/pm/issues/328#:~:text=eth_maxPriorityFeePerGas%20after%20London%20will%20effectively%20return%20eth_gasPrice%20%2D%20baseFee
        const [block, gasPrice] = await Promise.all([
            block_ ? Promise.resolve(block_) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getBlock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBlock"], 'getBlock')({}),
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getGasPrice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGasPrice"], 'getGasPrice')({})
        ]);
        if (typeof block.baseFeePerGas !== 'bigint') throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$fee$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Eip1559FeesNotSupportedError"]();
        const maxPriorityFeePerGas = gasPrice - block.baseFeePerGas;
        if (maxPriorityFeePerGas < 0n) return 0n;
        return maxPriorityFeePerGas;
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/actions/public/fillTransaction.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fillTransaction",
    ()=>fillTransaction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/accounts/utils/parseAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$fee$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/fee.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/transaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$errors$2f$getTransactionError$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/errors/getTransactionError.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$extract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/extract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/transaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$transactionRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/transactionRequest.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/getAction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$transaction$2f$assertRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/transaction/assertRequest.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getBlock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/getBlock.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getChainId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/getChainId.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
async function fillTransaction(client, parameters) {
    const { account = client.account, accessList, authorizationList, chain = client.chain, blobVersionedHashes, blobs, data, gas, gasPrice, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, nonce: nonce_, nonceManager, to, type, value, ...rest } = parameters;
    const nonce = await (async ()=>{
        if (!account) return nonce_;
        if (!nonceManager) return nonce_;
        if (typeof nonce_ !== 'undefined') return nonce_;
        const account_ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseAccount"])(account);
        const chainId = chain ? chain.id : await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getChainId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChainId"], 'getChainId')({});
        return await nonceManager.consume({
            address: account_.address,
            chainId,
            client
        });
    })();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$transaction$2f$assertRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertRequest"])(parameters);
    const chainFormat = chain?.formatters?.transactionRequest?.format;
    const format = chainFormat || __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$transactionRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatTransactionRequest"];
    const request = format({
        // Pick out extra data that might exist on the chain's transaction request type.
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$extract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extract"])(rest, {
            format: chainFormat
        }),
        account: account ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseAccount"])(account) : undefined,
        accessList,
        authorizationList,
        blobs,
        blobVersionedHashes,
        data,
        gas,
        gasPrice,
        maxFeePerBlobGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        to,
        type,
        value
    }, 'fillTransaction');
    try {
        const response = await client.request({
            method: 'eth_fillTransaction',
            params: [
                request
            ]
        });
        const format = chain?.formatters?.transaction?.format || __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatTransaction"];
        const transaction = format(response.tx);
        // Remove unnecessary fields.
        delete transaction.blockHash;
        delete transaction.blockNumber;
        delete transaction.r;
        delete transaction.s;
        delete transaction.transactionIndex;
        delete transaction.v;
        delete transaction.yParity;
        // Rewrite fields.
        transaction.data = transaction.input;
        const hasFeePayerSignature = typeof transaction.feePayerSignature !== 'undefined' && transaction.feePayerSignature !== null;
        if (hasFeePayerSignature && typeof nonce !== 'undefined' && transaction.nonce !== nonce) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FeePayerNonceMismatchError"]({
            filledNonce: transaction.nonce,
            requestedNonce: nonce
        });
        // A fee payer signature commits to the filled transaction, so preserve
        // its signed fields regardless of who produced the signature.
        // https://tips.sh/0001#fee-payer-signature
        if (!hasFeePayerSignature) {
            // Preference supplied fees (some nodes do not take these preferences).
            if (transaction.gas) transaction.gas = parameters.gas ?? transaction.gas;
            if (transaction.gasPrice) transaction.gasPrice = parameters.gasPrice ?? transaction.gasPrice;
            if (transaction.maxFeePerBlobGas) transaction.maxFeePerBlobGas = parameters.maxFeePerBlobGas ?? transaction.maxFeePerBlobGas;
            if (transaction.maxFeePerGas) transaction.maxFeePerGas = parameters.maxFeePerGas ?? transaction.maxFeePerGas;
            if (transaction.maxPriorityFeePerGas) transaction.maxPriorityFeePerGas = parameters.maxPriorityFeePerGas ?? transaction.maxPriorityFeePerGas;
            if (typeof transaction.nonce !== 'undefined') transaction.nonce = parameters.nonce ?? transaction.nonce;
            // Build fee multiplier function.
            const feeMultiplier = await (async ()=>{
                if (typeof chain?.fees?.baseFeeMultiplier === 'function') {
                    const block = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getBlock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBlock"], 'getBlock')({});
                    return chain.fees.baseFeeMultiplier({
                        block,
                        client,
                        request: parameters
                    });
                }
                return chain?.fees?.baseFeeMultiplier ?? 1.2;
            })();
            if (feeMultiplier < 1) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$fee$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseFeeScalarError"]();
            const decimals = feeMultiplier.toString().split('.')[1]?.length ?? 0;
            const denominator = 10 ** decimals;
            const multiplyFee = (base)=>base * BigInt(Math.round(feeMultiplier * denominator)) / BigInt(denominator);
            // Apply fee multiplier.
            if (transaction.maxFeePerGas && !parameters.maxFeePerGas) transaction.maxFeePerGas = multiplyFee(transaction.maxFeePerGas);
            if (transaction.gasPrice && !parameters.gasPrice) transaction.gasPrice = multiplyFee(transaction.gasPrice);
        }
        return {
            raw: response.raw,
            transaction: {
                from: request.from,
                ...transaction
            },
            ...response.capabilities ? {
                capabilities: response.capabilities
            } : {}
        };
    } catch (err) {
        throw (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$errors$2f$getTransactionError$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTransactionError"])(err, {
            ...parameters,
            chain: client.chain
        });
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/actions/public/getBlock.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getBlock",
    ()=>getBlock
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$block$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/block.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toHex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$block$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/block.js [app-client] (ecmascript)");
;
;
;
async function getBlock(client, { blockHash, blockNumber, blockTag = client.experimental_blockTag ?? 'latest', includeTransactions: includeTransactions_ } = {}) {
    const includeTransactions = includeTransactions_ ?? false;
    const blockNumberHex = blockNumber !== undefined ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(blockNumber) : undefined;
    let block = null;
    if (blockHash) {
        block = await client.request({
            method: 'eth_getBlockByHash',
            params: [
                blockHash,
                includeTransactions
            ]
        }, {
            dedupe: true
        });
    } else {
        block = await client.request({
            method: 'eth_getBlockByNumber',
            params: [
                blockNumberHex || blockTag,
                includeTransactions
            ]
        }, {
            dedupe: Boolean(blockNumberHex)
        });
    }
    if (!block) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$block$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BlockNotFoundError"]({
        blockHash,
        blockNumber
    });
    const format = client.chain?.formatters?.block?.format || __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$block$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatBlock"];
    return format(block, 'getBlock');
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/actions/public/getChainId.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getChainId",
    ()=>getChainId
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$fromHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/fromHex.js [app-client] (ecmascript)");
;
async function getChainId(client) {
    const chainIdHex = await client.request({
        method: 'eth_chainId'
    }, {
        dedupe: true
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$fromHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToNumber"])(chainIdHex);
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/actions/public/getGasPrice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Returns the current price of gas (in wei).
 *
 * - Docs: https://viem.sh/docs/actions/public/getGasPrice
 * - JSON-RPC Methods: [`eth_gasPrice`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_gasprice)
 *
 * @param client - Client to use
 * @returns The gas price (in wei). {@link GetGasPriceReturnType}
 *
 * @example
 * import { createPublicClient, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { getGasPrice } from 'viem/public'
 *
 * const client = createPublicClient({
 *   chain: mainnet,
 *   transport: http(),
 * })
 * const gasPrice = await getGasPrice(client)
 */ __turbopack_context__.s([
    "getGasPrice",
    ()=>getGasPrice
]);
async function getGasPrice(client) {
    const gasPrice = await client.request({
        method: 'eth_gasPrice'
    });
    return BigInt(gasPrice);
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/actions/public/getTransactionCount.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTransactionCount",
    ()=>getTransactionCount
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$block$2f$formatBlockParameter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/block/formatBlockParameter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$fromHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/fromHex.js [app-client] (ecmascript)");
;
;
async function getTransactionCount(client, { address, blockHash, blockNumber, blockTag = 'latest', requireCanonical }) {
    const block = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$block$2f$formatBlockParameter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatBlockParameter"])({
        blockHash,
        blockNumber,
        blockTag,
        requireCanonical
    });
    const count = await client.request({
        method: 'eth_getTransactionCount',
        params: [
            address,
            block
        ]
    }, {
        dedupe: typeof blockNumber === 'bigint' || blockHash !== undefined
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$fromHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToNumber"])(count);
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/actions/wallet/prepareTransactionRequest.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "defaultParameters",
    ()=>defaultParameters,
    "eip1559NetworkCache",
    ()=>eip1559NetworkCache,
    "prepareTransactionRequest",
    ()=>prepareTransactionRequest,
    "supportsFillTransaction",
    ()=>supportsFillTransaction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/accounts/utils/parseAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$estimateFeesPerGas$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/estimateFeesPerGas.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$estimateGas$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/estimateGas.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getBlock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/getBlock.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getTransactionCount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/getTransactionCount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$fee$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/fee.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/transaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$blobsToCommitments$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/blob/blobsToCommitments.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$blobsToProofs$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/blob/blobsToProofs.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$commitmentsToVersionedHashes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/blob/commitmentsToVersionedHashes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$toBlobSidecars$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/blob/toBlobSidecars.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/getAction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$lru$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/lru.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$transaction$2f$assertRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/transaction/assertRequest.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$transaction$2f$getTransactionType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/transaction/getTransactionType.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$fillTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/fillTransaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getChainId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/getChainId.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const defaultParameters = [
    'blobVersionedHashes',
    'chainId',
    'fees',
    'gas',
    'nonce',
    'type'
];
const eip1559NetworkCache = /*#__PURE__*/ new Map();
const supportsFillTransaction = /*#__PURE__*/ new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$lru$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LruMap"](128);
async function prepareTransactionRequest(client, args) {
    let request = args;
    request.account ??= client.account;
    request.parameters ??= defaultParameters;
    const { account: account_, chain = client.chain, nonceManager, parameters } = request;
    const prepareTransactionRequest = (()=>{
        if (typeof chain?.prepareTransactionRequest === 'function') return {
            fn: chain.prepareTransactionRequest,
            runAt: [
                'beforeFillTransaction'
            ]
        };
        if (Array.isArray(chain?.prepareTransactionRequest)) return {
            fn: chain.prepareTransactionRequest[0],
            runAt: chain.prepareTransactionRequest[1].runAt
        };
        return undefined;
    })();
    let chainId;
    async function getChainId() {
        if (chainId) return chainId;
        if (typeof request.chainId !== 'undefined') return request.chainId;
        if (chain) return chain.id;
        const chainId_ = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getChainId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChainId"], 'getChainId')({});
        chainId = chainId_;
        return chainId;
    }
    let account = account_ ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseAccount"])(account_) : account_;
    let nonce = request.nonce;
    if (prepareTransactionRequest?.fn && prepareTransactionRequest.runAt?.includes('beforeFillTransaction')) {
        request = await prepareTransactionRequest.fn({
            ...request,
            chain
        }, {
            client,
            phase: 'beforeFillTransaction'
        });
        nonce ??= request.nonce;
        const sender = request.account ?? request.from;
        account = sender ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseAccount"])(sender) : undefined;
    }
    if (parameters.includes('nonce') && typeof nonce === 'undefined' && account && nonceManager) {
        const chainId = await getChainId();
        nonce = await nonceManager.consume({
            address: account.address,
            chainId,
            client
        });
    }
    const attemptFill = (()=>{
        // Do not attempt if blobs are provided.
        if ((parameters.includes('blobVersionedHashes') || parameters.includes('sidecars')) && request.kzg && request.blobs) return false;
        // Always attempt if the caller explicitly requested a non-empty set of
        // `parameters` and a fee payer signature is being requested (e.g. Tempo
        // sponsorship via `feePayer: true`/`Account`) and has not already been
        // filled. The fee payer signature can only be obtained as a side effect
        // of `eth_fillTransaction` (the relay co-signs the returned transaction),
        // so it must be called even when nonce/gas/fees are already fully
        // populated, or when the caller's `parameters` option omits `'fees'`/
        // `'gas'` entirely — otherwise the transaction silently ends up without
        // a fee payer signature. This check intentionally runs before the
        // `shouldAttempt` gate below, since fee-payer sponsorship is independent
        // of which parameters the caller opted into filling.
        //
        // The `parameters.length > 0` guard excludes internal micro-prepare calls
        // that explicitly pass an empty `parameters` array (e.g. `estimateGas`'s
        // internal `prepareTransactionRequest` call for local accounts) — those
        // are deliberately scoped to fill nothing, and should not independently
        // re-attempt `eth_fillTransaction` for fee-payer sponsorship.
        if (parameters.length > 0 && 'feePayer' in request && request.feePayer && !('feePayerSignature' in request && request.feePayerSignature)) return true;
        // Sponsorship can route fill requests to a different endpoint, so it must
        // bypass support state cached from a non-sponsored request.
        if (supportsFillTransaction.get(client.uid) === false) return false;
        // Should attempt `eth_fillTransaction` if "fees" or "gas" are required to be populated,
        // otherwise, can just use the other individual calls.
        const shouldAttempt = [
            'fees',
            'gas'
        ].some((parameter)=>parameters.includes(parameter));
        if (!shouldAttempt) return false;
        // Check if `eth_fillTransaction` needs to be called.
        if (parameters.includes('chainId') && typeof request.chainId !== 'number') return true;
        if (parameters.includes('nonce') && typeof nonce !== 'number') return true;
        if (parameters.includes('fees') && typeof request.gasPrice !== 'bigint' && (typeof request.maxFeePerGas !== 'bigint' || typeof request.maxPriorityFeePerGas !== 'bigint')) return true;
        if (parameters.includes('gas') && typeof request.gas !== 'bigint') return true;
        return false;
    })();
    const fillResult = attemptFill ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$fillTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fillTransaction"], 'fillTransaction')({
        ...request,
        nonce
    }).then((result)=>{
        const { chainId, from, gas, gasPrice, nonce, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, type, ...rest } = result.transaction;
        const feeToken = 'feeToken' in rest ? rest.feeToken : undefined;
        const hasFilledFeePayerSignature = 'feePayerSignature' in rest && rest.feePayerSignature !== null && typeof rest.feePayerSignature !== 'undefined';
        const shouldUseFilledFeeToken = typeof feeToken !== 'undefined' && feeToken !== null && (!('feeToken' in request) || hasFilledFeePayerSignature);
        supportsFillTransaction.set(client.uid, true);
        return {
            ...request,
            ...from ? {
                from
            } : {},
            ...type && !request.type ? {
                type
            } : {},
            ...typeof chainId !== 'undefined' ? {
                chainId
            } : {},
            ...typeof gas !== 'undefined' ? {
                gas
            } : {},
            ...typeof gasPrice !== 'undefined' ? {
                gasPrice
            } : {},
            ...typeof nonce !== 'undefined' ? {
                nonce
            } : {},
            ...typeof maxFeePerBlobGas !== 'undefined' && request.type !== 'legacy' && request.type !== 'eip2930' ? {
                maxFeePerBlobGas
            } : {},
            ...typeof maxFeePerGas !== 'undefined' && request.type !== 'legacy' && request.type !== 'eip2930' ? {
                maxFeePerGas
            } : {},
            ...typeof maxPriorityFeePerGas !== 'undefined' && request.type !== 'legacy' && request.type !== 'eip2930' ? {
                maxPriorityFeePerGas
            } : {},
            ...'nonceKey' in rest && typeof rest.nonceKey !== 'undefined' ? {
                nonceKey: rest.nonceKey
            } : {},
            ...'keyAuthorization' in rest && typeof rest.keyAuthorization !== 'undefined' && rest.keyAuthorization !== null && !('keyAuthorization' in request) ? {
                keyAuthorization: rest.keyAuthorization
            } : {},
            ...'feePayerSignature' in rest && typeof rest.feePayerSignature !== 'undefined' && rest.feePayerSignature !== null ? {
                feePayerSignature: rest.feePayerSignature
            } : {},
            ...shouldUseFilledFeeToken ? {
                feeToken
            } : {},
            ...result.capabilities ? {
                _capabilities: result.capabilities
            } : {}
        };
    }).catch((e)=>{
        const error = e;
        if (error.name !== 'TransactionExecutionError') return request;
        const nonceMismatch = error.walk?.((error)=>error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FeePayerNonceMismatchError"]);
        if (nonceMismatch) throw e;
        const executionReverted = error.walk?.((e)=>{
            const error = e;
            return error.name === 'ExecutionRevertedError';
        });
        if (executionReverted) throw e;
        const unsupported = error.walk?.((e)=>{
            const error = e;
            return error.name === 'MethodNotFoundRpcError' || error.name === 'MethodNotSupportedRpcError' || error.message?.includes('eth_fillTransaction is not available');
        });
        if (unsupported) supportsFillTransaction.set(client.uid, false);
        return request;
    }) : request;
    nonce ??= fillResult.nonce;
    request = {
        ...fillResult,
        ...account ? {
            from: account?.address
        } : {},
        ...typeof nonce !== 'undefined' ? {
            nonce
        } : {}
    };
    const { blobs, gas, kzg, type } = request;
    if (prepareTransactionRequest?.fn && prepareTransactionRequest.runAt?.includes('beforeFillParameters')) {
        request = await prepareTransactionRequest.fn({
            ...request,
            chain
        }, {
            client,
            phase: 'beforeFillParameters'
        });
    }
    let block;
    async function getBlock() {
        if (block) return block;
        block = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getBlock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBlock"], 'getBlock')({
            blockTag: 'latest'
        });
        return block;
    }
    if (parameters.includes('nonce') && typeof nonce === 'undefined' && account && !nonceManager) request.nonce = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getTransactionCount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTransactionCount"], 'getTransactionCount')({
        address: account.address,
        blockTag: 'pending'
    });
    if ((parameters.includes('blobVersionedHashes') || parameters.includes('sidecars')) && blobs && kzg) {
        const commitments = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$blobsToCommitments$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["blobsToCommitments"])({
            blobs,
            kzg
        });
        if (parameters.includes('blobVersionedHashes')) {
            const versionedHashes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$commitmentsToVersionedHashes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["commitmentsToVersionedHashes"])({
                commitments,
                to: 'hex'
            });
            request.blobVersionedHashes = versionedHashes;
        }
        if (parameters.includes('sidecars')) {
            const proofs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$blobsToProofs$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["blobsToProofs"])({
                blobs,
                commitments,
                kzg
            });
            const sidecars = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$toBlobSidecars$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toBlobSidecars"])({
                blobs,
                commitments,
                proofs,
                to: 'hex'
            });
            request.sidecars = sidecars;
        }
    }
    if (parameters.includes('chainId')) request.chainId = await getChainId();
    if ((parameters.includes('fees') || parameters.includes('type')) && typeof type === 'undefined') {
        try {
            request.type = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$transaction$2f$getTransactionType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTransactionType"])(request);
        } catch  {
            let isEip1559Network = eip1559NetworkCache.get(client.uid);
            if (typeof isEip1559Network === 'undefined') {
                const block = await getBlock();
                isEip1559Network = typeof block?.baseFeePerGas === 'bigint';
                eip1559NetworkCache.set(client.uid, isEip1559Network);
            }
            request.type = isEip1559Network ? 'eip1559' : 'legacy';
        }
    }
    if (parameters.includes('fees')) {
        // TODO(4844): derive blob base fees once https://github.com/ethereum/execution-apis/pull/486 is merged.
        if (request.type !== 'legacy' && request.type !== 'eip2930') {
            // EIP-1559 fees
            if (typeof request.maxFeePerGas === 'undefined' || typeof request.maxPriorityFeePerGas === 'undefined') {
                const block = await getBlock();
                const { maxFeePerGas, maxPriorityFeePerGas } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$estimateFeesPerGas$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["internal_estimateFeesPerGas"])(client, {
                    block: block,
                    chain,
                    request: request
                });
                if (typeof request.maxPriorityFeePerGas === 'undefined' && request.maxFeePerGas && request.maxFeePerGas < maxPriorityFeePerGas) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$fee$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MaxFeePerGasTooLowError"]({
                    maxPriorityFeePerGas
                });
                request.maxPriorityFeePerGas = maxPriorityFeePerGas;
                request.maxFeePerGas = maxFeePerGas;
            }
        } else {
            // Legacy fees
            if (typeof request.maxFeePerGas !== 'undefined' || typeof request.maxPriorityFeePerGas !== 'undefined') throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$fee$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Eip1559FeesNotSupportedError"]();
            if (typeof request.gasPrice === 'undefined') {
                const block = await getBlock();
                const { gasPrice: gasPrice_ } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$estimateFeesPerGas$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["internal_estimateFeesPerGas"])(client, {
                    block: block,
                    chain,
                    request: request,
                    type: 'legacy'
                });
                request.gasPrice = gasPrice_;
            }
        }
    }
    if (parameters.includes('gas') && typeof gas === 'undefined') request.gas = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$estimateGas$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["estimateGas"], 'estimateGas')({
        ...request,
        account,
        prepare: account?.type === 'local' ? [] : [
            'blobVersionedHashes'
        ]
    });
    if (prepareTransactionRequest?.fn && prepareTransactionRequest.runAt?.includes('afterFillParameters')) request = await prepareTransactionRequest.fn({
        ...request,
        chain
    }, {
        client,
        phase: 'afterFillParameters'
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$transaction$2f$assertRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertRequest"])(request);
    delete request.parameters;
    return request;
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/actions/wallet/sendRawTransaction.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Sends a **signed** transaction to the network
 *
 * - Docs: https://viem.sh/docs/actions/wallet/sendRawTransaction
 * - JSON-RPC Method: [`eth_sendRawTransaction`](https://ethereum.github.io/execution-apis/api-documentation/)
 *
 * @param client - Client to use
 * @param parameters - {@link SendRawTransactionParameters}
 * @returns The transaction hash. {@link SendRawTransactionReturnType}
 *
 * @example
 * import { createWalletClient, custom } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { sendRawTransaction } from 'viem/wallet'
 *
 * const client = createWalletClient({
 *   chain: mainnet,
 *   transport: custom(window.ethereum),
 * })
 *
 * const hash = await sendRawTransaction(client, {
 *   serializedTransaction: '0x02f850018203118080825208808080c080a04012522854168b27e5dc3d5839bab5e6b39e1a0ffd343901ce1622e3d64b48f1a04e00902ae0502c4728cbf12156290df99c3ed7de85b1dbfe20b5c36931733a33'
 * })
 */ __turbopack_context__.s([
    "sendRawTransaction",
    ()=>sendRawTransaction
]);
async function sendRawTransaction(client, { serializedTransaction }) {
    return client.request({
        method: 'eth_sendRawTransaction',
        params: [
            serializedTransaction
        ]
    }, {
        retryCount: 0
    });
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/actions/wallet/sendTransaction.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sendTransaction",
    ()=>sendTransaction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/accounts/utils/parseAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$account$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/account.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$authorization$2f$recoverAuthorizationAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/authorization/recoverAuthorizationAddress.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$chain$2f$assertCurrentChain$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/chain/assertCurrentChain.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$concat$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/data/concat.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$errors$2f$getTransactionError$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/errors/getTransactionError.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$extract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/extract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$transactionRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/transactionRequest.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/getAction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$lru$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/lru.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$transaction$2f$assertRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/transaction/assertRequest.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getChainId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/public/getChainId.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$wallet$2f$prepareTransactionRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/wallet/prepareTransactionRequest.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$wallet$2f$sendRawTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/wallet/sendRawTransaction.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const supportsWalletNamespace = new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$lru$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LruMap"](128);
async function sendTransaction(client, parameters) {
    const { account: account_ = client.account, assertChainId = true, chain = client.chain, accessList, authorizationList, blobs, data, dataSuffix = typeof client.dataSuffix === 'string' ? client.dataSuffix : client.dataSuffix?.value, gas, gasPrice, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, nonce, type, value, ...rest } = parameters;
    if (typeof account_ === 'undefined') throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$account$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AccountNotFoundError"]({
        docsPath: '/docs/actions/wallet/sendTransaction'
    });
    const account = account_ ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseAccount"])(account_) : null;
    let nonceManagerParameters;
    try {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$transaction$2f$assertRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertRequest"])(parameters);
        const to = await (async ()=>{
            // If `to` exists on the parameters, use that.
            if (parameters.to) return parameters.to;
            // If `to` is null, we are sending a deployment transaction.
            if (parameters.to === null) return undefined;
            // If no `to` exists, and we are sending a EIP-7702 transaction, use the
            // address of the first authorization in the list.
            if (authorizationList && authorizationList.length > 0) return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$authorization$2f$recoverAuthorizationAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["recoverAuthorizationAddress"])({
                authorization: authorizationList[0]
            }).catch(()=>{
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"]('`to` is required. Could not infer from `authorizationList`.');
            });
            // Otherwise, we are sending a deployment transaction.
            return undefined;
        })();
        if (account?.type === 'json-rpc' || account === null) {
            let chainId;
            if (chain !== null) {
                chainId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$public$2f$getChainId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChainId"], 'getChainId')({});
                if (assertChainId) (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$chain$2f$assertCurrentChain$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertCurrentChain"])({
                    currentChainId: chainId,
                    chain
                });
            }
            const chainFormat = client.chain?.formatters?.transactionRequest?.format;
            const format = chainFormat || __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$transactionRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatTransactionRequest"];
            const request = format({
                // Pick out extra data that might exist on the chain's transaction request type.
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$extract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extract"])(rest, {
                    format: chainFormat
                }),
                accessList,
                account,
                authorizationList,
                blobs,
                chainId,
                data: dataSuffix ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$concat$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["concat"])([
                    data ?? '0x',
                    dataSuffix
                ]) : data,
                gas,
                gasPrice,
                maxFeePerBlobGas,
                maxFeePerGas,
                maxPriorityFeePerGas,
                nonce,
                to,
                type,
                value
            }, 'sendTransaction');
            const isWalletNamespaceSupported = supportsWalletNamespace.get(client.uid);
            const method = isWalletNamespaceSupported ? 'wallet_sendTransaction' : 'eth_sendTransaction';
            try {
                return await client.request({
                    method,
                    params: [
                        request
                    ]
                }, {
                    retryCount: 0
                });
            } catch (e) {
                if (isWalletNamespaceSupported === false) throw e;
                const error = e;
                // If the transport does not support the method or input, attempt to use the
                // `wallet_sendTransaction` method.
                if (error.name === 'InvalidInputRpcError' || error.name === 'InvalidParamsRpcError' || error.name === 'MethodNotFoundRpcError' || error.name === 'MethodNotSupportedRpcError') {
                    return await client.request({
                        method: 'wallet_sendTransaction',
                        params: [
                            request
                        ]
                    }, {
                        retryCount: 0
                    }).then((hash)=>{
                        supportsWalletNamespace.set(client.uid, true);
                        return hash;
                    }).catch((e)=>{
                        const walletNamespaceError = e;
                        if (walletNamespaceError.name === 'MethodNotFoundRpcError' || walletNamespaceError.name === 'MethodNotSupportedRpcError') {
                            supportsWalletNamespace.set(client.uid, false);
                            throw error;
                        }
                        throw walletNamespaceError;
                    });
                }
                throw error;
            }
        }
        if (account?.type === 'local') {
            const nonceManager = (()=>{
                if (!account.nonceManager || typeof nonce !== 'undefined') return account.nonceManager;
                const nonceManager = account.nonceManager;
                return {
                    consume (parameters) {
                        nonceManagerParameters = {
                            address: parameters.address,
                            chainId: parameters.chainId
                        };
                        return nonceManager.consume(parameters);
                    },
                    get (parameters) {
                        return nonceManager.get(parameters);
                    },
                    increment (parameters) {
                        return nonceManager.increment(parameters);
                    },
                    reset (parameters) {
                        return nonceManager.reset(parameters);
                    }
                };
            })();
            // Prepare the request for signing (assign appropriate fees, etc.)
            const request = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$wallet$2f$prepareTransactionRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["prepareTransactionRequest"], 'prepareTransactionRequest')({
                account,
                accessList,
                authorizationList,
                blobs,
                chain,
                data: dataSuffix ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$concat$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["concat"])([
                    data ?? '0x',
                    dataSuffix
                ]) : data,
                gas,
                gasPrice,
                maxFeePerBlobGas,
                maxFeePerGas,
                maxPriorityFeePerGas,
                nonce,
                nonceManager,
                parameters: [
                    ...__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$wallet$2f$prepareTransactionRequest$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultParameters"],
                    'sidecars'
                ],
                type,
                value,
                ...rest,
                to
            });
            const serializer = chain?.serializers?.transaction;
            const serializedTransaction = await account.signTransaction(request, {
                serializer
            });
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$wallet$2f$sendRawTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sendRawTransaction"], 'sendRawTransaction')({
                serializedTransaction
            });
        }
        if (account?.type === 'smart') throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$account$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AccountTypeNotSupportedError"]({
            metaMessages: [
                'Consider using the `sendUserOperation` Action instead.'
            ],
            docsPath: '/docs/actions/bundler/sendUserOperation',
            type: 'smart'
        });
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$account$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AccountTypeNotSupportedError"]({
            docsPath: '/docs/actions/wallet/sendTransaction',
            type: account?.type
        });
    } catch (err) {
        if (err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$account$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AccountTypeNotSupportedError"]) throw err;
        if (nonceManagerParameters) account?.nonceManager?.reset(nonceManagerParameters);
        throw (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$errors$2f$getTransactionError$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTransactionError"])(err, {
            ...parameters,
            account,
            chain: parameters.chain || undefined
        });
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/clients/transports/custom.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "custom",
    ()=>custom
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$clients$2f$transports$2f$createTransport$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/clients/transports/createTransport.js [app-client] (ecmascript)");
;
function custom(provider, config = {}) {
    const { key = 'custom', methods, name = 'Custom Provider', retryDelay } = config;
    return ({ retryCount: defaultRetryCount })=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$clients$2f$transports$2f$createTransport$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createTransport"])({
            key,
            methods,
            name,
            request: provider.request.bind(provider),
            retryCount: config.retryCount ?? defaultRetryCount,
            retryDelay,
            type: 'custom'
        });
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/constants/blob.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bytesPerBlob",
    ()=>bytesPerBlob,
    "bytesPerFieldElement",
    ()=>bytesPerFieldElement,
    "fieldElementsPerBlob",
    ()=>fieldElementsPerBlob,
    "maxBytesPerTransaction",
    ()=>maxBytesPerTransaction
]);
// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-4844.md#parameters
/** Blob limit per transaction. */ const blobsPerTransaction = 6;
const bytesPerFieldElement = 32;
const fieldElementsPerBlob = 4096;
const bytesPerBlob = bytesPerFieldElement * fieldElementsPerBlob;
const maxBytesPerTransaction = bytesPerBlob * blobsPerTransaction - // terminator byte (0x80).
1 - // zero byte (0x00) appended to each field element.
1 * fieldElementsPerBlob * blobsPerTransaction;
}),
"[project]/avax-frontend/node_modules/viem/_esm/constants/kzg.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-4844.md#parameters
__turbopack_context__.s([
    "versionedHashVersionKzg",
    ()=>versionedHashVersionKzg
]);
const versionedHashVersionKzg = 1;
}),
"[project]/avax-frontend/node_modules/viem/_esm/constants/number.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "maxInt104",
    ()=>maxInt104,
    "maxInt112",
    ()=>maxInt112,
    "maxInt120",
    ()=>maxInt120,
    "maxInt128",
    ()=>maxInt128,
    "maxInt136",
    ()=>maxInt136,
    "maxInt144",
    ()=>maxInt144,
    "maxInt152",
    ()=>maxInt152,
    "maxInt16",
    ()=>maxInt16,
    "maxInt160",
    ()=>maxInt160,
    "maxInt168",
    ()=>maxInt168,
    "maxInt176",
    ()=>maxInt176,
    "maxInt184",
    ()=>maxInt184,
    "maxInt192",
    ()=>maxInt192,
    "maxInt200",
    ()=>maxInt200,
    "maxInt208",
    ()=>maxInt208,
    "maxInt216",
    ()=>maxInt216,
    "maxInt224",
    ()=>maxInt224,
    "maxInt232",
    ()=>maxInt232,
    "maxInt24",
    ()=>maxInt24,
    "maxInt240",
    ()=>maxInt240,
    "maxInt248",
    ()=>maxInt248,
    "maxInt256",
    ()=>maxInt256,
    "maxInt32",
    ()=>maxInt32,
    "maxInt40",
    ()=>maxInt40,
    "maxInt48",
    ()=>maxInt48,
    "maxInt56",
    ()=>maxInt56,
    "maxInt64",
    ()=>maxInt64,
    "maxInt72",
    ()=>maxInt72,
    "maxInt8",
    ()=>maxInt8,
    "maxInt80",
    ()=>maxInt80,
    "maxInt88",
    ()=>maxInt88,
    "maxInt96",
    ()=>maxInt96,
    "maxUint104",
    ()=>maxUint104,
    "maxUint112",
    ()=>maxUint112,
    "maxUint120",
    ()=>maxUint120,
    "maxUint128",
    ()=>maxUint128,
    "maxUint136",
    ()=>maxUint136,
    "maxUint144",
    ()=>maxUint144,
    "maxUint152",
    ()=>maxUint152,
    "maxUint16",
    ()=>maxUint16,
    "maxUint160",
    ()=>maxUint160,
    "maxUint168",
    ()=>maxUint168,
    "maxUint176",
    ()=>maxUint176,
    "maxUint184",
    ()=>maxUint184,
    "maxUint192",
    ()=>maxUint192,
    "maxUint200",
    ()=>maxUint200,
    "maxUint208",
    ()=>maxUint208,
    "maxUint216",
    ()=>maxUint216,
    "maxUint224",
    ()=>maxUint224,
    "maxUint232",
    ()=>maxUint232,
    "maxUint24",
    ()=>maxUint24,
    "maxUint240",
    ()=>maxUint240,
    "maxUint248",
    ()=>maxUint248,
    "maxUint256",
    ()=>maxUint256,
    "maxUint32",
    ()=>maxUint32,
    "maxUint40",
    ()=>maxUint40,
    "maxUint48",
    ()=>maxUint48,
    "maxUint56",
    ()=>maxUint56,
    "maxUint64",
    ()=>maxUint64,
    "maxUint72",
    ()=>maxUint72,
    "maxUint8",
    ()=>maxUint8,
    "maxUint80",
    ()=>maxUint80,
    "maxUint88",
    ()=>maxUint88,
    "maxUint96",
    ()=>maxUint96,
    "minInt104",
    ()=>minInt104,
    "minInt112",
    ()=>minInt112,
    "minInt120",
    ()=>minInt120,
    "minInt128",
    ()=>minInt128,
    "minInt136",
    ()=>minInt136,
    "minInt144",
    ()=>minInt144,
    "minInt152",
    ()=>minInt152,
    "minInt16",
    ()=>minInt16,
    "minInt160",
    ()=>minInt160,
    "minInt168",
    ()=>minInt168,
    "minInt176",
    ()=>minInt176,
    "minInt184",
    ()=>minInt184,
    "minInt192",
    ()=>minInt192,
    "minInt200",
    ()=>minInt200,
    "minInt208",
    ()=>minInt208,
    "minInt216",
    ()=>minInt216,
    "minInt224",
    ()=>minInt224,
    "minInt232",
    ()=>minInt232,
    "minInt24",
    ()=>minInt24,
    "minInt240",
    ()=>minInt240,
    "minInt248",
    ()=>minInt248,
    "minInt256",
    ()=>minInt256,
    "minInt32",
    ()=>minInt32,
    "minInt40",
    ()=>minInt40,
    "minInt48",
    ()=>minInt48,
    "minInt56",
    ()=>minInt56,
    "minInt64",
    ()=>minInt64,
    "minInt72",
    ()=>minInt72,
    "minInt8",
    ()=>minInt8,
    "minInt80",
    ()=>minInt80,
    "minInt88",
    ()=>minInt88,
    "minInt96",
    ()=>minInt96
]);
const maxInt8 = 2n ** (8n - 1n) - 1n;
const maxInt16 = 2n ** (16n - 1n) - 1n;
const maxInt24 = 2n ** (24n - 1n) - 1n;
const maxInt32 = 2n ** (32n - 1n) - 1n;
const maxInt40 = 2n ** (40n - 1n) - 1n;
const maxInt48 = 2n ** (48n - 1n) - 1n;
const maxInt56 = 2n ** (56n - 1n) - 1n;
const maxInt64 = 2n ** (64n - 1n) - 1n;
const maxInt72 = 2n ** (72n - 1n) - 1n;
const maxInt80 = 2n ** (80n - 1n) - 1n;
const maxInt88 = 2n ** (88n - 1n) - 1n;
const maxInt96 = 2n ** (96n - 1n) - 1n;
const maxInt104 = 2n ** (104n - 1n) - 1n;
const maxInt112 = 2n ** (112n - 1n) - 1n;
const maxInt120 = 2n ** (120n - 1n) - 1n;
const maxInt128 = 2n ** (128n - 1n) - 1n;
const maxInt136 = 2n ** (136n - 1n) - 1n;
const maxInt144 = 2n ** (144n - 1n) - 1n;
const maxInt152 = 2n ** (152n - 1n) - 1n;
const maxInt160 = 2n ** (160n - 1n) - 1n;
const maxInt168 = 2n ** (168n - 1n) - 1n;
const maxInt176 = 2n ** (176n - 1n) - 1n;
const maxInt184 = 2n ** (184n - 1n) - 1n;
const maxInt192 = 2n ** (192n - 1n) - 1n;
const maxInt200 = 2n ** (200n - 1n) - 1n;
const maxInt208 = 2n ** (208n - 1n) - 1n;
const maxInt216 = 2n ** (216n - 1n) - 1n;
const maxInt224 = 2n ** (224n - 1n) - 1n;
const maxInt232 = 2n ** (232n - 1n) - 1n;
const maxInt240 = 2n ** (240n - 1n) - 1n;
const maxInt248 = 2n ** (248n - 1n) - 1n;
const maxInt256 = 2n ** (256n - 1n) - 1n;
const minInt8 = -(2n ** (8n - 1n));
const minInt16 = -(2n ** (16n - 1n));
const minInt24 = -(2n ** (24n - 1n));
const minInt32 = -(2n ** (32n - 1n));
const minInt40 = -(2n ** (40n - 1n));
const minInt48 = -(2n ** (48n - 1n));
const minInt56 = -(2n ** (56n - 1n));
const minInt64 = -(2n ** (64n - 1n));
const minInt72 = -(2n ** (72n - 1n));
const minInt80 = -(2n ** (80n - 1n));
const minInt88 = -(2n ** (88n - 1n));
const minInt96 = -(2n ** (96n - 1n));
const minInt104 = -(2n ** (104n - 1n));
const minInt112 = -(2n ** (112n - 1n));
const minInt120 = -(2n ** (120n - 1n));
const minInt128 = -(2n ** (128n - 1n));
const minInt136 = -(2n ** (136n - 1n));
const minInt144 = -(2n ** (144n - 1n));
const minInt152 = -(2n ** (152n - 1n));
const minInt160 = -(2n ** (160n - 1n));
const minInt168 = -(2n ** (168n - 1n));
const minInt176 = -(2n ** (176n - 1n));
const minInt184 = -(2n ** (184n - 1n));
const minInt192 = -(2n ** (192n - 1n));
const minInt200 = -(2n ** (200n - 1n));
const minInt208 = -(2n ** (208n - 1n));
const minInt216 = -(2n ** (216n - 1n));
const minInt224 = -(2n ** (224n - 1n));
const minInt232 = -(2n ** (232n - 1n));
const minInt240 = -(2n ** (240n - 1n));
const minInt248 = -(2n ** (248n - 1n));
const minInt256 = -(2n ** (256n - 1n));
const maxUint8 = 2n ** 8n - 1n;
const maxUint16 = 2n ** 16n - 1n;
const maxUint24 = 2n ** 24n - 1n;
const maxUint32 = 2n ** 32n - 1n;
const maxUint40 = 2n ** 40n - 1n;
const maxUint48 = 2n ** 48n - 1n;
const maxUint56 = 2n ** 56n - 1n;
const maxUint64 = 2n ** 64n - 1n;
const maxUint72 = 2n ** 72n - 1n;
const maxUint80 = 2n ** 80n - 1n;
const maxUint88 = 2n ** 88n - 1n;
const maxUint96 = 2n ** 96n - 1n;
const maxUint104 = 2n ** 104n - 1n;
const maxUint112 = 2n ** 112n - 1n;
const maxUint120 = 2n ** 120n - 1n;
const maxUint128 = 2n ** 128n - 1n;
const maxUint136 = 2n ** 136n - 1n;
const maxUint144 = 2n ** 144n - 1n;
const maxUint152 = 2n ** 152n - 1n;
const maxUint160 = 2n ** 160n - 1n;
const maxUint168 = 2n ** 168n - 1n;
const maxUint176 = 2n ** 176n - 1n;
const maxUint184 = 2n ** 184n - 1n;
const maxUint192 = 2n ** 192n - 1n;
const maxUint200 = 2n ** 200n - 1n;
const maxUint208 = 2n ** 208n - 1n;
const maxUint216 = 2n ** 216n - 1n;
const maxUint224 = 2n ** 224n - 1n;
const maxUint232 = 2n ** 232n - 1n;
const maxUint240 = 2n ** 240n - 1n;
const maxUint248 = 2n ** 248n - 1n;
const maxUint256 = 2n ** 256n - 1n;
}),
"[project]/avax-frontend/node_modules/viem/_esm/errors/account.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AccountNotFoundError",
    ()=>AccountNotFoundError,
    "AccountTypeNotSupportedError",
    ()=>AccountTypeNotSupportedError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
;
class AccountNotFoundError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ docsPath } = {}){
        super([
            'Could not find an Account to execute with this Action.',
            'Please provide an Account with the `account` argument on the Action, or by supplying an `account` to the Client.'
        ].join('\n'), {
            docsPath,
            docsSlug: 'account',
            name: 'AccountNotFoundError'
        });
    }
}
class AccountTypeNotSupportedError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ docsPath, metaMessages, type }){
        super(`Account type "${type}" is not supported.`, {
            docsPath,
            metaMessages,
            name: 'AccountTypeNotSupportedError'
        });
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/errors/blob.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BlobSizeTooLargeError",
    ()=>BlobSizeTooLargeError,
    "EmptyBlobError",
    ()=>EmptyBlobError,
    "InvalidVersionedHashSizeError",
    ()=>InvalidVersionedHashSizeError,
    "InvalidVersionedHashVersionError",
    ()=>InvalidVersionedHashVersionError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$kzg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/constants/kzg.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
;
;
class BlobSizeTooLargeError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ maxSize, size }){
        super('Blob size is too large.', {
            metaMessages: [
                `Max: ${maxSize} bytes`,
                `Given: ${size} bytes`
            ],
            name: 'BlobSizeTooLargeError'
        });
    }
}
class EmptyBlobError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor(){
        super('Blob data must not be empty.', {
            name: 'EmptyBlobError'
        });
    }
}
class InvalidVersionedHashSizeError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ hash, size }){
        super(`Versioned hash "${hash}" size is invalid.`, {
            metaMessages: [
                'Expected: 32',
                `Received: ${size}`
            ],
            name: 'InvalidVersionedHashSizeError'
        });
    }
}
class InvalidVersionedHashVersionError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ hash, version }){
        super(`Versioned hash "${hash}" version is invalid.`, {
            metaMessages: [
                `Expected: ${__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$kzg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["versionedHashVersionKzg"]}`,
                `Received: ${version}`
            ],
            name: 'InvalidVersionedHashVersionError'
        });
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/errors/block.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BlockNotFoundError",
    ()=>BlockNotFoundError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
;
class BlockNotFoundError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ blockHash, blockNumber }){
        let identifier = 'Block';
        if (blockHash) identifier = `Block at hash "${blockHash}"`;
        if (blockNumber) identifier = `Block at number "${blockNumber}"`;
        super(`${identifier} could not be found.`, {
            name: 'BlockNotFoundError'
        });
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/errors/chain.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChainDoesNotSupportContract",
    ()=>ChainDoesNotSupportContract,
    "ChainMismatchError",
    ()=>ChainMismatchError,
    "ChainNotFoundError",
    ()=>ChainNotFoundError,
    "ClientChainNotConfiguredError",
    ()=>ClientChainNotConfiguredError,
    "InvalidChainIdError",
    ()=>InvalidChainIdError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
;
class ChainDoesNotSupportContract extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ blockNumber, chain, contract }){
        super(`Chain "${chain.name}" does not support contract "${contract.name}".`, {
            metaMessages: [
                'This could be due to any of the following:',
                ...blockNumber && contract.blockCreated && contract.blockCreated > blockNumber ? [
                    `- The contract "${contract.name}" was not deployed until block ${contract.blockCreated} (current block ${blockNumber}).`
                ] : [
                    `- The chain does not have the contract "${contract.name}" configured.`
                ]
            ],
            name: 'ChainDoesNotSupportContract'
        });
    }
}
class ChainMismatchError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ chain, currentChainId }){
        super(`The current chain of the wallet (id: ${currentChainId}) does not match the target chain for the transaction (id: ${chain.id} – ${chain.name}).`, {
            metaMessages: [
                `Current Chain ID:  ${currentChainId}`,
                `Expected Chain ID: ${chain.id} – ${chain.name}`
            ],
            name: 'ChainMismatchError'
        });
    }
}
class ChainNotFoundError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor(){
        super([
            'No chain was provided to the request.',
            'Please provide a chain with the `chain` argument on the Action, or by supplying a `chain` to WalletClient.'
        ].join('\n'), {
            name: 'ChainNotFoundError'
        });
    }
}
class ClientChainNotConfiguredError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor(){
        super('No chain was provided to the Client.', {
            name: 'ClientChainNotConfiguredError'
        });
    }
}
class InvalidChainIdError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ chainId }){
        super(typeof chainId === 'number' ? `Chain ID "${chainId}" is invalid.` : 'Chain ID is invalid.', {
            name: 'InvalidChainIdError'
        });
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/errors/cursor.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NegativeOffsetError",
    ()=>NegativeOffsetError,
    "PositionOutOfBoundsError",
    ()=>PositionOutOfBoundsError,
    "RecursiveReadLimitExceededError",
    ()=>RecursiveReadLimitExceededError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
;
class NegativeOffsetError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ offset }){
        super(`Offset \`${offset}\` cannot be negative.`, {
            name: 'NegativeOffsetError'
        });
    }
}
class PositionOutOfBoundsError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ length, position }){
        super(`Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`, {
            name: 'PositionOutOfBoundsError'
        });
    }
}
class RecursiveReadLimitExceededError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ count, limit }){
        super(`Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`, {
            name: 'RecursiveReadLimitExceededError'
        });
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/errors/estimateGas.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EstimateGasExecutionError",
    ()=>EstimateGasExecutionError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatEther$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/unit/formatEther.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/unit/formatGwei.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/transaction.js [app-client] (ecmascript)");
;
;
;
;
class EstimateGasExecutionError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor(cause, { account, docsPath, chain, data, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas, nonce, to, value }){
        const prettyArgs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["prettyPrint"])({
            from: account?.address,
            to,
            value: typeof value !== 'undefined' && `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatEther$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatEther"])(value)} ${chain?.nativeCurrency?.symbol || 'ETH'}`,
            data,
            gas,
            gasPrice: typeof gasPrice !== 'undefined' && `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatGwei"])(gasPrice)} gwei`,
            maxFeePerGas: typeof maxFeePerGas !== 'undefined' && `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatGwei"])(maxFeePerGas)} gwei`,
            maxPriorityFeePerGas: typeof maxPriorityFeePerGas !== 'undefined' && `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatGwei"])(maxPriorityFeePerGas)} gwei`,
            nonce
        });
        super(cause.shortMessage, {
            cause,
            docsPath,
            metaMessages: [
                ...cause.metaMessages ? [
                    ...cause.metaMessages,
                    ' '
                ] : [],
                'Estimate Gas Arguments:',
                prettyArgs
            ].filter(Boolean),
            name: 'EstimateGasExecutionError'
        });
        Object.defineProperty(this, "cause", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.cause = cause;
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/errors/fee.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BaseFeeScalarError",
    ()=>BaseFeeScalarError,
    "Eip1559FeesNotSupportedError",
    ()=>Eip1559FeesNotSupportedError,
    "MaxFeePerGasTooLowError",
    ()=>MaxFeePerGasTooLowError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/unit/formatGwei.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
;
;
class BaseFeeScalarError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor(){
        super('`baseFeeMultiplier` must be greater than 1.', {
            name: 'BaseFeeScalarError'
        });
    }
}
class Eip1559FeesNotSupportedError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor(){
        super('Chain does not support EIP-1559 fees.', {
            name: 'Eip1559FeesNotSupportedError'
        });
    }
}
class MaxFeePerGasTooLowError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ maxPriorityFeePerGas }){
        super(`\`maxFeePerGas\` cannot be less than the \`maxPriorityFeePerGas\` (${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatGwei"])(maxPriorityFeePerGas)} gwei).`, {
            name: 'MaxFeePerGasTooLowError'
        });
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/errors/node.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ExecutionRevertedError",
    ()=>ExecutionRevertedError,
    "FeeCapTooHighError",
    ()=>FeeCapTooHighError,
    "FeeCapTooLowError",
    ()=>FeeCapTooLowError,
    "InsufficientFundsError",
    ()=>InsufficientFundsError,
    "IntrinsicGasTooHighError",
    ()=>IntrinsicGasTooHighError,
    "IntrinsicGasTooLowError",
    ()=>IntrinsicGasTooLowError,
    "NonceMaxValueError",
    ()=>NonceMaxValueError,
    "NonceTooHighError",
    ()=>NonceTooHighError,
    "NonceTooLowError",
    ()=>NonceTooLowError,
    "TipAboveFeeCapError",
    ()=>TipAboveFeeCapError,
    "TransactionTypeNotSupportedError",
    ()=>TransactionTypeNotSupportedError,
    "UnknownNodeError",
    ()=>UnknownNodeError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/unit/formatGwei.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
;
;
class ExecutionRevertedError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ cause, message } = {}){
        const reason = message?.replace('execution reverted: ', '')?.replace('execution reverted', '');
        super(`Execution reverted ${reason ? `with reason: ${reason}` : 'for an unknown reason'}.`, {
            cause,
            name: 'ExecutionRevertedError'
        });
    }
}
Object.defineProperty(ExecutionRevertedError, "code", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 3
});
Object.defineProperty(ExecutionRevertedError, "nodeMessage", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: /execution reverted|gas required exceeds allowance/
});
class FeeCapTooHighError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ cause, maxFeePerGas } = {}){
        super(`The fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatGwei"])(maxFeePerGas)} gwei` : ''}) cannot be higher than the maximum allowed value (2^256-1).`, {
            cause,
            name: 'FeeCapTooHighError'
        });
    }
}
Object.defineProperty(FeeCapTooHighError, "nodeMessage", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: /max fee per gas higher than 2\^256-1|fee cap higher than 2\^256-1/
});
class FeeCapTooLowError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ cause, maxFeePerGas } = {}){
        super(`The fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatGwei"])(maxFeePerGas)}` : ''} gwei) cannot be lower than the block base fee.`, {
            cause,
            name: 'FeeCapTooLowError'
        });
    }
}
Object.defineProperty(FeeCapTooLowError, "nodeMessage", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: /max fee per gas less than block base fee|fee cap less than block base fee|transaction is outdated/
});
class NonceTooHighError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ cause, nonce } = {}){
        super(`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ''}is higher than the next one expected.`, {
            cause,
            name: 'NonceTooHighError'
        });
    }
}
Object.defineProperty(NonceTooHighError, "nodeMessage", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: /nonce too high/
});
class NonceTooLowError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ cause, nonce } = {}){
        super([
            `Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ''}is lower than the current nonce of the account.`,
            'Try increasing the nonce or find the latest nonce with `getTransactionCount`.'
        ].join('\n'), {
            cause,
            name: 'NonceTooLowError'
        });
    }
}
Object.defineProperty(NonceTooLowError, "nodeMessage", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: /nonce too low|transaction already imported|already known/
});
class NonceMaxValueError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ cause, nonce } = {}){
        super(`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ''}exceeds the maximum allowed nonce.`, {
            cause,
            name: 'NonceMaxValueError'
        });
    }
}
Object.defineProperty(NonceMaxValueError, "nodeMessage", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: /nonce has max value/
});
class InsufficientFundsError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ cause } = {}){
        super([
            'The total cost (gas * gas fee + value) of executing this transaction exceeds the balance of the account.'
        ].join('\n'), {
            cause,
            metaMessages: [
                'This error could arise when the account does not have enough funds to:',
                ' - pay for the total gas fee,',
                ' - pay for the value to send.',
                ' ',
                'The cost of the transaction is calculated as `gas * gas fee + value`, where:',
                ' - `gas` is the amount of gas needed for transaction to execute,',
                ' - `gas fee` is the gas fee,',
                ' - `value` is the amount of ether to send to the recipient.'
            ],
            name: 'InsufficientFundsError'
        });
    }
}
Object.defineProperty(InsufficientFundsError, "nodeMessage", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: /insufficient funds|exceeds transaction sender account balance/
});
class IntrinsicGasTooHighError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ cause, gas } = {}){
        super(`The amount of gas ${gas ? `(${gas}) ` : ''}provided for the transaction exceeds the limit allowed for the block.`, {
            cause,
            name: 'IntrinsicGasTooHighError'
        });
    }
}
Object.defineProperty(IntrinsicGasTooHighError, "nodeMessage", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: /intrinsic gas too high|gas limit reached/
});
class IntrinsicGasTooLowError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ cause, gas } = {}){
        super(`The amount of gas ${gas ? `(${gas}) ` : ''}provided for the transaction is too low.`, {
            cause,
            name: 'IntrinsicGasTooLowError'
        });
    }
}
Object.defineProperty(IntrinsicGasTooLowError, "nodeMessage", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: /intrinsic gas too low/
});
class TransactionTypeNotSupportedError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ cause }){
        super('The transaction type is not supported for this chain.', {
            cause,
            name: 'TransactionTypeNotSupportedError'
        });
    }
}
Object.defineProperty(TransactionTypeNotSupportedError, "nodeMessage", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: /transaction type not valid/
});
class TipAboveFeeCapError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ cause, maxPriorityFeePerGas, maxFeePerGas } = {}){
        super([
            `The provided tip (\`maxPriorityFeePerGas\`${maxPriorityFeePerGas ? ` = ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatGwei"])(maxPriorityFeePerGas)} gwei` : ''}) cannot be higher than the fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatGwei"])(maxFeePerGas)} gwei` : ''}).`
        ].join('\n'), {
            cause,
            name: 'TipAboveFeeCapError'
        });
    }
}
Object.defineProperty(TipAboveFeeCapError, "nodeMessage", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: /max priority fee per gas higher than max fee per gas|tip higher than fee cap/
});
class UnknownNodeError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ cause }){
        super(`An error occurred while executing: ${cause?.shortMessage}`, {
            cause,
            name: 'UnknownNodeError'
        });
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/errors/stateOverride.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AccountStateConflictError",
    ()=>AccountStateConflictError,
    "StateAssignmentConflictError",
    ()=>StateAssignmentConflictError,
    "prettyStateMapping",
    ()=>prettyStateMapping,
    "prettyStateOverride",
    ()=>prettyStateOverride
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
;
class AccountStateConflictError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ address }){
        super(`State for account "${address}" is set multiple times.`, {
            name: 'AccountStateConflictError'
        });
    }
}
class StateAssignmentConflictError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor(){
        super('state and stateDiff are set on the same account.', {
            name: 'StateAssignmentConflictError'
        });
    }
}
function prettyStateMapping(stateMapping) {
    return stateMapping.reduce((pretty, { slot, value })=>{
        return `${pretty}        ${slot}: ${value}\n`;
    }, '');
}
function prettyStateOverride(stateOverride) {
    return stateOverride.reduce((pretty, { address, ...state })=>{
        let val = `${pretty}    ${address}:\n`;
        if (state.nonce) val += `      nonce: ${state.nonce}\n`;
        if (state.balance) val += `      balance: ${state.balance}\n`;
        if (state.code) val += `      code: ${state.code}\n`;
        if (state.state) {
            val += '      state:\n';
            val += prettyStateMapping(state.state);
        }
        if (state.stateDiff) {
            val += '      stateDiff:\n';
            val += prettyStateMapping(state.stateDiff);
        }
        return val;
    }, '  State Override:\n').slice(0, -1);
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/errors/transaction.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FeeConflictError",
    ()=>FeeConflictError,
    "FeePayerNonceMismatchError",
    ()=>FeePayerNonceMismatchError,
    "InvalidLegacyVError",
    ()=>InvalidLegacyVError,
    "InvalidSerializableTransactionError",
    ()=>InvalidSerializableTransactionError,
    "InvalidSerializedTransactionError",
    ()=>InvalidSerializedTransactionError,
    "InvalidSerializedTransactionTypeError",
    ()=>InvalidSerializedTransactionTypeError,
    "InvalidStorageKeySizeError",
    ()=>InvalidStorageKeySizeError,
    "InvalidYParityError",
    ()=>InvalidYParityError,
    "TransactionExecutionError",
    ()=>TransactionExecutionError,
    "TransactionNotFoundError",
    ()=>TransactionNotFoundError,
    "TransactionReceiptNotFoundError",
    ()=>TransactionReceiptNotFoundError,
    "TransactionReceiptRevertedError",
    ()=>TransactionReceiptRevertedError,
    "WaitForTransactionReceiptTimeoutError",
    ()=>WaitForTransactionReceiptTimeoutError,
    "prettyPrint",
    ()=>prettyPrint
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatEther$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/unit/formatEther.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/unit/formatGwei.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
;
;
;
function prettyPrint(args) {
    const entries = Object.entries(args).map(([key, value])=>{
        if (value === undefined || value === false) return null;
        return [
            key,
            value
        ];
    }).filter(Boolean);
    const maxLength = entries.reduce((acc, [key])=>Math.max(acc, key.length), 0);
    return entries.map(([key, value])=>`  ${`${key}:`.padEnd(maxLength + 1)}  ${value}`).join('\n');
}
class FeeConflictError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor(){
        super([
            'Cannot specify both a `gasPrice` and a `maxFeePerGas`/`maxPriorityFeePerGas`.',
            'Use `maxFeePerGas`/`maxPriorityFeePerGas` for EIP-1559 compatible networks, and `gasPrice` for others.'
        ].join('\n'), {
            name: 'FeeConflictError'
        });
    }
}
class FeePayerNonceMismatchError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ filledNonce, requestedNonce }){
        super('The filled transaction nonce does not match the requested nonce.', {
            metaMessages: [
                `Requested Nonce: ${requestedNonce}`,
                `Filled Nonce: ${filledNonce}`
            ],
            name: 'FeePayerNonceMismatchError'
        });
    }
}
class InvalidLegacyVError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ v }){
        super(`Invalid \`v\` value "${v}". Expected 27 or 28.`, {
            name: 'InvalidLegacyVError'
        });
    }
}
class InvalidYParityError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ yParity }){
        super(`Invalid \`yParity\` value "${yParity}". Expected 0 or 1.`, {
            name: 'InvalidYParityError'
        });
    }
}
class InvalidSerializableTransactionError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ transaction }){
        super('Cannot infer a transaction type from provided transaction.', {
            metaMessages: [
                'Provided Transaction:',
                '{',
                prettyPrint(transaction),
                '}',
                '',
                'To infer the type, either provide:',
                '- a `type` to the Transaction, or',
                '- an EIP-1559 Transaction with `maxFeePerGas`, or',
                '- an EIP-2930 Transaction with `gasPrice` & `accessList`, or',
                '- an EIP-4844 Transaction with `blobs`, `blobVersionedHashes`, `sidecars`, or',
                '- an EIP-7702 Transaction with `authorizationList`, or',
                '- a Legacy Transaction with `gasPrice`'
            ],
            name: 'InvalidSerializableTransactionError'
        });
    }
}
class InvalidSerializedTransactionTypeError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ serializedType }){
        super(`Serialized transaction type "${serializedType}" is invalid.`, {
            name: 'InvalidSerializedTransactionType'
        });
        Object.defineProperty(this, "serializedType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.serializedType = serializedType;
    }
}
class InvalidSerializedTransactionError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ attributes, serializedTransaction, type }){
        const missing = Object.entries(attributes).map(([key, value])=>typeof value === 'undefined' ? key : undefined).filter(Boolean);
        super(`Invalid serialized transaction of type "${type}" was provided.`, {
            metaMessages: [
                `Serialized Transaction: "${serializedTransaction}"`,
                missing.length > 0 ? `Missing Attributes: ${missing.join(', ')}` : ''
            ].filter(Boolean),
            name: 'InvalidSerializedTransactionError'
        });
        Object.defineProperty(this, "serializedTransaction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.serializedTransaction = serializedTransaction;
        this.type = type;
    }
}
class InvalidStorageKeySizeError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ storageKey }){
        super(`Size for storage key "${storageKey}" is invalid. Expected 32 bytes. Got ${Math.floor((storageKey.length - 2) / 2)} bytes.`, {
            name: 'InvalidStorageKeySizeError'
        });
    }
}
class TransactionExecutionError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor(cause, { account, docsPath, chain, data, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas, nonce, to, value }){
        const prettyArgs = prettyPrint({
            chain: chain && `${chain?.name} (id: ${chain?.id})`,
            from: account?.address,
            to,
            value: typeof value !== 'undefined' && `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatEther$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatEther"])(value)} ${chain?.nativeCurrency?.symbol || 'ETH'}`,
            data,
            gas,
            gasPrice: typeof gasPrice !== 'undefined' && `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatGwei"])(gasPrice)} gwei`,
            maxFeePerGas: typeof maxFeePerGas !== 'undefined' && `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatGwei"])(maxFeePerGas)} gwei`,
            maxPriorityFeePerGas: typeof maxPriorityFeePerGas !== 'undefined' && `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatGwei$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatGwei"])(maxPriorityFeePerGas)} gwei`,
            nonce
        });
        super(cause.shortMessage, {
            cause,
            docsPath,
            metaMessages: [
                ...cause.metaMessages ? [
                    ...cause.metaMessages,
                    ' '
                ] : [],
                'Request Arguments:',
                prettyArgs
            ].filter(Boolean),
            name: 'TransactionExecutionError'
        });
        Object.defineProperty(this, "cause", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.cause = cause;
    }
}
class TransactionNotFoundError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ blockHash, blockNumber, blockTag, hash, index }){
        let identifier = 'Transaction';
        if (blockTag && index !== undefined) identifier = `Transaction at block time "${blockTag}" at index "${index}"`;
        if (blockHash && index !== undefined) identifier = `Transaction at block hash "${blockHash}" at index "${index}"`;
        if (blockNumber && index !== undefined) identifier = `Transaction at block number "${blockNumber}" at index "${index}"`;
        if (hash) identifier = `Transaction with hash "${hash}"`;
        super(`${identifier} could not be found.`, {
            name: 'TransactionNotFoundError'
        });
    }
}
class TransactionReceiptNotFoundError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ hash }){
        super(`Transaction receipt with hash "${hash}" could not be found. The Transaction may not be processed on a block yet.`, {
            name: 'TransactionReceiptNotFoundError'
        });
    }
}
class TransactionReceiptRevertedError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ receipt }){
        super(`Transaction with hash "${receipt.transactionHash}" reverted.`, {
            metaMessages: [
                'The receipt marked the transaction as "reverted". This could mean that the function on the contract you are trying to call threw an error.',
                ' ',
                'You can attempt to extract the revert reason by:',
                '- calling the `simulateContract` or `simulateCalls` Action with the `abi` and `functionName` of the contract',
                '- using the `call` Action with raw `data`'
            ],
            name: 'TransactionReceiptRevertedError'
        });
        Object.defineProperty(this, "receipt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.receipt = receipt;
    }
}
class WaitForTransactionReceiptTimeoutError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor({ hash }){
        super(`Timed out while waiting for transaction with hash "${hash}" to be confirmed.`, {
            name: 'WaitForTransactionReceiptTimeoutError'
        });
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/authorization/hashAuthorization.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hashAuthorization",
    ()=>hashAuthorization
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$concat$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/data/concat.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toBytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toBytes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toHex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toRlp$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toRlp.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$hash$2f$keccak256$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/hash/keccak256.js [app-client] (ecmascript)");
;
;
;
;
;
function hashAuthorization(parameters) {
    const { chainId, nonce, to } = parameters;
    const address = parameters.contractAddress ?? parameters.address;
    const hash = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$hash$2f$keccak256$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keccak256"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$concat$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["concatHex"])([
        '0x05',
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toRlp$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toRlp"])([
            chainId ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(chainId) : '0x',
            address,
            nonce ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(nonce) : '0x'
        ])
    ]));
    if (to === 'bytes') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toBytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToBytes"])(hash);
    return hash;
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/authorization/recoverAuthorizationAddress.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "recoverAuthorizationAddress",
    ()=>recoverAuthorizationAddress
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$signature$2f$recoverAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/signature/recoverAddress.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$authorization$2f$hashAuthorization$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/authorization/hashAuthorization.js [app-client] (ecmascript)");
;
;
async function recoverAuthorizationAddress(parameters) {
    const { authorization, signature } = parameters;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$signature$2f$recoverAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["recoverAddress"])({
        hash: (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$authorization$2f$hashAuthorization$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hashAuthorization"])(authorization),
        signature: signature ?? authorization
    });
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/blob/blobsToCommitments.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "blobsToCommitments",
    ()=>blobsToCommitments
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toBytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toBytes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toHex.js [app-client] (ecmascript)");
;
;
function blobsToCommitments(parameters) {
    const { kzg } = parameters;
    const to = parameters.to ?? (typeof parameters.blobs[0] === 'string' ? 'hex' : 'bytes');
    const blobs = typeof parameters.blobs[0] === 'string' ? parameters.blobs.map((x)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toBytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToBytes"])(x)) : parameters.blobs;
    const commitments = [];
    for (const blob of blobs)commitments.push(Uint8Array.from(kzg.blobToKzgCommitment(blob)));
    return to === 'bytes' ? commitments : commitments.map((x)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bytesToHex"])(x));
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/blob/blobsToProofs.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "blobsToProofs",
    ()=>blobsToProofs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toBytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toBytes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toHex.js [app-client] (ecmascript)");
;
;
function blobsToProofs(parameters) {
    const { kzg } = parameters;
    const to = parameters.to ?? (typeof parameters.blobs[0] === 'string' ? 'hex' : 'bytes');
    const blobs = typeof parameters.blobs[0] === 'string' ? parameters.blobs.map((x)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toBytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToBytes"])(x)) : parameters.blobs;
    const commitments = typeof parameters.commitments[0] === 'string' ? parameters.commitments.map((x)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toBytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToBytes"])(x)) : parameters.commitments;
    const proofs = [];
    for(let i = 0; i < blobs.length; i++){
        const blob = blobs[i];
        const commitment = commitments[i];
        proofs.push(Uint8Array.from(kzg.computeBlobKzgProof(blob, commitment)));
    }
    return to === 'bytes' ? proofs : proofs.map((x)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bytesToHex"])(x));
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/blob/commitmentToVersionedHash.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "commitmentToVersionedHash",
    ()=>commitmentToVersionedHash
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toHex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$hash$2f$sha256$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/hash/sha256.js [app-client] (ecmascript)");
;
;
function commitmentToVersionedHash(parameters) {
    const { commitment, version = 1 } = parameters;
    const to = parameters.to ?? (typeof commitment === 'string' ? 'hex' : 'bytes');
    const versionedHash = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$hash$2f$sha256$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sha256"])(commitment, 'bytes');
    versionedHash.set([
        version
    ], 0);
    return to === 'bytes' ? versionedHash : (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bytesToHex"])(versionedHash);
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/blob/commitmentsToVersionedHashes.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "commitmentsToVersionedHashes",
    ()=>commitmentsToVersionedHashes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$commitmentToVersionedHash$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/blob/commitmentToVersionedHash.js [app-client] (ecmascript)");
;
function commitmentsToVersionedHashes(parameters) {
    const { commitments, version } = parameters;
    const to = parameters.to ?? (typeof commitments[0] === 'string' ? 'hex' : 'bytes');
    const hashes = [];
    for (const commitment of commitments){
        hashes.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$commitmentToVersionedHash$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["commitmentToVersionedHash"])({
            commitment,
            to,
            version
        }));
    }
    return hashes;
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/blob/toBlobSidecars.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toBlobSidecars",
    ()=>toBlobSidecars
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$blobsToCommitments$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/blob/blobsToCommitments.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$blobsToProofs$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/blob/blobsToProofs.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$toBlobs$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/blob/toBlobs.js [app-client] (ecmascript)");
;
;
;
function toBlobSidecars(parameters) {
    const { data, kzg, to } = parameters;
    const blobs = parameters.blobs ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$toBlobs$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toBlobs"])({
        data: data,
        to
    });
    const commitments = parameters.commitments ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$blobsToCommitments$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["blobsToCommitments"])({
        blobs,
        kzg: kzg,
        to
    });
    const proofs = parameters.proofs ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$blob$2f$blobsToProofs$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["blobsToProofs"])({
        blobs,
        commitments,
        kzg: kzg,
        to
    });
    const sidecars = [];
    for(let i = 0; i < blobs.length; i++)sidecars.push({
        blob: blobs[i],
        commitment: commitments[i],
        proof: proofs[i]
    });
    return sidecars;
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/blob/toBlobs.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toBlobs",
    ()=>toBlobs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$blob$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/constants/blob.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$blob$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/blob.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$cursor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/cursor.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$size$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/data/size.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toBytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toBytes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toHex.js [app-client] (ecmascript)");
;
;
;
;
;
;
function toBlobs(parameters) {
    const to = parameters.to ?? (typeof parameters.data === 'string' ? 'hex' : 'bytes');
    const data = typeof parameters.data === 'string' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toBytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToBytes"])(parameters.data) : parameters.data;
    const size_ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$size$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["size"])(data);
    if (!size_) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$blob$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EmptyBlobError"]();
    if (size_ > __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$blob$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["maxBytesPerTransaction"]) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$blob$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BlobSizeTooLargeError"]({
        maxSize: __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$blob$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["maxBytesPerTransaction"],
        size: size_
    });
    const blobs = [];
    let active = true;
    let position = 0;
    while(active){
        const blob = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$cursor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCursor"])(new Uint8Array(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$blob$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bytesPerBlob"]));
        let size = 0;
        while(size < __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$blob$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fieldElementsPerBlob"]){
            const bytes = data.slice(position, position + (__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$blob$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bytesPerFieldElement"] - 1));
            // Push a zero byte so the field element doesn't overflow the BLS modulus.
            blob.pushByte(0x00);
            // Push the current segment of data bytes.
            blob.pushBytes(bytes);
            // If we detect that the current segment of data bytes is less than 31 bytes,
            // we can stop processing and push a terminator byte to indicate the end of the blob.
            if (bytes.length < 31) {
                blob.pushByte(0x80);
                active = false;
                break;
            }
            size++;
            position += 31;
        }
        blobs.push(blob);
    }
    return to === 'bytes' ? blobs.map((x)=>x.bytes) : blobs.map((x)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bytesToHex"])(x.bytes));
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/block/formatBlockParameter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatBlockParameter",
    ()=>formatBlockParameter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toHex.js [app-client] (ecmascript)");
;
;
function formatBlockParameter(parameters) {
    const { blockHash, blockNumber, blockTag, requireCanonical } = parameters;
    if (requireCanonical !== undefined && !blockHash) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"]('`requireCanonical` can only be provided when `blockHash` is set.');
    if (blockHash) return requireCanonical ? {
        blockHash,
        requireCanonical
    } : {
        blockHash
    };
    if (typeof blockNumber === 'bigint') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(blockNumber);
    return blockTag ?? 'latest';
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/chain/assertCurrentChain.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "assertCurrentChain",
    ()=>assertCurrentChain
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$chain$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/chain.js [app-client] (ecmascript)");
;
function assertCurrentChain({ chain, currentChainId }) {
    if (!chain) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$chain$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChainNotFoundError"]();
    if (currentChainId !== chain.id) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$chain$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChainMismatchError"]({
        chain,
        currentChainId
    });
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/cursor.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createCursor",
    ()=>createCursor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$cursor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/cursor.js [app-client] (ecmascript)");
;
const staticCursor = {
    bytes: new Uint8Array(),
    dataView: new DataView(new ArrayBuffer(0)),
    position: 0,
    positionReadCount: new Map(),
    recursiveReadCount: 0,
    recursiveReadLimit: Number.POSITIVE_INFINITY,
    assertReadLimit () {
        if (this.recursiveReadCount >= this.recursiveReadLimit) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$cursor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RecursiveReadLimitExceededError"]({
            count: this.recursiveReadCount + 1,
            limit: this.recursiveReadLimit
        });
    },
    assertPosition (position) {
        if (position < 0 || position > this.bytes.length - 1) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$cursor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositionOutOfBoundsError"]({
            length: this.bytes.length,
            position
        });
    },
    decrementPosition (offset) {
        if (offset < 0) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$cursor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NegativeOffsetError"]({
            offset
        });
        const position = this.position - offset;
        this.assertPosition(position);
        this.position = position;
    },
    getReadCount (position) {
        return this.positionReadCount.get(position || this.position) || 0;
    },
    incrementPosition (offset) {
        if (offset < 0) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$cursor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NegativeOffsetError"]({
            offset
        });
        const position = this.position + offset;
        this.assertPosition(position);
        this.position = position;
    },
    inspectByte (position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position);
        return this.bytes[position];
    },
    inspectBytes (length, position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + length - 1);
        return this.bytes.subarray(position, position + length);
    },
    inspectUint8 (position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position);
        return this.bytes[position];
    },
    inspectUint16 (position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + 1);
        return this.dataView.getUint16(position);
    },
    inspectUint24 (position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + 2);
        return (this.dataView.getUint16(position) << 8) + this.dataView.getUint8(position + 2);
    },
    inspectUint32 (position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + 3);
        return this.dataView.getUint32(position);
    },
    pushByte (byte) {
        this.assertPosition(this.position);
        this.bytes[this.position] = byte;
        this.position++;
    },
    pushBytes (bytes) {
        this.assertPosition(this.position + bytes.length - 1);
        this.bytes.set(bytes, this.position);
        this.position += bytes.length;
    },
    pushUint8 (value) {
        this.assertPosition(this.position);
        this.bytes[this.position] = value;
        this.position++;
    },
    pushUint16 (value) {
        this.assertPosition(this.position + 1);
        this.dataView.setUint16(this.position, value);
        this.position += 2;
    },
    pushUint24 (value) {
        this.assertPosition(this.position + 2);
        this.dataView.setUint16(this.position, value >> 8);
        this.dataView.setUint8(this.position + 2, value & ~4294967040);
        this.position += 3;
    },
    pushUint32 (value) {
        this.assertPosition(this.position + 3);
        this.dataView.setUint32(this.position, value);
        this.position += 4;
    },
    readByte () {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectByte();
        this.position++;
        return value;
    },
    readBytes (length, size) {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectBytes(length);
        this.position += size ?? length;
        return value;
    },
    readUint8 () {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint8();
        this.position += 1;
        return value;
    },
    readUint16 () {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint16();
        this.position += 2;
        return value;
    },
    readUint24 () {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint24();
        this.position += 3;
        return value;
    },
    readUint32 () {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint32();
        this.position += 4;
        return value;
    },
    get remaining () {
        return this.bytes.length - this.position;
    },
    setPosition (position) {
        const oldPosition = this.position;
        this.assertPosition(position);
        this.position = position;
        return ()=>this.position = oldPosition;
    },
    _touch () {
        if (this.recursiveReadLimit === Number.POSITIVE_INFINITY) return;
        const count = this.getReadCount();
        this.positionReadCount.set(this.position, count + 1);
        if (count > 0) this.recursiveReadCount++;
    }
};
function createCursor(bytes, { recursiveReadLimit = 8_192 } = {}) {
    const cursor = Object.create(staticCursor);
    cursor.bytes = bytes;
    cursor.dataView = new DataView(bytes.buffer ?? bytes, bytes.byteOffset, bytes.byteLength);
    cursor.positionReadCount = new Map();
    cursor.recursiveReadLimit = recursiveReadLimit;
    return cursor;
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/data/concat.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "concat",
    ()=>concat,
    "concatBytes",
    ()=>concatBytes,
    "concatHex",
    ()=>concatHex
]);
function concat(values) {
    if (typeof values[0] === 'string') return concatHex(values);
    return concatBytes(values);
}
function concatBytes(values) {
    let length = 0;
    for (const arr of values){
        length += arr.length;
    }
    const result = new Uint8Array(length);
    let offset = 0;
    for (const arr of values){
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}
function concatHex(values) {
    return `0x${values.reduce((acc, x)=>acc + x.replace('0x', ''), '')}`;
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toRlp.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bytesToRlp",
    ()=>bytesToRlp,
    "hexToRlp",
    ()=>hexToRlp,
    "toRlp",
    ()=>toRlp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$cursor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/cursor.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toBytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toBytes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toHex.js [app-client] (ecmascript)");
;
;
;
;
function toRlp(bytes, to = 'hex') {
    const encodable = getEncodable(bytes);
    const cursor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$cursor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCursor"])(new Uint8Array(encodable.length));
    encodable.encode(cursor);
    if (to === 'hex') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bytesToHex"])(cursor.bytes);
    return cursor.bytes;
}
function bytesToRlp(bytes, to = 'bytes') {
    return toRlp(bytes, to);
}
function hexToRlp(hex, to = 'hex') {
    return toRlp(hex, to);
}
function getEncodable(bytes) {
    if (Array.isArray(bytes)) return getEncodableList(bytes.map((x)=>getEncodable(x)));
    return getEncodableBytes(bytes);
}
function getEncodableList(list) {
    const bodyLength = list.reduce((acc, x)=>acc + x.length, 0);
    const sizeOfBodyLength = getSizeOfLength(bodyLength);
    const length = (()=>{
        if (bodyLength <= 55) return 1 + bodyLength;
        return 1 + sizeOfBodyLength + bodyLength;
    })();
    return {
        length,
        encode (cursor) {
            if (bodyLength <= 55) {
                cursor.pushByte(0xc0 + bodyLength);
            } else {
                cursor.pushByte(0xc0 + 55 + sizeOfBodyLength);
                if (sizeOfBodyLength === 1) cursor.pushUint8(bodyLength);
                else if (sizeOfBodyLength === 2) cursor.pushUint16(bodyLength);
                else if (sizeOfBodyLength === 3) cursor.pushUint24(bodyLength);
                else cursor.pushUint32(bodyLength);
            }
            for (const { encode } of list){
                encode(cursor);
            }
        }
    };
}
function getEncodableBytes(bytesOrHex) {
    const bytes = typeof bytesOrHex === 'string' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toBytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToBytes"])(bytesOrHex) : bytesOrHex;
    const sizeOfBytesLength = getSizeOfLength(bytes.length);
    const length = (()=>{
        if (bytes.length === 1 && bytes[0] < 0x80) return 1;
        if (bytes.length <= 55) return 1 + bytes.length;
        return 1 + sizeOfBytesLength + bytes.length;
    })();
    return {
        length,
        encode (cursor) {
            if (bytes.length === 1 && bytes[0] < 0x80) {
                cursor.pushBytes(bytes);
            } else if (bytes.length <= 55) {
                cursor.pushByte(0x80 + bytes.length);
                cursor.pushBytes(bytes);
            } else {
                cursor.pushByte(0x80 + 55 + sizeOfBytesLength);
                if (sizeOfBytesLength === 1) cursor.pushUint8(bytes.length);
                else if (sizeOfBytesLength === 2) cursor.pushUint16(bytes.length);
                else if (sizeOfBytesLength === 3) cursor.pushUint24(bytes.length);
                else cursor.pushUint32(bytes.length);
                cursor.pushBytes(bytes);
            }
        }
    };
}
function getSizeOfLength(length) {
    if (length < 2 ** 8) return 1;
    if (length < 2 ** 16) return 2;
    if (length < 2 ** 24) return 3;
    if (length < 2 ** 32) return 4;
    throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"]('Length is too large.');
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/errors/getEstimateGasError.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getEstimateGasError",
    ()=>getEstimateGasError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$estimateGas$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/estimateGas.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/node.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$errors$2f$getNodeError$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/errors/getNodeError.js [app-client] (ecmascript)");
;
;
;
function getEstimateGasError(err, { docsPath, ...args }) {
    const cause = (()=>{
        const cause = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$errors$2f$getNodeError$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getNodeError"])(err, args);
        if (cause instanceof __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UnknownNodeError"]) return err;
        return cause;
    })();
    return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$estimateGas$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EstimateGasExecutionError"](cause, {
        docsPath,
        ...args
    });
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/errors/getNodeError.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "containsNodeError",
    ()=>containsNodeError,
    "getNodeError",
    ()=>getNodeError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/base.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/node.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$request$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/request.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$rpc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/rpc.js [app-client] (ecmascript)");
;
;
;
;
function containsNodeError(err) {
    return err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$rpc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TransactionRejectedRpcError"] || err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$rpc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidInputRpcError"] || err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$request$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RpcRequestError"] && err.code === __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExecutionRevertedError"].code;
}
function getNodeError(err, args) {
    const message = (err.details || '').toLowerCase();
    const executionRevertedError = err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] ? err.walk((e)=>e?.code === __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExecutionRevertedError"].code) : err;
    if (executionRevertedError instanceof __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"]) return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExecutionRevertedError"]({
        cause: err,
        message: executionRevertedError.details
    });
    if (__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExecutionRevertedError"].nodeMessage.test(message)) return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExecutionRevertedError"]({
        cause: err,
        message: err.details
    });
    if (__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FeeCapTooHighError"].nodeMessage.test(message)) return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FeeCapTooHighError"]({
        cause: err,
        maxFeePerGas: args?.maxFeePerGas
    });
    if (__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FeeCapTooLowError"].nodeMessage.test(message)) return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FeeCapTooLowError"]({
        cause: err,
        maxFeePerGas: args?.maxFeePerGas
    });
    if (__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonceTooHighError"].nodeMessage.test(message)) return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonceTooHighError"]({
        cause: err,
        nonce: args?.nonce
    });
    if (__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonceTooLowError"].nodeMessage.test(message)) return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonceTooLowError"]({
        cause: err,
        nonce: args?.nonce
    });
    if (__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonceMaxValueError"].nodeMessage.test(message)) return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonceMaxValueError"]({
        cause: err,
        nonce: args?.nonce
    });
    if (__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InsufficientFundsError"].nodeMessage.test(message)) return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InsufficientFundsError"]({
        cause: err
    });
    if (__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IntrinsicGasTooHighError"].nodeMessage.test(message)) return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IntrinsicGasTooHighError"]({
        cause: err,
        gas: args?.gas
    });
    if (__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IntrinsicGasTooLowError"].nodeMessage.test(message)) return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IntrinsicGasTooLowError"]({
        cause: err,
        gas: args?.gas
    });
    if (__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TransactionTypeNotSupportedError"].nodeMessage.test(message)) return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TransactionTypeNotSupportedError"]({
        cause: err
    });
    if (__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TipAboveFeeCapError"].nodeMessage.test(message)) return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TipAboveFeeCapError"]({
        cause: err,
        maxFeePerGas: args?.maxFeePerGas,
        maxPriorityFeePerGas: args?.maxPriorityFeePerGas
    });
    return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UnknownNodeError"]({
        cause: err
    });
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/errors/getTransactionError.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTransactionError",
    ()=>getTransactionError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/node.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/transaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$errors$2f$getNodeError$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/errors/getNodeError.js [app-client] (ecmascript)");
;
;
;
function getTransactionError(err, { docsPath, ...args }) {
    const cause = (()=>{
        const cause = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$errors$2f$getNodeError$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getNodeError"])(err, args);
        if (cause instanceof __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UnknownNodeError"]) return err;
        return cause;
    })();
    return new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TransactionExecutionError"](cause, {
        docsPath,
        ...args
    });
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/block.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "defineBlock",
    ()=>defineBlock,
    "formatBlock",
    ()=>formatBlock
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/transaction.js [app-client] (ecmascript)");
;
;
function formatBlock(block, _) {
    const transactions = (block.transactions ?? []).map((transaction)=>{
        if (typeof transaction === 'string') return transaction;
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatTransaction"])(transaction);
    });
    return {
        ...block,
        baseFeePerGas: block.baseFeePerGas ? BigInt(block.baseFeePerGas) : null,
        blobGasUsed: block.blobGasUsed ? BigInt(block.blobGasUsed) : undefined,
        difficulty: block.difficulty ? BigInt(block.difficulty) : undefined,
        excessBlobGas: block.excessBlobGas ? BigInt(block.excessBlobGas) : undefined,
        gasLimit: block.gasLimit ? BigInt(block.gasLimit) : undefined,
        gasUsed: block.gasUsed ? BigInt(block.gasUsed) : undefined,
        hash: block.hash ? block.hash : null,
        logsBloom: block.logsBloom ? block.logsBloom : null,
        nonce: block.nonce ? block.nonce : null,
        number: block.number ? BigInt(block.number) : null,
        size: block.size ? BigInt(block.size) : undefined,
        timestamp: block.timestamp ? BigInt(block.timestamp) : undefined,
        transactions,
        totalDifficulty: block.totalDifficulty ? BigInt(block.totalDifficulty) : null
    };
}
const defineBlock = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defineFormatter"])('block', formatBlock);
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/extract.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @description Picks out the keys from `value` that exist in the formatter..
 */ __turbopack_context__.s([
    "extract",
    ()=>extract
]);
function extract(value_, { format }) {
    if (!format) return {};
    const value = {};
    function extract_(formatted) {
        const keys = Object.keys(formatted);
        for (const key of keys){
            if (key in value_) value[key] = value_[key];
            if (formatted[key] && typeof formatted[key] === 'object' && !Array.isArray(formatted[key])) extract_(formatted[key]);
        }
    }
    const formatted = format(value_ || {});
    extract_(formatted);
    return value;
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "defineFormatter",
    ()=>defineFormatter
]);
function defineFormatter(type, format) {
    return ({ exclude, format: overrides })=>{
        return {
            exclude,
            format: (args, action)=>{
                const formatted = format(args, action);
                if (exclude) {
                    for (const key of exclude){
                        delete formatted[key];
                    }
                }
                return {
                    ...formatted,
                    ...overrides(args, action)
                };
            },
            type
        };
    };
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/transaction.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "defineTransaction",
    ()=>defineTransaction,
    "formatTransaction",
    ()=>formatTransaction,
    "transactionType",
    ()=>transactionType
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$fromHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/fromHex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/formatter.js [app-client] (ecmascript)");
;
;
const transactionType = {
    '0x0': 'legacy',
    '0x1': 'eip2930',
    '0x2': 'eip1559',
    '0x3': 'eip4844',
    '0x4': 'eip7702'
};
function formatTransaction(transaction, _) {
    const transaction_ = {
        ...transaction,
        blockHash: transaction.blockHash ? transaction.blockHash : null,
        blockNumber: transaction.blockNumber ? BigInt(transaction.blockNumber) : null,
        ...transaction.blockTimestamp != null && {
            blockTimestamp: BigInt(transaction.blockTimestamp)
        },
        chainId: transaction.chainId ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$fromHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToNumber"])(transaction.chainId) : undefined,
        gas: transaction.gas ? BigInt(transaction.gas) : undefined,
        gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice) : undefined,
        maxFeePerBlobGas: transaction.maxFeePerBlobGas ? BigInt(transaction.maxFeePerBlobGas) : undefined,
        maxFeePerGas: transaction.maxFeePerGas ? BigInt(transaction.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ? BigInt(transaction.maxPriorityFeePerGas) : undefined,
        nonce: transaction.nonce ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$fromHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToNumber"])(transaction.nonce) : undefined,
        to: transaction.to ? transaction.to : null,
        transactionIndex: transaction.transactionIndex ? Number(transaction.transactionIndex) : null,
        type: transaction.type ? transactionType[transaction.type] : undefined,
        typeHex: transaction.type ? transaction.type : undefined,
        value: transaction.value ? BigInt(transaction.value) : undefined,
        v: transaction.v ? BigInt(transaction.v) : undefined
    };
    if (transaction.authorizationList) transaction_.authorizationList = formatAuthorizationList(transaction.authorizationList);
    transaction_.yParity = (()=>{
        // If `yParity` is provided, we will use it.
        if (transaction.yParity) return Number(transaction.yParity);
        // If no `yParity` provided, try derive from `v`.
        if (typeof transaction_.v === 'bigint') {
            if (transaction_.v === 0n || transaction_.v === 27n) return 0;
            if (transaction_.v === 1n || transaction_.v === 28n) return 1;
            if (transaction_.v >= 35n) return transaction_.v % 2n === 0n ? 1 : 0;
        }
        return undefined;
    })();
    if (transaction_.type === 'legacy') {
        delete transaction_.accessList;
        delete transaction_.maxFeePerBlobGas;
        delete transaction_.maxFeePerGas;
        delete transaction_.maxPriorityFeePerGas;
        delete transaction_.yParity;
    }
    if (transaction_.type === 'eip2930') {
        delete transaction_.maxFeePerBlobGas;
        delete transaction_.maxFeePerGas;
        delete transaction_.maxPriorityFeePerGas;
    }
    if (transaction_.type === 'eip1559') delete transaction_.maxFeePerBlobGas;
    return transaction_;
}
const defineTransaction = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defineFormatter"])('transaction', formatTransaction);
//////////////////////////////////////////////////////////////////////////////
function formatAuthorizationList(authorizationList) {
    return authorizationList.map((authorization)=>({
            address: authorization.address,
            chainId: Number(authorization.chainId),
            nonce: Number(authorization.nonce),
            r: authorization.r,
            s: authorization.s,
            yParity: Number(authorization.yParity)
        }));
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/transactionRequest.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "defineTransactionRequest",
    ()=>defineTransactionRequest,
    "formatTransactionRequest",
    ()=>formatTransactionRequest,
    "rpcTransactionType",
    ()=>rpcTransactionType
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toHex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/formatters/formatter.js [app-client] (ecmascript)");
;
;
const rpcTransactionType = {
    legacy: '0x0',
    eip2930: '0x1',
    eip1559: '0x2',
    eip4844: '0x3',
    eip7702: '0x4'
};
function formatTransactionRequest(request, _) {
    const rpcRequest = {};
    if (typeof request.authorizationList !== 'undefined') rpcRequest.authorizationList = formatAuthorizationList(request.authorizationList);
    if (typeof request.accessList !== 'undefined') rpcRequest.accessList = request.accessList;
    if (typeof request.blobVersionedHashes !== 'undefined') rpcRequest.blobVersionedHashes = request.blobVersionedHashes;
    if (typeof request.blobs !== 'undefined') {
        if (typeof request.blobs[0] !== 'string') rpcRequest.blobs = request.blobs.map((x)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bytesToHex"])(x));
        else rpcRequest.blobs = request.blobs;
    }
    if (typeof request.data !== 'undefined') rpcRequest.data = request.data;
    if (request.account) rpcRequest.from = request.account.address;
    if (typeof request.from !== 'undefined') rpcRequest.from = request.from;
    if (typeof request.gas !== 'undefined') rpcRequest.gas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(request.gas);
    if (typeof request.gasPrice !== 'undefined') rpcRequest.gasPrice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(request.gasPrice);
    if (typeof request.maxFeePerBlobGas !== 'undefined') rpcRequest.maxFeePerBlobGas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(request.maxFeePerBlobGas);
    if (typeof request.maxFeePerGas !== 'undefined') rpcRequest.maxFeePerGas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(request.maxFeePerGas);
    if (typeof request.maxPriorityFeePerGas !== 'undefined') rpcRequest.maxPriorityFeePerGas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(request.maxPriorityFeePerGas);
    if (typeof request.nonce !== 'undefined') rpcRequest.nonce = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(request.nonce);
    if (typeof request.to !== 'undefined') rpcRequest.to = request.to;
    if (typeof request.type !== 'undefined') rpcRequest.type = rpcTransactionType[request.type];
    if (typeof request.value !== 'undefined') rpcRequest.value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(request.value);
    return rpcRequest;
}
const defineTransactionRequest = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$formatters$2f$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defineFormatter"])('transactionRequest', formatTransactionRequest);
//////////////////////////////////////////////////////////////////////////////
function formatAuthorizationList(authorizationList) {
    return authorizationList.map((authorization)=>({
            address: authorization.address,
            r: authorization.r ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(BigInt(authorization.r)) : authorization.r,
            s: authorization.s ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(BigInt(authorization.s)) : authorization.s,
            chainId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(authorization.chainId),
            nonce: (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(authorization.nonce),
            ...typeof authorization.yParity !== 'undefined' ? {
                yParity: (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(authorization.yParity)
            } : {},
            ...typeof authorization.v !== 'undefined' && typeof authorization.yParity === 'undefined' ? {
                v: (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(authorization.v)
            } : {}
        }));
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/getAction.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Retrieves and returns an action from the client (if exists), and falls
 * back to the tree-shakable action.
 *
 * Useful for extracting overridden actions from a client (ie. if a consumer
 * wants to override the `sendTransaction` implementation).
 */ __turbopack_context__.s([
    "getAction",
    ()=>getAction
]);
function getAction(client, actionFn, // Some minifiers drop `Function.prototype.name`, or replace it with short letters,
// meaning that `actionFn.name` will not always work. For that case, the consumer
// needs to pass the name explicitly.
name) {
    const action_implicit = client[actionFn.name];
    if (typeof action_implicit === 'function') return action_implicit;
    const action_explicit = client[name];
    if (typeof action_explicit === 'function') return action_explicit;
    return (params)=>actionFn(client, params);
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/hash/sha256.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sha256",
    ()=>sha256
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$sha256$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@noble/hashes/esm/sha256.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$isHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/data/isHex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toBytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toBytes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toHex.js [app-client] (ecmascript)");
;
;
;
;
function sha256(value, to_) {
    const to = to_ || 'hex';
    const bytes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$noble$2f$hashes$2f$esm$2f$sha256$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sha256"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$isHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isHex"])(value, {
        strict: false
    }) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toBytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toBytes"])(value) : value);
    if (to === 'bytes') return bytes;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toHex"])(bytes);
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/signature/recoverAddress.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "recoverAddress",
    ()=>recoverAddress
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$publicKeyToAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/accounts/utils/publicKeyToAddress.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$signature$2f$recoverPublicKey$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/signature/recoverPublicKey.js [app-client] (ecmascript)");
;
;
async function recoverAddress({ hash, signature }) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$publicKeyToAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["publicKeyToAddress"])(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$signature$2f$recoverPublicKey$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["recoverPublicKey"])({
        hash,
        signature
    }));
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/signature/recoverPublicKey.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "recoverPublicKey",
    ()=>recoverPublicKey
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$isHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/data/isHex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$size$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/data/size.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$fromHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/fromHex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toHex.js [app-client] (ecmascript)");
;
;
;
;
async function recoverPublicKey({ hash, signature }) {
    const hashHex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$isHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isHex"])(hash) ? hash : (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toHex"])(hash);
    const { secp256k1 } = await __turbopack_context__.A("[project]/avax-frontend/node_modules/@noble/curves/esm/secp256k1.js [app-client] (ecmascript, async loader)");
    const signature_ = (()=>{
        // typeof signature: `Signature`
        if (typeof signature === 'object' && 'r' in signature && 's' in signature) {
            const { r, s, v, yParity } = signature;
            const yParityOrV = Number(yParity ?? v);
            const recoveryBit = toRecoveryBit(yParityOrV);
            return new secp256k1.Signature((0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$fromHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToBigInt"])(r), (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$fromHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToBigInt"])(s)).addRecoveryBit(recoveryBit);
        }
        // typeof signature: `Hex | ByteArray`
        const signatureHex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$isHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isHex"])(signature) ? signature : (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toHex"])(signature);
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$data$2f$size$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["size"])(signatureHex) !== 65) throw new Error('invalid signature length');
        const yParityOrV = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$fromHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hexToNumber"])(`0x${signatureHex.slice(130)}`);
        const recoveryBit = toRecoveryBit(yParityOrV);
        return secp256k1.Signature.fromCompact(signatureHex.substring(2, 130)).addRecoveryBit(recoveryBit);
    })();
    const publicKey = signature_.recoverPublicKey(hashHex.substring(2)).toHex(false);
    return `0x${publicKey}`;
}
function toRecoveryBit(yParityOrV) {
    if (yParityOrV === 0 || yParityOrV === 1) return yParityOrV;
    if (yParityOrV === 27) return 0;
    if (yParityOrV === 28) return 1;
    throw new Error('Invalid yParityOrV value');
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/stateOverride.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "serializeAccountStateOverride",
    ()=>serializeAccountStateOverride,
    "serializeStateMapping",
    ()=>serializeStateMapping,
    "serializeStateOverride",
    ()=>serializeStateOverride
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$address$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/address.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$data$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/data.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$stateOverride$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/stateOverride.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$address$2f$isAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/address/isAddress.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/encoding/toHex.js [app-client] (ecmascript)");
;
;
;
;
;
function serializeStateMapping(stateMapping) {
    if (!stateMapping || stateMapping.length === 0) return undefined;
    return stateMapping.reduce((acc, { slot, value })=>{
        if (slot.length !== 66) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$data$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidBytesLengthError"]({
            size: slot.length,
            targetSize: 66,
            type: 'hex'
        });
        if (value.length !== 66) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$data$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidBytesLengthError"]({
            size: value.length,
            targetSize: 66,
            type: 'hex'
        });
        acc[slot] = value;
        return acc;
    }, {});
}
function serializeAccountStateOverride(parameters) {
    const { balance, nonce, state, stateDiff, code } = parameters;
    const rpcAccountStateOverride = {};
    if (code !== undefined) rpcAccountStateOverride.code = code;
    if (balance !== undefined) rpcAccountStateOverride.balance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(balance);
    if (nonce !== undefined) rpcAccountStateOverride.nonce = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$encoding$2f$toHex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberToHex"])(nonce);
    if (state !== undefined) rpcAccountStateOverride.state = serializeStateMapping(state);
    if (stateDiff !== undefined) {
        if (rpcAccountStateOverride.state) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$stateOverride$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateAssignmentConflictError"]();
        rpcAccountStateOverride.stateDiff = serializeStateMapping(stateDiff);
    }
    return rpcAccountStateOverride;
}
function serializeStateOverride(parameters) {
    if (!parameters) return undefined;
    const rpcStateOverride = {};
    for (const { address, ...accountState } of parameters){
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$address$2f$isAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAddress"])(address, {
            strict: false
        })) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$address$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidAddressError"]({
            address
        });
        if (rpcStateOverride[address]) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$stateOverride$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AccountStateConflictError"]({
            address: address
        });
        rpcStateOverride[address] = serializeAccountStateOverride(accountState);
    }
    return rpcStateOverride;
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/transaction/assertRequest.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "assertRequest",
    ()=>assertRequest
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/accounts/utils/parseAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$number$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/constants/number.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$address$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/address.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/node.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$address$2f$isAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/address/isAddress.js [app-client] (ecmascript)");
;
;
;
;
;
function assertRequest(args) {
    const { account: account_, maxFeePerGas, maxPriorityFeePerGas, to } = args;
    const account = account_ ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseAccount"])(account_) : undefined;
    if (account && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$address$2f$isAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAddress"])(account.address)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$address$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidAddressError"]({
        address: account.address
    });
    if (to && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$address$2f$isAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAddress"])(to)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$address$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidAddressError"]({
        address: to
    });
    if (maxFeePerGas && maxFeePerGas > __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$constants$2f$number$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["maxUint256"]) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FeeCapTooHighError"]({
        maxFeePerGas
    });
    if (maxPriorityFeePerGas && maxFeePerGas && maxPriorityFeePerGas > maxFeePerGas) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$node$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TipAboveFeeCapError"]({
        maxFeePerGas,
        maxPriorityFeePerGas
    });
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/transaction/getTransactionType.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTransactionType",
    ()=>getTransactionType
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/errors/transaction.js [app-client] (ecmascript)");
;
function getTransactionType(transaction) {
    if (transaction.type) return transaction.type;
    if (typeof transaction.authorizationList !== 'undefined') return 'eip7702';
    if (typeof transaction.blobs !== 'undefined' || typeof transaction.blobVersionedHashes !== 'undefined' || typeof transaction.maxFeePerBlobGas !== 'undefined' || typeof transaction.sidecars !== 'undefined') return 'eip4844';
    if (typeof transaction.maxFeePerGas !== 'undefined' || typeof transaction.maxPriorityFeePerGas !== 'undefined') {
        return 'eip1559';
    }
    if (typeof transaction.gasPrice !== 'undefined') {
        if (typeof transaction.accessList !== 'undefined') return 'eip2930';
        return 'legacy';
    }
    throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$errors$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidSerializableTransactionError"]({
        transaction
    });
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/unit/Value.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "format",
    ()=>format,
    "formatEther",
    ()=>formatEther,
    "formatGwei",
    ()=>formatGwei,
    "from",
    ()=>from,
    "fromEther",
    ()=>fromEther,
    "fromGwei",
    ()=>fromGwei
]);
// Adapted from the Ox v1 `Value` module.
/** @see https://ethereum.github.io/yellowpaper/paper.pdf */ const exponents = {
    wei: 0,
    gwei: 9,
    szabo: 12,
    finney: 15,
    ether: 18
};
function format(value, decimals = 0) {
    if (!Number.isInteger(decimals) || decimals < 0) throw new InvalidDecimalsError({
        decimals
    });
    let display = value.toString();
    const negative = display.startsWith('-');
    if (negative) display = display.slice(1);
    display = display.padStart(decimals, '0');
    let [integer, fraction] = [
        display.slice(0, display.length - decimals),
        display.slice(display.length - decimals)
    ];
    fraction = fraction.replace(/(0+)$/, '');
    return `${negative ? '-' : ''}${integer || '0'}${fraction ? `.${fraction}` : ''}`;
}
function formatEther(wei, unit = 'wei') {
    return format(wei, exponents.ether - exponents[unit]);
}
function formatGwei(wei, unit = 'wei') {
    return format(wei, exponents.gwei - exponents[unit]);
}
function from(value, decimals = 0) {
    if (!Number.isInteger(decimals) || decimals < 0) throw new InvalidDecimalsError({
        decimals
    });
    // Require at least one digit overall. Rejects '', '.', '-', '-.' which
    // the previous regex accepted (and which then either produced garbage or
    // threw a raw `SyntaxError` from `BigInt('')`).
    if (!/^-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(value)) throw new InvalidDecimalNumberError({
        value
    });
    let [integer = '', fraction = '0'] = value.split('.');
    const negative = integer.startsWith('-');
    if (negative) integer = integer.slice(1);
    if (integer === '') integer = '0';
    // trim trailing zeros.
    fraction = fraction.replace(/(0+)$/, '');
    // round off if the fraction is larger than the number of decimals.
    if (decimals === 0) {
        // Round half-away-from-zero by inspecting the first fractional digit.
        if (fraction.length > 0 && Number.parseInt(fraction[0], 10) >= 5) integer = `${BigInt(integer) + 1n}`;
        fraction = '';
    } else if (fraction.length > decimals) {
        const left = fraction.slice(0, decimals);
        const roundDigit = Number.parseInt(fraction.slice(decimals, decimals + 1), 10);
        if (roundDigit >= 5) {
            // Carry through the truncated fraction digits into the integer part
            // without converting to a JS Number (avoids float precision loss).
            const carried = carry(left);
            if (carried.length > decimals) {
                // Carry overflowed into the integer part.
                fraction = carried.slice(1);
                integer = `${BigInt(integer) + 1n}`;
            } else {
                fraction = carried;
            }
        } else {
            fraction = left;
        }
    } else {
        fraction = fraction.padEnd(decimals, '0');
    }
    return BigInt(`${negative ? '-' : ''}${integer}${fraction}`);
}
/**
 * Adds 1 to a digit string with carry, returning a string of the same length
 * unless the carry overflows past the most-significant digit (in which case
 * the returned string is one digit longer).
 *
 * @internal
 */ function carry(digits) {
    const out = digits.split('');
    let i = out.length - 1;
    while(i >= 0){
        const d = Number.parseInt(out[i], 10) + 1;
        if (d < 10) {
            out[i] = String(d);
            return out.join('');
        }
        out[i] = '0';
        i--;
    }
    return `1${out.join('')}`;
}
function fromEther(ether, unit = 'wei') {
    return from(ether, exponents.ether - exponents[unit]);
}
function fromGwei(gwei, unit = 'wei') {
    return from(gwei, exponents.gwei - exponents[unit]);
}
/**
 * Thrown when a value is not a valid decimal number.
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 *
 * Value.fromEther('123.456.789')
 * // @error: Value.InvalidDecimalNumberError: Value `123.456.789` is not a valid decimal number.
 * ```
 */ class InvalidDecimalNumberError extends Error {
    constructor({ value }){
        super(`Value \`${value}\` is not a valid decimal number.`);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Value.InvalidDecimalNumberError'
        });
    }
}
/**
 * Thrown when the `decimals` argument is not a non-negative integer.
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 *
 * Value.from('1', -1)
 * // @error: Value.InvalidDecimalsError: `decimals` must be a non-negative integer. Got `-1`.
 * ```
 */ class InvalidDecimalsError extends Error {
    constructor({ decimals }){
        super(`\`decimals\` must be a non-negative integer. Got \`${decimals}\`.`);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Value.InvalidDecimalsError'
        });
    }
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/unit/formatEther.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatEther",
    ()=>formatEther
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$Value$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/unit/Value.js [app-client] (ecmascript)");
;
function formatEther(wei, unit = 'wei') {
    return __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$Value$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatEther"](wei, unit);
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/unit/formatGwei.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatGwei",
    ()=>formatGwei
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$Value$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/unit/Value.js [app-client] (ecmascript)");
;
function formatGwei(wei, unit = 'wei') {
    return __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$Value$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatGwei"](wei, unit);
}
}),
"[project]/avax-frontend/node_modules/viem/_esm/utils/unit/parseEther.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseEther",
    ()=>parseEther
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$Value$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/unit/Value.js [app-client] (ecmascript)");
;
function parseEther(ether, unit = 'wei') {
    return __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$Value$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fromEther"](ether, unit);
}
}),
"[project]/avax-frontend/node_modules/wagmi/dist/esm/errors/base.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BaseError",
    ()=>BaseError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/errors/base.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$utils$2f$getVersion$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/utils/getVersion.js [app-client] (ecmascript)");
;
;
class BaseError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor(){
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'WagmiError'
        });
    }
    get docsBaseUrl() {
        return 'https://wagmi.sh/react';
    }
    get version() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$utils$2f$getVersion$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getVersion"])();
    }
}
}),
"[project]/avax-frontend/node_modules/wagmi/dist/esm/errors/context.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WagmiProviderNotFoundError",
    ()=>WagmiProviderNotFoundError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/errors/base.js [app-client] (ecmascript)");
;
class WagmiProviderNotFoundError extends __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$errors$2f$base$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseError"] {
    constructor(){
        super('`useConfig` must be used within `WagmiProvider`.', {
            docsPath: '/api/WagmiProvider'
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'WagmiProviderNotFoundError'
        });
    }
}
}),
"[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useChains.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useChains",
    ()=>useChains
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$getChains$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/getChains.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$watchChains$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/watchChains.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useConfig$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useConfig.js [app-client] (ecmascript)");
'use client';
;
;
;
;
function useChains(parameters = {}) {
    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useConfig$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConfig"])(parameters);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"])({
        "useChains.useSyncExternalStore": (onChange)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$watchChains$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["watchChains"])(config, {
                onChange
            })
    }["useChains.useSyncExternalStore"], {
        "useChains.useSyncExternalStore": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$getChains$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChains"])(config)
    }["useChains.useSyncExternalStore"], {
        "useChains.useSyncExternalStore": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$getChains$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChains"])(config)
    }["useChains.useSyncExternalStore"]);
}
}),
"[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useConfig.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useConfig",
    ()=>useConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$context$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/context.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$errors$2f$context$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/errors/context.js [app-client] (ecmascript)");
'use client';
;
;
;
function useConfig(parameters = {}) {
    // biome-ignore lint/correctness/useHookAtTopLevel: false alarm
    const config = parameters.config ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$context$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WagmiContext"]);
    if (!config) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$errors$2f$context$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WagmiProviderNotFoundError"]();
    return config;
}
}),
"[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useConnection.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useConnection",
    ()=>useConnection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$getConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/getConnection.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$watchConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/watchConnection.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useConfig$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useConfig.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useSyncExternalStoreWithTracked$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useSyncExternalStoreWithTracked.js [app-client] (ecmascript)");
'use client';
;
;
;
function useConnection(parameters = {}) {
    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useConfig$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConfig"])(parameters);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useSyncExternalStoreWithTracked$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStoreWithTracked"])({
        "useConnection.useSyncExternalStoreWithTracked": (onChange)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$watchConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["watchConnection"])(config, {
                onChange
            })
    }["useConnection.useSyncExternalStoreWithTracked"], {
        "useConnection.useSyncExternalStoreWithTracked": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$getConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getConnection"])(config)
    }["useConnection.useSyncExternalStoreWithTracked"]);
}
}),
"[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useConnection.js [app-client] (ecmascript) <export useConnection as useAccount>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAccount",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConnection"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useConnection.js [app-client] (ecmascript)");
}),
"[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useSendTransaction.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSendTransaction",
    ()=>useSendTransaction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@tanstack/react-query/build/modern/useMutation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$query$2f$sendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/query/sendTransaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useConfig$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useConfig.js [app-client] (ecmascript)");
'use client';
;
;
;
function useSendTransaction(parameters = {}) {
    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useConfig$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConfig"])(parameters);
    const options = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$query$2f$sendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sendTransactionMutationOptions"])(config, parameters);
    const mutation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])(options);
    return {
        ...mutation,
        sendTransaction: mutation.mutate,
        sendTransactionAsync: mutation.mutateAsync
    };
}
}),
"[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useSwitchChain.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSwitchChain",
    ()=>useSwitchChain
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/@tanstack/react-query/build/modern/useMutation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$query$2f$switchChain$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/query/switchChain.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useChains$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useChains.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useConfig$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useConfig.js [app-client] (ecmascript)");
'use client';
;
;
;
;
function useSwitchChain(parameters = {}) {
    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useConfig$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConfig"])(parameters);
    const options = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$query$2f$switchChain$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["switchChainMutationOptions"])(config, parameters);
    const mutation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])(options);
    return {
        ...mutation,
        chains: (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useChains$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChains"])({
            config
        }),
        switchChain: mutation.mutate,
        switchChainAsync: mutation.mutateAsync
    };
}
}),
"[project]/avax-frontend/node_modules/wagmi/dist/esm/hooks/useSyncExternalStoreWithTracked.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSyncExternalStoreWithTracked",
    ()=>useSyncExternalStoreWithTracked
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$utils$2f$deepEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/utils/deepEqual.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$use$2d$sync$2d$external$2d$store$2f$shim$2f$with$2d$selector$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/use-sync-external-store/shim/with-selector.js [app-client] (ecmascript)");
'use client';
;
;
;
const isPlainObject = (obj)=>typeof obj === 'object' && !Array.isArray(obj);
function useSyncExternalStoreWithTracked(subscribe, getSnapshot, getServerSnapshot = getSnapshot, isEqual = __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$utils$2f$deepEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deepEqual"]) {
    const trackedKeys = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$use$2d$sync$2d$external$2d$store$2f$shim$2f$with$2d$selector$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStoreWithSelector"])(subscribe, getSnapshot, getServerSnapshot, {
        "useSyncExternalStoreWithTracked.useSyncExternalStoreWithSelector[result]": (x)=>x
    }["useSyncExternalStoreWithTracked.useSyncExternalStoreWithSelector[result]"], {
        "useSyncExternalStoreWithTracked.useSyncExternalStoreWithSelector[result]": (a, b)=>{
            if (isPlainObject(a) && isPlainObject(b) && trackedKeys.current.length) {
                for (const key of trackedKeys.current){
                    const equal = isEqual(a[key], b[key]);
                    if (!equal) return false;
                }
                return true;
            }
            return isEqual(a, b);
        }
    }["useSyncExternalStoreWithTracked.useSyncExternalStoreWithSelector[result]"]);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useSyncExternalStoreWithTracked.useMemo": ()=>{
            if (isPlainObject(result)) {
                const trackedResult = {
                    ...result
                };
                let properties = {};
                for (const [key, value] of Object.entries(trackedResult)){
                    properties = {
                        ...properties,
                        [key]: {
                            configurable: false,
                            enumerable: true,
                            get: ({
                                "useSyncExternalStoreWithTracked.useMemo": ()=>{
                                    if (!trackedKeys.current.includes(key)) {
                                        trackedKeys.current.push(key);
                                    }
                                    return value;
                                }
                            })["useSyncExternalStoreWithTracked.useMemo"]
                        }
                    };
                }
                Object.defineProperties(trackedResult, properties);
                return trackedResult;
            }
            return result;
        }
    }["useSyncExternalStoreWithTracked.useMemo"], [
        result
    ]);
}
}),
"[project]/avax-frontend/node_modules/wagmi/dist/esm/utils/getVersion.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getVersion",
    ()=>getVersion
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$version$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/dist/esm/version.js [app-client] (ecmascript)");
;
const getVersion = ()=>`wagmi@${__TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$version$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["version"]}`;
}),
"[project]/avax-frontend/node_modules/wagmi/dist/esm/version.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "version",
    ()=>version
]);
const version = '3.7.6';
}),
"[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/getChains.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getChains",
    ()=>getChains
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$utils$2f$deepEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/utils/deepEqual.js [app-client] (ecmascript)");
;
let previousChains = [];
function getChains(config) {
    const chains = config.chains;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$utils$2f$deepEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deepEqual"])(previousChains, chains)) return previousChains;
    previousChains = chains;
    return chains;
}
}),
"[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/getConnection.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** https://wagmi.sh/core/api/actions/getConnection */ __turbopack_context__.s([
    "getConnection",
    ()=>getConnection
]);
function getConnection(config) {
    const uid = config.state.current;
    const connection = config.state.connections.get(uid);
    const addresses = connection?.accounts;
    const address = addresses?.[0];
    const chain = config.chains.find((chain)=>chain.id === connection?.chainId);
    const status = config.state.status;
    switch(status){
        case 'connected':
            return {
                address: address,
                addresses: addresses,
                chain,
                chainId: connection?.chainId,
                connector: connection?.connector,
                isConnected: true,
                isConnecting: false,
                isDisconnected: false,
                isReconnecting: false,
                status
            };
        case 'reconnecting':
            return {
                address,
                addresses,
                chain,
                chainId: connection?.chainId,
                connector: connection?.connector,
                isConnected: !!address,
                isConnecting: false,
                isDisconnected: false,
                isReconnecting: true,
                status
            };
        case 'connecting':
            return {
                address,
                addresses,
                chain,
                chainId: connection?.chainId,
                connector: connection?.connector,
                isConnected: false,
                isConnecting: true,
                isDisconnected: false,
                isReconnecting: false,
                status
            };
        case 'disconnected':
            return {
                address: undefined,
                addresses: undefined,
                chain: undefined,
                chainId: undefined,
                connector: undefined,
                isConnected: false,
                isConnecting: false,
                isDisconnected: true,
                isReconnecting: false,
                status
            };
    }
}
}),
"[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/getConnectorClient.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getConnectorClient",
    ()=>getConnectorClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$clients$2f$createClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/clients/createClient.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$clients$2f$transports$2f$custom$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/clients/transports/custom.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$address$2f$getAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/utils/address/getAddress.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/accounts/utils/parseAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$errors$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/errors/config.js [app-client] (ecmascript)");
;
;
;
async function getConnectorClient(config, parameters = {}) {
    const { assertChainId = true } = parameters;
    // Get connection
    let connection;
    if (parameters.connector) {
        const { connector } = parameters;
        if (config.state.status === 'reconnecting' && !connector.getAccounts && !connector.getChainId) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$errors$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConnectorUnavailableReconnectingError"]({
            connector
        });
        const [accounts, chainId] = await Promise.all([
            connector.getAccounts().catch((e)=>{
                if (parameters.account === null) return [];
                throw e;
            }),
            connector.getChainId()
        ]);
        connection = {
            accounts: accounts,
            chainId,
            connector
        };
    } else connection = config.state.connections.get(config.state.current);
    if (!connection) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$errors$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConnectorNotConnectedError"]();
    const chainId = parameters.chainId ?? connection.chainId;
    // Check connector using same chainId as connection
    const connectorChainId = await connection.connector.getChainId();
    if (assertChainId && connectorChainId !== chainId) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$errors$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConnectorChainMismatchError"]({
        connectionChainId: chainId,
        connectorChainId
    });
    const connector = connection.connector;
    if (connector.getClient) return connector.getClient({
        chainId
    });
    // Default using `custom` transport
    const account = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$accounts$2f$utils$2f$parseAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseAccount"])(parameters.account ?? connection.accounts[0]);
    if (account) account.address = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$address$2f$getAddress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAddress"])(account.address); // TODO: Checksum address as part of `parseAccount`?
    // If account was provided, check that it exists on the connector
    if (parameters.account && !connection.accounts.some((x)=>x.toLowerCase() === account.address.toLowerCase())) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$errors$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConnectorAccountNotFoundError"]({
        address: account.address,
        connector
    });
    const chain = config.chains.find((chain)=>chain.id === chainId);
    const provider = await connection.connector.getProvider({
        chainId
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$clients$2f$createClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createClient"])({
        account,
        chain,
        name: 'Connector Client',
        transport: (opts)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$clients$2f$transports$2f$custom$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["custom"])(provider)({
                ...opts,
                retryCount: 0
            })
    });
}
}),
"[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/sendTransaction.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sendTransaction",
    ()=>sendTransaction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$wallet$2f$sendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/viem/_esm/actions/wallet/sendTransaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/utils/getAction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$getConnectorClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/getConnectorClient.js [app-client] (ecmascript)");
;
;
;
async function sendTransaction(config, parameters) {
    const { account, chainId, connector, ...rest } = parameters;
    let client;
    if (typeof account === 'object' && account?.type === 'local') client = config.getClient({
        chainId
    });
    else client = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$getConnectorClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getConnectorClient"])(config, {
        account: account ?? undefined,
        assertChainId: false,
        chainId,
        connector
    });
    const chain = (()=>{
        if (!chainId || client.chain?.id === chainId) return client.chain;
        return {
            id: chainId
        };
    })();
    const action = (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$utils$2f$getAction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAction"])(client, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$viem$2f$_esm$2f$actions$2f$wallet$2f$sendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sendTransaction"], 'sendTransaction');
    const hash = await action({
        ...rest,
        ...account ? {
            account
        } : {},
        assertChainId: !!chainId,
        chain,
        gas: rest.gas ?? undefined
    });
    return hash;
}
}),
"[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/switchChain.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "switchChain",
    ()=>switchChain
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$errors$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/errors/config.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$errors$2f$connector$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/errors/connector.js [app-client] (ecmascript)");
;
;
async function switchChain(config, parameters) {
    const { addEthereumChainParameter, chainId } = parameters;
    const connection = config.state.connections.get(parameters.connector?.uid ?? config.state.current);
    if (connection) {
        const connector = connection.connector;
        if (!connector.switchChain) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$errors$2f$connector$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SwitchChainNotSupportedError"]({
            connector
        });
        const chain = await connector.switchChain({
            addEthereumChainParameter,
            chainId
        });
        return chain;
    }
    const chain = config.chains.find((x)=>x.id === chainId);
    if (!chain) throw new __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$errors$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChainNotConfiguredError"]();
    config.setState((x)=>({
            ...x,
            chainId
        }));
    return chain;
}
}),
"[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/watchChains.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @internal
 * We don't expose this because as far as consumers know, you can't chainge (lol) `config.chains` at runtime.
 * Setting `config.chains` via `config._internal.chains.setState(...)` is an extremely advanced use case that's not worth documenting or supporting in the public API at this time.
 */ __turbopack_context__.s([
    "watchChains",
    ()=>watchChains
]);
function watchChains(config, parameters) {
    const { onChange } = parameters;
    return config._internal.chains.subscribe((chains, prevChains)=>{
        onChange(chains, prevChains);
    });
}
}),
"[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/watchConnection.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "watchConnection",
    ()=>watchConnection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$utils$2f$deepEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/utils/deepEqual.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$getConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/getConnection.js [app-client] (ecmascript)");
;
;
function watchConnection(config, parameters) {
    const { onChange } = parameters;
    return config.subscribe(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$getConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getConnection"])(config), onChange, {
        equalityFn (a, b) {
            const { connector: aConnector, ...aRest } = a;
            const { connector: bConnector, ...bRest } = b;
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$utils$2f$deepEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deepEqual"])(aRest, bRest) && // check connector separately
            aConnector?.id === bConnector?.id && aConnector?.uid === bConnector?.uid;
        }
    });
}
}),
"[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/query/sendTransaction.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sendTransactionMutationOptions",
    ()=>sendTransactionMutationOptions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$sendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/sendTransaction.js [app-client] (ecmascript)");
;
function sendTransactionMutationOptions(config, options = {}) {
    return {
        ...options.mutation,
        mutationFn (variables) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$sendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sendTransaction"])(config, variables);
        },
        mutationKey: [
            'sendTransaction'
        ]
    };
}
}),
"[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/query/switchChain.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "switchChainMutationOptions",
    ()=>switchChainMutationOptions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$switchChain$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/actions/switchChain.js [app-client] (ecmascript)");
;
function switchChainMutationOptions(config, options = {}) {
    return {
        ...options.mutation,
        mutationFn (variables) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$avax$2d$frontend$2f$node_modules$2f$wagmi$2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$switchChain$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["switchChain"])(config, variables);
        },
        mutationKey: [
            'switchChain'
        ]
    };
}
}),
"[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/utils/deepEqual.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Forked from https://github.com/epoberezkin/fast-deep-equal */ __turbopack_context__.s([
    "deepEqual",
    ()=>deepEqual
]);
function deepEqual(a, b) {
    if (a === b) return true;
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        if (a.constructor !== b.constructor) return false;
        let length;
        let i;
        if (Array.isArray(a) && Array.isArray(b)) {
            length = a.length;
            if (length !== b.length) return false;
            for(i = length; i-- !== 0;)if (!deepEqual(a[i], b[i])) return false;
            return true;
        }
        if (typeof a.valueOf === 'function' && a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (typeof a.toString === 'function' && a.toString !== Object.prototype.toString) return a.toString() === b.toString();
        const keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for(i = length; i-- !== 0;)if (!Object.hasOwn(b, keys[i])) return false;
        for(i = length; i-- !== 0;){
            const key = keys[i];
            if (key && !deepEqual(a[key], b[key])) return false;
        }
        return true;
    }
    // true if both NaN, false otherwise
    // biome-ignore lint/suspicious/noSelfCompare: using
    return a !== a && b !== b;
}
}),
"[project]/avax-frontend/node_modules/wagmi/node_modules/@wagmi/core/dist/esm/utils/getAction.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Retrieves and returns an action from the client (if exists), and falls
 * back to the tree-shakable action.
 *
 * Useful for extracting overridden actions from a client (ie. if a consumer
 * wants to override the `sendTransaction` implementation).
 */ __turbopack_context__.s([
    "getAction",
    ()=>getAction
]);
function getAction(client, actionFn, // Some minifiers drop `Function.prototype.name`, or replace it with short letters,
// meaning that `actionFn.name` will not always work. For that case, the consumer
// needs to pass the name explicitly.
name) {
    const action_implicit = client[actionFn.name];
    if (typeof action_implicit === 'function') return action_implicit;
    const action_explicit = client[name];
    if (typeof action_explicit === 'function') return action_explicit;
    return (params)=>actionFn(client, params);
}
}),
]);

//# sourceMappingURL=0-t2_18ub856._.js.map