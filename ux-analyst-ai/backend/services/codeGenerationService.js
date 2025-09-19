const { GoogleGenerativeAI } = require('@google/generative-ai');

class CodeGenerationService {
  constructor(config = {}) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.logger = config.logger || console;
  }

  async generateImplementationCode(recommendations, screenshots, websiteUrl) {
    try {
      this.logger.log('🔧 Generating implementation code for recommendations...');

      const codePrompts = recommendations.map(rec =>
        this.createCodePrompt(rec, websiteUrl)
      );

      const codeResults = await Promise.all(
        codePrompts.map(prompt => this.generateCodeForRecommendation(prompt))
      );

      return {
        success: true,
        implementations: codeResults.filter(result => result.success),
        errors: codeResults.filter(result => !result.success)
      };

    } catch (error) {
      this.logger.error('Code generation failed:', error);
      return {
        success: false,
        error: error.message,
        implementations: []
      };
    }
  }

  createCodePrompt(recommendation, websiteUrl) {
    return `
You are a senior web developer tasked with implementing UX improvements.

**Website:** ${websiteUrl}

**UX Recommendation:**
Title: ${recommendation.title}
Description: ${recommendation.description}
Priority: ${recommendation.priority}
Expected Impact: ${recommendation.impact}

**Task:** Provide practical implementation code (HTML, CSS, and/or JavaScript) to implement this recommendation.

**Requirements:**
1. Provide clean, production-ready code
2. Include both the code and clear implementation instructions
3. Consider accessibility standards
4. Use modern web development practices
5. Provide code that can be easily integrated into existing websites

**Response Format:**
{
  "recommendation": "${recommendation.title}",
  "implementation": {
    "html": "HTML code if needed",
    "css": "CSS code if needed",
    "javascript": "JavaScript code if needed"
  },
  "instructions": "Step-by-step implementation guide",
  "notes": "Important considerations and best practices"
}

Focus on creating implementable, tested code that directly addresses the UX issue described.
`;
  }

  async generateCodeForRecommendation(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON response
      let parsedResponse;
      try {
        // Extract JSON from response if it's wrapped in markdown
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        parsedResponse = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : text);
      } catch (parseError) {
        // If JSON parsing fails, structure the response manually
        parsedResponse = {
          recommendation: "Code Implementation",
          implementation: {
            html: this.extractCodeBlock(text, 'html'),
            css: this.extractCodeBlock(text, 'css'),
            javascript: this.extractCodeBlock(text, 'javascript') || this.extractCodeBlock(text, 'js')
          },
          instructions: this.extractInstructions(text),
          notes: this.extractNotes(text)
        };
      }

      return {
        success: true,
        data: parsedResponse
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  extractCodeBlock(text, language) {
    const regex = new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\\n\`\`\``, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  extractInstructions(text) {
    const instructionsMatch = text.match(/(?:instructions?|implementation|steps?):\s*(.+?)(?:\n\n|\*\*|$)/is);
    return instructionsMatch ? instructionsMatch[1].trim() : 'Follow the provided code implementation.';
  }

  extractNotes(text) {
    const notesMatch = text.match(/(?:notes?|considerations?|important):\s*(.+?)(?:\n\n|\*\*|$)/is);
    return notesMatch ? notesMatch[1].trim() : 'Test thoroughly before deploying to production.';
  }

  async generateCodeBundle(analysisResults, websiteUrl) {
    try {
      this.logger.log('📦 Creating comprehensive code bundle...');

      const allRecommendations = this.extractAllRecommendations(analysisResults);

      if (allRecommendations.length === 0) {
        return {
          success: false,
          error: 'No recommendations found to generate code for'
        };
      }

      // Generate code for top priority recommendations
      const priorityRecs = allRecommendations
        .filter(rec => rec.priority === 'high' || rec.priority === 'medium')
        .slice(0, 8); // Limit to avoid API overload

      const implementations = await this.generateImplementationCode(priorityRecs, null, websiteUrl);

      if (!implementations.success) {
        return implementations;
      }

      // Create a comprehensive code bundle
      const bundle = this.createCodeBundle(implementations.implementations);

      return {
        success: true,
        bundle,
        totalRecommendations: allRecommendations.length,
        implementedRecommendations: implementations.implementations.length
      };

    } catch (error) {
      this.logger.error('Code bundle generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  extractAllRecommendations(analysisResults) {
    const recommendations = [];

    // Extract from UX critique
    if (analysisResults.ux_critique?.structured_critique?.recommendations) {
      recommendations.push(...analysisResults.ux_critique.structured_critique.recommendations);
    }

    // Extract from accessibility results
    if (analysisResults.accessibility?.recommendations) {
      recommendations.push(...analysisResults.accessibility.recommendations);
    }

    // Extract from final report
    if (analysisResults.final_report?.recommendations) {
      recommendations.push(...analysisResults.final_report.recommendations);
    }

    return recommendations;
  }

  createCodeBundle(implementations) {
    const bundle = {
      html: [],
      css: [],
      javascript: [],
      instructions: [],
      summary: `Implementation code for ${implementations.length} UX improvements`
    };

    implementations.forEach((impl, index) => {
      if (impl.success && impl.data) {
        const data = impl.data;

        if (data.implementation.html) {
          bundle.html.push({
            title: data.recommendation,
            code: data.implementation.html,
            instructions: data.instructions
          });
        }

        if (data.implementation.css) {
          bundle.css.push({
            title: data.recommendation,
            code: data.implementation.css,
            instructions: data.instructions
          });
        }

        if (data.implementation.javascript) {
          bundle.javascript.push({
            title: data.recommendation,
            code: data.implementation.javascript,
            instructions: data.instructions
          });
        }

        bundle.instructions.push({
          recommendation: data.recommendation,
          steps: data.instructions,
          notes: data.notes
        });
      }
    });

    return bundle;
  }

  getHealthStatus() {
    return {
      status: 'healthy',
      service: 'CodeGenerationService',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = CodeGenerationService;