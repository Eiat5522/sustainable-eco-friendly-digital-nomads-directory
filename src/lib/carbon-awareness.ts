const carbon = {
  async getUserRegion(): Promise<string> {
    // Dummy implementation for testing
    return 'US';
  },

  async getCarbonIntensity(): Promise<number> {
    try {
      const region = await carbon.getUserRegion();
      // Simulate API call – replace with actual API endpoint if needed
      const response = await fetch(`https://api.example.com/carbon?region=${region}`);
      if (!response.ok) {
        return 250;
      }
      const data = await response.json();
      return data.carbonIntensity;
    } catch (error) {
      return 250;
    }
  }
};

export default carbon;
