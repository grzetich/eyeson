#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const UXAnalyzer = require('../lib/UXAnalyzer');

const program = new Command();

program
  .name('ux-analyze')
  .description('AI-powered UX analysis for websites')
  .version('1.0.0');

program
  .argument('<url>', 'Website URL to analyze')
  .option('-o, --output <dir>', 'Output directory for results', './ux-analysis')
  .option('-f, --format <format>', 'Output format (json|html|markdown)', 'json')
  .option('-v, --viewports <viewports>', 'Comma-separated viewports (desktop,tablet,mobile)', 'desktop,tablet,mobile')
  .option('--quick', 'Run quick analysis (faster, less detailed)')
  .option('--code', 'Generate implementation code')
  .option('--accessibility', 'Include accessibility analysis')
  .option('--config <file>', 'Configuration file path')
  .option('--api-key <key>', 'Gemini API key (or set GEMINI_API_KEY env var)')
  .action(async (url, options) => {
    try {
      await runAnalysis(url, options);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('interactive')
  .alias('i')
  .description('Interactive mode for UX analysis')
  .action(async () => {
    try {
      await runInteractiveMode();
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Configure UX Analyzer settings')
  .action(async () => {
    await configureSettings();
  });

async function runAnalysis(url, options) {
  console.log(chalk.blue.bold('🚀 UX Analyst AI - Command Line Interface\n'));

  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }

  // Load configuration
  const config = await loadConfiguration(options);

  // Initialize analyzer
  const analyzer = new UXAnalyzer(config);

  // Parse options
  const analysisOptions = {
    viewports: options.viewports.split(',').map(v => v.trim()),
    analysisType: options.quick ? 'quick' : 'comprehensive',
    includeAccessibility: options.accessibility,
    includeCodeGeneration: options.code,
    outputFormat: options.format,
    outputDir: options.output
  };

  console.log(chalk.cyan('🔍 Analysis Configuration:'));
  console.log(`  • URL: ${chalk.white(url)}`);
  console.log(`  • Viewports: ${chalk.white(analysisOptions.viewports.join(', '))}`);
  console.log(`  • Type: ${chalk.white(analysisOptions.analysisType)}`);
  console.log(`  • Output: ${chalk.white(path.resolve(analysisOptions.outputDir))}`);
  if (analysisOptions.includeAccessibility) console.log(`  • ${chalk.green('✓')} Accessibility analysis`);
  if (analysisOptions.includeCodeGeneration) console.log(`  • ${chalk.green('✓')} Code generation`);
  console.log();

  // Run analysis with progress spinner
  const spinner = ora('Starting UX analysis...').start();

  try {
    const result = await analyzer.analyze(url, analysisOptions, (progress) => {
      spinner.text = `${progress.stage} (${progress.percent}%)`;
    });

    spinner.succeed('Analysis completed!');

    // Save results
    await saveResults(result, analysisOptions);

    // Display summary
    displaySummary(result, analysisOptions);

  } catch (error) {
    spinner.fail('Analysis failed');
    throw error;
  }
}

async function runInteractiveMode() {
  console.log(chalk.blue.bold('🚀 UX Analyst AI - Interactive Mode\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message: 'Enter the website URL to analyze:',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    },
    {
      type: 'checkbox',
      name: 'viewports',
      message: 'Select viewports to analyze:',
      choices: [
        { name: 'Desktop (1920x1080)', value: 'desktop', checked: true },
        { name: 'Tablet (768x1024)', value: 'tablet', checked: true },
        { name: 'Mobile (375x667)', value: 'mobile', checked: true }
      ],
      validate: (input) => input.length > 0 || 'Please select at least one viewport'
    },
    {
      type: 'list',
      name: 'analysisType',
      message: 'Choose analysis type:',
      choices: [
        { name: 'Comprehensive (detailed analysis)', value: 'comprehensive' },
        { name: 'Quick (faster, basic analysis)', value: 'quick' }
      ],
      default: 'comprehensive'
    },
    {
      type: 'confirm',
      name: 'includeAccessibility',
      message: 'Include accessibility analysis?',
      default: true
    },
    {
      type: 'confirm',
      name: 'includeCodeGeneration',
      message: 'Generate implementation code?',
      default: true
    },
    {
      type: 'list',
      name: 'outputFormat',
      message: 'Choose output format:',
      choices: [
        { name: 'JSON (machine-readable)', value: 'json' },
        { name: 'HTML (human-readable report)', value: 'html' },
        { name: 'Markdown (documentation-friendly)', value: 'markdown' }
      ],
      default: 'html'
    },
    {
      type: 'input',
      name: 'outputDir',
      message: 'Output directory:',
      default: './ux-analysis'
    }
  ]);

  await runAnalysis(answers.url, answers);
}

async function loadConfiguration(options) {
  const config = {
    geminiApiKey: options.apiKey || process.env.GEMINI_API_KEY,
    server: {
      port: 0, // Use random port for CLI mode
      environment: 'cli'
    },
    ai: {
      geminiApiKey: options.apiKey || process.env.GEMINI_API_KEY,
      gemini: {
        model: "gemini-1.5-flash",
        maxRetries: 3,
        baseDelay: 2000,
        timeoutMs: 45000,
        maxConcurrentRequests: 5
      }
    },
    database: {
      type: "sqlite",
      path: "./data/analysis.db"
    },
    screenshots: {
      storagePath: "./data/screenshots",
      viewports: {
        desktop: { width: 1920, height: 1080 },
        tablet: { width: 768, height: 1024 },
        mobile: { width: 375, height: 667 }
      }
    },
    browser: {
      poolSize: 3,
      headless: true,
      launchArgs: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    },
    analysis: {
      maxConcurrentAnalyses: 3,
      timeoutMs: 300000,
      defaultViewports: ["desktop", "tablet", "mobile"]
    }
  };

  if (options.config) {
    const configFile = await fs.readJson(options.config);
    Object.assign(config, configFile);
  }

  if (!config.geminiApiKey) {
    throw new Error('Gemini API key is required. Set GEMINI_API_KEY environment variable or use --api-key option.');
  }

  return config;
}

async function saveResults(result, options) {
  const outputDir = path.resolve(options.outputDir);
  await fs.ensureDir(outputDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFilename = `ux-analysis-${timestamp}`;

  switch (options.outputFormat) {
    case 'json':
      await fs.writeJson(path.join(outputDir, `${baseFilename}.json`), result, { spaces: 2 });
      break;

    case 'html':
      const html = generateHTMLReport(result);
      await fs.writeFile(path.join(outputDir, `${baseFilename}.html`), html);
      break;

    case 'markdown':
      const markdown = generateMarkdownReport(result);
      await fs.writeFile(path.join(outputDir, `${baseFilename}.md`), markdown);
      break;
  }

  // Save implementation code if generated
  if (result.implementationCode) {
    const codeDir = path.join(outputDir, 'implementation-code');
    await fs.ensureDir(codeDir);

    if (result.implementationCode.html?.length > 0) {
      const htmlCode = result.implementationCode.html.map(item =>
        `<!-- ${item.title} -->\n${item.code}\n\n<!-- Instructions: ${item.instructions} -->\n`
      ).join('\n');
      await fs.writeFile(path.join(codeDir, 'improvements.html'), htmlCode);
    }

    if (result.implementationCode.css?.length > 0) {
      const cssCode = result.implementationCode.css.map(item =>
        `/* ${item.title} */\n${item.code}\n\n/* Instructions: ${item.instructions} */\n`
      ).join('\n');
      await fs.writeFile(path.join(codeDir, 'improvements.css'), cssCode);
    }

    if (result.implementationCode.javascript?.length > 0) {
      const jsCode = result.implementationCode.javascript.map(item =>
        `// ${item.title}\n${item.code}\n\n// Instructions: ${item.instructions}\n`
      ).join('\n');
      await fs.writeFile(path.join(codeDir, 'improvements.js'), jsCode);
    }

    // Implementation guide
    if (result.implementationCode.instructions?.length > 0) {
      const guide = `# UX Implementation Guide\n\n${result.implementationCode.instructions.map(item =>
        `## ${item.recommendation}\n\n${item.steps}\n\n**Notes:** ${item.notes}\n`
      ).join('\n')}`;
      await fs.writeFile(path.join(codeDir, 'IMPLEMENTATION_GUIDE.md'), guide);
    }
  }

  console.log(chalk.green(`\n📁 Results saved to: ${outputDir}`));
}

function displaySummary(result, options) {
  console.log(chalk.blue.bold('\n📊 Analysis Summary\n'));

  if (result.report?.summary) {
    const summary = result.report.summary;
    console.log(`${chalk.cyan('Overall Grade:')} ${getGradeEmoji(summary.overallGrade)} ${summary.overallGrade}`);
    console.log(`${chalk.cyan('UX Score:')} ${summary.uxScore || 'N/A'}/100`);
    console.log(`${chalk.cyan('Total Issues:')} ${summary.totalIssues || 0}`);
  }

  if (result.accessibility) {
    console.log(`${chalk.cyan('Accessibility Score:')} ${result.accessibility.score}/100`);
    console.log(`${chalk.cyan('Accessibility Violations:')} ${result.accessibility.totalViolations || 0}`);
  }

  if (result.screenshots?.length > 0) {
    console.log(`${chalk.cyan('Screenshots Captured:')} ${result.screenshots.length}`);
  }

  if (result.implementationCode) {
    const codeTypes = ['html', 'css', 'javascript'].filter(type =>
      result.implementationCode[type]?.length > 0
    );
    if (codeTypes.length > 0) {
      console.log(`${chalk.cyan('Implementation Code:')} ${codeTypes.join(', ').toUpperCase()}`);
    }
  }

  console.log(chalk.green('\n✅ Analysis complete! Check the output directory for detailed results.'));
}

function getGradeEmoji(grade) {
  switch (grade) {
    case 'Excellent': return '🏆';
    case 'Good': return '👍';
    case 'Fair': return '⚠️';
    case 'Poor': return '❌';
    default: return '📊';
  }
}

function generateHTMLReport(result) {
  // Simplified HTML report for CLI
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UX Analysis Report - ${result.url}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .header { background: #f4f4f4; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
        .section { margin-bottom: 30px; }
        .score { font-size: 24px; font-weight: bold; color: #2c5aa0; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>UX Analysis Report</h1>
        <p><strong>Website:</strong> ${result.url}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        ${result.report?.summary ? `<p><strong>Overall Grade:</strong> ${result.report.summary.overallGrade}</p>` : ''}
    </div>

    <div class="section">
        <h2>Analysis Results</h2>
        <pre>${JSON.stringify(result, null, 2)}</pre>
    </div>
</body>
</html>`;
}

function generateMarkdownReport(result) {
  return `# UX Analysis Report

**Website:** ${result.url}
**Generated:** ${new Date().toLocaleString()}
${result.report?.summary ? `**Overall Grade:** ${result.report.summary.overallGrade}` : ''}

## Summary

${result.report?.summary ? `
- **UX Score:** ${result.report.summary.uxScore || 'N/A'}/100
- **Total Issues:** ${result.report.summary.totalIssues || 0}
` : ''}

${result.accessibility ? `
## Accessibility
- **Score:** ${result.accessibility.score}/100
- **Violations:** ${result.accessibility.totalViolations || 0}
` : ''}

## Detailed Results

\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`
`;
}

async function configureSettings() {
  console.log(chalk.blue.bold('⚙️ UX Analyst CLI Configuration\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiKey',
      message: 'Enter your Gemini API key:',
      validate: (input) => input.length > 0 || 'API key is required'
    }
  ]);

  // Save to .env file
  const envPath = path.join(process.cwd(), '.env');
  const envContent = `GEMINI_API_KEY=${answers.apiKey}\n`;

  await fs.writeFile(envPath, envContent);
  console.log(chalk.green(`✅ Configuration saved to ${envPath}`));
}

if (require.main === module) {
  program.parse();
}

module.exports = { program };