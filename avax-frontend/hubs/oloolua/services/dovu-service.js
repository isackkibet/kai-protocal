const axios = require('axios');

const DOVU_API_URL = 'https://app.dovu.market/api/v1'; // Check documentation for exact endpoint

class DovuService {
    constructor() {
        this.apiKey = process.env.DOVU_API_KEY;
        this.api = axios.create({
            baseURL: DOVU_API_URL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
    }

    /**
     * Get carbon market data
     */
    async getCarbonMarketData() {
        try {
            console.log("Fetching DOVU market data...");
            // const response = await this.api.get('/market/data');
            // return response.data;
            return {
                pricePerTonne: 25.50,
                availableCredits: 5000
            };
        } catch (error) {
            console.error("Error fetching DOVU data:", error.message);
            return null;
        }
    }
}

module.exports = new DovuService();
