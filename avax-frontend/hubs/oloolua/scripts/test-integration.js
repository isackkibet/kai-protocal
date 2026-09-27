const hederaClient = require('../services/hedera-client');
const guardianService = require('../services/guardian-service');
const dovuService = require('../services/dovu-service');

async function testIntegration() {
    console.log("🚀 Starting Integration Test\n");

    // 1. Test Hedera Client Initialization
    console.log("Testing Hedera Client...");
    try {
        const client = hederaClient.createClient();
        if (client) {
            console.log("✅ Hedera Client initialized successfully");
            // Basic check - just getting the operator account ID if set, or confirming it's a client
            if (process.env.MY_ACCOUNT_ID) {
                console.log(`   Operator: ${process.env.MY_ACCOUNT_ID}`);
            } else {
                console.log("   (Running in testnet mode without credentials)");
            }
        }
    } catch (e) {
        console.error("❌ Hedera Client failed:", e.message);
    }

    console.log("\n-------------------\n");

    // 2. Test Guardian Service
    console.log("Testing Guardian Service (Mock)...");
    try {
        const policies = await guardianService.getPolicies();
        if (Array.isArray(policies)) {
            console.log("✅ Guardian Service returned policies:", policies);
        } else {
            console.log("⚠️  Guardian Service returned unexpected format");
        }
    } catch (e) {
        console.error("❌ Guardian Service failed:", e.message);
    }

    console.log("\n-------------------\n");

    // 3. Test DOVU Service
    console.log("Testing DOVU Service (Mock)...");
    try {
        const marketData = await dovuService.getCarbonMarketData();
        if (marketData) {
            console.log("✅ DOVU Service returned market data:", marketData);
        } else {
            console.log("⚠️  DOVU Service returned null");
        }
    } catch (e) {
        console.error("❌ DOVU Service failed:", e.message);
    }

    console.log("\n🚀 Test Complete");

    // Explicitly exit to ensure the Hedera Client doesn't keep the process alive
    process.exit(0);
}

testIntegration();
