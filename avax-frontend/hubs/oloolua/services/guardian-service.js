const axios = require('axios');

// Placeholder for Guardian API URL - typically runs on localhost:3000 or a hosted instance
const GUARDIAN_API_URL = process.env.GUARDIAN_API_URL || 'http://localhost:3000/api';

class GuardianService {
    constructor() {
        this.api = axios.create({
            baseURL: GUARDIAN_API_URL,
            // Add authentication headers if required (e.g., Bearer token)
        });
    }

    /**
     * Fetch all active policies from the Guardian
     */
    async getPolicies() {
        try {
            console.log("Fetching policies from Guardian...");
            // Mock response for now until a real instance is connected
            // const response = await this.api.get('/policies');
            // return response.data;
            return [
                { id: "mock-policy-1", name: "Carbon Offset Policy", status: "PUBLISHED" }
            ];
        } catch (error) {
            console.error("Error fetching policies:", error.message);
            return [];
        }
    }

    /**
     * Submit a new ecological project
     * @param {Object} projectData 
     */
    async submitProject(projectData) {
        console.log("Submitting project to Guardian:", projectData);
        // await this.api.post('/projects', projectData);
        return { success: true, message: "Project submitted (mock)" };
    }
}

module.exports = new GuardianService();
